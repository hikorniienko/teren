import { Loop, Event, Runner, easeInOutSine } from '../src';

import { CanvasStage } from './utils/CanvasStage';
import { CanvasSprite } from './utils/CanvasSprite';
import './assets/main.css';

// Simple DOM box example.
const root = document.getElementById('root')!;
const stage = new CanvasStage(root);
const box = new CanvasSprite(stage.ctx, stage.canvas);

// Add box element to render
Loop.instance.addRender(() => {
  stage.clear();
  box.render();
});

// Init event / state
const boxEvent = new Event({ count: 0, running: false });

// Init click and toggle running
document.body.addEventListener('click', () => {
  const context = boxEvent.get();
  boxEvent.emit({ running: !context.running });
});

// Init Runners
new Runner(clickRunner);
new Runner(incrementCounter);

function* clickRunner() {
  let flowBoxRunner: Runner | null = null;

  while (true) {
    yield boxEvent.await('running');
    const context = boxEvent.get();

    if (context.running) {
      flowBoxRunner = new Runner(flowBox);
    } else {
      // Cancel runner and all runners in scope
      flowBoxRunner?.cancel();
    }
  }
}

// Function for move box
function* flowBox() {
  while (true) {
    // Emit counter
    yield boxEvent.emit({ count: boxEvent.get().count + 1 });

    // Fork for rotate
    yield new Runner(rotateBox);

    // Move box to random position
    yield* moveBox();
  }
}

// Rotate box
function* rotateBox() {
  const rotation = Math.random() * 360;
  yield Runner.tween([box], [{ rotation }], 2, {
    easing: easeInOutSine,
  });
}

// Move box
function* moveBox() {
  const x = Math.random() * window.innerWidth - window.innerWidth / 2;
  const y = Math.random() * window.innerHeight - window.innerHeight / 2;
  yield Runner.tween([box], [{ x, y }], 3, {
    easing: easeInOutSine,
  });
}

// Increment counter
function* incrementCounter() {
  while (true) {
    yield boxEvent.await('count');
    const context = boxEvent.get();
    box.text = `${context.count}`;
  }
}
