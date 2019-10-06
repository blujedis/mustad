/// <reference types="node" />
import { MustadMap } from './map';
import { IOptions, NextHandler, Handler, IMeta, NodeCallback } from './types';
export declare class Mustad<T = any> {
    proto: T | Mustad;
    pres: MustadMap;
    posts: MustadMap;
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
    protected applyHooks(args: any[], handlers: NextHandler[], meta: IMeta, done: NodeCallback<any[]>): Promise<void | NodeJS.Immediate>;
    /**
     * Wraps a hook function.
     *
     * @param fn the function to be wrapped.
     * @param args the arguments to apply
     * @param handlers the handlers to pass to function.
     */
    protected wrapHook(fn: (...args: any[]) => void, args: any[], handlers: NextHandler[], meta: IMeta): Promise<any[]>;
    /**
     * Wraps a method handler function.
     *
     * @param fn the handler function to wrap.
     * @param args the arguments to apply.
     * @param cb optional callback
     */
    protected wrapHandler(fn: (...args: any[]) => void | Promise<any>, args: any[], cb?: any): Promise<any>;
    /**
     * Gets allowable method names.
     *
     * @param proto the prototype to get methods for.
     * @param include iincluded allowable methods names.
     * @param exclude excluded non allowable method names.
     */
    private allowableMethods;
    /**
     * Compiles a handler with pre and post hooks.
     *
     * @param name tne name of the handler to compile.
     * @param handler the handler to be compiled.
     * @param context optional context to be applied.
     */
    compile<C extends object>(name: string, handler: Handler, context?: C, execType?: 'pre' | 'post'): ((...args: any[]) => any) & {
        __hooked?: Handler;
    };
    /**
     * Binds hook to handler.
     *
     * @param name the name of the method to apply hook to.
     * @param handler the handler to be wrapped.
     * @param context optional context to bind to.
     */
    hook<C extends object>(name: string, handler: Handler, context?: C): this;
    /**
     * Adds pre hooks to method.
     *
     * @param name the name of the method to bind to.
     * @param hooks the hooks to be compiled.
     */
    pre(name: string, hooks: NextHandler | NextHandler[]): this;
    /**
     * Adds pre hooks to method.
     *
     * @param names the names of the methods to bind to.
     * @param hooks the hooks to be compiled.
     */
    pre(names: string[], hooks: NextHandler | NextHandler[]): this;
    /**
     * Adds pre hooks to method.
     *
     * @param name the name of the method to bind to.
     * @param context optional context to apply to handlers.
     * @param hooks the hooks to be compiled.
     */
    pre<C extends object>(name: string, context: C, hooks: NextHandler | NextHandler[]): this;
    /**
     * Adds pre hooks to method.
     *
     * @param names the names of the methods to bind to.
     * @param context optional context to apply to handlers.
     * @param hooks the hooks to be compiled.
     */
    pre<C extends object>(names: string[], context: C, hooks: NextHandler | NextHandler[]): this;
    /**
     * Adds post hooks to method.
     *
     * @param name the name of the method to bind to.
     * @param hooks the hooks to be compiled.
     */
    post(name: string, hooks: NextHandler | NextHandler[]): this;
    /**
     * Adds post hooks to method.
     *
     * @param names the names of the methods to bind to.
     * @param hooks the hooks to be compiled.
     */
    post(names: string[], hooks: NextHandler | NextHandler[]): this;
    /**
     * Adds post hooks to method.
     *
     * @param name the name of the method to bind to.
     * @param context optional context to apply to handlers.
     * @param hooks the hooks to be compiled
     */
    post<C extends object>(name: string, context: C, hooks: NextHandler | NextHandler[]): this;
    /**
     * Adds post hooks to method.
     *
     * @param names the names of the methods to bind to.
     * @param context optional context to apply to hooks.
     * @param hooks the hooks to be compiled.
     */
    post<C extends object>(names: string[], context: C, hooks: NextHandler | NextHandler[]): this;
    /**
     * Staically calls a method and it's pre hooks.
     *
     * @param name the name of the method to exec.
     * @param args the arguments to provide to the method.
     * @param context the context to be applied to hooks.
     * @param cb an optional callback on done.
     */
    preExec<C extends object, D = any>(name: string, args: any[], context: C, cb?: NodeCallback<D>): void | Promise<D>;
    /**
     * Staically calls a method and it's pre hooks.
     *
     * @param name the name of the method to exec.
     * @param args the arguments to provide to the method.
     * @param cb an optional callback on done.
     */
    preExec<D = any>(name: string, args: any[], cb?: NodeCallback<D>): void | Promise<D>;
    /**
     * Staically calls a method and it's post hooks.
     *
     * @param name the name of the method to exec.
     * @param args the arguments to provide to the method.
     * @param context the context to be applied to hooks.
     * @param cb an optional callback on done.
     */
    postExec<C extends object, D = any>(name: string, args: any[], context: C, cb?: NodeCallback<D>): void | Promise<D>;
    /**
     * Staically calls a method and it's post hooks.
     *
     * @param name the name of the method to exec.
     * @param args the arguments to provide to the method.
     * @param cb an optional callback on done.
     */
    postExec<D = any>(name: string, args: any[], cb?: NodeCallback<D>): void | Promise<D>;
    /**
     * Returns a list of hooked methods.
     */
    list(): string[];
}
export declare function wrap<T>(proto: T, instance?: Mustad<T>): T & Pick<Mustad<T>, "pre" | "post" | "preExec" | "postExec"> & {
    mustad: Mustad<T>;
};
