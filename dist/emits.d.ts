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
//# sourceMappingURL=emits.d.ts.map