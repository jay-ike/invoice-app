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
    const refs = Object.create(null);
    function updateStore(key, value) {
        try {
            store.setItem(key, JSON.stringify(value));
        } catch (error) {
            if (window.DOMException.prototype.isPrototypeOf(error)) {
                window.console.warn("failed to store data ", error);
            }
        }
    }
    refs.all = Object.values(store).reduce(function (acc, value) {
        const invoices = deserializeInvoices(value);
        invoices.forEach(function (invoice) {
            acc[invoice.reference] = invoice;
        });
        return acc;
    }, Object.create(null));
    refs.update = function (invoices) {
        const self = this;
        invoices.forEach(function (invoice) {
            self.all[invoice.reference] = invoice;
        });
    };

    return Object.freeze({
        deleteById(id) {
            let items;
            const deletedItem = refs.all[id];
            delete refs.all[id];
            items = Object.values(refs.all).reduce(function (acc, invoice) {
                if (!Array.isArray(acc[invoice.status])) {
                    acc[invoice.status] = [invoice];
                } else {
                    acc[invoice.status].push(invoice);
                }
                return acc;
            }, Object.create(null));
            Object.entries(items).forEach(
                ([key, value]) => updateStore(key, value)
            );
            if (items[deletedItem.status] === undefined) {
                store.removeItem(deletedItem.status);
            }
        },
        get(key) {
            let result = store.getItem(key);
            return parseInvoices(result);
        },
        getAll: () => Object.values(refs.all),
        getById: (id) => refs.all[id],
        isSupported,
        set(key, value) {
            updateStore(key, value);
            if (Array.isArray(value)) {
                refs.update(value);
            }
        }
    });
}
export default storage;
