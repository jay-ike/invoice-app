/*jslint browser*/
import {openDB} from "./idb-min.js";

const {Intl, MessageChannel, crypto, matchMedia} = window;
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const alphabetReducer = (acc, val) => acc + alphabet[val % alphabet.length];
const getColorScheme = () => (
    matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);

/*jslint-disable*/
function formatterOf(formatter) {
    return Object.freeze({
        copyWith(language, newOptions) {
            let {locale, ...options} = formatter.resolvedOptions();
            return new formatter.constructor(
                language ?? locale,
                Object.assign(options, newOptions ?? {})
            );
        }
    });
}
/*jslint-enable*/
function frameActor(frameElement) {
    const channel = new MessageChannel();
    if (!window.HTMLIFrameElement.prototype.isPrototypeOf(frameElement)) {
        return;
    }
    frameElement.addEventListener("load", function () {
        frameElement.contentWindow.postMessage(
            "message port sent",
            "*",
            [channel.port2]
        );
    }, false);
    return Object.freeze({
        requestPrint() {
            frameElement.contentWindow.print();
        },
        send(data) {
            channel.port1.postMessage(data);
        }
    });
}
function generateCode(length = 6) {
    let numbers = new Uint8Array(length);
    crypto.getRandomValues(numbers);
    return numbers.reduce(alphabetReducer, "");
}
function getFormatter() {
    let dateFormatter = new Intl.DateTimeFormat(
        navigator.language,
        {day: "numeric", month: "short", year: "numeric"}
    );
    let currencyFormatter = new Intl.NumberFormat(
        navigator.language,
        {currency: "XAF", style: "currency"}
    );

    return Object.freeze({
/*jslint-disable*/
        updateCurrencyFormatter(language, options) {
            return formatterOf(currencyFormatter).copyWith(language, options);
        },
        updateDateFormatter(language, options) {
            return formatterOf(dateFormatter).copyWith(language, options);
        },
/*jslint-enable*/
        formatCurrency(amount) {
            let result = Number.parseFloat(amount.toString());
            if (Number.isFinite(result)) {
                return currencyFormatter.format(amount);
            }
            return "";
        },
        formatDate(date) {
            return dateFormatter.format(date);
        }
    });
}
function getInvoicesDescriptor() {
    const pluralize = (count) => (
        count > 1
        ? "s"
        : ""
    );
    return function labelInvoices(invoices) {
        const {length} = invoices ?? {};
        if (length > 0) {
            return "total " + length + " invoice" + pluralize(length);
        } else {
            return "no invoice";
        }
    };
}
async function invoiceStorage(dbName = "jay-ike_invoices", version = 1) {
    const inv_store = "invoice";
    let result = Object.create(null);
    const db = await openDB(dbName, version, {
        upgrade: function upgrade(db) {
            const store = db.createObjectStore(
                inv_store,
                {keyPath: "reference"}
            );
            store.createIndex("status", "status", {unique: false});
        }
    });
    result.addMany = async function insertMany(invoices) {
        let tx = db.transaction(inv_store, "readwrite");
        let actions = invoices.map((elt) => tx.store.add(elt));
        actions[actions.length] = tx.done;
        await Promise.all(actions);
    };
    result.upsert = async function upsert(invoice) {
        let oldValue = await db.get(inv_store, invoice.reference);
        oldValue = Object.assign(oldValue ?? {}, invoice);
        await db.put(inv_store, oldValue);
        return oldValue;
    };
    result.getById = (reference) => db.get(inv_store, reference);
    result.getAll = () => db.getAll(inv_store);
    result.getAllByStatuses = async function fetchByStatuses(statuses) {
        let request;
        if (!Array.isArray(statuses)) {
            return [];
        }
        request = await db.getAllFromIndex(inv_store, "status");
        return request.filter((elt) => statuses.includes(elt.status));
    };
    result.deleteById = (reference) => db.delete(inv_store, reference);
    return result;
}
function numberGenerator() {
    let initial = 1;
    return Object.freeze({
        next() {
            const result = initial;
            initial += 1;
            return result;
        }
    });
}
export default Object.freeze({
    frameActor,
    generateCode,
    getColorScheme,
    getFormatter,
    getInvoicesDescriptor,
    invoiceStorage,
    numberGenerator
});
