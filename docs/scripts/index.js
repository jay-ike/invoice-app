/*jslint browser*/
import StepByStep from "./step-by-step.js";
import Datepicker from "./datepicker.js";

const config = {};
let currentTheme = (
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);

function resetFields(fieldset, newName) {
    fieldset.name = newName;
    Array.from(fieldset.elements).filter(
        (elt) => elt.tagName.toLowerCase() !== "button"
    ).forEach(function (elt) {
        let label = elt.nextElementSibling;
        label.htmlFor = newName;
        elt.dataset.new = "";
        elt.id = newName;
        elt.name = newName;
        elt.value = "";
    });

}

function cloneFields(fieldset) {
    let clone = null;
    let newName;
    if (HTMLCollection.prototype.isPrototypeOf(fieldset?.elements)) {
        clone = fieldset.cloneNode(true);
        newName = clone.name.replace(
            /\d+/,
            (val) => Number.parseInt(val, 10) + 1
        );
        resetFields(clone);
    }
    return clone;
}
function requestNewItem(button, fieldset) {
    let newItem;
    let isValid = Array.from(fieldset.elements).every(function (elt) {
        delete elt.dataset.new;
        if (elt.tagName.toLowerCase() !== "button") {
            return elt.checkValidity();
        }
        return true;
    });
    if (isValid) {
        newItem = cloneFields(fieldset);
        if (newItem !== null) {
            button.insertAdjacentElement("beforebegin", newItem);
        }
    }
}
function requestItemDeletion(item) {
    let newName;
    const selector = "." + Array.from(item.classList.values()).join(".");
    const items = config.drawer.querySelectorAll(selector);
    if (items.length === 1) {
        newName = item.name.replace(/\d+/, () => 1);
        resetFields(item, newName);
    } else {
        item.remove();
    }
}

config.themeSwitches = {dark: "light", light: "dark"};
config.drawer = document.querySelector(".drawer");
config.invoiceForm = document.querySelector("form#invoice_form");
config.invoiceDetails = document.querySelector(".invoice__details");
config.stepIndicators = document.querySelectorAll(".step-indicator > li");
config.nextFormStep = document.querySelector("#next_step");
config.prevFormStep = document.querySelector("#prev_step");
config.dialog = document.querySelector("dialog");

config.invoiceForm.firstElementChild.addEventListener(
    "indexupdated",
    function ({detail}) {
        const {current, previous} = detail;
        if (current > 0) {
            config.prevFormStep.disabled = false;
        } else {
            config.prevFormStep.disabled = true;
        }
        if (current >= config.stepIndicators.length - 1) {
            config.nextFormStep.disabled = true;
        } else {
            config.nextFormStep.disabled = false;
        }
        if (previous > current) {
            config.stepIndicators[previous].classList.remove("step-active");
        }
        config.stepIndicators[current].classList.add("step-active");
    },
    false
);

document.body.addEventListener("click", function ({target}) {
    const root = document.documentElement;
    if (target.classList.contains("theme-switch")) {
        root.dataset.theme = config.themeSwitches[currentTheme];
        currentTheme = config.themeSwitches[currentTheme];
    }
    if (target.classList.contains("invoice__summary")) {
        target.closest("step-by-step").nextStep();
    }
    if (target.classList.contains("back")) {
        target.closest("step-by-step").previousStep();
    }
    if (target.id === "new_invoice") {
        document.body.dataset.drawer = "show";
    }
}, false);
config.drawer.addEventListener("click", function ({target}) {
    if (target.classList.contains("cancel")) {
        delete document.body.dataset.drawer;
        delete config.drawer.dataset.edit;
    }
    if (target.id === "next_step") {
        config.invoiceForm.firstElementChild.nextStep();
    }
    if (target.id === "prev_step") {
        config.invoiceForm.firstElementChild.previousStep();
    }
    if (target.classList.contains("large-btn")) {
        requestNewItem(target, target.previousElementSibling);
    }
    if (target.dataset.icon === "delete") {
        requestItemDeletion(target.parentElement);
    }
}, false);
config.invoiceDetails.addEventListener("click", function ({target}) {
    if (target.classList.contains("back")) {
        config.invoiceDetails.closest("step-by-step").previousStep();
    }
    if (target.classList.contains("btn-edit")) {
        config.drawer.dataset.edit = "";
        document.body.dataset.drawer = "show";
    }
    if (target.classList.contains("btn-danger")) {
        config.dialog.showModal();
    }
}, false);
StepByStep.define();
Datepicker.define();
