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
    return (data) => (
        typeof data === "function"
        ? data(item)
        : updatableElements.forEach((fn) => fn(data))
    );
}
function updateChildren(element, clone) {
    const {id, memoized} = element.dataset;
    const sealer = sealerFactory();
    const keys = Object.create(null);
    function addKey(id, fn) {
        let key = sealer.seal(fn);
        keys[id] = key;
    }
    function callFn(id, data) {
        let fn = sealer.unseal(keys[id]);
        if (typeof fn !== "function") {
            return;
        }
        if (typeof data === "function") {
            data(fn);
        } else {
            fn(data);
        }
    }
    function remove(element) {
        element.remove();
    }
    function add(item) {
        element.insertAdjacentElement("beforeend", item);
    }
    function processMemoizedData(data) {
        let fn;
        if (data[id] === undefined) {
            return;
        }
        if (keys[data[id]] !== undefined) {
            callFn(data[id], data);
        } else {
            fn = updateItem(clone());
            addKey(data[id], fn);
            fn(data);
            fn(add);
        }
    }
    function updateMemoizedData(datas) {
        datas.forEach(function itemUpdater(data) {
            callFn(data[id], data);
        });
    }
    function handleNewData(datas, updated) {
        let currentIds;
        let itemsToRemove;
        if (updated) {
            updateMemoizedData(datas);
        } else {
            currentIds = datas.map((data) => data[id]);
            itemsToRemove = Object.keys(keys).filter(
                (key) => !currentIds.includes(key)
            );
            datas.forEach(processMemoizedData);
            itemsToRemove.forEach(function removeItem(key) {
                callFn(key, (fn) => fn(remove));
            });
        }
    }
    return function (data = {}) {
        let datas = data[element.dataset.for];
        const {update} = data;
        if (!Array.isArray(datas)) {
            return;
        }
        if (memoized !== undefined) {
            handleNewData(datas, update);
        } else {
            element.textContent = "";
            datas.forEach(function itemBuilder(childData) {
                let fn = updateItem(clone());
                fn(childData);
                fn(add);
            });
        }
    };
}
function parseElement(element) {
    const {property} = element.dataset;
    const chain = [];
    let cloner;
    let tmp;

    tmp = updateAttributes(element);
    if (typeof tmp === "function") {
        chain[chain.length] = tmp;
    }
    if (property !== undefined) {
        chain[chain.length] = updateContent(element);
    }
    if (element.dataset.for !== undefined) {
        tmp = element.firstElementChild.cloneNode(true);
        cloner = () => tmp.cloneNode(true);
        element.textContent = "";
        chain[chain.length] = updateChildren(element, cloner);
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
    let emitters = Array.from(
        rootElement.querySelectorAll("[data-emit]")
    ).reduce(
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
