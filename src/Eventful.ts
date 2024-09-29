import type {Constructor} from 'lowclass/dist/Constructor.js'

// TODO, come up with a pattern for event handler args to be typed.

const isEventful = Symbol('isEventful')

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
	return class Eventful extends Base {
		// @ts-expect-error `as any` here to prevent errors in subclasses about "has or is using private name 'isEventful'"
		[isEventful as any] = true

		// We're using Set here so that iteration of event handlers is
		// impervious to items being deleted during iteration (i.e. during
		// emit).
		#eventMap: Map<string, Set<[Function, any]>> | null = null

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
			if (typeof callback !== 'function') throw new Error('Expected a function in callback argument of Eventful#on.')

			if (!eventMap) eventMap = this.#eventMap = new Map()

			let callbacks = eventMap.get(eventName)

			if (!callbacks) eventMap.set(eventName, (callbacks = new Set()))

			callbacks.add([callback, context])
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

			const tuple = Array.from(callbacks).find(tuple => tuple[0] === callback && tuple[1] === context)

			if (!tuple) return

			callbacks.delete(tuple)

			if (callbacks.size === 0) eventMap.delete(eventName)

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

			for (const [callback, context] of new Set(callbacks)) callback.call(context, data)
		}
	}
}

// Use defineProperty instead of assignment because [Symbol.hasInstance] is writable:false
Object.defineProperty(Eventful, Symbol.hasInstance, {
	value(value: any): boolean {
		if (!value) return false
		if (value[isEventful]) return true
		return false
	},
})
