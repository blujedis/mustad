"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MustadMap extends Map {
    /**
     * Ensures the hook collection is initialized.
     *
     * @param name the name of the hooks collection.
     */
    init(name) {
        let hooks = this.get(name);
        if (!Array.isArray(hooks)) {
            this.set(name, []);
            hooks = [];
        }
        return hooks;
    }
    push(name, handler) {
        const hooks = this.init(name);
        this.set(name, [...hooks, handler]);
    }
}
exports.MustadMap = MustadMap;
//# sourceMappingURL=map.js.map