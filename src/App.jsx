import { createEffect, createMemo, createResource, createSignal, Show } from "solid-js";
import Nav from "./components/header.jsx";
import InvoiceAdder from "./components/invoice-adder.jsx";
import Drawer from "./components/drawer.jsx";
import InvoiceList from "./components/invoice-list.jsx";

function App(props) {
    const [storage, { mutate }] = createResource(getStorage);
    const [drawerVisible, showDrawer] = createSignal(false);
    const [filter, setFilter] = createSignal([]);
    const drawerDescriptor = {
        action: "new invoice",
        cancel: "discard",
        proceed: "save & send"
    };
    const shownInvoices = createMemo(function() {
        const types = filter();
        const invoices = storage()?.invoices ?? [];
        if (types.length === 0) {
            return invoices;
        } else {
            return invoices.filter((item) => types.includes(item.status));
        }
    });
    createEffect(function drawerHandler() {
        if (drawerVisible() === true) {
            document.body.dataset.drawer = "show";
        } else {
            delete document.body.dataset.drawer;
        }
    });

    async function getStorage() {
        const { db, storedInvoices: invoices } = await props.data;
        return { db, invoices };
    }
    async function saveInvoice(data) {
        const db = storage()?.db;
        let result;
        if (db !== undefined) {
            await db.upsert(data);
            result = storage().invoices;
            mutate({ db, invoices: result.concat([data]) });
        }
    }

    return (
        <div id="app-wrapper">
            <Nav />
            <main>
                <section className="column box">
                    <InvoiceAdder allInvoices={shownInvoices} onNewInvoice={() => showDrawer(true)} invoiceFiltered={setFilter} />
                    <Show when={storage()?.invoices} fallback={<div className="center"><p>loading...</p></div>}>
                        <InvoiceList invoices={shownInvoices} />
                    </Show>
                </section>
                <Drawer onClose={() => showDrawer(false)} descriptor={drawerDescriptor} onSave={saveInvoice} />
            </main>
        </div>
    );
}

export default App;
