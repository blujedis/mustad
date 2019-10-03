import { NextHandler } from './types';
export declare class MustadMap extends Map<string, NextHandler[]> {
    /**
     * Ensures the hook collection is initialized.
     *
     * @param name the name of the hooks collection.
     */
    init(name: string): NextHandler[];
    push(name: string, handler: NextHandler): void;
}
