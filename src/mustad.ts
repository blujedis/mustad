import { MustadMap } from './map';
import { IOptions, NextHandler, Handler, IMeta, NodeCallback } from './types';
import {
  isHooked, me, isFunction, toArray, isHookable, isError, once, isBoolean, isPromise
} from './utils';

const DEFAULTS: IOptions = {
  enablePre: true,
  enablePost: true,
  timeout: 3000,
  timeoutError: true,
  include: [],
  exclude: [],
  lazy: true
};

export class Mustad<T = any> {

  proto: T;
  pres = new MustadMap();
  posts = new MustadMap();
  options: IOptions;

  constructor(proto: T, options: IOptions = {}) {
    options = { ...DEFAULTS, ...options };
    if (!proto)
      throw new Error(`Cannot initialize Mustad using proto of undefined.`);
    this.proto = proto;
    this.options = options;
  }

  /**
   * Merge args when next is called.
   * 
   * @param args the base or default args.
   * @param nargs the next function args including additional args.
   */
  protected mergeArgs(args: any[] = [], nargs: any[] = []) {
    if (!nargs.length)
      return args;
    if (nargs.length < args.length)   // append missing args not included in nargs.
      nargs = [...nargs, ...args.slice(nargs.length)];
    return nargs;
  }

  /**
   * Handles error, throws or callsback.
   * 
   * @param err the Error to be handled.
   * @param cb optional coallback.
   */
  protected handleError(err: Error, cb?: (err: Error) => void): void | Promise<Error> {
    if (cb)
      return cb(err);
    return Promise.reject(err);
  }

  /**
   * Applies hooks to hooked function.
   * 
   * @param args the hook arguments to be applied.
   * @param handlers the handlers to iterate.
   * @param meta metadata for ensuring hooks have completed or timedout.
   * @param done function called on done.
   */
  protected async applyHooks(
    args: any[], handlers: NextHandler[], meta: IMeta, done: NodeCallback<any[]>) {

    const mustad = meta.mustad;
    const options = mustad.options;
    const timeout = options.timeout;

    // If already handled just return.
    if (meta.finished)
      return;

    if (!handlers.length) {

      if (meta.completed === meta.length || meta.timedout) {
        meta.finished = true;
        clearTimeout(meta.timeoutId);
        if (meta.timedout && options.timeoutError)
          return done(new Error(`Timeout "${timeout}" exceeded, to suppress disable "options.timeoutError" or extend "options.timeout".`));
        return done(null, args);
      }

      // Don't run forever timeout eventually.
      if (!meta.timeoutId)
        meta.timeoutId = setTimeout(() => {
          meta.timedout = true;
        }, timeout);

      // Async hooks not finished callback
      // until done or timedout.
      // return setImmediate(() => {
      return setTimeout(() => {
        this.applyHooks(args, handlers, meta, done);
      });

    }

    const fn = meta.context ? handlers.shift().bind(meta.context) : handlers.shift();
    const fname = meta.name;

    let wrapper;

    const next = (err?: Error | null | boolean, ...nargs: any[]) => {

      if (isError(err))
        return done(err as Error, this.mergeArgs(args, nargs));

      if (err === false)
        return done(new Error(`Hook "${fname.toUpperCase()}" returned false and exited.`), this.mergeArgs(args, nargs));

      // if is true treat as async
      // disable call once don't mark as complete.
      if (err === true) {
        wrapper.__called = false;
      }
      else {
        meta.completed++;
      }

      this.applyHooks(this.mergeArgs(args, nargs), handlers, meta, done);

    };

    // Get the result allow user to call next()
    // return true/false, a Promise or an Error.
    wrapper = once(next, meta.context);
    const result = fn(wrapper, ...args);

    // Result was returned, callback NOT called.
    // ensure value is not function where user
    // did something like return next();
    if (isBoolean(result) || isPromise(result) || isError(result)) {

      // User returned a promise call
      // and convert to callback.
      if (isPromise(result)) {
        const { err, data } = await me(result);
        next(err, data);
      }

      // Error or bool returned. If true just call
      // next() otherwise return Error or create
      // a simple error message.
      else {

        if (result === true)
          next();

        else
          next(result === false ? new Error(`Hook "${fname.toUpperCase()}" returned false and exited.`) : result);

      }

    }

  }

