import { Eventful } from './Eventful.js';
let eventCount = 0;
let eventCount2 = 0;
describe('Eventful', () => {
    describe('provides an event pattern', () => {
        it('triggers an event handler based on event names', () => {
            const MyClass = Eventful();
            const o = new MyClass();
            const eventHandler = () => {
                eventCount += 1;
            };
            const eventHandler2 = () => {
                eventCount2 += 1;
            };
            o.on('foo', eventHandler);
            o.on('bar', eventHandler2);
            o.emit('foo');
            expect(eventCount).toBe(1);
            expect(eventCount2).toBe(0);
            o.emit('foo');
            expect(eventCount).toBe(2);
            expect(eventCount2).toBe(0);
            o.emit('foo');
            expect(eventCount).toBe(3);
            expect(eventCount2).toBe(0);
            o.emit('foo');
            o.emit('foo');
            o.emit('foo');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(0);
            o.emit('bar');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(1);
            o.emit('bar');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(2);
            o.emit('bar');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(3);
            o.off('foo', eventHandler);
            o.emit('foo');
            o.emit('foo');
            o.emit('foo');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(3);
            o.emit('bar');
            o.emit('bar');
            o.emit('bar');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(6);
            o.off('bar', eventHandler);
            o.emit('bar');
            o.emit('bar');
            o.emit('bar');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(9);
            o.off('bar', eventHandler2);
            o.emit('bar');
            o.emit('bar');
            o.emit('bar');
            expect(eventCount).toBe(6);
            expect(eventCount2).toBe(9);
        });
        it('passes event payloads to event handlers', () => {
            class MyClass extends Eventful() {
            }
            const o = new MyClass();
            let thePayload;
            let thePayload2;
            const handler = (payload) => {
                thePayload = payload;
            };
            const handler2 = (payload) => {
                thePayload2 = payload;
            };
            o.on('foo', handler);
            o.on('bar', handler2);
            o.emit('foo', 56);
            expect(thePayload).toBe(56);
            expect(thePayload2).toBe(undefined);
            o.emit('bar', 42);
            expect(thePayload).toBe(56);
            expect(thePayload2).toBe(42);
            o.off('bar', handler2);
            o.emit('foo', 'oh yeah');
            o.emit('bar', 123);
            expect(thePayload).toBe('oh yeah');
            expect(thePayload2).toBe(42);
        });
        it('allows callbacks to be paired with contexts with which to be called', () => {
            class MyClass extends Eventful() {
            }
            const o = new MyClass();
            let obj = { n: 0 };
            const o1 = {};
            const o2 = {};
            const callback = function (data) {
                // the first two calls
                if (data.n <= 1) {
                    if (data.n === 0) {
                        data.n++;
                        expect(this).toBe(o1);
                    }
                    else {
                        data.n++;
                        expect(this).toBe(o2);
                    }
                }
                // the 3rd and 4th calls
                else {
                    data.n++;
                    expect(this).toBe(o2);
                }
            };
            o.on('foo', callback, o1);
            o.on('foo', callback, o2);
            o.emit('foo', obj);
            expect(obj.n).toBe(2);
            o.off('foo', callback, o1);
            o.emit('foo', obj);
            o.emit('foo', obj);
            expect(obj.n).toBe(4);
            o.off('foo', callback, o2);
            o.emit('foo', obj);
            o.emit('foo', obj);
            o.emit('foo', obj);
            expect(obj.n).toBe(4);
        });
        it('allows us to check objects are instances of the mixin class or composed classes', () => {
            const MyClass = Eventful();
            class OtherClass extends Eventful() {
            }
            class AnotherClass extends Eventful(Array) {
            }
            let o = new MyClass();
            expect(o).toBeInstanceOf(Eventful);
            expect(o).toBeInstanceOf(MyClass);
            expect(o).not.toBeInstanceOf(OtherClass);
            expect(o).not.toBeInstanceOf(AnotherClass);
            expect(o).not.toBeInstanceOf(Array);
            o = new OtherClass();
            expect(o).toBeInstanceOf(Eventful);
            expect(o).not.toBeInstanceOf(MyClass);
            expect(o).toBeInstanceOf(OtherClass);
            expect(o).not.toBeInstanceOf(AnotherClass);
            expect(o).not.toBeInstanceOf(Array);
            o = new AnotherClass();
            expect(o).toBeInstanceOf(Eventful);
            expect(o).not.toBeInstanceOf(MyClass);
            expect(o).not.toBeInstanceOf(OtherClass);
            expect(o).toBeInstanceOf(AnotherClass);
            expect(o).toBeInstanceOf(Array);
        });
    });
});
//# sourceMappingURL=Eventful.test.js.map