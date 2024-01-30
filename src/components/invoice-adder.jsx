import {For, createEffect, createMemo, createSignal} from "solid-js";
import InvoiceOption from "./invoice-option";
import utils from "../App.module.css"

const syntax = /\{(\w+)\}/g;
const dictionary = {
    be: {plural: "are", singular: "is"},
    item: {plural: "s"}
};

function InvoiceAdder(props) {
    const filterOptions = [
        {id: "o-draft", name:"draft"},
        {id: "o-paid", name:"paid"},
        {id: "o-pending", name:"pending"},
    ];
    const [options, setOptions] = createSignal([]);
    let totalInvoices = createMemo(function() {
        let total;
        if (props.allInvoices().length > 0) {
            total = props.allInvoices().length;
            return ("there {be} " + total + " invoice{item}").replace(
                syntax,
                function (ignore, term) {
                    if (total > 1) {
                        return dictionary[term].plural;
                    } else {
                        return dictionary[term].singular ?? "";
                    }
                }
            );
        } else {
            return "no invoice";
        }
    });

    createEffect(function optionsUpdated() {
        console.log(options());
    });

    function check(option) {
        setOptions(options().concat([option]));
    }
    function uncheck(option) {
        setOptions(options().filter((val) => val !== option));
    }

    return (
        <div class="row no-gap content-bold">
          <dl class="grow-2 capitalize">
            <dt class="heading-l">Invoices</dt>
            <dd class="subtitle-text">{totalInvoices}</dd>
          </dl>
          <div class="opt-filter relative" tabindex="0">
            <p class="box heading-s row icon-end" data-icon="arrow_down">Filter <span class={utils["sm-hide"]}>by status</span></p>
            <form id="status-form" class="stack box" action="">
              <For each={filterOptions} key="id">
                {
                    function optionBuilder(option) {
                        return <InvoiceOption name={option.name} id={option.id} onCheck={check} onUncheck={uncheck}></InvoiceOption>;
                    }
                }
              </For>
            </form>
          </div>
          <button id="new_invoice" aria-label="new invoice" data-icon="add-circle" class="row icon-start btn-primary box">New <span class={utils["sm-hide"]}>Invoice</span></button>
        </div>
    );
}

export default Object.freeze(InvoiceAdder);
