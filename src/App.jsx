import {createEffect, createSignal} from "solid-js";
import Nav from "./components/header.jsx";
import InvoiceAdder from "./components/invoice-adder.jsx";
import Drawer from "./components/drawer.jsx";
import InvoiceList from "./components/invoice-list.jsx";
import utils from "./utils.js";

function App() {
    const [invoices, setInvoices] = createSignal([]);
    const [drawerVisible, showDrawer] = createSignal(false);
    const drawerDescriptor = {
        action: "new invoice",
        cancel: "discard",
        proceed: "save & send"
    };
    let db;

    document.addEventListener("DOMContentLoaded", async function () {
        let storedInvoices;
        db = await utils.invoiceStorage();
        storedInvoices = await db.getAll();
        setInvoices(storedInvoices);
    });
    createEffect(function drawerHandler() {
        if (drawerVisible() === true) {
            document.body.dataset.drawer = "show";
        } else {
            delete document.body.dataset.drawer;
        }
    });

    async function filterInvoices(types) {
        let selected;
        if (typeof db === "undefined") {
            return;
        }
        selected = await db.getAll();
        if (types.length > 0) {
            selected = selected.filter((item) => types.includes(item.status));
        }
        setInvoices(selected);

    }
    async function saveInvoice(data) {
        let result;
        await db.upsert(data);
        result = await db.getAll();
        setInvoices(result);
    }

    return (
        <>
            <Nav/>
            <main>
                <section className="column box">
                    <InvoiceAdder allInvoices={invoices} onNewInvoice={() => showDrawer(true)} invoiceFiltered={filterInvoices}/>
                    <InvoiceList invoices={invoices} />
                </section>
                <Drawer onClose={() => showDrawer(false)} descriptor={drawerDescriptor} onSave={saveInvoice}/>
            </main>
        </>
    );
}

export default App;
