import { Handler } from './types';
export declare const isPromise: (val: any) => boolean;
export declare const isBoolean: (val: any) => boolean;
export declare const isError: (val: any) => boolean;
export declare const isFunction: (val: any) => boolean;
export declare const isUndefined: (val: any) => boolean;
export declare const hasOwn: (obj: object, key: string) => boolean;
export declare const toArray: (val: any) => any[];
export declare const isHooked: (handler: Handler) => boolean;
/**
 * Checks if method exists, is function and isn't already "__hooked".
 *
 * @param key the proto key to lookup.
 * @param proto the prototype context object where handler resides.
 * @param exclude array of excluded keys.
 */
export declare function isHookable<T extends object>(key: string, proto: T, exclude: string[]): boolean;
/**
 * Checks if function is already "__hooked" or is excluded.
 *
 * @param key the proto key to lookup.
 * @param handler existing handler function.
 * @param exclude array of excluded keys.
 */
export declare function isHookable(key: string, handler: Handler, exclude: string[]): boolean;
export declare function isHookable(key: string, exclude: string[]): boolean;
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
