import {
    createEffect,
    createMemo,
    createResource,
    createSignal,
    For,
    Show
} from "solid-js";
import Nav from "./components/header.jsx";
import Drawer from "./components/drawer.jsx";
import style from "./invoice-preview.module.css";

function InvoiceDetails(props) {
    const [storage, { mutate }] = createResource(getStorage);
    const [drawerVisible, showDrawer] = createSignal(false);
    const descriptor = createMemo(function() {
        return {
            action: "edit ",
            cancel: "cancel",
            edit: "",
            proceed: "save changes",
            status: storage()?.invoice?.status
        };
    });
    const elements = Object.create(null);
    async function getStorage() {
        const result = await props.data;
        return result;
    }
    createEffect(function drawerHandler() {
        if (drawerVisible() === true) {
            document.body.dataset.drawer = "show";
        } else {
            delete document.body.dataset.drawer;
        }
    });
    function handleCancelation(event) {
        event.preventDefault();
        elements.dialog.close("cancel");
    }
    async function handleClosedModal(event) {
        const { returnValue } = event.target;
        const db = storage()?.db;
        if (returnValue === "delete" && db !== undefined) {
            await db.deleteById(storage().invoice.reference);
            elements.backLink.click();
        }
    }
    async function updateInvoice(data) {
        const db = storage()?.db;
        if (db !== undefined) {
            await db.upsert(data);
            mutate({ db, invoice: data });
        }
    }
    async function markAsPaid() {
        const data = Object.assign({}, storage().invoice);
        data.status = "paid";
        await updateInvoice(data);
    }
    return (
        <div id="app-wrapper">
            <Nav />
            <main>
                <section class={"box " + style["invoice__details"] + " column relative"}>
                    <a ref={elements.backLink} href="/" class="row back-btn icon-start" data-icon="arrow_left">Go back</a>
                    <Show when={storage()?.invoice} fallback={<div className="center"><p>loading...</p></div>}>
                        <>
                            <div class={style["invoice__status"] + " blank-box"} data-status={storage().invoice.status ?? ""}>
                                <dl class="row">
                                    <dt>status</dt>
                                    <dd class="box status-box icon-start">{storage().invoice.status ?? ""}</dd>
                                </dl>
                                <div class={"box " + style["invoice__actions"]}>
                                    <button aria-label="edit" class="box btn-edit" onClick={() => showDrawer(true)}>edit</button>
                                    <button aria-label="delete" class="box btn-danger" onClick={() => elements.dialog.showModal()}>delete</button>
                                    <button aria-label="mark as paid" class="box btn-primary paid" onClick={markAsPaid}>mark as paid</button>
                                </div>
                                <button aria-label="print invoice" type="button" class="icon-end row transparent-box" data-icon="file-download" onClick={() => window.print()}>print invoice</button>
                            </div>
                            <div class="blank-box stack grow-2 y-scrollable">
                                <dl class={style["invoice__desc"] + " label-text invoice-grid"}>
                                    <div class="row">
                                        <div>
                                            <dt class="content-bold" data-prefix="#" data-print="Reference: ">{storage().invoice.reference}</dt>
                                            <dd data-print="Project Description: " data-prefix="">{storage().invoice.description}</dd>
                                        </div>
                                        <div>
                                            <dt>{storage().invoice.senderAddress}</dt>
                                            <dd>{storage().invoice.senderCity}</dd>
                                            <dd>{storage().invoice.senderPostCode}</dd>
                                            <dd>{storage().invoice.senderCountry}</dd>
                                        </div>
                                    </div>
                                    <div>
                                        <dt>Invoice Date</dt>
                                        <dd class="content-bold">{storage().invoice.invoiceDate}</dd>
                                    </div>
                                    <div>
                                        <dt>Payment Due</dt>
                                        <dd class="content-bold">{storage().invoice.dueDate}</dd>
                                    </div>
                                    <div>
                                        <dt>Bill To</dt>
                                        <dd class="content-bold">{storage().invoice.clientName}</dd>
                                        <dd>{storage().invoice.clientAddress}</dd>
                                        <dd>{storage().invoice.clientCity}</dd>
                                        <dd>{storage().invoice.clientPostCode}</dd>
                                        <dd>{storage().invoice.clientCountry}</dd>
                                    </div>
                                    <div>
                                        <dt>Sent To</dt>
                                        <dd class="content-bold">{storage().invoice.clientMail}</dd>
                                    </div>
                                </dl>
                                <div class={style["invoice__table"]}>
                                    <div class={"box " + style["items-box"] + " stack"} role="grid" aria-label="invoice details">
                                        <div role="rowheader" class="sm-hide label-text grid">
                                            <div role="columnheader">item Name</div>
                                            <div role="columnheader">qty.</div>
                                            <div role="columnheader">price</div>
                                            <div role="columnheader">total</div>
                                        </div>
                                        <div data-for="items" role="rowgroup">
                                            <For each={storage().invoice.items}>
                                                {
                                                    (invoice) => (
                                                        <div role="row" class="content-bold invoice-grid">
                                                            <div role="gridcell">{invoice.name}</div>
                                                            <div role="gridcell" data-suffix=" x " class="label-text">{invoice.qty}</div>
                                                            <div role="gridcell" class="label-text">{invoice.priceAmount}</div>
                                                            <div role="gridcell">{invoice.totalAmount}</div>
                                                        </div>
                                                    )
                                                }
                                            </For>
                                        </div>
                                    </div>
                                    <dl class={"box " + style["amount-box"] + " segragator"}>
                                        <dt>grand total</dt>
                                        <dd class="content-bold">{storage().invoice.totalAmount}</dd>
                                    </dl>
                                </div>
                            </div>
                        </>
                    </Show>
                </section>
                <Show when={storage()?.invoice}>
                    <Drawer descriptor={descriptor()} invoice={storage().invoice} onClose={() => showDrawer(false)} onSave={updateInvoice} />
                </Show>
            </main>
            <dialog ref={elements.dialog} class="blank-box center" title="invoice deletion popup" onClose={handleClosedModal} onCancel={handleCancelation}>
                <form method="dialog" class="column">
                    <h3 class="heading-m">confirm deletion</h3>
                    <p>
                        <span>Are you sure you want to delete invoice #<span>{storage()?.invoice?.reference ?? ""}</span></span>?
                        <strong>This action cannot be undone.</strong>
                    </p>
                    <menu class="row">
                        <button aria-label="cancel" value="cancel" class="box btn-edit cancel">cancel</button>
                        <button aria-label="delete" value="delete" class="box btn-danger delete">delete</button>
                    </menu>
                </form>
            </dialog>
        </div>
    );
}
export default InvoiceDetails;
