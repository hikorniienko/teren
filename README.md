# teren
Teren is a lightweight library for writing modular game logic using generators, events, state, and a controllable update loop.

[See the Examples!](https://)

## Table of content
- [Installation](#installation)
- [Examples](https://)
- [About](#about)
- [Loop](#loop)
  - [dt](#dt)
  - [pause()](#pause)
  - [resume()](#resume)
  - [addUpdate()](#addupdatecallback)
  - [removeUpdate()](#removeupdatecallback)
  - [addRender()](#addrendercallback)
  - [removeRender()](#removerendercallback)
- [Event](#event)
  - [get()](#get)
  - [on()](#oncallback)
  - [off()](#offcallback)
  - [emit()](#emitcontext)
  - [await()](#awaitkey)
- [Runner](#runner)
  - [cancel()](#cancel)
- [Runner.sleep()](#runnersleepseconds)
- [Runner.race()](#runnerraceobj)
- [Runner.tween()](#runnertweenfromtodurationoptionscancelable)
- [License](#license)

## Installation

### npm

```bash
npm install teren
```

## About

In web games, async code often causes problems: timers and promises are hard to cancel deep in the code, and some code still runs after the scene ends. Teren solves this by using generators to write game logic.

**When to Use**

- When you make a game and want to control the steps: wait, play an animation, wait for a click, check something, cancel some fork.
- When you want to pause game logic and animations when the tab changes.
- When you want to write logic like normal step-by-step code, but still keep control.

Teren is built for games with modular logic. It uses generators, works with the game loop, and helps you write logic that is easy to follow, control, and cancel.

## Loop

The Loop class is a singleton that handles game update and render calls every frame.
By default, the loop is running.

### dt

Type: `number`

Delta time in seconds.

```ts
let x = 0;
Loop.instance.addUpdate(() => {
  x += Loop.instance.dt;
})
```

### pause()
Pauses the loop.

```ts
Loop.instance.pause();
```

### resume()
Resumes the loop.

```ts
Loop.instance.resume();
```

### addUpdate(callback)

Adds an update callback to the loop.

| Params   | Type         |
|----------|--------------|
| callback | `() => void` |


```ts
Loop.instance.addUpdate(() => {})
```

### removeUpdate(callback)
Removes an update callback from the loop.


| Params   | Type         |
|----------|--------------|
| callback | `() => void` |


```ts
Loop.instance.removeUpdate(() => {})
```

### addRender(callback)
Adds a render callback to the loop.


| Params   | Type         |
|----------|--------------|
| callback | `() => void` |


```ts
Loop.instance.addRender(() => {})
```

### removeRender(callback)
Removes a render callback from the loop.


| Params   | Type         |
|----------|--------------|
| callback | `() => void` |


```ts
Loop.instance.removeRender(() => {})
```

## Event

Event class that combines state management with event emitters.

Each event holds a context object (state), which can be updated and observed.
Listeners are triggered on `.emit()` with the latest merged context.

Ideal for scenarios like game signals, UI events, or shared state updates with side effects.


| Params     | Type                  | Default |
|------------|-----------------------|---------|
| context    | `Record<string, any>` | `{}`    |
| immutable  | `boolean`             | `true`  |

```ts
const counter = new Event<{ value: number }>(
  { value: 0 }, //default context
  true, // is immutable context, default true
)
```

### get()
Return: `context`

Gets the current event context.

```ts
console.log(counter.get());
```

### on(callback)
Adds a callback to the event.

| Params   | Type                                                  |
|----------|-------------------------------------------------------|
| callback | `(context: Context, keys: (keyof Context)[]) => void` |

```ts
counter.on((context, keys) => {
  console.log(context, keys);
})
```

### off(callback)
Removes a callback from the event.

| Params   | Type                                                  |
|----------|-------------------------------------------------------|
| callback | `(context: Context, keys: (keyof Context)[]) => void` |

```ts
const callback = (context, keys) => {
  console.log(context, keys);
}
counter.off(callback);
```

### emit(context)
Return: `context`

Merges and emits a partial context.

| Params  | Type                    |
|---------|-------------------------|
| context | `Partial<Context> = {}` |

```ts
// Emit with context: updates the context and triggers all subscribers
counter.emit({value: 1});

// Emit without context: triggers all subscribers with the current context
counter.emit();
```

### await(key)
Return: `Promise<context>`

Waits for the next event emission.

| Params | Type              |
|--------|-------------------|
| key    | `keyof Context`   |


```ts
// Wait for any emit() call (with or without updated values)
new Runner(function* () {
  yield counter.await();
  console.log('Counter:', counter.get());
});

// Wait specifically for emit() when the "value" field is updated
new Runner(function* () {
  yield counter.await('value');
  console.log('Counter:', counter.get());
});
```

## Runner

Runner class to manage asynchronous operations using generators.

Supports yielding:
- Generator functions
- Promises
- Other Runners (like forked operations, which will be stopped if parent is cancelled)
- Runner.sleep(seconds)
- Runner.tween(from, to, duration)
- Runner.race(promises)

Automatically updated every frame via Loop.
Runner.cancel() stops itself and all child runners.


| Params      | Type                  | Default |
|-------------|-----------------------|---------|
| fn          | `function * (): void` |         |
| cancellable | `boolean`             | `true`  |

```ts
const flow: Runner = new Runner(function* () {
    console.log('Start flow');
    
    // Execute second flow like fork
    const secondFlow: Runner = yield new Runner(function* () {
      console.log('Second flow start');
      
      // Sleep 1s
      yield Runner.sleep(1);
      console.log('Second flow await');
      
      // Sleep 1s
      yield Runner.sleep(1);
      console.log('Second flow not execute');
    });
    
    // Sleep 1s
    yield Runner.sleep(1);
    
    // Cancel second flow
    secondFlow.cancel();
  }, //generator function
  true, // stopped if parent is cancelled, default true
);
```

### cancel()
Cancel runner and children(if children can be cancelled).

```ts
const runner = new Runner(function* () {});
runner.cancel();
```

## Runner.sleep(seconds)

Pauses execution for N seconds (based on deltaTime).

| Params      | Type      | Default |
|-------------|-----------|---------|
| seconds     | `number`  |         |


```ts
new Runner(function* () {
    yield Runner.sleep(2);
})
```

## Runner.race(obj)

Waits for the first resolving promise and returns its key.

| Params | Type                               |
|--------|------------------------------------|
| obj    | `Record<string, Promise<unknown>>` |

```ts
new Runner(function* () {
    const result = yield Runner.race({
        wait: Runner.sleep(1),
        click: myEvent.await(),
    });

    if ('click' in result) {
        // do something
    }
})
```

## Runner.tween(from,to,duration,options,cancelable)

Animates numeric values from `from[]` to `to[]` over time.


| Params               | Type                                 | Default  |
|----------------------|--------------------------------------|----------|
| from                 | `Array<Record<string, any>>`         |          |
| to                   | `Array<Record<string, any>>`         |          |
| duration             | `number`                             |          |
| options.easing       | `(t: number) => number \| undefined` | (t) => t |
| options.onUpdate     | `() => void \| undefined`            |          |
| cancellable          | `boolean`                            | true     |

```ts
import { Runner, easeInOutSine } from 'teren';

new Runner(function* () {
    const testTween = { x: 0, y: 0 };
    const testTween2 = { x: 0, y: 0 };

    yield Runner.tween(
        [testTween, testTween2],
        [{ x: 100, y: 100 },{ x: 100, y: 100 }],
        2,
        {
            easing: easeInOutSine,
            onUpdate: () => {},
        },
        true // true means this tween be stopped if parent is cancelled
    );
})
```

## License

This project is licensed under the [MIT License](./LICENSE).  
© 2025 Vladyslav Korniienko