/*jslint browser*/
import {EventDispatcher} from "./event-dispatcher.js";
const dispatcher = new EventDispatcher(document);
let port;
window.addEventListener("message", function (event) {
    if (event.ports[0] !== undefined) {
        port = event.ports[0];
        port.onmessage = handleMessage;
    } else {
        console.warn("sent handshake message without port");
    }
});

function handleMessage(event) {
    if (event.data !== undefined) {
        dispatcher.dispatch("invoiceupdated", event.data);
        document.title = "invoice_" + event.data.reference + "_preview";
    } else {
        console.warn("sent message without data");
    }
}
