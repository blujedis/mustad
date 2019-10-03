import { NextHandler } from './types';

export class MustadMap extends Map<string, NextHandler[]> {

  /**
   * Ensures the hook collection is initialized.
   * 
   * @param name the name of the hooks collection.
   */
  init(name: string) {
    let hooks = this.get(name);
    if (!Array.isArray(hooks)) {
      this.set(name, []);
      hooks = [];
    }
    return hooks;
  }

  push(name: string, handler: NextHandler) {
    const hooks = this.init(name);
    this.set(name, [...hooks, handler]);
  }

}
