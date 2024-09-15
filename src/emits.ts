import {Eventful} from './Eventful.js'

/**
 * @decorator
 * @function emits - This is a decorator that when used on a property in a
 * class definition, causes setting of that property to emit the specified
 * event, with the event payload being the property value. This decorator must
 * be used in a class that extends from Eventful, otherwise an error is thrown.
 *
 * @example
 * class Foo {
 *   @emits('propchange') foo = 123
 * }
 * const f = new Foo
 * f.on('propchange', value => console.log('value: ', value))
 * f.foo = 456 // logs "value: 456"
 */
export function emits(eventName: string): any {
	return (prototype: any, propName: string, descriptor?: PropertyDescriptor) => {
		return _emits(prototype, propName, descriptor ?? undefined, eventName)
	}
}

function _emits(prototype: any, propName: string, descriptor: PropertyDescriptor | undefined, eventName: string): any {
	if (!(prototype instanceof Eventful))
		throw new TypeError('The @emits decorator is only for use on properties of classes that extend from Eventful.')

	const vName = Symbol('@emits: ' + propName)

	// property decorators are not passed a descriptor (unlike decorators on accessors or methods)
	let calledAsPropertyDecorator = false

	if (!descriptor) {
		calledAsPropertyDecorator = true
		descriptor = Object.getOwnPropertyDescriptor(prototype, propName)
	}

	let hasOriginalAccessor = false
	let originalGet: (() => any) | undefined
	let originalSet: ((v: any) => void) | undefined
	let initialValue: any
	let writable: boolean | undefined

	if (descriptor) {
		if (descriptor.get || descriptor.set) {
			hasOriginalAccessor = true
			originalGet = descriptor.get
			originalSet = descriptor.set

			// reactivity requires both
			if (!originalSet) {
				console.warn(
					'The `@emits` decorator was used on an accessor named "' +
						propName +
						'" which did not have a setter. This means an event will never be emitted because the value can not be set. In this case the decorator doesn\'t do anything.',
				)
				return
			}

			delete descriptor.get
			delete descriptor.set
		} else {
			initialValue = descriptor.value
			writable = descriptor.writable

			// if it isn't writable, we don't need to make a reactive variable because
			// the value won't change
			if (!writable) {
				console.warn(
					'The `@emits` decorator was used on a property named "' +
						propName +
						'" that is not writable. An event can not be emitted because the property can not be modified. In this case the decorator does not do anything.',
				)
				return
			}

			delete descriptor.value
			delete descriptor.writable
		}
	}

	let initialValueIsSet = false
	function emitEvent(this: EventfulInstance) {
		this.emit(eventName, propName)
	}

	descriptor = {
		...descriptor,
		configurable: true,
		...(hasOriginalAccessor
			? originalGet
				? {
						get(): any {
							return originalGet!.call(this)
						},
				  }
				: {}
			: {
					get(): any {
						if (!initialValueIsSet) {
							initialValueIsSet = true
							return ((this as any)[vName] = initialValue)
						}

						return (this as any)[vName]
					},
			  }),
		...(hasOriginalAccessor
			? {
					set(newValue: any) {
						originalSet!.call(this, newValue)

						// TODO should we defer the event, or not? Perhaps provide an option, and defer by default.
						Promise.resolve().then(emitEvent.bind(this as EventfulInstance))
						// emitEvent.call(this as Eventful)
					},
			  }
			: {
					set(newValue: any) {
						if (!initialValueIsSet) initialValueIsSet = true
						;(this as any)[vName] = newValue
						Promise.resolve().then(emitEvent.bind(this as EventfulInstance))
					},
			  }),
	}

	// If a decorator is called on a property, then returning a descriptor does
	// nothing, so we need to set the descriptor manually.
	if (calledAsPropertyDecorator) Object.defineProperty(prototype, propName, descriptor)
	// If a decorator is called on an accessor or method, then we must return a
	// descriptor in order to modify it, and doing it manually won't work.
	else return descriptor
	// Weird, huh?
	// This will all change with updates to the ES decorators proposal, https://github.com/tc39/proposal-decorators
}

type EventfulInstance = InstanceType<ReturnType<typeof Eventful>>
