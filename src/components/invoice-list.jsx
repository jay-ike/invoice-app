import {createEffect, For} from "solid-js";
import styles from "../App.module.css";

function InvoiceList(props) {
    let list;
    createEffect(function () {
        if (props.invoices()?.length === 0) {
            list.textContent = "";
        }
    });
    return (
     <>
        <div ref={list} class="invoices column grow-2" data-for="invoices" data-event="invoicesupdated" data-memoized data-id="reference">
           <For each={props.invoices()} id="reference">
                {
                    (invoice) => (
                        <button type="button" class={"blank-box " + styles["summary-grid"] + " invoice-grid"} aria-label={"invoice number " + invoice.reference}>
                            <span data-prefix="#">{invoice.reference}</span>
                            <span class="label-text" data-prefix="due ">{invoice.dueDate ?? "not assigned"}</span>
                            <span class="label-text">{invoice.clientName}</span>
                            <span >{invoice.totalAmount}</span>
                            <span class="box icon-start status-box" data-status={invoice.status}>{invoice.status}</span>
                        </button>
                    )

                }
           </For>
        </div>
        <div class="empty box center stack">
               <img src="/src/assets/Email campaign_Flatline 2.svg" alt="An Illustration of a woman in purple shirt holding a speaker for an email campaign" width="194" height="160"/>
               <h3 style="--space: 2em;" class="heading-m">There is nothing here</h3>
               <p class="subtitle-text">Create an invoice by clicking the <strong>New <span class="sm-hide">Invoice</span></strong> button and get started</p>
        </div>
     </>
    );
}

export default InvoiceList;
