import { NextHandler } from './types';
export declare class MustadMap extends Map<string, NextHandler[]> {
    /**
     * Ensures the hook collection is initialized.
     *
     * @param name the name of the hooks collection.
     */
    init(name: string): NextHandler[];
    /**
     * Push new handler to mapped hook.
     *
     * @param name name of the method to bind to.
     * @param handler the handler to be added.
     */
    push(name: string, handler: NextHandler): void;
    /**
     * Appends handlers to existing or initialized mapped hook.
     *
     * @param name the name of the method to bind to.
     * @param handlers ay array of handlers to bind as hooks.
     */
    append(name: string, ...handlers: NextHandler[]): void;
    /**
     * Returns list of keys.
     */
    list(): string[];
}
