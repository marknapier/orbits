export default class MouseHandler {
  constructor(canvas, sim, renderer) {
    this.canvas = canvas;
    this.sim = sim;
    this.renderer = renderer || null; // Use provided renderer if available
    this.setupListeners();
  }
  
  // Get mouse position relative to canvas
  getMousePos(event) {
    const rect = this.canvas.getBoundingClientRect(); // Get canvas position for mouse coordinate calculations
    return {
      x: Math.floor(event.clientX - rect.left),
      y: Math.floor(event.clientY - rect.top)
    };
  }

  mouseDown(e) {
    const pos = this.getMousePos(e);
    this.sim.mousePressed(pos.x, pos.y);
  }

  mouseUp(e) {
    const pos = this.getMousePos(e);
    this.sim.mouseReleased(pos.x, pos.y);
  }

  mouseMove(e, dragging = false) {
    const pos = this.getMousePos(e);
    
    // Tell renderer the mouse position
    if (this.renderer != null) {
      this.renderer.setMouseXY(pos.x, pos.y);
    }
    
    // If mouse button is pressed, it's a drag operation
    if (dragging) {
      this.sim.mouseDragged(pos.x, pos.y);
    }
    else {
      // Just a mouse move, not dragging, see if we are near any particles
      const closestParticle = this.sim.mouseMoved(pos.x, pos.y);
      if (this.renderer) {
        this.renderer.setClosestParticle(closestParticle);
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
}
