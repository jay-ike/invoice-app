/*jslint browser*/
import StepByStep from "./step-by-step.js";
import Datepicker from "./datepicker.js";
import store from "./storage.js";
import {contentDispatcher} from "./event-dispatcher.js";

const config = {};
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const researchedTags = ["input", "select", "output"];
const {CustomEvent, HTMLCollection, crypto, matchMedia} = window;
let currentTheme = (
    matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);

function getInvoiceRef() {
    let numbers = new Uint8Array(6);
    crypto.getRandomValues(numbers);
    return numbers.reduce((acc, val) => acc + alphabet[val % 32], "");
}
function notifyFormChange(formElement, detail) {
    const options = {bubbles: true};
    options.detail = detail ?? {isValid: formElement.form.checkValidity()};
    formElement.dispatchEvent(new CustomEvent("formstatechanged", options));
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
    if (HTMLCollection.prototype.isPrototypeOf(fieldset?.elements)) {
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
            button.scrollIntoView();
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
    const form = config.invoiceForm;
    let selector = ".inv-item:first-of-type [data-icon='delete']";
    let deletionButton;
    delete document.body.dataset.drawer;
    delete config.drawer.dataset.edit;
    deletionButton = form.querySelector(selector);
    selector = ".inv-item + .inv-item";
    form.querySelectorAll(selector).forEach((elt) => elt.remove());
    deletionButton.click();
    config.invoiceForm.reset();
    form.firstElementChild.gotoStep(0);
}
function updateFieldsDatas(fieldset, data) {
    let name = fieldset.name;
    Object.entries(data).forEach(function ([key, value]) {
        fieldset.elements[name + "-" + key].value = value;
    });
}
function initializeItems(values) {
    let previous = config.invoiceForm.querySelector(".inv-item:first-of-type");
    updateFieldsDatas(previous, values.shift());
    values.reduce(function (acc, itemData) {
        let clone = cloneFields(acc);
        updateFieldsDatas(clone, itemData);
        acc.insertAdjacentElement("afterend", clone);
        return clone;
    }, previous);
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
                let parts = elt.name.split(/item-\d+-/);
                item[parts[1]] = elt.value;
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
config.storage = store();
config.drawerDispatcher = contentDispatcher(config.drawer);
config.dispatchPreview = contentDispatcher(config.invoiceDetails).dispatch;

config.invoiceForm.firstElementChild.addEventListener(
    "indexupdated",
    function ({detail}) {
        const indicators = config.stepIndicators;
        let {current, previous} = detail;
        let step = 1;

        if (previous > current) {
            step = -1;
        }
        config.prevFormStep.disabled = current <= 0;
        config.nextFormStep.disabled = current >= indicators.length - 1;
        while (previous !== current) {
            if (step > 0) {
                indicators[previous].classList.add("step-active");
            } else {
                indicators[previous].classList.remove("step-active");
            }
            previous += step;
        }
        indicators[current].classList.add("step-active");
    },
    false
);

document.body.addEventListener("click", function ({target}) {
    const root = document.documentElement;
    let data;
    if (target.classList.contains("theme-switch")) {
        root.dataset.theme = config.themeSwitches[currentTheme];
        currentTheme = config.themeSwitches[currentTheme];
    }
    if (target.classList.contains("invoice__summary")) {
        data = config.storage.get("pending")[0];
        config.dispatchPreview("previewrequested", data);
        target.closest("step-by-step").nextStep();
    }
    if (target.classList.contains("back")) {
        target.closest("step-by-step").previousStep();
    }
    if (target.id === "new_invoice") {
        data = {action: "new invoice", reference: ""};
        config.drawerDispatcher.dispatch("draweropened", data);
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
        fieldset[itemName + "-total"].value = total;
    }
    notifyFormChange(target);
}, false);
config.drawer.addEventListener("formstatechanged", function ({detail}) {
    const {isValid} = detail;
    config.drawer.querySelector(".proceed").disabled = !isValid;
}, false);
config.drawer.addEventListener("click", function ({target}) {
    let formDatas;
    let storedDatas;
    const form = config.invoiceForm;
    if (target.classList.contains("cancel")) {
        closeDrawer();
    }
    if (target.id === "next_step") {
        requestNextFormStep();
    }
    if (target.id === "prev_step") {
        form.firstElementChild.previousStep();
    }
    if (target.classList.contains("large-btn")) {
        requestNewItem(target, target.previousElementSibling);
        notifyFormChange(target);
    }
    if (target.dataset.icon === "delete") {
        formDatas = target.parentElement.form;
        requestItemDeletion(target.parentElement);
        notifyFormChange(target, {isValid: formDatas.checkValidity()});
    }
    if (target.classList.contains("proceed") && form.checkValidity()) {
        formDatas = getFormDatas();
        storedDatas = config.storage.get(formDatas.status) ?? [];
        storedDatas[storedDatas.length] = formDatas;
        config.storage.set(formDatas.status, storedDatas);
        closeDrawer();
    }
}, false);
config.invoiceDetails.addEventListener("click", function ({target}) {
    let form;
    let data = config.storage.get("pending")[0];
    if (target.classList.contains("back")) {
        config.invoiceDetails.closest("step-by-step").previousStep();
    }
    if (target.classList.contains("btn-edit")) {
        form = config.invoiceForm;
        Object.entries(data).forEach(function ([key, value]) {
            if (form[key] !== undefined) {
                form[key].value = value;
            }
            if (key === "items") {
                initializeItems(value);
            }
        });
        notifyFormChange(form, {isValid: form.checkValidity()});
        data.action = "edit ";
        config.drawerDispatcher.dispatch("draweropened", data);
        config.drawer.dataset.edit = "";
        document.body.dataset.drawer = "show";
    }
    if (target.classList.contains("btn-danger")) {
        config.dialog.showModal();
    }
}, false);
StepByStep.define();
Datepicker.define();
