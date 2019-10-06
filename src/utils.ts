import { Handler } from './types';

export const isPromise = val => Promise.resolve(val) === val;
export const isBoolean = val => typeof val === 'boolean';
export const isError = val => (val instanceof Error);
export const isFunction = val => typeof val === 'function';
export const isUndefined = val => typeof val === 'undefined';
export const hasOwn = (obj: object, key: string) => obj.hasOwnProperty(key);
export const toArray = val => isUndefined(val) && [] || (Array.isArray(val) && val) || [val];
export const isArray = val => Array.isArray(val);
export const isHooked = (handler: Handler) => isFunction(handler) && (handler as any).__hooked;

/**
 * Flattens multi dimensional array.
 * 
 * @param arr the array to be flattened. 
 */
export function flatten<T = any>(arr: T[]): T[] {
  return arr.reduce((a, c) => [...a, ...(Array.isArray(c) ? flatten(c) : [c])], []);
}

/**
 * Checks if key is hookable, is on prototype, is in allowable keys and is NOT __hooked.
 * 
 * @param key the key to inpsect as hookable.
 * @param proto the prototype that the key belongs to.
 * @param allowable the allowable hookable keys.
 */
export function isHookable<T extends object>(key: string, proto: T, allowable: string[]): boolean;

/**
 * Checks if key is contained in hookable keys.
 * 
 * @param key the key to inspect if is hookable.
 * @param allowable the allowable hookable keys.
 */
export function isHookable(key: string, allowable: string[]): boolean;

/**
 * Ensures handler is NOT __hooked.
 * 
 * @param handler a handler to check if is __hooked.
 */
export function isHookable(handler: Handler): boolean;
export function isHookable<T extends object>(key: string | Handler, proto?: T | string[], allowable: string[] = []) {

  if (isFunction(key))
    return !isHooked(key as any);

  if (isArray(proto)) {
    allowable = proto as string[];
    proto = undefined;
  }

  allowable = allowable || [];

  if (proto)
    return allowable.includes(key as string) && isFunction(proto[key as string]) && !proto[key as string].__hooked;

  return allowable.includes(key as string);

}

/**
 * Wraps function to ensure it is only called once.
 * 
 * @param fn the function to be wrapped.
 * @param scope the scope to apply to the function.
 */
export function once<T>(fn: any, scope: T = {} as any) {
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