  /**
   * Wraps a hook function.
   * 
   * @param fn the function to be wrapped.
   * @param args the arguments to apply
   * @param handlers the handlers to pass to function.
   */
  protected wrapHook(
    fn: (...args: any[]) => void, args: any[], handlers: NextHandler[], meta: IMeta) {

    // ensure array.
    args = toArray(args);

    meta = { ...{ length: handlers.length, completed: 0, timedout: false }, ...meta };

    return new Promise<any[]>((res, rej) => {

      fn(args, handlers, meta, (err: Error, nargs: any[]) => {

        if (err)
          return rej(err);

        res(nargs);

      });

    });

  }

  /**
   * Wraps a method handler function.
   * 
   * @param fn the handler function to wrap.
   * @param args the arguments to apply.
   * @param cb optional callback
   */
  protected wrapHandler(
    fn: (...args: any[]) => void | Promise<any>, args: any[], cb?: any): Promise<any> {

    // ensure array.
    args = toArray(args);

    if (!cb) {

      const result = fn(...args);

      if (isPromise(result))
        return result as Promise<any>;

      return new Promise((res, rej) => {
        if (isError(result))
          return rej(result);
        return res(result);
      });

    }

    else {

      // Handler has callback.
      return new Promise((res, rej) => {
        args = [...args, (err: Error | null, ...data: any[]) => {
          if (err)
            return rej(err);
          res(data);
        }];
        fn(...args);
      });

    }

  }

  /**
   * Gets allowable method names.
   *  
   * @param proto the prototype to get methods for.
   * @param include iincluded allowable methods names.
   * @param exclude excluded non allowable method names.
   */
  private allowableMethods(proto?: T | Mustad, include?: string[], exclude?: string[]) {
    proto = proto || this.proto;
    include = include || this.options.include || [];
    exclude = exclude || this.options.exclude || [];
    // If included is empty allow any method.
    if (!include.length)
      include = Object.getOwnPropertyNames(proto);
    return include.filter(k => !exclude.includes(k));
  }

  /**
   * Compiles a handler with pre and post hooks.
   * 
   * @param name tne name of the handler to compile.
   * @param handler the handler to be compiled.
   * @param context optional context to be applied.
   */
  compile<C extends object>(name: string, handler: Handler, context?: C, execType?: 'pre' | 'post') {

    if (!handler)
      throw new Error(`Failed to compiled undefined handler for ${name}.`);

    // Initialize the hooks in map.
    this.pres.init(name);
    this.posts.init(name);

    const mustad = this;

    const compiled = async (...args: any[]) => {

      let pres = this.pres.get(name).slice(0);
      let posts = this.posts.get(name).slice(0);
      const cb = isFunction(args[args.length - 1]) ? args.pop() : null;
      let nextArgs = args.slice(0);

      if (execType) {
        if (execType === 'pre')
          posts = [];
        else
          pres = [];
      }

      if ((this.options.enablePre || execType === 'pre') && pres.length) {

        const { err: preErr, data: preData } =
          await me(this.wrapHook(this.applyHooks.bind(this), nextArgs, pres, { context, mustad, name }));

        if (preErr)
          return this.handleError(preErr, cb);

        nextArgs = preData;

      }

      const { err: hErr, data: hData } = await me(this.wrapHandler(handler.bind(this.proto), nextArgs, cb));

      nextArgs = hData;

      // If nextArgs is array we need to wrap in
      // array otherwise single array will be spread.
      if (Array.isArray(nextArgs))
        nextArgs = [nextArgs];

      if (hErr)
        return this.handleError(hErr, cb);

      if ((this.options.enablePost || execType === 'post') && posts.length) {

        const { err: postErr, data: postData } =
          await me(this.wrapHook(this.applyHooks.bind(this), nextArgs, posts, { context, mustad, name }));

        if (postErr)
          return this.handleError(postErr, cb);

        nextArgs = postData.length === 1 ? postData[0] : postData;

        if (cb)
          cb(null, ...toArray(nextArgs));

        return Promise.resolve(nextArgs);

      }

      else {

        if (cb)
          cb(null, ...toArray(nextArgs));

        return Promise.resolve(nextArgs);

      }

    };

    return compiled as typeof compiled & { __hooked?: Handler; };

  }

