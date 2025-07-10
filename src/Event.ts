type Callback<Context> = (context: Context) => void;

/**
 * Event class that combines state management with event emitters.
 *
 * Each event holds a context object (state), which can be updated and observed.
 * Listeners are triggered on `.emit()` with the latest merged context.
 *
 * - Supports mutable or immutable context (deep-frozen after each emit).
 * - Supports regular (`on`) and one-time (`onOnce`) listeners.
 * - Allows awaiting the next `.emit()` via `.await()`.
 *
 * Ideal for scenarios like game signals, UI events, or shared state updates with side effects.
 *
 * @example
 * ```typescript
 * const userEvent = new Event<{ value: number, name: string }>({ value: 0, name: '' });
 *
 * // Subscribe to changes
 * userEvent.on((context) => {
 *   console.log('User event emitted:', context);
 * });
 *
 * // Await event in a runner
 * new Runner(function* () {
 *   yield userEvent.await();
 *   console.log('User data:', userEvent.get());
 * });
 *
 * // Emit
 * userEvent.emit({ value: 42, name: 'User1' });
 * ```
 */
export class Event<Context extends Record<string, any>> {
  private callbacks = new Set<Callback<Context>>();
  private callbacksOnce = new Set<Callback<Context>>();

  constructor(
    private context: Context = {} as Context,
    private readonly immutable = true,
  ) {}

  public get(): Context {
    return this.context;
  }

  public on(callback: Callback<Context>): void {
    this.callbacks.add(callback);
  }

  public off(callback: Callback<Context>): void {
    this.callbacks.delete(callback);
  }

  public onOnce(callback: Callback<Context>): void {
    this.callbacksOnce.add(callback);
  }

  public emit(context: Partial<Context> = {}): Context {
    const newContext = { ...this.context, ...context };
    this.context = this.immutable ? Object.freeze(newContext) : newContext;

    this.callbacks.forEach((callback) => callback(this.context));
    this.callbacksOnce.forEach((callback) => callback(this.context));
    this.callbacksOnce.clear();

    return newContext;
  }

  public async await(): Promise<Context> {
    return new Promise((resolve) => {
      const callback = (context: Context) => {
        resolve(context);
      };
      this.onOnce(callback);
    });
  }
}
