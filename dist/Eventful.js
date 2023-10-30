export function Eventful(Base = Object) {
    var _a;
    class Eventful extends Base {
        constructor() {
            super(...arguments);
            this[_a] = isEventful;
            this.#eventMap = null;
        }
        static { _a = isEventful; }
        on(eventName, callback, context) {
            let eventMap = this.#eventMap;
            if (typeof callback !== 'function')
                throw new Error('Expected a function in callback argument of Eventful#on.');
            if (!eventMap)
                eventMap = this.#eventMap = new Map();
            let callbacks = eventMap.get(eventName);
            if (!callbacks)
                eventMap.set(eventName, (callbacks = []));
            callbacks.push([callback, context]);
        }
        off(eventName, callback, context) {
            const eventMap = this.#eventMap;
            if (!eventMap)
                return;
            const callbacks = eventMap.get(eventName);
            if (!callbacks)
                return;
            const index = callbacks.findIndex(tuple => tuple[0] === callback && tuple[1] === context);
            if (index === -1)
                return;
            callbacks.splice(index, 1);
            if (callbacks.length === 0)
                eventMap.delete(eventName);
            if (eventMap.size === 0)
                this.#eventMap = null;
        }
        emit(eventName, data) {
            const eventMap = this.#eventMap;
            if (!eventMap)
                return;
            const callbacks = eventMap.get(eventName);
            if (!callbacks)
                return;
            let tuple;
            let callback;
            let context;
            for (let i = 0, len = callbacks.length; i < len; i += 1) {
                tuple = callbacks[i];
                callback = tuple[0];
                context = tuple[1];
                callback.call(context, data);
            }
        }
        #eventMap;
    }
    Eventful.prototype[isEventful] = isEventful;
    return Eventful;
}
const isEventful = Symbol('isEventful');
Object.defineProperty(Eventful, Symbol.hasInstance, {
    value(obj) {
        if (!obj)
            return false;
        if (obj[isEventful])
            return true;
        return false;
    },
});
export function emits(eventName) {
    return (prototype, propName, descriptor) => {
        return _emits(prototype, propName, descriptor ?? undefined, eventName);
    };
}
function _emits(prototype, propName, descriptor, eventName) {
    if (!(prototype instanceof Eventful))
        throw new TypeError('The @emits decorator is only for use on properties of classes that extend from Eventful.');
    const vName = Symbol('@emits: ' + propName);
    let calledAsPropertyDecorator = false;
    if (!descriptor) {
        calledAsPropertyDecorator = true;
        descriptor = Object.getOwnPropertyDescriptor(prototype, propName);
    }
    let hasOriginalAccessor = false;
    let originalGet;
    let originalSet;
    let initialValue;
    let writable;
    if (descriptor) {
        if (descriptor.get || descriptor.set) {
            hasOriginalAccessor = true;
            originalGet = descriptor.get;
            originalSet = descriptor.set;
            if (!originalSet) {
                console.warn('The `@emits` decorator was used on an accessor named "' +
                    propName +
                    '" which did not have a setter. This means an event will never be emitted because the value can not be set. In this case the decorator doesn\'t do anything.');
                return;
            }
            delete descriptor.get;
            delete descriptor.set;
        }
        else {
            initialValue = descriptor.value;
            writable = descriptor.writable;
            if (!writable) {
                console.warn('The `@emits` decorator was used on a property named "' +
                    propName +
                    '" that is not writable. An event can not be emitted because the property can not be modified. In this case the decorator does not do anything.');
                return;
            }
            delete descriptor.value;
            delete descriptor.writable;
        }
    }
    let initialValueIsSet = false;
    function emitEvent() {
        this.emit(eventName, propName);
    }
    descriptor = {
        ...descriptor,
        configurable: true,
        ...(hasOriginalAccessor
            ? originalGet
                ? {
                    get() {
                        return originalGet.call(this);
                    },
                }
                : {}
            : {
                get() {
                    if (!initialValueIsSet) {
                        initialValueIsSet = true;
                        return (this[vName] = initialValue);
                    }
                    return this[vName];
                },
            }),
        ...(hasOriginalAccessor
            ? {
                set(newValue) {
                    originalSet.call(this, newValue);
                    Promise.resolve().then(emitEvent.bind(this));
                },
            }
            : {
                set(newValue) {
                    if (!initialValueIsSet)
                        initialValueIsSet = true;
                    this[vName] = newValue;
                    Promise.resolve().then(emitEvent.bind(this));
                },
            }),
    };
    if (calledAsPropertyDecorator)
        Object.defineProperty(prototype, propName, descriptor);
    else
        return descriptor;
}
//# sourceMappingURL=Eventful.js.map