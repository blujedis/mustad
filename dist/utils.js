"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPromise = val => Promise.resolve(val) === val;
exports.isBoolean = val => typeof val === 'boolean';
exports.isError = val => (val instanceof Error);
exports.isFunction = val => typeof val === 'function';
exports.isUndefined = val => typeof val === 'undefined';
exports.hasOwn = (obj, key) => obj.hasOwnProperty(key);
exports.toArray = val => exports.isUndefined(val) && [] || (Array.isArray(val) && val) || [val];
exports.isHooked = (handler) => handler.__hooked === true;
function isHookable(key, proto, exclude) {
    if (Array.isArray(proto))
        return !proto.includes(key);
    if (exports.isFunction(proto))
        return !proto.__hooked;
    exclude = exclude || [];
    return exports.hasOwn(proto, key) && !exclude.includes(key) && exports.isFunction(proto[key]);
}
exports.isHookable = isHookable;
/**
 * Wraps function to ensure it is only called once.
 *
 * @param fn the function to be wrapped.
 * @param scope the scope to apply to the function.
 */
function once(fn, scope) {
    function wrapper() {
        if (wrapper.__called)
            return;
        wrapper.__called = true;
        return fn.apply(scope, arguments);
    }
    wrapper.__called = false;
    return wrapper;
}
exports.once = once;
/**
 * Wraps a promise returning resolved error/data as object.
 *
 * @param promise a promise to be wrapped
 */
function me(promise) {
    return promise
        .then(data => ({ err: null, data }))
        .catch(err => ({ err }));
}
exports.me = me;
//# sourceMappingURL=utils.js.map