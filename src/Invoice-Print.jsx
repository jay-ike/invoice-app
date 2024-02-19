import { For, createSignal } from "solid-js";
import styles from "./invoice-preview.module.css";

function InvoicePreview() {
    const [invoice, setInvoice] = createSignal({items: []});
    let port;

    window.addEventListener("message", function(event) {
        if (event.ports[0] !== undefined) {
            port = event.ports[0];
            port.onmessage = handleMessage;
        } else {
            console.warn("sent handshake message without port");
        }
    });

    function handleMessage(event) {
        if (event.data !== undefined) {
            setInvoice(event.data);
            document.title = "invoice_" + event.data.reference + "_preview";
        } else {
            console.warn("sent message without data");
        }
    }
    return (
        <div className="stack">
            <div class="segragator">
                <ul class="medium-text" id="sender_infos">
                    <li>{invoice().senderAddress ?? ""}</li>
                    <li>{invoice().senderCity ?? ""}</li>
                    <li>{invoice().senderPostCode ?? ""}</li>
                    <li>{invoice().senderCountry ?? ""}</li>
                </ul>
                <dl id="reciever_infos" class="medium-text">
                    <dt class="primary-text">Invoice to</dt>
                    <dd>{invoice().clientName ?? ""}</dd>
                    <dd>{invoice().clientMail ?? ""}</dd>
                    <dd>{invoice().clientAddress ?? ""}</dd>
                    <dd>{invoice().clientCity ?? ""}</dd>
                    <dd>{invoice().clientPostCode ?? ""}</dd>
                    <dd>{invoice().clientCountry ?? ""}</dd>
                </dl>
            </div>
            <div class="details">
                <p><strong>Invoice Date:  </strong><span>{invoice().invoiceDate ?? ""}</span></p>
                <p><strong>Reference  </strong> #<span>{invoice().reference ?? ""}</span></p>
            </div>
            <p class={styles.description}><strong>Project Description:  </strong><span>{invoice().description ?? ""}</span></p>
            <table>
                <thead>
                    <tr>
                        <th scope="col">item name</th>
                        <th scope="col" class="align-end">quantity</th>
                        <th scope="col" class="align-end">unit price</th>
                        <th scope="col" class="align-end">total price</th>
                    </tr>
                </thead>
                <tbody>
                    <For each={invoice().items}>
                        {
                            (item) => (
                                <tr>
                                <td>{item.name}</td>
                                <td>{item.qty}</td>
                                <td>{item.priceAmount}</td>
                                <td>{item.totalAmount}</td>
                                </tr>
                            )
                        }
                    </For>
                </tbody>
                <tfoot>
                    <tr>
                        <th scope="row">amount due</th>
                        <td class="align-end" colspan="3">{invoice().totalAmount ?? ""}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
export default InvoicePreview;
