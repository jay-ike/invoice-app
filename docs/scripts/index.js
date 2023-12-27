/*jslint browser*/
import StepByStep from "./step-by-step.js";
import Datepicker from "./datepicker.js";

const config = {};
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const researchedTags = ["input", "select", "output"];
let currentTheme = (
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);

function getInvoiceRef() {
    let numbers = new Uint8Array(6);
    window.crypto.getRandomValues(numbers);
    return numbers.reduce((acc, val) => acc + alphabet[val % 32], "");
}
function resetFields(fieldset, nameUpdater) {
    fieldset.name = fieldset.name.replace(/\d+/, nameUpdater);
    Array.from(fieldset.elements).filter(
        (elt) => elt.tagName.toLowerCase() !== "button"
    ).forEach(function (elt) {
        let label = elt.nextElementSibling;
        let newName = elt.name.replace(/\d+/, nameUpdater);
        label.htmlFor = newName;
        elt.dataset.new = "";
        elt.id = newName;
        elt.name = newName;
        elt.value = "";
        if (elt.tagName.toLowerCase() === "output") {
            elt.htmlFor = elt.htmlFor.value.replace(/\d+/g, nameUpdater);
        }
    });
}
function requestNextFormStep() {
    const selector = "step-by-step > :not(.step-out) :is(input,select)";
    let inputFields = Array.from(config.invoiceForm.querySelectorAll(selector));
    if (allFieldsValid(inputFields)) {
        config.invoiceForm.firstElementChild.nextStep();
    }
}
function allFieldsValid(fields) {
    return fields.every(function (field) {
        delete field.dataset.new;
        return field.checkValidity();
    });
}
function cloneFields(fieldset) {
    let clone = null;
    if (window.HTMLCollection.prototype.isPrototypeOf(fieldset?.elements)) {
        clone = fieldset.cloneNode(true);
        resetFields(clone, (val) => Number.parseInt(val, 10) + 1);
    }
    return clone;
}
function requestNewItem(button, fieldset) {
    let newItem;
    let fields = Array.from(fieldset.elements).filter(
        (elt) => elt.tagName.toLowerCase() !== "button"
    );
    if (allFieldsValid(fields)) {
        newItem = cloneFields(fieldset);
        if (newItem !== null) {
            button.insertAdjacentElement("beforebegin", newItem);
        }
    }
}
function requestItemDeletion(item) {
    const selector = "." + Array.from(item.classList.values()).join(".");
    const items = config.drawer.querySelectorAll(selector);
    if (items.length === 1) {
        resetFields(item, () => 1);
    } else {
        item.remove();
    }
}
function closeDrawer() {
    delete document.body.dataset.drawer;
    delete config.drawer.dataset.edit;
    config.invoiceForm.reset();
}
function getFormDatas(ref, status) {
    let result = Object.create(null);
    result.items = [];
    const fieldsets = config.invoiceForm.querySelectorAll("fieldset");
    fieldsets.forEach(function (fieldset) {
        let item;
        let elements = Array.from(fieldset.elements).filter(
            (elt) => researchedTags.includes(elt.tagName.toLowerCase())
        );
        if (fieldset.name.match(/item-\d+/)) {
            item = Object.create(null);
            elements.forEach(function (elt) {
                let [,key] = elt.name.split(/item-\d+-/);
                item[key] = elt.value;
            });
            result.items[result.items.length] = item;
        } else {
            elements.forEach(function (elt) {
                result[elt.name] = elt.value;
            });
        }
    });
    result.reference = ref ?? getInvoiceRef();
    result.status = status ?? "pending";
    return result;
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
config.drawer.addEventListener("input", function ({target}) {
    let fieldset;
    let itemName;
    let total;
    itemName = target.pattern ?? "";
    if (itemName.trim().length <= 0 || !target.required) {
        return;
    }
    fieldset = target.closest("fieldset.inv-item");
    if (fieldset === null) {
        return;
    }
    itemName = fieldset.name;
    fieldset = fieldset.elements;
    total = (
        Number.parseInt(fieldset[itemName + "-qty"].value, 10) *
        Number.parseFloat(fieldset[itemName + "-price"].value)
    );
    if (Number.isFinite(total)) {
        fieldset.elements[itemName + "-total"].value = total;
    }
}, false);
config.drawer.addEventListener("click", function ({target}) {
    let formDatas;
    if (target.classList.contains("cancel")) {
        closeDrawer();
    }
    if (target.id === "next_step") {
        requestNextFormStep();
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
    if (target.classList.contains("proceed") && config.invoiceForm.checkValidity()) {
        formDatas = getFormDatas();
        console.log(formDatas);
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
