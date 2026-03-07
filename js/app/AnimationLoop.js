// Usage:
// const canvas = document.getElementById('sim');
// const sim = new PhysicsEngine();
// const renderer = new Renderer(canvas, sim);
// const animationLoop = new AnimationLoop(sim, renderer);
//
// Start the animation
// animationLoop.start();
//
// Stop the animation (if needed)
// animationLoop.stop();
//
// Get current FPS (if needed)
// console.log(animationLoop.getFPS());

export default class AnimationLoop {
  constructor(sim, renderer) {
    this.sim = sim;
    this.renderer = renderer;
    this.isRunning = false;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
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
    
    // Update physics simulation
    this.sim.step();
    
    // Render the current state
    this.renderer.render();
    
    // Request next frame
    requestAnimationFrame(this.animate);
  }
  
  getFPS() {
    return this.fps;
  }
}
