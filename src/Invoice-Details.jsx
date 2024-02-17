import { createSignal, For } from "solid-js";
import Nav from "./components/header.jsx";

function InvoiceDetails(props) {
    const [invoice, setInvoice] = createSignal({ items: [] });
    let dialog;
    let db;
    props.data.then(function(value) {
        if (value.invoice !== undefined) {
            db = value.db;
            setInvoice(value.invoice);
        }
    });

    function openModal() {
        dialog.showModal();
    }
    function handleCancelation(event) {
        event.preventDefault();
        dialog.close("cancel");
    }
    async function handleClosedModal(event) {
        const {returnValue} = event.target;
        if (returnValue === "delete") {
            await db.deleteById(invoice().reference);
            window.history.back();
        }
    }
    return (
        <>
            <Nav />
            <main>
                <section class="box invoice__details column relative" data-emit="previewrequested">
                    <a href="/" class="row back-btn icon-start" data-icon="arrow_left">Go back</a>
                    <div class="invoice__status blank-box" data-status={invoice().status ?? ""} data-event="previewrequested" data-attributes="data-status:{status}">
                        <dl class="row">
                            <dt>status</dt>
                            <dd class="box status-box icon-start" data-property="{status}" data-event="previewrequested">{invoice().status ?? ""}</dd>
                        </dl>
                        <div class="box invoice__actions">
                            <button aria-label="edit" class="box btn-edit">edit</button>
                            <button aria-label="delete" class="box btn-danger" onClick={openModal}>delete</button>
                            <button aria-label="mark as paid" class="box btn-primary paid">mark as paid</button>
                        </div>
                        <button aria-label="print invoice" type="button" class="icon-end row transparent-box" data-icon="file-download">print invoice</button>
                        <iframe id="preview" src="./print-preview.html" aria-hidden="true"></iframe>
                    </div>
                    <div class="blank-box stack grow-2 y-scrollable">
                        <dl class="invoice__desc label-text invoice-grid">
                            <div class="row">
                                <div>
                                    <dt class="content-bold" data-prefix="#" data-event="previewrequested" data-property="{reference}">{invoice().reference}</dt>
                                    <dd data-event="previewrequested" data-property="{description}" >{invoice().description}</dd>
                                </div>
                                <div>
                                    <dt data-event="previewrequested" data-property="{senderAddress}">{invoice().senderAddress}</dt>
                                    <dd data-event="previewrequested" data-property="{senderCity}">{invoice().senderCity}</dd>
                                    <dd data-event="previewrequested" data-property="{senderPostCode}">{invoice().senderPostCode}</dd>
                                    <dd data-event="previewrequested" data-property="{senderCountry}">{invoice().senderCountry}</dd>
                                </div>
                            </div>
                            <div>
                                <dt>Invoice Date</dt>
                                <dd data-event="previewrequested" data-property="{invoiceDate}" class="content-bold">{invoice().invoiceDate}</dd>
                            </div>
                            <div>
                                <dt>Payment Due</dt>
                                <dd class="content-bold" data-event="previewrequested" data-property="{dueDate}">{invoice().dueDate}</dd>
                            </div>
                            <div>
                                <dt>Bill To</dt>
                                <dd data-event="previewrequested" data-property="{clientName}" class="content-bold">{invoice().clientName}</dd>
                                <dd data-event="previewrequested" data-property="{clientAddress}">{invoice().clientAddress}</dd>
                                <dd data-event="previewrequested" data-property="{clientCity}">{invoice().clientCity}</dd>
                                <dd data-event="previewrequested" data-property="{clientPostCode}">{invoice().clientPostCode}</dd>
                                <dd data-event="previewrequested" data-property="{clientCountry}">{invoice().clientCountry}</dd>
                            </div>
                            <div>
                                <dt>Sent To</dt>
                                <dd data-event="previewrequested" data-property="{clientMail}" class="content-bold">{invoice().clientMail}</dd>
                            </div>
                        </dl>
                        <div class="invoice__table">
                            <div class="box items-box stack" role="grid" aria-label="invoice details">
                                <div role="rowheader" class="sm-hide label-text grid">
                                    <div role="columnheader">item Name</div>
                                    <div role="columnheader">qty.</div>
                                    <div role="columnheader">price</div>
                                    <div role="columnheader">total</div>
                                </div>
                                <div data-for="items" data-event="previewrequested" role="rowgroup">
                                    <For each={invoice().items}>
                                        {
                                            (invoice) => (
                                                <div role="row" class="content-bold invoice-grid">
                                                    <div role="gridcell" data-property="{name}">{invoice.name}</div>
                                                    <div role="gridcell" data-suffix=" x " data-property="{qty}" class="label-text">{invoice.qty}</div>
                                                    <div role="gridcell" class="label-text" data-property="{priceAmount}">{invoice.priceAmount}</div>
                                                    <div role="gridcell" data-property="{totalAmount}">{invoice.totalAmount}</div>
                                                </div>
                                            )
                                        }
                                    </For>
                                </div>
                            </div>
                            <dl class="box amount-box segragator">
                                <dt>grand total</dt>
                                <dd class="content-bold" data-event="previewrequested" data-property="{totalAmount}">{invoice().totalAmount}</dd>
                            </dl>
                        </div>
                    </div>
                </section>
            </main>
            <dialog ref={dialog} class="blank-box center" title="invoice deletion popup" onClose={handleClosedModal} onCancel={handleCancelation}>
                <form method="dialog" class="column">
                    <h3 class="heading-m">confirm deletion</h3>
                    <p>
                        <span>Are you sure you want to delete invoice #<span data-event="dialogopened" data-property="{reference}">{invoice().reference}</span></span>?
                        <strong>This action cannot be undone.</strong>
                    </p>
                    <menu class="row">
                        <button aria-label="cancel" value="cancel" class="box btn-edit cancel">cancel</button>
                        <button aria-label="delete" value="delete" class="box btn-danger delete">delete</button>
                    </menu>
                </form>
            </dialog>
        </>
    );
}
export default InvoiceDetails;
