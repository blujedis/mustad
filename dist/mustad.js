"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const map_1 = require("./map");
const utils_1 = require("./utils");
const DEFAULTS = {
    appendArgs: false,
    enablePre: true,
    enablePost: true,
    timeout: 3000,
    timeoutError: true,
    include: [],
    exclude: [],
    lazy: true
};
class Mustad {
    constructor(options = {}) {
        this.pres = new map_1.MustadMap();
        this.posts = new map_1.MustadMap();
        options = { ...DEFAULTS, ...options };
        this.options = options;
    }
    /**
     * Merge args when next is called.
     *
     * @param base the base or default args.
     * @param extend additional args to extend or overwrite with.
     */
    mergeArgs(base = [], extend = []) {
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
    handleError(err, cb) {
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
    async applyHooks(args, handlers, meta, done) {
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
        const fn = meta.context ? handlers.shift().bind(meta.context) : handlers.shift();
        const fname = meta.name;
        let wrapper;
        const next = (err, ...nargs) => {
            if (utils_1.isError(err))
                return done(err, this.mergeArgs(args, nargs));
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
        wrapper = utils_1.once(next, meta.context);
        const result = fn(wrapper, ...args);
        // Result was returned, callback NOT called.
        // ensure value is not function where user
        // did something like return next();
        if (utils_1.isBoolean(result) || utils_1.isPromise(result) || utils_1.isError(result)) {
            // User returned a promise call
            // and convert to callback.
            if (utils_1.isPromise(result)) {
                const { err, data } = await utils_1.me(result);
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
    wrapHook(fn, args, handlers, meta) {
        // ensure array.
        args = utils_1.toArray(args);
        meta = { ...{ length: handlers.length, completed: 0, timedout: false }, ...meta };
        return new Promise((res, rej) => {
            fn(args, handlers, meta, (err, nargs) => {
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
    wrapHandler(fn, args, cb) {
        // ensure array.
        args = utils_1.toArray(args);
        if (!cb) {
            const result = fn(...args);
            return new Promise((res, rej) => {
                if (!utils_1.isPromise(result)) {
                    if (utils_1.isError(result))
                        return rej(result);
                    return res(result);
                }
                result
                    .then(iRes => {
                    if (utils_1.isError(iRes))
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
            args = [...args, (err, ...data) => {
                    if (err)
                        return rej(err);
                    data = data.length === 1 ? data[0] : data;
                    res(data);
                }];
            fn(...args);
        });
    }
    /**
     * Gets allowable method names.
     *
     * @param proto the prototype to get methods for.
     * @param include iincluded allowable methods names.
     * @param exclude excluded non allowable method names.
     */
    allowableMethods(proto, include, exclude) {
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
    compile(name, handler, context, execType) {
        if (!handler)
            throw new Error(`Failed to compiled undefined handler for ${name}.`);
        // Initialize the hooks in map.
        this.pres.init(name);
        this.posts.init(name);
        const mustad = this;
        const compiled = async (...args) => {
            let pres = this.pres.get(name).slice(0);
            let posts = this.posts.get(name).slice(0);
            const cb = utils_1.isFunction(args[args.length - 1]) ? args.pop() : null;
            let nextArgs = args.slice(0);
            if (execType) {
                if (execType === 'pre')
                    posts = [];
                else
                    pres = [];
            }
            if ((this.options.enablePre || execType === 'pre') && pres.length) {
                const { err: preErr, data: preData } = await utils_1.me(this.wrapHook(this.applyHooks.bind(this), nextArgs, pres, { context, mustad, name }));
                if (preErr)
                    return this.handleError(preErr, cb);
                nextArgs = preData;
            }
            const { err: hErr, data: hData } = await utils_1.me(this.wrapHandler(handler, nextArgs, cb));
            nextArgs = hData;
            if (hErr)
                return this.handleError(hErr, cb);
            if ((this.options.enablePost || execType === 'post') && posts.length) {
                const { err: postErr, data: postData } = await utils_1.me(this.wrapHook(this.applyHooks.bind(this), nextArgs, posts, { context, mustad, name }));
                if (postErr)
                    return this.handleError(postErr, cb);
                nextArgs = postData.length === 1 ? postData[0] : postData;
                if (cb)
                    cb(null, ...utils_1.toArray(nextArgs));
                return Promise.resolve(nextArgs);
            }
            else {
                if (cb)
                    cb(null, ...utils_1.toArray(nextArgs));
                return Promise.resolve(nextArgs);
            }
        };
        return compiled;
    }
    /**
     * Binds hook to handler.
     *
     * @param name the name of the method to apply hook to.
     * @param handler the handler to be wrapped.
     * @param context optional context to bind to.
     */
    hook(name, handler, context) {
        if (utils_1.isHooked(handler))
            return null;
        if (!utils_1.isHookable(name, this.allowableMethods()) || !utils_1.isHookable(handler))
            throw new Error(`Cannot bind hook to unknown, prohibited or previously hooked method ${name}.`);
        const proto = this.proto || this;
        const compiled = this.compile(name, handler, context);
        if (!compiled)
            return this;
        compiled.__hooked = handler;
        proto[name] = compiled;
        return this;
    }
    pre(name, context, hooks) {
        const options = this.options;
        const proto = this.proto || this;
        hooks = utils_1.toArray(hooks);
        if (utils_1.isFunction(context)) {
            hooks.unshift(context);
            context = undefined;
        }
        if (Array.isArray(name)) {
            name.forEach(n => {
                this.pre(n, context, hooks);
            });
            return this;
        }
        if (hooks.length > 1) {
            hooks.forEach(m => this.pre.call(this, name, context, m));
            return this;
        }
        this.pres.push(name, hooks[0]);
        if (options.lazy)
            this.hook(name, proto[name]);
        return this;
    }
    post(name, context, hooks) {
        const options = this.options;
        const proto = this.proto || this;
        hooks = utils_1.toArray(hooks);
        if (utils_1.isFunction(context)) {
            hooks.unshift(context);
            context = undefined;
        }
        if (Array.isArray(name)) {
            name.forEach(n => {
                this.post(n, context, hooks);
            });
            return this;
        }
        if (hooks.length > 1) {
            hooks.forEach(m => this.post.call(this, name, context, m));
            return this;
        }
        this.posts.push(name, hooks[0]);
        if (options.lazy)
            this.hook(name, proto[name]);
        return this;
    }
    preExec(name, args, context, cb) {
        if (utils_1.isFunction(context)) {
            cb = context;
            context = undefined;
        }
        let handler = this.proto[name];
        handler = handler.__hooked || handler;
        args = args || [];
        if (!handler)
            throw new Error(`preExec cannot execute undefined handler for ${name}`);
        if (cb)
            args.push(cb);
        // No hooks just call the handler.
        // context NOT applied to handler only
        // applied to hooks.
        if (!this.pres.get(name).length)
            return handler(...args);
        return this.compile(name, handler, context)(...args);
    }
    postExec(name, args, context, cb) {
        if (utils_1.isFunction(context)) {
            cb = context;
            context = undefined;
        }
        let handler = this.proto[name];
        handler = handler.__hooked || handler;
        args = args || [];
        if (!handler)
            throw new Error(`postExec cannot execute undefined handler for ${name}`);
        if (cb)
            args.push(cb);
        // No hooks just call the handler.
        // context NOT applied to handler only
        // applied to hooks.
        if (!this.posts.get(name).length)
            return handler(...args);
        return this.compile(name, handler, context)(...args);
    }
    /**
     * Returns a list of hooked methods.
     */
    list() {
        return Object.keys(this.proto).filter(v => utils_1.isHooked(this.proto[v]));
    }
}
exports.Mustad = Mustad;
function wrap(proto, instance = new Mustad()) {
    const _proto = proto;
    instance.proto = proto;
    _proto.mustad = instance;
    _proto.pre = instance.pre.bind(instance);
    _proto.post = instance.post.bind(instance);
    _proto.preExec = instance.preExec.bind(instance);
    _proto.postExec = instance.postExec.bind(instance);
    return _proto;
}
exports.wrap = wrap;
//# sourceMappingURL=mustad.js.map