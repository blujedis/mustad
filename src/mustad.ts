import { MustadMap } from './map';
import { IOptions, NextHandler, Handler, IMeta } from './types';
import { isHooked, me, isFunction, toArray, isHookable, isError, once, isBoolean, isPromise, flatten } from './utils';

const DEFAULTS: IOptions = {
  appendArgs: false,
  enablePre: true,
  enablePost: true,
  timeout: 3000,
  timeoutError: true,
  include: [],
  exclude: [],
  lazy: true
};

export class Mustad<T = any> {

  proto: T | Mustad;
  pres = new MustadMap();
  posts = new MustadMap();
  groups = new Map<string, string[]>();
  options: IOptions;

  constructor(options: IOptions = {}) {
    options = { ...DEFAULTS, ...options };
    this.options = options;
  }

  /**
   * Merge args when next is called.
   * 
   * @param base the base or default args.
   * @param extend additional args to extend or overwrite with.
   */
  protected mergeArgs(base: any[] = [], extend: any[] = []) {
    if (this.options.appendArgs)
      return [...base, ...extend];
    if (!extend.length)
      return base;
    return extend;
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
  protected async applyHooks<C = any>(
    args: any[], handlers: NextHandler[], meta: IMeta<C>, done: (err: Error, data?: any[]) => void) {

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
      return setImmediate(() => {
        this.applyHooks(args, handlers, meta, done);
      });

    }

    const fn = handlers.shift();
    const fname = meta.name;

    let wrapper;

    const next = (err?: Error | null | true, ...nargs: any[]) => {

      if (isError(err))
        return done(err as Error, this.mergeArgs(args, nargs));

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
  protected wrapHook<C = any>(
    fn: (...args: any[]) => void, args: any[], handlers: NextHandler[], meta: IMeta<C>) {

    // ensure array.
    args = toArray(args);

    meta = { ...{ length: handlers.length, completed: 0, timedout: false, context: {} as any }, ...meta };

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

      return new Promise((res, rej) => {

        if (!isPromise(result)) {

          if (isError(result))
            return rej(result);

          return res(result);

        }

        (result as Promise<any>)
          .then(iRes => {
            if (isError(iRes))
              return rej(iRes);
            res(iRes);
          })
          .catch(iRej => {
            rej(iRej);
          });

      });

    }

    // Handler has callback.
    return new Promise((res, rej) => {

      args = [...args, (err: Error | null, ...data: any[]) => {

        if (err)
          return rej(err);

        data = data.length === 1 ? data[0] : data;

        res(data);

      }];

      fn(...args);

    });

  }

  /**
   * Compiles a handler with pre and post hooks.
   * 
   * @param name tne name of the handler to compile.
   * @param handler the handler to be compiled.
   * @param context the context to be applied.
   */
  compile<C extends object>(name: string, handler: Handler, context: C = {} as any) {

    if (isHooked(handler))
      return null;

    if (!isHookable(name as string, handler, this.options.exclude))
      throw new Error(`Cannot bind hook to unknown or prohibited or previously hooked method ${name}.`);

    // Initialize the hooks in map.
    this.pres.init(name);
    this.posts.init(name);

    const mustad = this;

    const compiled = async (...args: any[]) => {

      const pres = this.pres.get(name).slice(0);
      const posts = this.posts.get(name).slice(0);
      const cb = isFunction(args[args.length - 1]) ? args.pop() : null;

      let nextArgs = args.slice(0);

      if (this.options.enablePre && pres.length) {

        const { err: preErr, data: preData } =
          await me(this.wrapHook(this.applyHooks.bind(this), nextArgs, pres, { context, mustad, name }));

        if (preErr)
          return this.handleError(preErr, cb);

        nextArgs = preData;

      }

      const { err: hErr, data: hData } = await me(this.wrapHandler(handler, nextArgs, cb));

      nextArgs = hData;

      if (hErr)
        return this.handleError(hErr, cb);

      if (this.options.enablePost && posts.length) {

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

    return compiled as typeof compiled & { __hooked?: boolean };

  }

  /**
   * Binds hook to handler.
   * 
   * @param name the name of the method to apply hook to.
   * @param handler the handler to be wrapped.
   */
  hook<C extends object>(name: string, handler: Handler, context: C = {} as any) {

    const proto = this.proto || this as any;
    const compiled = this.compile(name, handler, context);

    if (!compiled)
      return this;

    compiled.__hooked = true;
    proto[name] = compiled;

    return this;

  }

  /**
   * Adds pre hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  pre(name: string, handlers: NextHandler[]): this;

  /**
   * Adds pre hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  pre(names: string[], handlers: NextHandler[]): this;

  /**
   * Adds pre hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  pre(name: string, ...handlers: NextHandler[]): this;

  /**
   * Adds pre hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  pre(names: string[], ...handlers: NextHandler[]): this;
  pre(name: string | string[], ...handlers: Array<NextHandler | NextHandler[]>) {

    const funcs = flatten(handlers) as NextHandler[];
    const options = this.options;
    const proto = this.proto || this as any;

    if (Array.isArray(name)) {
      name.forEach(n => {
        this.pre(n, funcs);
      });
      return this;
    }

    if (!isHookable(name, proto, options.exclude || []))
      return this;

    if (funcs.length > 1)
      return funcs.forEach(m => this.pre.call(this, name as any, m));

    this.pres.push(name, funcs[0]);

    if (options.lazy)
      this.hook(name, proto[name]);

    return this;

  }

  /**
   * Adds post hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  post(name: string, handlers: NextHandler[]): this;

  /**
   * Adds post hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  post(names: string[], handlers: NextHandler[]): this;

  /**
   * Adds post hooks to method.
   * 
   * @param name the name of the method to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  post(name: string, ...handlers: NextHandler[]): this;

  /**
   * Adds post hooks to method.
   * 
   * @param names the names of the methods to bind to.
   * @param handlers the method or methods to wrap with hooks.
   */
  post(names: string[], ...handlers: NextHandler[]): this;
  post(name: string | string[], ...handlers: Array<NextHandler | NextHandler[]>) {

    const funcs = flatten(handlers) as NextHandler[];
    const options = this.options;
    const proto = this.proto || this as any;

    if (Array.isArray(name)) {
      name.forEach(n => {
        this.post(n, funcs);
      });
      return this;
    }

    if (!isHookable(name, proto, options.exclude))
      return this;

    if (funcs.length > 1)
      return funcs.forEach(m => this.post.call(this, name as any, m));

    this.posts.push(name, funcs[0]);

    if (options.lazy)
      this.hook(name, proto[name]);

    return this;

  }

  preExec(name: string, handler: Handler, args: any[], ...funcs: NextHandler[]);
  preExec(name: string, args: any[], ...funcs: NextHandler[]);
  preExec(name: string, args: any[]);
  preExec(name: string, handler: Handler | any[], args?: any[] | NextHandler, ...funcs: NextHandler[]) {

    return;
  }

  postExec(name: string, handler: Handler, args: any[], ...funcs: NextHandler[]);
  postExec(name: string, args: any[], ...funcs: NextHandler[]);
  postExec(name: string, args: any[]);
  postExec(name: string, handler: Handler | any[], args?: any[] | NextHandler, ...funcs: NextHandler[]) {

    return;
  }

}

export function wrap<T>(proto: T, instance: Mustad<T> = new Mustad<T>()) {
  type ComputedType = T & Pick<Mustad<T>, 'pre' | 'post' | 'preExec' | 'postExec'>;
  const _proto = proto as ComputedType;
  instance.proto = proto;
  _proto.mustad = instance;
  _proto.pre = instance.pre.bind(instance);
  _proto.post = instance.post.bind(instance);
  _proto.preExec = instance.preExec.bind(instance);
  _proto.postExec = instance.postExec.bind(instance);
  return _proto;
}
