/**
 * Loop class that handles game update and render calls every frame.
 *
 * Use as a singleton: `Loop.instance`
 */
export class Loop {
  private static _instance: Loop;
  public static get instance(): Loop {
    if (!Loop._instance) {
      Loop._instance = new Loop();
    }
    return Loop._instance;
  }

  private isPaused = false;
  private updateList = new Set<() => void>();
  private renderList = new Set<() => void>();

  public dt: number = 0;
  public elapsed: number = 0;
  public then: number = performance.now();

  private constructor() {
    requestAnimationFrame(this.frame.bind(this));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  private frame() {
    if (!this.isPaused) {
      const now = performance.now();
      this.dt = (now - this.then) / 1000;
      this.elapsed += this.dt;
      this.then = now;

      this.updateList.forEach((f) => f());
      this.renderList.forEach((f) => f());
    }

    requestAnimationFrame(this.frame.bind(this));
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.then = performance.now(); // Reset the timer when resuming
  }

  public addUpdate(callback: () => void) {
    this.updateList.add(callback);
  }

  public removeUpdate(callback: () => void) {
    this.updateList.delete(callback);
  }

  public addRender(callback: () => void) {
    this.renderList.add(callback);
  }

  public removeRender(callback: () => void) {
    this.renderList.delete(callback);
  }
}
