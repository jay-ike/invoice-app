/*jslint browser, this*/

function updateContent(element) {
    const {property} = element.dataset;
    if (property !== undefined) {
        return function (data) {
            element.textContent = data[property] ?? "";
        };
    }
}
function updateAttributes(element) {
    let entries;
    const {attributes} = element.dataset;
    if (attributes !== undefined) {
        entries = attributes.split(",").map((val) => val.split(":"));
        entries = entries.map(function ([attr, value]) {
            return (elt, data) => elt.setAttribute(attr, data[value]);
        });
        delete element.dataset.attributes;
        return (data) => entries.forEach((fn) => fn(element, data));
    }
}
function updateItem(item) {
    const selector = "[data-property], [data-attributes]";
    let updatableElements = Array.from(item.querySelectorAll(selector));
    let tmp;
    updatableElements = updatableElements.map(function (elt) {
        const chain = [];
        chain[chain.length] = updateAttributes(elt);
        chain[chain.length] = updateContent(elt);
        return (data) => chain.filter(
            (fn) => typeof fn === "function"
        ).forEach((fn) => fn(data));
    });
    tmp = updateAttributes(item);
    if (typeof tmp === "function") {
        updatableElements[updatableElements.length] = tmp;
    }
    return (data) => updatableElements.forEach((fn) => fn(data));
}
function updateChildren(element, template) {
    return function (data = {}) {
        let datas = data[element.dataset.for];
        element.textContent = "";
        if (Array.isArray(datas)) {
            datas = datas.forEach(function (childData) {
                const item = template.cloneNode(true);
                updateItem(item)(childData);
                element.insertAdjacentElement("beforeend", item);
            });
        }
    };
}
function parseElement(element) {
    const {property} = element.dataset;
    const chain = [];
    let template;
    let tmp;

    tmp = updateAttributes(element);
    if (typeof tmp === "function") {
        chain[chain.length] = tmp;
    }
    if (property !== undefined) {
        chain[chain.length] = updateContent(element);
    }
    if (element.dataset.for !== undefined) {
        template = element.firstElementChild.cloneNode(true);
        element.textContent = "";
        chain[chain.length] = updateChildren(element, template);
    }
    return (data) => chain.forEach((fn) => fn(data));
}
function contentDispatcher(target) {
    const listeners = Array.from(
        target.querySelectorAll("[data-event]")
    ).reduce(function (acc, element) {
        const {event} = element.dataset;
        if (acc[event] === undefined) {
            acc[event] = [parseElement(element)];
        } else {
            acc[event][acc[event].length] = parseElement(element);
        }
        return acc;
    }, Object.create(null));
    return function (event, data) {
        let eventListeners = listeners[event];
        if (Array.isArray(eventListeners)) {
            eventListeners.forEach((fn) => fn(data));
        }
    };
}
function EventDispatcher(rootElement) {
    const self = Object.create(this);
    let emitters = Array.from(rootElement.querySelectorAll("[data-emit]")).reduce(
        function (acc, emitter) {
            acc[emitter.dataset.emit] = contentDispatcher(emitter);
            return acc;
        },
        Object.create(null)
    );
    self.dispatch = function (event, data) {
        if (emitters[event] !== undefined) {
            emitters[event](event, data);
        }
    };
    return self;
}
function sealerFactory() {
    const weakmap = new WeakMap();
    return Object.freeze({
        seal(object) {
            const box = Object.freeze(Object.create(null));
            if (object?.id !== undefined) {
                box.id = object.id;
            }
            weakmap.set(box, object);
            return box;
        },
        unseal(box) {
            return weakmap.get(box);
        }
    });
}

export {EventDispatcher, sealerFactory};
