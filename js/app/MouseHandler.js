/**
 * MouseHandler manages mouse interactions with the canvas and translates them into actions on the physics simulation. 
 * 
 * Responsibilities:
 * - Track mouse position relative to the canvas, accounting for canvas position and CSS scaling.
 * - Listen for mouse events and call corresponding methods on the simulation.
 * - Support touch events for mobile devices, translating them into equivalent mouse interactions.
 * - Optionally hide the cursor after a period of inactivity.
 * 
 * Note: Mouse coordinates are in browser viewport "pixels" (CSS pixels), which may differ from the 
 * physics simulation dimensions if the canvas is scaled for high-DPI displays. The MouseHandler 
 * translates mouse coordinates to match the physics simulation dimensions before passing them to the simulation.
 * 
 * @property {HTMLCanvasElement} canvas - The canvas element to attach mouse listeners to.
 * @property {Simulation} sim - The physics simulation instance to interact with based on mouse events.
 * @property {Renderer|null} renderer - Optional renderer instance to communicate mouse position for visual feedback.
 * @property {string} activeCursor - The current cursor style (e.g. 'crosshair', 'pointer').
 * @property {number} scaleFactorX - Scaling factor for translating mouse X coordinates from canvas space to simulation space.
 * @property {number} scaleFactorY - Scaling factor for translating mouse Y coordinates from canvas space to simulation space.
 */

export default class MouseHandler {
  constructor(canvas, sim, renderer) {
    this.canvas = canvas;
    this.sim = sim;
    this.renderer = renderer || null; // Use provided renderer if available
    this.activeCursor = 'crosshair';
    // The canvas size on screen (in CSS pixels) may differ from the actual canvas size in pixels if we are scaling for high-DPI displays. 
    // For mouse position handling, we need the screen size of the canvas.
    this.canvasScreenWidth = this.getCanvasScreenSize(canvas).width;
    this.canvasScreenHeight = this.getCanvasScreenSize(canvas).height;
    // Calculate scaling factors to translate mouse coordinates from canvas space to simulation space
    this.scaleFactorX = this.sim.getWidth() / (this.canvasScreenWidth || this.canvas.width);
    this.scaleFactorY = this.sim.getHeight() / (this.canvasScreenHeight || this.canvas.height);
    this.setupListeners();
  }

  // Return the mouse position relative to canvas, with upper left of canvas as 0,0.
  // This accounts for canvas position and any CSS scaling.
  // Mouse units are browser viewport "pixels", e.g. the onscreen CSS dimensions of the canvas. 
  // Actual canvas size in pixels may be larger to support higher device pixel ratios.
  //
  // Note: if the canvas is larger than the physics simulation area, the mouse coordinates 
  // need to be scaled from the coordinate space of the canvas to match the 
  // physics simulation dimensions before being used in the simulation.
  getMousePos(event) {
    const rect = this.canvas.getBoundingClientRect(); // Get canvas position for mouse coordinate calculations
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    return {
      x: x,
      y: y,
      simX: x * this.scaleFactorX, // Scale mouse coords to simulation dimensions
      simY: y * this.scaleFactorY,
    };
  }

  /**
   * Get the size of the canvas as displayed on the screen (in CSS pixels). 
   * This may be smaller than canvas.width and canvas.height if the canvas is scaled for high DPI screens.
   * @param {*} canvas 
   * @returns the dimensions of the canvas in CSS pixels.
   */
  getCanvasScreenSize(canvas) {
    const style = window.getComputedStyle(canvas);
    const width = parseInt(style.width, 10);
    const height = parseInt(style.height, 10);
    return { width, height };
  }

  mouseDown(e) {
    const pos = this.getMousePos(e);
    this.sim.mousePressed(pos.simX, pos.simY);
  }

  mouseUp(e) {
    const pos = this.getMousePos(e);
    this.sim.mouseReleased(pos.simX, pos.simY);
  }

  mouseMove(e, dragging = false) {
    const pos = this.getMousePos(e);

    // Tell renderer the mouse position
    if (this.renderer != null) {
      this.renderer.setMouseXY(pos.x, pos.y);
    }

    // If mouse button is pressed, it's a drag operation
    if (dragging) {
      this.sim.mouseDragged(pos.simX, pos.simY);
    }
    else {
      // Just a mouse move, not dragging, see if we are near any particles
      const closestParticle = this.sim.mouseMoved(pos.simX, pos.simY);
      if (this.renderer) {
        // tell the renderer that mouse is near a particle (for possible hover effect)
        this.renderer.setClosestParticle(closestParticle);
        // CursorManager needs to know what cursor it should show
        this.setActiveCursor(closestParticle ? 'pointer' : 'crosshair');
      }
    }
  }

  setupListeners() {
    // Mouse pressed (mousedown)
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouseDown(e);
    });

    // Mouse moved (mousemove)
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseMove(e, e.buttons === 1); // Pass whether mouse button is pressed for drag detection
    });

    // Mouse released (mouseup)
    this.canvas.addEventListener('mouseup', (e) => {
      this.mouseUp(e);
    });

    // Mouse leaving the canvas, release any active drag operations
    this.canvas.addEventListener('mouseleave', (e) => {
      const pos = this.getMousePos(e);
      this.sim.mouseReleased(pos.x, pos.y);
    });

    // Touch on the screen for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.mouseDown(touch);
    });

    // Touch and move on mobile is treated as a drag operation
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.mouseMove(touch, true);
    });

    // Touch end on mobile is treated as mouse release
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Get the "non-active" touch point (no longer touching the screen)
      const touch = e.changedTouches[0];
      this.mouseUp(touch);
    });
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  setActiveCursor(cursorType = 'crosshair') {
    this.canvas.style.cursor = cursorType;
    this.activeCursor = cursorType;
  }

  getActiveCursor() {
    return this.activeCursor;
  }

  /**
   * Hides the cursor after a delay of 6 seconds. The getActiveCursorFunc returns a string
   * such as 'crosshair' or 'pointer' to set the cursor style when the cursor is visible.
   * @param {*} element 
   * @param {*} getActiveCursorFunc 
   */
  hideCursorAfterDelay(delayInMillis = 6000) {
    const cursorManager = new CursorManager(this.canvas, {
      hideDelay: delayInMillis,
      getActiveCursorFunc: this.getActiveCursor.bind(this),
    });
  }
}

/**
 * Usage:
 *  const cursorManager = new CursorManager(document.body, {
      hideDelay: 10000,
      getActiveCursorFunc: (() => 'pointer')
    });
 *
 *  To stop: cursorManager.destroy();
 */
class CursorManager {
  constructor(element, options = {}) {
    this.element = element;
    this.hideDelay = options.hideDelay || 6000;
    this.getActiveCursorFunc = options.getActiveCursorFunc || (() => 'crosshair');
    this.timeout = null;
    this.init();
  }

  init() {
    this.resetTimer = this.resetTimer.bind(this);
    this.element.addEventListener('mousemove', this.resetTimer);
    this.resetTimer();
  }

  showCursor() {
    this.element.style.cursor = this.getActiveCursorFunc();
  }

  hideCursor() {
    this.element.style.cursor = 'none';
  }

  resetTimer() {
    this.showCursor();
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.hideCursor(), this.hideDelay);
  }

  destroy() {
    clearTimeout(this.timeout);
    this.element.removeEventListener('mousemove', this.resetTimer);
    this.showCursor();
  }
}
