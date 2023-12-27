/*jslint browser*/

function storage() {
    const store = window.localStorage;
    const isSupported = typeof window.Storage === "function";
    return Object.freeze({
        get(key) {
            let result = store.getItem(key);
            try {
                return JSON.parse(result);
            } catch (error) {
                if (SyntaxError.prototype.isPrototypeOf(error)) {
                    return result;
                }
            }
        },
        isSupported,
        set(key, value) {
            try {
                store.setItem(key, JSON.stringify(value));
            } catch (error) {
                if (window.DOMException.prototype.isPrototypeOf(error)) {
                    window.console.warn("failed to store data ", error);
                }
            }
        }
    });
}
export default storage;
