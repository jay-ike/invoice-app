
/*jslint browser*/
import StepByStep from "./step-by-step.js";
import Datepicker from "./datepicker.js";
import utils from "./utils.js";
import {EventDispatcher} from "./event-dispatcher.js";

const {CustomEvent, HTMLCollection} = window;
const config = Object.create(null);
const formatter = utils.getFormatter();
const researchedTags = ["input", "select", "output"];
const emitter = new EventDispatcher(document);
const countInvoices = utils.getInvoicesDescriptor();
const printActor = utils.frameActor(document.querySelector("iframe#preview"));
let currentTheme = utils.getColorScheme();

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
function closeDrawer(formDatas) {
    const form = config.invoiceForm;
    const updateMessage = {invoices: [formDatas], update: true};
    let selector = ".inv-item:first-of-type [data-icon='delete']";
    let deletionButton;
    deletionButton = form.querySelector(selector);
    selector = ".inv-item + .inv-item";
    form.querySelectorAll(selector).forEach((elt) => elt.remove());
    deletionButton.click();
    config.invoiceForm.reset();
    form.firstElementChild.gotoStep(0);
    delete document.body.dataset.drawer;
    if (formDatas === undefined) {
        return;
    }
    if (config.drawer.dataset.edit !== undefined) {
        emitter.of("previewrequested").dispatch(formDatas);
        printActor.send(formDatas);
    }
    emitter.of("invoicesupdated").dispatch(updateMessage);
}
function updateFieldsDatas(fieldset, data) {
    let name = fieldset.name;
    Object.entries(data ?? {}).forEach(function ([key, value]) {
        let itemElt = name + "-" + key;
        if (fieldset.elements[itemElt] !== undefined) {
            fieldset.elements[itemElt].value = value;
        }
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
    let amount = 0;
    const predicate = (elt) => (
        researchedTags.includes(elt.tagName.toLowerCase())
        && elt.checkValidity()
    );
    result.items = [];
    const fieldsets = config.invoiceForm.querySelectorAll("fieldset");
    fieldsets.forEach(function (fieldset) {
        let item;
        let elements = Array.from(fieldset.elements).filter(predicate);
        if (fieldset.name.match(/item-\d+/)) {
            item = Object.create(null);
            elements.filter(predicate).forEach(function (elt) {
                const amountProps = ["price", "total"];
                let cost;
                let parts = elt.name.split(/item-\d+-/);
                item[parts[1]] = elt.value;
                if (amountProps.includes(parts[1])) {
                    cost = Number.parseFloat(elt.value);
                    item[parts[1] + "Amount"] = formatter.formatCurrency(cost);
                }
                if (parts[1] === "total") {
                    amount += cost;
                }
            });
            result.items[result.items.length] = item;
        } else {
            elements.forEach(function (elt) {
                result[elt.name] = elt.value;
            });
        }
    });
    result.dueDate = config.invoiceForm.getDueDate();
    if (result.dueDate === undefined) {
        delete result.dueDate;
    }
    result.totalAmount = formatter.formatCurrency(amount);
    result.reference = ref ?? utils.generateCode();
    result.status = status ?? "pending";
    return result;
}
async function handleEdition() {
    let data = await config.db.getById(document.body.dataset.id);
    let form = config.invoiceForm;
    const drawerData = Object.assign(
        {reference: data.reference},
        config.drawerMeta.edit
    );
    Object.entries(data).forEach(function formUpdater([key, value]) {
        if (form.elements[key] !== undefined) {
            form.elements[key].value = value;
        }
        if (key === "items") {
            initializeItems(value);
        }
    });
    notifyFormChange(form, {isValid: form.checkValidity()});
    drawerData.reference = data.reference;
    emitter.of("draweropened").dispatch(drawerData);
    if (data.step !== undefined) {
        config.invoiceForm.firstElementChild.gotoStep(data.step);
    }
    document.body.dataset.drawer = "show";
}
async function submitInvoice(id, state) {
    let data = getFormDatas(id, state);
    data = await config.db.upsert(data);
    closeDrawer(data);
}
function initializeInvoices(invoices) {
    emitter.of("invoicesupdated").dispatch({invoices});
    emitter.of("invoicesupdated").dispatch(
        {detail: countInvoices(invoices)},
        "invoicesfiltered"
    );
}
function getSelectedStatuses() {
    return Array.from(config.filterForm.elements).map((elt) => (
        elt.checked ?? false
        ? elt.name.replace(/selected/i, "")
        : null
    )).filter((elt) => elt !== null);
}

config.themeSwitches = {dark: "light", light: "dark"};
config.drawer = document.querySelector(".drawer");
config.invoiceForm = document.querySelector("form#invoice_form");
config.invoiceDetails = document.querySelector(".invoice__details");
config.stepIndicators = document.querySelectorAll(".step-indicator > li");
config.nextFormStep = document.querySelector("#next_step");
config.prevFormStep = document.querySelector("#prev_step");
config.dialog = document.querySelector("dialog");
config.filterForm = document.querySelector("#status-form");
config.drawerMeta = Object.freeze({
    create: {action: "new invoice", cancel: "discard", proceed: "save & send"},
    edit: {action: "edit ", cancel: "cancel", edit: "", proceed: "save changes"}
});

config.invoiceForm.getDueDate = function () {
    const form = config.invoiceForm;
    let terms = Number.parseInt(form.elements.paymentTerms.value);
    terms *= 24 * 3600000;
    if (Number.isFinite(terms) && form.selectedDate !== undefined) {
        terms += Date.parse(form.selectedDate);
        return formatter.formatDate(terms);
    }
};
config.invoiceForm.getCurrentStep = function () {
    const {firstElementChild} = config.invoiceForm;
    const step = firstElementChild.style.getPropertyValue("--current");
    return Number.parseInt(step, 10);
};
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

config.invoiceForm.addEventListener("dateselected", function ({detail}) {
    const {date} = detail;
    config.invoiceForm.selectedDate = date;
});

document.body.addEventListener("click", async function ({target}) {
    const root = document.documentElement;
    let data;
    if (target.classList.contains("theme-switch")) {
        root.dataset.theme = config.themeSwitches[currentTheme];
        currentTheme = config.themeSwitches[currentTheme];
    }
    if (target.classList.contains("invoice__summary")) {
        data = await config.db.getById(target.dataset.id);
        printActor.send(Object.assign({}, data));
        emitter.of("previewrequested").dispatch(data);
        document.body.dataset.id = data.reference;
        target.closest("step-by-step").gotoStep(1);
    }
    if (target.classList.contains("back")) {
        target.closest("step-by-step").gotoStep(0);
    }
    if (target.id === "new_invoice") {
        data = {action: "new invoice", reference: ""};
        emitter.of("draweropened").dispatch(config.drawerMeta.create);
        document.body.dataset.drawer = "show";
    }
}, false);
config.filterForm.addEventListener("input", async function () {
    let statuses = getSelectedStatuses();
    let invoices;
    if (statuses.length === 0) {
        invoices = await config.db.getAll();
    } else {
        invoices = await config.db.getAllByStatuses(statuses);
    }
    initializeInvoices(invoices);
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
config.drawer.addEventListener("click", function drawerClickHandler({target}) {
    let formDatas;
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
    if (target.classList.contains("proceed")) {
        submitInvoice(document.body.dataset.id);
    }
    if (target.classList.contains("btn-draft")) {
        submitInvoice(null, "draft");
    }
}, false);
config.dialog.addEventListener("cancel", function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    config.dialog.close("cancel");
});
config.dialog.addEventListener("close", async function () {
    let {db, dialog} = config;
    let invoices;
    if (dialog.returnValue === "delete") {
        await db.deleteById(document.body.dataset.id);
        invoices = await db.getAll();
        emitter.of("invoicesupdated").dispatch({invoices});
        config.invoiceDetails.closest("step-by-step").gotoStep(0);
        delete document.body.dataset.id;
    }
});
config.invoiceDetails.addEventListener("click", async function ({target}) {
    let data;
    if (target.classList.contains("back")) {
        delete document.body.dataset.id;
        config.invoiceDetails.closest("step-by-step").gotoStep(0);
    }
    if (target.classList.contains("btn-edit")) {
        await handleEdition();
    }
    if (target.classList.contains("btn-danger")) {
        data = await config.db.getById(document.body.dataset.id);
        emitter.of("dialogopened").dispatch(data);
        config.dialog.showModal();
    }
    if (target.dataset.icon === "file-download") {
        printActor.requestPrint();
    }
    if (target.classList.contains("paid")) {
        data = config.db.getById(document.body.dataset.id);
        data.status = "paid";
        data = config.db.upsert(data);
        emitter.of("previewrequested").dispatch(data);
        emitter.of("invoicesupdated").dispatch(
            {invoices: [data], update: true}
        );
    }
}, false);
(async function initialization() {
    let invoices;
    config.db = await utils.invoiceStorage();
    invoices = await config.db.getAll();
    initializeInvoices(invoices);
}());

StepByStep.define();
Datepicker.define();
