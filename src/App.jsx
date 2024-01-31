import {createEffect, createSignal} from "solid-js";
import Nav from "./components/header.jsx";
import InvoiceAdder from "./components/invoice-adder.jsx";
import Drawer from "./components/drawer.jsx";

function App() {
    const [invoices, setInvoices] = createSignal([]);
    const [drawerVisible, showDrawer] = createSignal(false);
    const drawerDescriptor = {
        action: "new invoice",
        cancel: "discard",
        edit: "",
        proceed: "save & send"
    };

    createEffect(function drawerHandler() {
        if (drawerVisible() === true) {
            document.body.dataset.drawer = "show";
        } else {
            delete document.body.dataset.drawer;
        }
    });

    return (
        <>
            <Nav/>
            <main>
                <section className="column box">
                    <InvoiceAdder allInvoices={invoices} onNewInvoice={() => showDrawer(true)}/>
                </section>
                <Drawer onClose={() => showDrawer(false)} descriptor={drawerDescriptor}/>
            </main>
        </>
    );
}

export default App;
