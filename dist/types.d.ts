import { MustadMap } from './map';
import { Mustad } from './mustad';
export type NodeCallback<T = any> = (err: null | Error, data?: T) => void;
export type Handler = <T = any>(...args: any[]) => void | Promise<T>;
export interface HookHandler {
    (err: null | Error, ...args: any[]): void;
    (async?: true): void;
}
export type NextHandler = (next: HookHandler, ...args: any[]) => any;
export interface Options {
    enablePre?: boolean;
    enablePost?: boolean;
    timeout?: number;
    timeoutError?: boolean;
    include?: string[];
    exclude?: string[];
    lazy?: boolean;
}
export interface Config {
    options?: Options;
    pre: MustadMap;
    post: MustadMap;
}
export interface Meta<C extends Record<string, unknown> = Record<string, unknown>> {
    name: string;
    mustad: Mustad;
    context?: C;
    length?: number;
    completed?: number;
    timedout?: boolean;
    timeoutId?: NodeJS.Timeout;
    finished?: boolean;
}