  /**
   * Binds hook to handler.
   * 
   * @param name the name of the method to apply hook to.
   * @param handler the handler to be wrapped.
   * @param context optional context to bind to.
   */
  hook<C extends object>(name: string, handler: Handler, context?: C) {

    if (isHooked(handler))
      return null;

    if (!isHookable(name as string, this.allowableMethods()) || !isHookable(handler))
      throw new Error(`Cannot bind hook to unknown, prohibited or previously hooked method ${name}.`);

    const proto = this.proto || this as any;
    const compiled = this.compile(name, handler, context);

    if (!compiled)
      return this;

    compiled.__hooked = handler;
    proto[name] = compiled;

    return this;

  }

  /**
   * Adds pre hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param hooks the hooks to be compiled.
   */
  pre(name: string, hooks: NextHandler | NextHandler[]): this;

  /**
   * Adds pre hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param hooks the hooks to be compiled.
   */
  pre(names: string[], hooks: NextHandler | NextHandler[]): this;

  /**
   * Adds pre hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param context optional context to apply to handlers.
   * @param hooks the hooks to be compiled.
   */
  pre<C extends object>(name: string, context: C, hooks: NextHandler | NextHandler[]): this;

  /**
   * Adds pre hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param context optional context to apply to handlers.
   * @param hooks the hooks to be compiled.
   */
  pre<C extends object>(names: string[], context: C, hooks: NextHandler | NextHandler[]): this;

  pre<C extends object>(
    name: string | string[], context: C | NextHandler, hooks?: NextHandler | NextHandler[]) {

    const options = this.options;
    const proto = this.proto || this as any;
    hooks = toArray(hooks);

    if (isFunction(context)) {
      hooks.unshift(context as any);
      context = undefined;
    }

    if (Array.isArray(name)) {
      name.forEach(n => {
        this.pre(n as any, context, hooks);
      });
      return this;
    }

    if (hooks.length > 1) {
      hooks.forEach(m => this.pre(name as any, context, m));
      return this;
    }

    this.pres.push(name, hooks[0]);

    if (options.lazy)
      this.hook(name, proto[name]);

    return this;

  }

  /**
   * Adds post hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param hooks the hooks to be compiled.
   */
  post(name: string, hooks: NextHandler | NextHandler[]): this;

  /**
   * Adds post hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param hooks the hooks to be compiled.
   */
  post(names: string[], hooks: NextHandler | NextHandler[]): this;

  /**
   * Adds post hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param context optional context to apply to handlers.
   * @param hooks the hooks to be compiled
   */
  post<C extends object>(name: string, context: C, hooks: NextHandler | NextHandler[]): this;

  /**
   * Adds post hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param context optional context to apply to hooks.
   * @param hooks the hooks to be compiled.
   */
  post<C extends object>(names: string[], context: C, hooks: NextHandler | NextHandler[]): this;

