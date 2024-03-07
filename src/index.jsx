/* @refresh reload */
import {lazy} from "solid-js";
import {render} from 'solid-js/web';
import {Router} from "@solidjs/router";
import stepByStep from "./step-by-step.js";
import datePicker from "./datepicker.js";
import utils from "./utils.js";

import "solid-devtools";
import './index.css';

async function load({params}) {
    const db = await utils.invoiceStorage();
    const invoice = await db.getById(params.id);
    return {db, invoice};
}
async function loadInvoices() {
    const db = await utils.invoiceStorage();
    const storedInvoices = await db.getAll();
    return {db, storedInvoices};
}
const root = document.getElementById('root');
const routes = [
    {
        component: lazy(() => import("./Invoice-Details.jsx")),
        load,
        path: "/invoice/:id"
    },
    {
        component: lazy(() => import("./App.jsx")),
        load: loadInvoices,
        path: "/"
    }
];

stepByStep.define("step-by-step");
datePicker.define("date-picker");

if (import.meta.env.DEV && !(HTMLElement.prototype.isPrototypeOf(root))) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
    <Router>{routes}</Router>
),root);
