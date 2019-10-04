import { NextHandler } from './types';

export class MustadMap extends Map<string, NextHandler[]> {

  /**
   * Ensures the hook collection is initialized.
   * 
   * @param name the name of the hooks collection.
   */
  init(name: string) {
    let hooks = this.get(name);
    if (!hooks || !Array.isArray(hooks)) {
      this.set(name, []);
      hooks = [];
    }
    return hooks;
  }

  /**
   * Push new handler to mapped hook.
   * 
   * @param name name of the method to bind to.
   * @param handler the handler to be added.
   */
  push(name: string, handler: NextHandler) {
    const hooks = this.init(name);
    this.set(name, [...hooks, handler]);
  }

  /**
   * Appends handlers to existing or initialized mapped hook.
   * 
   * @param name the name of the method to bind to.
   * @param handlers ay array of handlers to bind as hooks.
   */
  append(name: string, ...handlers: NextHandler[]) {
    const hooks = this.init(name);
    this.set(name, [...hooks, ...handlers]);
  }

  /**
   * Returns list of keys.
   */
  list() {
    return [...this.keys()];
  }

}
