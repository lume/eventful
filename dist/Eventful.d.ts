import type { Constructor } from 'lowclass';
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
export declare function Eventful<T extends Constructor>(Base?: T): {
    new (...a: any[]): {
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
        on(eventName: string, callback: Function, context?: any): void;
        /**
         * @method off - Stop a `callback` from being fired for event named `eventName`. If
         * the callback was previously registered along with a `context` in
         * `.on()`, be sure to pass the `context` to `.off()` as well.
         *
         * @param {string} eventName - The name of the event to unsubscribe `callback` from.
         * @param {Function} callback - The callback that will be no longer be executed when the event happens.
         * @param {any} context - A context associated with `callback`. Not passing a `context` arg is equivalent to unsubscribing the `callback` for `context` of `undefined`.
         */
        off(eventName: string, callback?: Function, context?: any): void;
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
        emit(eventName: string, data?: any): void;
        "__#1@#eventMap": Map<string, Array<[Function, any]>> | null;
    };
} & T;
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
export declare function emits(eventName: string): any;
//# sourceMappingURL=Eventful.d.ts.map