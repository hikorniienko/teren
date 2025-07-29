import {Loop, Event, Runner} from '../src';

import { DOMSprite } from './utils/DOMSprite';
import './assets/main.css';
import './assets/basic.css';

// Simple DOM box example.
const root = document.getElementById('root');
const div = document.createElement('div');
const box = new DOMSprite(div,root!);

// Add box to render
Loop.instance.addRender(() => {
    box.render();
});

// Init event / state
const boxMoveEvent = new Event({ running: false });
const boxCountEvent = new Event({ count: 0 });

// Init click and toggle running
document.body.addEventListener('click', () => {
    const context = boxMoveEvent.get();
    boxMoveEvent.emit({ running: !context.running });
});

// Init Runners
new Runner(clickRunner);
new Runner(incrementCounter);

function * clickRunner () {
    let moveBoxRunner: Runner | null = null;

    while (true) {
        yield boxMoveEvent.await();
        const context = boxMoveEvent.get();

        if (context.running) {
            moveBoxRunner = new Runner(moveBox);
        } else {
            // Cancel runner and all runners in scope
            moveBoxRunner?.cancel();
        }
    }
}

// Function for move box
function * moveBox () {
    // Emit counter
    yield boxCountEvent.emit({ count: boxCountEvent.get().count + 1});

    // Fork for rotate
    yield new Runner(rotateBox);

    // Move box to random position
    const x = Math.random() * window.innerWidth - (window.innerWidth / 2);
    const y = Math.random() * window.innerHeight - (window.innerHeight / 2);
    yield Runner.tween([box as Record<string, any>], [{x, y}], 2);

    // Repeat move
    yield new Runner(moveBox);
}

// Function for rotate box
function * rotateBox () {
    const rotation = Math.random() * 360;
    yield Runner.tween([box as Record<string, any>], [{rotation}], 1);
}

// Increment counter
function * incrementCounter () {
    while (true) {
        yield boxCountEvent.await();
        const context = boxCountEvent.get();
        box.text = `${context.count}`;
    }
}
