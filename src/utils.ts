import { Handler } from './types';

export const isPromise = val => Promise.resolve(val) === val;
export const isBoolean = val => typeof val === 'boolean';
export const isError = val => (val instanceof Error);
export const isFunction = val => typeof val === 'function';
export const isUndefined = val => typeof val === 'undefined';
export const hasOwn = (obj: object, key: string) => obj.hasOwnProperty(key);
export const toArray = val => isUndefined(val) && [] || (Array.isArray(val) && val) || [val];
export const isHooked = (handler: Handler) => (handler as any).__hooked === true;

/**
 * Flattens multi dimensional array.
 * 
 * @param arr the array to be flattened. 
 */
export function flatten<T = any>(arr: T[]): T[] {
  return arr.reduce((a, c) => [ ...a, ...(Array.isArray(c) ? flatten(c) : [c])], []);
}

/**
 * Checks if method exists, is function and isn't already "__hooked".
 * 
 * @param key the proto key to lookup.
 * @param proto the prototype context object where handler resides.
 * @param exclude array of excluded keys.
 */
export function isHookable<T extends object>(key: string, proto: T, exclude: string[]): boolean;

/**
 * Checks if function is already "__hooked" or is excluded.
 * 
 * @param key the proto key to lookup.
 * @param handler existing handler function.
 * @param exclude array of excluded keys.
 */
export function isHookable(key: string, handler: Handler, exclude: string[]): boolean;
export function isHookable(key: string, exclude: string[]): boolean;
export function isHookable<T extends object>(key: string, proto: T | Handler | string[], exclude?: string[]) {
  if (Array.isArray(proto))
    return !proto.includes(key);
  if (isFunction(proto))
    return !(proto as any).__hooked;
  exclude = exclude || [];
  return hasOwn(proto, key) && !exclude.includes(key) && isFunction(proto[key]);
}

/**
 * Wraps function to ensure it is only called once.
 * 
 * @param fn the function to be wrapped.
 * @param scope the scope to apply to the function.
 */
export function once<T>(fn: any, scope?: T) {
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
export function me<T>(promise: Promise<T>) {
  return promise
    .then(data => ({ err: null, data }))
    .catch(err => ({ err })) as Promise<{ err?: Error, data?: T }>;
}
