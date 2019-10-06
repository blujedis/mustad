"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPromise = val => Promise.resolve(val) === val;
exports.isBoolean = val => typeof val === 'boolean';
exports.isError = val => (val instanceof Error);
exports.isFunction = val => typeof val === 'function';
exports.isUndefined = val => typeof val === 'undefined';
exports.hasOwn = (obj, key) => obj.hasOwnProperty(key);
exports.toArray = val => exports.isUndefined(val) && [] || (Array.isArray(val) && val) || [val];
exports.isArray = val => Array.isArray(val);
exports.isHooked = (handler) => exports.isFunction(handler) && handler.__hooked;
/**
 * Flattens multi dimensional array.
 *
 * @param arr the array to be flattened.
 */
function flatten(arr) {
    return arr.reduce((a, c) => [...a, ...(Array.isArray(c) ? flatten(c) : [c])], []);
}
exports.flatten = flatten;
function isHookable(key, proto, allowable = []) {
    if (exports.isFunction(key))
        return !exports.isHooked(key);
    if (exports.isArray(proto)) {
        allowable = proto;
        proto = undefined;
    }
    allowable = allowable || [];
    if (proto)
        return allowable.includes(key) && exports.isFunction(proto[key]) && !proto[key].__hooked;
    return allowable.includes(key);
}
exports.isHookable = isHookable;
/**
 * Wraps function to ensure it is only called once.
 *
 * @param fn the function to be wrapped.
 * @param scope the scope to apply to the function.
 */
function once(fn, scope = {}) {
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