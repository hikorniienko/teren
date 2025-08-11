import { Loop } from './Loop';
const IS_RUNNER = Symbol('IS_RUNNER');

/**
 * Runner class to manage asynchronous operations using generators.
 *
 * Supports yielding:
 *  - Generator functions
 *  - Promises
 *  - Other Runners (like forked operations, which will be stopped if parent is cancelled)
 *  - Runner.sleep(seconds)
 *  - Runner.tween(from, to, duration)
 *  - Runner.race(promises)
 *
 * Automatically updated every frame via Loop.
 * Runner.cancel() stops itself and all child runners.
 *
 * @example
 * ```typescript
 * const initRunner: Runner = new Runner(function* () {
 *  console.log('Starting...');
 *
 *  yield Runner.sleep(1);
 *
 *  const runner: Runner = yield new Runner(function* () {
 *    console.log('Forked operation started...');
 *    yield Runner.sleep(1);
 *    console.log('Forked operation finished!');
 *  },
 *  true // true means this runner be stopped if parent is cancelled
 *  );
 *
 *  // runner.cancel(); // Cancel the forked operation if needed
 *
 *  console.log('Finished!');
 * });
 *
 * //initRunner.cancel(); // Cancel the runner, which will also cancel all child runners.
 * ```
 */
export class Runner {
  public static sleep = sleep;
  public static race = race;
  public static tween = tween;

  protected readonly [IS_RUNNER] = true;
  private children: Runner[] = [];
  private canceled = false;

  constructor(
    private readonly generatorFn: () => Generator,
    protected readonly cancellable = true,
  ) {
    const fn = this.generatorFn();

    const processNext = async (value?: unknown) => {
      if (this.canceled) return;

      try {
        const next = fn.next(value);
        const nextValue = await next.value;

        if (nextValue?.[IS_RUNNER] === true) {
          if (nextValue?.cancellable) {
            this.children.push(nextValue as Runner);
          }

          if (nextValue?.extraPromise) {
            await nextValue.extraPromise();
          }
        }

        if (!next.done) {
          await processNext(nextValue);
        }
      } catch (e) {
        console.error('Runner crashed:', e);
      }
    };

    void processNext();
  }

  public cancel(): void {
    this.canceled = true;

    for (const child of this.children) {
      child.cancel();
    }
  }
}

/**
 * Runner.sleep — pauses execution for N seconds (based on deltaTime).
 *
 * @example
 * ```typescript
 * yield Runner.sleep(2);
 * ```
 */
function sleep(seconds: number): Promise<boolean> {
  return new Promise((resolve) => {
    const update = () => {
      seconds -= Loop.instance.dt;
      if (seconds <= 0) {
        Loop.instance.removeUpdate(update);
        resolve(true);
      }
    };
    Loop.instance.addUpdate(update);
  });
}

/**
 * Runner.race — waits for the first resolving promise and returns its key.
 *
 * @example
 * const result = yield Runner.race({
 *   wait: Runner.sleep(1),
 *   click: myEvent.await(),
 * });
 *
 * if ('click' in result) { ... }
 */
async function race<T extends Record<string, Promise<unknown>>>(
  promises: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(promises) as [keyof T, Promise<unknown>][];

  return await Promise.race(
    entries.map(([key, promise]) =>
      promise.then(
        (value) => ({ [key]: value }) as { [K in keyof T]: Awaited<T[K]> },
      ),
    ),
  );
}

/**
 * Runner.tween — animates numeric values from `from[]` to `to[]` over time.
 *
 * @example
 * ```typescript
 * const testTween = { x: 0, y: 0 };
 * const testTween2 = { x: 0, y: 0 };
 *
 * yield Runner.tween(
 *   [testTween, testTween2],
 *   [{ x: 100, y: 100 },{ x: 100, y: 100 }],
 *   2,
 *   {},
 *   true // true means this tween be stopped if parent is cancelled
 * );
 *  ```
 */
function tween<T extends Array<Record<string, unknown>>>(
  from: T,
  to: T,
  duration: number,
  options: {
    easing?: (t: number) => number;
    onUpdate?: () => void;
    smoothFactor?: number;
  } = {},
  cancellable: boolean = true,
): {
  [IS_RUNNER]: true;
  cancellable: boolean;
  cancel: () => void;
  extraPromise: () => Promise<void>;
} {
  const keys = from.map((el) => Object.keys(el));
  const prevValues = from.map((obj) => {
    const record: Record<string, number> = {};
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'number') record[key] = obj[key] as number;
    }
    return record;
  });
  const smoothFactor = options.smoothFactor ?? 0.02;

  let canceled = false;
  let elapsed = 0;
  let resolve: () => void;

  const promise = new Promise<void>((res) => {
    resolve = res;
    Loop.instance.addUpdate(step);
  });

  function step() {
    if (canceled) {
      Loop.instance.removeUpdate(step);
      resolve();
      return;
    }

    elapsed += Loop.instance.dt;
    const t = Math.min(elapsed / duration, 1);
    const e = options?.easing ? options.easing : (t: number) => t;

    for (let i = 0; i < from.length; i++) {
      const fromObj = from[i];
      const toObj = to[i];
      for (const key of keys[i]) {
        const a = fromObj[key];
        const b = toObj[key];
        if (typeof a === 'number' && typeof b === 'number') {
          const target = a + (b - a) * e(t);
          prevValues[i][key] =
            prevValues[i][key] + (target - prevValues[i][key]) * smoothFactor;
          fromObj[key] = prevValues[i][key];
        }
      }
    }

    options?.onUpdate?.();

    if (t >= 1) {
      Loop.instance.removeUpdate(step);
      resolve();
    }
  }

  return {
    [IS_RUNNER]: true,
    cancellable,
    cancel: () => {
      canceled = true;
    },
    extraPromise: () => promise,
  };
}
