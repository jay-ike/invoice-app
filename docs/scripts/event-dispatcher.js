/*jslint browser, this*/

const syntax = /\{([^{}:\s]+)\}/g;
function parsedTemplate(data, string) {
    let result = string.replace(
        syntax,
        function replacer(original, path) {
            let value;
            try {
               value = path.split(".").reduce(
                   (acc, val) => acc[val] ?? original,
                   data
               );
            return (
                typeof value === "function"
                ? value(data)
                : value
            );

            } catch (ignore) {
                return original;
            }
        }
    );
    return (
        result === string
        ? undefined
        : result
    );


}
function updateContent(element) {
    const {fallback, property} = element.dataset;
    delete element.dataset.fallback;
    delete element.dataset.property;
    delete element.dataset.event;
    if (property !== undefined) {
        return function (data) {
            element.textContent = parsedTemplate(data, property) ?? fallback;
        };
    }
}
function updateAttributes(element) {
    let entries;
    const {attributes} = element.dataset;
    if (attributes !== undefined) {
        entries = attributes.split(",").map((val) => val.split(":"));
        entries = entries.map(function ([attr, value]) {
            return function attributeUpdater(elt, data) {
                const attributeValue = parsedTemplate(data, value);
                if (attributeValue !== undefined) {
                    elt.setAttribute(attr, attributeValue);
                } else {
                    elt.removeAttribute(attr);
                }
            };
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
    function addNewItem(data) {
        let fn = updateItem(clone());
        addKey(data[id], fn);
        fn(data);
        fn(add);

    }
    function processMemoizedData(data) {
        if (data[id] === undefined) {
            return;
        }
        if (keys[data[id]] !== undefined) {
            callFn(data[id], function preview(fn) {
                fn(data);
                fn(add)
            });
        } else {
            addNewItem(data);
        }
    }
    function updateMemoizedData(datas) {
        datas.forEach(function itemUpdater(data) {
            let key = keys[data[id]];
            if (key === undefined) {
                addNewItem(data);
            } else {
                callFn(data[id], data);
            }
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
    let elementFactory;
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
        elementFactory = () => tmp.cloneNode(true);
        element.textContent = "";
        chain[chain.length] = updateChildren(element, elementFactory);
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
            const {emit} = emitter.dataset;
            let dispatch = contentDispatcher(emitter);
            const update = updateAttributes(emitter);
            acc[emit] = function emitHandler(event, data) {
                if (typeof update === "function" && event === emit) {
                    update(data);
                }
                dispatch(event, data);
            };
            return acc;
        },
        Object.create(null)
    );
    self.dispatch = function (event, data) {
        if (emitters[event] !== undefined) {
            emitters[event](event, data);
        }
    };
    self.of = function (emitter) {
        return Object.freeze({
            dispatch(data, event = emitter) {
                if (emitters[emitter] !== undefined) {
                    emitters[emitter](event, data);
                }
            }
        });
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
