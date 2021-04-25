import type {Constructor} from 'lowclass'

// TODO, make strongly typed event args. Combine with stuff in Events.ts (or similar).

// TODO, Make sure emit will not attempt to call event handlers removed
// during emit (in place modification of listeners array during emit iteration
// will try to access undefined after the end of the array). Possibly use
// for..of with a Set instead, otherwise modify the iteration index manually.

// TODO, an option to defer events, and batch them (so that 3 of the
// same event and payload triggers only one event instead of three)

/**
 * @mixin
 * @class Eventful - An instance of Eventful emits events that code can
 * subscribe to with callbacks. Events may optionally pass a payload to the
 * callbacks.
 *
 * Callbacks can be associated with contexts to be called with (called with
 * Function.prototype.call), which offers more performance than similar
 * patterns that don't allow contexts to be specified (in those cases the user
 * has to create new arrow functions or function clones with
 * Function.prototype.bind, which is heavier).
 *
 * For example, suppose some object `rectangle` emits events named "resize".
 * One can react to those events by subscribing to them with a callback:
 *
 * ```js
 * const onResize = size => {
 *   // whenever `object` emits a "resize" event, the event passes a payload
 *   // containing the new size of `object`:
 *   console.log(size) // for example, {x: 123, y: 123}
 * }
 *
 * rectangle.on("resize", onResize)
 * ```
 *
 * To stop reacting to the "resize" event later, we can unsubscribe the
 * callback from the "resize" events:
 *
 * ```js
 * rectangle.off("resize", onResize)
 * ```
 */
export function Eventful<T extends Constructor>(Base: T = Object as any) {
	class Eventful extends Base {
		// @ts-ignore to avoid "is using private name" errors in consumer code.
		[isEventful as any] = isEventful as any

		/**
		 * @method on - Register a `callback` to be executed any
		 * time an event with name `eventName` is triggered by an instance of
		 * Eventful. If a `context` is passed to `.on()`, the `callback` is
		 * associated with both `eventName` and `context`. Make sure to also
		 * call `.off()` with the same `context` or else the callabck
		 * associated with that `context` will not be removed.
		 *
		 * @param {string} eventName - The name of the event to listen for.
		 * @param {Function} callback - A callback that will be called anytime the event named `eventName` happens. The callback may receive certain arguments depending on the event that the callback is subscribed to.
		 * @param {any} context - An optional context to call the callback with. Passing no context is the same as subscribing `callback` for a `context` of `undefined`.
		 */
		on(eventName: string, callback: Function, context?: any) {
			let eventMap = this.#eventMap

			// @prod-prune
			if (typeof callback !== 'function')
				throw new Error('Expected a function in callback argument of Eventful#on.')

			if (!eventMap) eventMap = this.#eventMap = new Map()

			let callbacks = eventMap.get(eventName)

			if (!callbacks) eventMap.set(eventName, (callbacks = []))

			callbacks.push([callback, context])
		}

		/**
		 * @method off - Stop a `callback` from being fired for event named `eventName`. If
		 * the callback was previously registered along with a `context` in
		 * `.on()`, be sure to pass the `context` to `.off()` as well.
		 *
		 * @param {string} eventName - The name of the event to unsubscribe `callback` from.
		 * @param {Function} callback - The callback that will be no longer be executed when the event happens.
		 * @param {any} context - A context associated with `callback`. Not passing a `context` arg is equivalent to unsubscribing the `callback` for `context` of `undefined`.
		 */
		off(eventName: string, callback?: Function, context?: any) {
			const eventMap = this.#eventMap

			if (!eventMap) return

			const callbacks = eventMap.get(eventName)

			if (!callbacks) return

			const index = callbacks.findIndex(tuple => tuple[0] === callback && tuple[1] === context)

			if (index === -1) return

			callbacks.splice(index, 1)

			if (callbacks.length === 0) eventMap.delete(eventName)

			if (eventMap.size === 0) this.#eventMap = null
		}

		/**
		 * @method emit - Cause the event with name `eventName` to be emitted
		 * (i.e. cause the event to happen). Any callbacks subscribed to the
		 * event will be executed and passed the arguments that passed into the
		 * emit call.
		 *
		 * For example, inside a Rectangle class we might see
		 *
		 * ```js
		 * this.emit("resize", {x, y})
		 * ```
		 *
		 * @param {string} eventName - The name of the event to emit.
		 * @param {data} any - The data that is passed to each callback subscribed to the event.
		 */
		emit(eventName: string, data?: any) {
			const eventMap = this.#eventMap

			if (!eventMap) return

			const callbacks = eventMap.get(eventName)

			if (!callbacks) return

			let tuple: typeof callbacks[0]
			let callback: typeof callbacks[0][0]
			let context: typeof callbacks[0][1]

			for (let i = 0, len = callbacks.length; i < len; i += 1) {
				tuple = callbacks[i]
				callback = tuple[0]
				context = tuple[1]
				callback.call(context, data)
			}
		}

		#eventMap: Map<string, Array<[Function, any]>> | null = null
	}

	Eventful.prototype[isEventful] = isEventful

	return Eventful
}

const isEventful = Symbol('isEventful')

Object.defineProperty(Eventful, Symbol.hasInstance, {
	value(obj: any): boolean {
		if (!obj) return false
		if (obj[isEventful]) return true
		return false
	},
})

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
		throw new TypeError('The @emits decorator in only for use on properties of classes that extend from Eventful.')

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
