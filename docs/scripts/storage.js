/*jslint browser*/

function parseInvoices(value) {
    try {
        return JSON.parse(value);
    } catch (error) {
        if (SyntaxError.prototype.isPrototypeOf(error)) {
            return value;
        }
    }
}
function deserializeInvoices(storedValue) {
    let result = parseInvoices(storedValue);
    if (Array.isArray(result)) {
        return result;
    }
    return [];
}
function storage() {
    const store = window.localStorage;
    const isSupported = typeof window.Storage === "function";
    return Object.freeze({
        get(key) {
            let result = store.getItem(key);
            return parseInvoices(result);
        },
        getAll() {
            let result = Object.values(store).reduce(function (acc, value) {
                let invoices = deserializeInvoices(value);
                acc.push(...invoices);
               return acc;
            }, []);
            return result;
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
