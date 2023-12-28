/*jslint browser*/

function updateContent(element, data) {
    const {property} = element.dataset;
    element.textContent = data[property];
}
function updateAttributes(element, data) {
    const {attributes} = element.dataset;
    const entries = attributes.split(",").map((val) => val.split(":"));
    entries.forEach(function ([attr, value]) {
        element.setAttribute(attr, data[value]);
    });
}
function updateItem(item, data) {
    let updatableElements = item.querySelectorAll("[data-property]");
    updatableElements.forEach(function (elt) {
        const {property} = elt.dataset;
        elt.textContent = data[property];
    });
}
function updateChildren(element, template, data) {
    const childrenDatas = data[element.dataset.for];
    element.textContent = "";
    if (Array.isArray(childrenDatas)) {
        childrenDatas.forEach(function (data) {
            const item = template.cloneNode(true);
            updateItem(item, data);
            element.insertAdjacentElement("beforeend", item);
        });
    }
}
function parseElement(element) {
    const {attributes, property} = element.dataset;
    const chain = [];
    let template;
    if (attributes !== undefined) {
        chain[chain.length] = (data) => updateAttributes(element, data);
    }
    if (property !== undefined) {
        chain[chain.length] = (data) => updateContent(element, data);
    }
    if (element.dataset.for !== undefined) {
        template = element.firstElementChild.cloneNode(true);
        chain[chain.length] = (data) => updateChildren(element, template, data);
    }
    return (data) => chain.forEach((fn) => fn(data));
}
function contentDispatcher(target) {
    const selector = "[data-event]";
    const listeners = Array.from(
        target.querySelectorAll(selector)
    ).reduce(function (acc, element) {
        const {event} = element.dataset;
        if (acc[event] === undefined) {
            acc[event] = [parseElement(element)];
        } else {
            acc[event][acc[event].length] = parseElement(element);
        }
        return acc;
    }, Object.create(null));
    return {
        dispatch(event, data) {
            let eventListeners = listeners[event];
            if (Array.isArray(eventListeners)) {
                eventListeners.forEach((fn) => fn(data));
            }
        }
    };
}

export {contentDispatcher};
