/*jslint browser*/

function updateContent(element, data) {
    const {property} = element.dataset;
    element.textContent = data[property];
}
function updateAttributes(element, data) {
    let entries;
    const {attributes} = element.dataset;
    if (attributes !== undefined) {
        entries = attributes.split(",").map((val) => val.split(":"));
        entries.forEach(function ([attr, value]) {
            element.setAttribute(attr, data[value]);
        });
        delete element.dataset.attributes;
    }
}
function updateItem(item, data) {
    let updatableElements = item.querySelectorAll("[data-property], [data-attributes]");
    updatableElements.forEach(function (elt) {
        const {property} = elt.dataset;
        updateAttributes(elt, data);
        if (property !== undefined) {
            elt.textContent = data[property];
        }
    });
    updateAttributes(item, data);
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
function EventDispatcher() {
    const self = Object.create(this);
    let emitters = Array.from(document.querySelectorAll("[data-emit]")).reduce(
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
