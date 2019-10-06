import { Handler } from './types';
export declare const isPromise: (val: any) => boolean;
export declare const isBoolean: (val: any) => boolean;
export declare const isError: (val: any) => boolean;
export declare const isFunction: (val: any) => boolean;
export declare const isUndefined: (val: any) => boolean;
export declare const hasOwn: (obj: object, key: string) => boolean;
export declare const toArray: (val: any) => any[];
export declare const isArray: (val: any) => boolean;
export declare const isHooked: (handler: Handler) => boolean;
/**
 * Flattens multi dimensional array.
 *
 * @param arr the array to be flattened.
 */
export declare function flatten<T = any>(arr: T[]): T[];
/**
 * Checks if key is hookable, is on prototype, is in allowable keys and is NOT __hooked.
 *
 * @param key the key to inpsect as hookable.
 * @param proto the prototype that the key belongs to.
 * @param allowable the allowable hookable keys.
 */
export declare function isHookable<T extends object>(key: string, proto: T, allowable: string[]): boolean;
/**
 * Checks if key is contained in hookable keys.
 *
 * @param key the key to inspect if is hookable.
 * @param allowable the allowable hookable keys.
 */
export declare function isHookable(key: string, allowable: string[]): boolean;
/**
 * Ensures handler is NOT __hooked.
 *
 * @param handler a handler to check if is __hooked.
 */
export declare function isHookable(handler: Handler): boolean;
/**
 * Wraps function to ensure it is only called once.
 *
 * @param fn the function to be wrapped.
 * @param scope the scope to apply to the function.
 */
export declare function once<T>(fn: any, scope?: T): {
    (): any;
    __called: boolean;
};
/**
 * Wraps a promise returning resolved error/data as object.
 *
 * @param promise a promise to be wrapped
 */
export declare function me<T>(promise: Promise<T>): Promise<{
    err?: Error;
    data?: T;
}>;
