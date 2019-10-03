/// <reference types="node" />
import { MustadMap } from './map';
import { IOptions, NextHandler, Handler, IMeta } from './types';
export declare class Mustad<T = any> {
    proto: T | Mustad;
    pres: MustadMap;
    posts: MustadMap;
    groups: Map<string, string[]>;
    options: IOptions;
    constructor(options?: IOptions);
    /**
     * Merge args when next is called.
     *
     * @param base the base or default args.
     * @param extend additional args to extend or overwrite with.
     */
    protected mergeArgs(base?: any[], extend?: any[]): any[];
    /**
     * Handles error, throws or callsback.
     *
     * @param err the Error to be handled.
     * @param cb optional coallback.
     */
    protected handleError(err: Error, cb?: (err: Error) => void): void | Promise<Error>;
    /**
     * Applies hooks to hooked function.
     *
     * @param args the hook arguments to be applied.
     * @param handlers the handlers to iterate.
     * @param meta metadata for ensuring hooks have completed or timedout.
     * @param done function called on done.
     */
    protected applyHooks<C = any>(args: any[], handlers: NextHandler[], meta: IMeta<C>, done: (err: Error, data?: any[]) => void): Promise<void | NodeJS.Immediate>;
    /**
     * Wraps a hook function.
     *
     * @param fn the function to be wrapped.
     * @param args the arguments to apply
     * @param handlers the handlers to pass to function.
     */
    protected wrapHook<C = any>(fn: (...args: any[]) => void, args: any[], handlers: NextHandler[], meta: IMeta<C>): Promise<any[]>;
    /**
     * Wraps a method handler function.
     *
     * @param fn the handler function to wrap.
     * @param args the arguments to apply.
     * @param cb optional callback
     */
    protected wrapHandler(fn: (...args: any[]) => void | Promise<any>, args: any[], cb?: any): Promise<any>;
    /**
     * Compiles a handler with pre and post hooks.
     *
     * @param name tne name of the handler to compile.
     * @param handler the handler to be compiled.
     * @param context the context to be applied.
     */
    compile<C extends object>(name: string, handler: Handler, context?: C): ((...args: any[]) => any) & {
        __hooked?: boolean;
    };
    /**
     * Binds hook to handler.
     *
     * @param name the name of the method to apply hook to.
     * @param handler the handler to be wrapped.
     */
    hook<C extends object>(name: string, handler: Handler, context?: C): this;
    /**
     * Adds pre hooks to method.
     *
     * @param name the name of the method to bind to.
     * @param funcs the method or methods to wrap with hooks.
     */
    pre(name: string, ...funcs: NextHandler[]): any;
    /**
     * Adds post hooks to method.
     *
     * @param name the name of the method to bind to.
     * @param funcs the method or methods to wrap with hooks.
     */
    post(name: string, ...funcs: NextHandler[]): any;
    preExec(name: string, handler: Handler, args: any[], ...funcs: NextHandler[]): any;
    preExec(name: string, args: any[], ...funcs: NextHandler[]): any;
    preExec(name: string, args: any[]): any;
    postExec(name: string, handler: Handler, args: any[], ...funcs: NextHandler[]): any;
    postExec(name: string, args: any[], ...funcs: NextHandler[]): any;
    postExec(name: string, args: any[]): any;
}
export declare function wrap<T>(proto: T, instance?: Mustad<T>): T & Pick<Mustad<T>, "pre" | "post" | "preExec" | "postExec">;