  post<C extends object>(
    name: string | string[], context: C | NextHandler, hooks?: NextHandler | NextHandler[]) {
    const options = this.options;
    const proto = this.proto || this as any;
    hooks = toArray(hooks);

    if (isFunction(context)) {
      hooks.unshift(context as any);
      context = undefined;
    }

    if (Array.isArray(name)) {
      name.forEach(n => {
        this.post(n, context, hooks);
      });
      return this;
    }

    if (hooks.length > 1) {
      hooks.forEach(m => this.post(name as any, context, m));
      return this;
    }

    this.posts.push(name, hooks[0]);

    if (options.lazy)
      this.hook(name, proto[name]);

    return this;

  }

  /**
   * Staically calls a method and it's pre hooks.
   * 
   * @param name the name of the method to exec.
   * @param args the arguments to provide to the method.
   * @param context the context to be applied to hooks.
   * @param cb an optional callback on done.
   */
  preExec<C extends object, D = any>(name: string, args: any[], context: C, cb?: NodeCallback<D>): void | Promise<D>;

  /**
   * Staically calls a method and it's pre hooks.
   * 
   * @param name the name of the method to exec.
   * @param args the arguments to provide to the method.
   * @param cb an optional callback on done.
   */
  preExec<D = any>(name: string, args: any[], cb?: NodeCallback<D>): void | Promise<D>;
  preExec<C extends object, D = any>(
    name: string, args: any[], context: C | NodeCallback<D>, cb?: NodeCallback<D>) {

    if (isFunction(context)) {
      cb = context as NodeCallback;
      context = undefined;
    }

    let handler = this.proto[name];
    handler = handler.__hooked || handler;
    args = args || [];

    if (!handler)
      throw new Error(`preExec cannot execute undefined handler for ${name}`);

    if (cb)
      (args as any[]).push(cb);

    // No hooks just call the handler.
    // context NOT applied to handler only
    // applied to hooks.
    if (!this.pres.get(name).length)
      return handler(...args as any[]);

    return this.compile(name, handler, context)(...args as any[]);

  }

  /**
   * Staically calls a method and it's post hooks.
   * 
   * @param name the name of the method to exec.
   * @param args the arguments to provide to the method.
   * @param context the context to be applied to hooks.
   * @param cb an optional callback on done.
   */
  postExec<C extends object, D = any>(name: string, args: any[], context: C, cb?: NodeCallback<D>): void | Promise<D>;

  /**
   * Staically calls a method and it's post hooks.
   * 
   * @param name the name of the method to exec.
   * @param args the arguments to provide to the method.
   * @param cb an optional callback on done.
   */
  postExec<D = any>(name: string, args: any[], cb?: NodeCallback<D>): void | Promise<D>;
  postExec<C extends object, D = any>(
    name: string, args: any[], context: C | NodeCallback<D>, cb?: NodeCallback<D>) {

    if (isFunction(context)) {
      cb = context as NodeCallback;
      context = undefined;
    }

    let handler = this.proto[name];
    handler = handler.__hooked || handler;

    args = args || [];

    if (!handler)
      throw new Error(`postExec cannot execute undefined handler for ${name}`);

    if (cb)
      (args as any[]).push(cb);

    // No hooks just call the handler.
    // context NOT applied to handler only
    // applied to hooks.
    if (!this.posts.get(name).length)
      return handler(...args as any[]);

    return this.compile(name, handler, context)(...args as any[]);

  }

  /**
   * Returns a list of hooked methods.
   */
  list() {
    return Object.keys(this.proto).filter(v => isHooked(this.proto[v]));
  }

}

export function wrap<T>(proto: T, instance?: Mustad<T>) {
  type Picked = Pick<Mustad<T>, 'pre' | 'post' | 'preExec' | 'postExec'>;
  type ComputedType = T & Picked & { mustad: Mustad<T>; };
  const _proto = proto as ComputedType;
  instance = instance || new Mustad<T>(proto);
  _proto.mustad = instance;
  _proto.pre = instance.pre.bind(instance);
  _proto.post = instance.post.bind(instance);
  _proto.preExec = instance.preExec.bind(instance);
  _proto.postExec = instance.postExec.bind(instance);
  return _proto;
}
