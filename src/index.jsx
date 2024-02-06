/* @refresh reload */
import stepByStep from "./step-by-step.js";
import datePicker from "./datepicker.js";
import {lazy} from "solid-js";
import {render} from 'solid-js/web';
import {Router} from "@solidjs/router";

import './index.css';

function InvoiceDetails() {
    return <div>I'm just a dummy detail</div>;
}
const root = document.getElementById('root');
const routes = [
    {
        component: InvoiceDetails,
        path: "/invoice/:id"
    },
    {
        component: lazy(() => import("./App.jsx")),
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
