/**
 * Drives a requestAnimationFrame loop for a physics simulation.
 *
 * @example
 * // With a sim + renderer pair:
 * const loop = new AnimationLoop(engine, renderer);
 *
 * // With a single update callback:
 * const loop = new AnimationLoop(() => { engine.step(); renderer.render(); });
 *
 * loop.start();
 * loop.stop();
 * console.log(loop.getFPS());
 */
export default class AnimationLoop {
  /**
   * @param {Function|Object} sim - Either a callback invoked each frame, or a physics
   *   engine with a `step()` method. When a function is passed, `renderer` is ignored.
   * @param {Object} [renderer] - Renderer with a `render()` method, used when `sim` is
   *   a physics engine rather than a callback.
   */
  constructor(sim, renderer) {
    this.updateFunction = null;
    this.sim = sim;
    this.renderer = renderer;
    this.isRunning = false;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
    // If a function is passed instead of physics sim and renderer, call that function to animate
    if (typeof sim === 'function') {
      this.updateFunction = sim;
    }
  }
  
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.animate(this.lastTime);
    }
  }
  
  stop() {
    this.isRunning = false;
  }
  
  running() {
    return this.isRunning;
  }

  animate = (currentTime) => {
    if (!this.isRunning) return;
    
    // Calculate delta time in seconds
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
    
    if (this.updateFunction) {
      // the function will handle the update
      this.updateFunction();
    }
    else {
      // Update physics simulation
      this.sim.step();
      
      // Render the current state
      this.renderer.render();      
    }
    
    // Request next frame
    requestAnimationFrame(this.animate);
  }
  
  getFPS() {
    return this.fps;
  }
}
