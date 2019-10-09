import { MustadMap } from './map';
import { Mustad } from './mustad';

export type NodeCallback<T = any> = (err: Error, data?: T) => void;

export type Handler = <T = any>(...args: any[]) => void | Promise<T>;

export interface IHookHandler {
  (err: Error, ...args: any[]): void;
  (async?: true): void;
}

export type NextHandler = (next?: IHookHandler, ...args: any[]) => any;

export interface IOptions {
  enablePre?: boolean;
  enablePost?: boolean;
  timeout?: number;
  timeoutError?: boolean;
  include?: string[];
  exclude?: string[];
  lazy?: boolean;
}

export interface IConfig {
  options?: IOptions;
  pre: MustadMap;
  post: MustadMap;
}

export interface IMeta<C = any> {
  name: string;
  mustad: Mustad;
  context?: C;
  length?: number;
  completed?: number;
  timedout?: boolean;
  timeoutId?: NodeJS.Timeout;
  finished?: boolean;
}