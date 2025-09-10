"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHooked = exports.isArray = exports.toArray = exports.hasOwn = exports.isUndefined = exports.isFunction = exports.isError = exports.isBoolean = exports.isPromise = void 0;
exports.flatten = flatten;
exports.isHookable = isHookable;
exports.once = once;
exports.me = me;
const isPromise = val => Promise.resolve(val) === val;
exports.isPromise = isPromise;
const isBoolean = val => typeof val === 'boolean';
exports.isBoolean = isBoolean;
const isError = val => (val instanceof Error);
exports.isError = isError;
const isFunction = val => typeof val === 'function';
exports.isFunction = isFunction;
const isUndefined = val => typeof val === 'undefined';
exports.isUndefined = isUndefined;
const hasOwn = (obj, key) => obj.hasOwnProperty(key);
exports.hasOwn = hasOwn;
const toArray = val => (0, exports.isUndefined)(val) && [] || (Array.isArray(val) && val) || [val];
exports.toArray = toArray;
const isArray = val => Array.isArray(val);
exports.isArray = isArray;
const isHooked = (handler) => (0, exports.isFunction)(handler) && handler.__hooked;
exports.isHooked = isHooked;
/**
 * Flattens multi dimensional array.
 *
 * @param arr the array to be flattened.
 */
function flatten(arr) {
    return arr.reduce((a, c) => [...a, ...(Array.isArray(c) ? flatten(c) : [c])], []);
}
function isHookable(key, proto, allowable = []) {
    if ((0, exports.isFunction)(key))
        return !(0, exports.isHooked)(key);
    if ((0, exports.isArray)(proto)) {
        allowable = proto;
        proto = undefined;
    }
    allowable = allowable || [];
    if (proto)
        return allowable.includes(key) && (0, exports.isFunction)(proto[key]) && !proto[key].__hooked;
    return allowable.includes(key);
}
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
//# sourceMappingURL=utils.js.map