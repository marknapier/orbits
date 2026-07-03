/**
 * Base class for physics simulation renderers
 * 
 * Renderer draws the physics simulation onto the screen canvas. The 
 * physics and screen spaces may be different sizes, and the canvas may be scaled 
 * for high-DPI displays. Here's how the coordinate spaces relate to each other:
 * 
 *   +-----+  Physics simulation space 1440x810
 *   | sim |
 *   +-----+
 *   +----------+  Canvas screen space 1629x916 (CSS pixels, mouse coordinates)
 *   |  screen  |   
 *   |          |
 *   +----------+
 *   +--------------------+  Canvas internal pixel space 3258x1832 (for screen with devicePixelRatio=2)
 *   |                    |
 *   |     internal       |
 *   |                    |
 *   +--------------------+  
 * 
 * In a perfect world, the sim and canvas are the same size and we're not using 
 * a Retina (high dots-per-inch) display, so no transforms are needed.
 * 
 * But if the canvas is a different size than the sim, we need to scale the sim coordinates 
 * to fit the screen space using canvasScreenToSimRatioH.
 * 
 * And if the canvas is scaled for high-DPI displays the internal pixel space may be twice as 
 * large as the screen space. Then we need to scale rendering again to match the screen space
 * to the internal pixel dimensions of the canvas using dpiRatio.
 * 
 * Combine these two scaling factors (sim->screen and screen->internal) to get the 
 * total scaling factor for rendering:
 *     this.totalScale = this.dpiRatio * this.canvasScreenToSimRatioH;
 *     ctx.scale(this.totalScale, this.totalScale);
 * 
 * Subsequent drawing operations are now in the physics simulation space, and will 
 * be scaled to fit the canvas.
 *
 * NOTE that drawImage() operations are not scaled by ctx.scale(). If using particle 
 * positions (simulation space) to draw images, the particle positions need to be 
 * multiplied by the totalScale factor in order for them to appear at the correct 
 * size and position in the internal pixel space.
 * 
 */

export default class RenderSimple {
  /**
   * Constructor sets some foundational properties on the renderer instance:
   * particles, springs, canvas, ctx, mouse position, background color (defaults to white).
   * @param {*} sim 
   * @param {HTMLCanvasElement} canvas 
   */
  constructor(sim, canvas) {
    this.particles = sim.particles;
    this.springs = sim.springs;
    this.mouseX = 0;
    this.mouseY = 0;
    this.bgColor = 'white';
    this.setTarget(canvas);
  }

  setTarget(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d'); //, { colorSpace: 'display-p3' });
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // clear canvas
    this.clear();

    // draw springs first (so particles appear on top)
    if (this.springs && this.springs.length > 0) {
      ctx.lineWidth = 2;
      for (let i = 0; i < this.springs.length; i++) {
        this.paintSpring(ctx, this.springs[i]);
      }
    }

    // draw particles
    if (this.particles && this.particles.length > 0) {
      for (let i = 0; i < this.particles.length; i++) {
        this.paintParticle(ctx, this.particles[i]);
      }
    }
  }

  // Draw a circle at particle position
  paintParticle(ctx, particle) {
    if (!particle || !particle.pos) return;
    const x = particle.getX();
    const y = particle.getY();
    const r = particle.getRadius();
    ctx.fillStyle = particle.getColor();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw a blue line connecting the two particles of the spring
  paintSpring(ctx, spring) {
    if (!spring) return;
    const p1 = spring.getP1();
    const p2 = spring.getP2();
    if (!p1 || !p2) return;
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(p1.getX(), p1.getY());
    ctx.lineTo(p2.getX(), p2.getY());
    ctx.stroke();
  }

  setMouseXY(x, y) {
    // This method can be used to track mouse position for hover effects or other interactions
    this.mouseX = x;
    this.mouseY = y;
  }

  clear() {
    // Draw a filled rectangle that covers the entire canvas
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setClosestParticle(particle) {
    // This method can be used to to highlight particle near mouse cursor
  }

  /**
   * Returns the ratio of the actual pixel dimensions of the canvas / CSS pixel dimensions of the canvas onscreen. 
   * For a regular canvas this will be 1, but for a canvas that is scaled up for high DPI screens, 
   * this will be > 1 (e.g. 2 for typical Retina displays).
   * @see Page.createCanvasDPI for how to create a canvas that is scaled for high DPI screens.
   * @param {*} canvas 
   * @returns the scale factor the canvas
   */
  static getCanvasDPIRatio(canvas) {
    const style = window.getComputedStyle(canvas);
    const screenHeight = parseInt(style.height, 10); // just using height as a proxy
    return canvas.height / screenHeight;
  }

  /**
   * Get the size of the canvas as displayed on the screen (in CSS pixels). 
   * This may be smaller than canvas.width and canvas.height if the canvas is scaled for high DPI screens.
   * @param {*} canvas 
   * @returns the dimensions of the canvas in CSS pixels.
   */
  static getCanvasScreenSize(canvas) {
    const style = window.getComputedStyle(canvas);
    const width = parseInt(style.width, 10);
    const height = parseInt(style.height, 10);
    return { width, height };
  }
}
