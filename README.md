# @lume/eventful

Emit and subscribe to events.

This is a standard event listener pattern, similar to `EventEmitter` in Node
where objects have a `.on('event-name')` method, or `EventTarget` in the web
where HTML elements have a `.addEventListener('event-name')` method.

#### `npm install @lume/eventful`

## Usage

`@lume/eventful` provides a class (or mixin) called `Eventful` that your
objects can extend from so that they can emit events and other code can
subscribe to those events.

```js
import {Eventful} from '@lume/eventful'

class Dog extends Eventful {
	makeHungry() {
		// An instance of Dog emits a "hungry" event at some point.
		this.emit('hungry')
	}

	feed(food) {
		// ... dog eats food ...
	}
}

const dog = new Dog()

// When the dog emits the "hungry" event, let's feed it.
dog.on('hungry', () => {
	dog.feed('chow')
})

// This triggers the "hungry" event, which causes the callback passed to
// `dog.on('hungry')` to fire.
dog.makeHungry()
```

That's basically it. See also [`Eventful.test.ts`](./src/Eventful.test.ts) to
get more of an idea.
