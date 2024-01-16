/*jslint browser*/
import {openDB} from "./idb-min.js";

async function invoiceStorage(dbName = "jay-ike_invoices", version = 1) {
    const inv_store = "invoice";
    let result = Object.create(null);
    const db = await openDB(dbName, version, {
        async upgrade(db) {
            const store = db.createObjectStore(
                inv_store, {keyPath: "reference"}
            );
            store.createIndex("status", "status", {unique: false});
        }
    });
    result.addMany = async function insertMany(invoices) {
        let tx = db.transaction(inv_store, "readwrite");
        let actions = invoices.map((elt) => tx.store.add(elt));
        actions[actions.length] = tx.done;
        await Promise.all(actions);
    }
    result.upsert = async function upsert(invoice) {
        let oldValue = await db.get(inv_store, invoice.reference);
        oldValue = Object.assign(oldValue ?? {}, invoice);
        await db.put(inv_store, oldValue);
        return oldValue;
    };
    result.getById = (reference) => db.get(inv_store, reference);
    result.getAll = () => db.getAll(inv_store);
    result.getAllByStatuses = async function fetchByStatuses(statuses) {
        let result = [];
        let request;
        if (!Array.isArray(statuses)) {
            return result;
        }
        request = await db.getAllFromIndex(inv_store, "status");
        return request.filter((elt) => statuses.includes(elt.status));
    };
    result.deleteById = (reference) => db.delete(inv_store, reference);
    return result;
}
export {invoiceStorage};
export default null;
