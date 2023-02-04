# @lume/eventful

Emit and subscribe to events.

This is a standard event listener pattern, similar to `EventEmitter` in Node.js
where objects have a `.on('event-name')` method, or `EventTarget` in the web
where HTML elements have a `.addEventListener('event-name')` method, for listening to events from such objects.

Additionally, the `Eventful` class provided by this package is a _mixin_. It can
be added onto _any_ existing class without modifying its class hierarchy. More
on that below.

#### `npm install @lume/eventful`

## Usage

### Working with events

`@lume/eventful` provides a class (or _mixin_) called `Eventful` that your
objects can extend from so that they can emit events and other code can
subscribe to those events.

```js
import {Eventful} from '@lume/eventful'

// Here we define a Dog class that extends from `Eventful()` so that it can emit
// a "hungry" event any time its `makeHungry()` method is called.
class Dog extends Eventful() {
	makeHungry() {
		// Emit a "hungry" event when this method is called.
		this.emit('hungry')
	}

	feed(food) {
		// ... dog eats food (use imagination here) ...
	}
}

const dog = new Dog()

function handleHungryDog() {
	dog.feed('chow')
}

// When the dog emits the "hungry" event, let's feed it. We pass in the
// handleHungryDog function to be called any time the dog emits the "hungry"
// event.
dog.on('hungry', handleHungryDog)

// This triggers the "hungry" event, which causes the callback passed to
// `dog.on('hungry')` to fire.
dog.makeHungry()

// We can stop listening for "hungry" events by using `.off()` to remove our
// event handler, the handleHungryDog function.
dog.off('hungry', handleHungryDog)

// This time we trigger the "hungry" event again, but our handleHungryDog
// function will not run again (poor dog, don't do this to your dog in real
// life).
dog.makeHungry()
```

That's basically it. See also [`Eventful.test.ts`](./src/Eventful.test.ts) to
get more of an idea.

### Using `Eventful` as a mixin

Did you notice the `()` in `extends Eventful()` above? That's because `Eventful`
is a _mixin_.

By default, it returns an `Eventful` class that extends from `Object`. Pass in a
custom base class to extend from anything you want.

As an example, imagine you already have a class defined somewhere that extends
from an existing base class.

```js
import Animal from 'somewhere'

// Imagine we have this existing Cat class.
class Cat extends Animal {
	isFeelingCurious = false

	goExploring() {
		if (this.isFeelingCurious) {
			// ... cat goes exploring (use imagination here) ...
		} else {
			// ... cat sleeps on your fluffy pillow ...
		}
	}
}

const cat = new Cat()
cat.isFeelingCurious = true
cat.goExploring()
```

Let's say we're updating our app, and we wish to add `Eventful` functionality to this class. Without a mixin, our only option would be to find the base-most class of the Cat (whether that's `Animal`, or something even lower like `Organism`), and we'd have to make that base-most class extend from `Eventful` (if it weren't a mixin).

But `Eventful` is a mixin! We can simply add it to our class, without touching
anything else! Like so:

```js
import {Eventful} from '@lume/eventful'
import Animal from 'somewhere'

// Now our class extends from both Eventful and Animal. Convenient! No
// base-class refactoring needed!
class Cat extends Eventful(Animal) {
	#isFeelingCurious = false // Let's make this private now.

	goExploring() {
		if (this.#isFeelingCurious) {
			// ... cat goes exploring (use imagination here) ...
		} else {
			// ... cat sleeps on your fluffy pillow ...
		}
	}

	// Let us now add a public getter/setter that sets our state, but also emits an event:
	set isFeelingCurious(val) {
		this.#isFeelingCurious = val
		this.emit('curiosity-changed') // We have the ability to emit events now.
	}
	get isFeelingCurious() {
		return this.#isFeelingCurious
	}
}

const cat = new Cat()
cat.isFeelingCurious = true // Setting this emits the "curiosity-changed" event.

// Define a function to run when `isFeelingCurious` changes (i.e. when a "curiosity-changed" event is emitted)
cat.on('curiosity-changed', () => {
	cat.goExploring()
})

cat.isFeelingCurious = true // Causes the event to be emitted, which makes the cat go exploring.
```

## Why?

Why do you want to make your `Cat` class a little more complicated to do the same thing?

The answer is, it isn't about _you_! Events are useful for letting _other
people_ (or other parts of your program, written by you or other people) to
react to changes (events).

The above `Cat` class is more practical when it another piece of code has
multiple instances of it, and needs to react in differing way depending on which
events happen.

For example, let's imagine that we give a `Cat` instance to some other piece of
code by exporting it for sake of example:

```js
class Cat extends Eventful(Animal) {
	// ... same as before ...
}

export const cat = new Cat()

// At random points in time, make the cat randomly curious or not:
setTimeout(function updateCuriousityOverTime() {
	cat.isFeelingCurious = Math.random() > 0.5

	// Keep updating every random interval of up to 1 second:
	setTimeout(updateCuriousityOverTime, Math.random() * 1000)
})
```

Now, some other code can decide, _independently of the code that defined the
`cat`_, what to do whenever the cat's curiosity has changed, and the original
code that defined the cat is not responsible for reacting to the change:

```js
import {cat} from './cat.js'

// Maybe we're making a game (use imagination here). Let's react to cat curiosity changes:
cat.on('curiosity-changed', () => {
	if (cat.isFeelingCurious) {
		// Perhaps make a set of `Rat` and `Mouse` instances start to frantically go hide.
	} else {
		// Make the `Rat` and `Mouse` instances relax, the cat has gone to lay on a pillow.
	}
})
```
