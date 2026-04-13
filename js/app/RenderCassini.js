import Particle from '../physics2D/Particle.js';
import RenderSimple from './RenderSimple.js'

export default class RenderCassini extends RenderSimple {
  // Configurable options
  bgColor = "rgb(60,0,0)";          // background color
  lineWidth = 10;                     // outline thickness offset
  opacity = 0.5;                      // alpha for all paint operations
  clearBG = true;                     // if false, leaves motion trails
  yellowColors = ["rgb(255, 255, 0)", "rgb(240, 240, 10)", "rgb(210, 210, 50)", "rgb(250, 250, 100)"];
  violetColors = ["rgb(25, 15, 30)", "rgb(20, 10, 25)", "rgb(15, 5, 20)", "rgb(10, 0, 15)"];

  constructor(particles = [], springs = [], canvas) {
    super(particles, null, canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = particles;
    this.texturePattern = this.makeTexurePattern();
  }

  setParticles(particles) {
    this.particles = particles ?? [];
  }

  makeTexurePattern() {
    // Create a small canvas pattern (do this once, e.g., in constructor)
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 8;
    patternCanvas.height = 8;
    const patternCtx = patternCanvas.getContext('2d');
    patternCtx.fillStyle = 'rgba(143, 220, 253, 0.1)';
    patternCtx.fillRect(0, 0, 4, 2);
    patternCtx.fillRect(4, 4, 4, 2);
    return this.ctx.createPattern(patternCanvas, 'repeat');
  }

  drawArcPath(ctx, p1, p2) {
    // compute midpoint and radius from p1 and p2
    const x1 = p1.getX(), y1 = p1.getY();
    const x2 = p2.getX(), y2 = p2.getY();
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const radius = Math.hypot(x2 - x1, y2 - y1) / 2;
    ctx.beginPath();
    ctx.arc(mx, my, radius, 0, Math.PI * 2);
  }

  // ============================================================
  // Render the physics simulation into the canvas
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear bg if configured to do so, with a low alpha to create motion trails
    if (this.clearBG) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Set a constant alpha composite for subsequent drawing
    ctx.globalAlpha = this.opacity;

    const particles = this.particles;

    const p0 = particles[0];
    const p1 = particles[1];
    const p2 = particles[2];
    const p3 = particles[3];

    const radius1 = Particle.distance(p0, p1);
    const radius2 = Particle.distance(p1, p2);
    const radius3 = Particle.distance(p2, p3);
    const radius4 = Particle.distance(p3, p0);

    // draw green circles at each particle
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.ellipse(p.getX(), p.getY(), 3, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------------------------------------------
    // Draw a circle for each particle pair, using the distance between particles as the radius.
    // ------------------------------------------------------------------------------------------------

    // Dark violet circle around p0
    // Make a 0-1 value that represents the radius length relative to the canvas height
    const radiusPercent = Math.max(Math.min(radius1 / this.canvas.height, 1), 0.1);
    ctx.save();
    {
      ctx.strokeStyle = this.violetColors[(radiusPercent * 3) | 0];
      ctx.lineWidth = 20 * radiusPercent;
      this.drawArcPath(ctx, p0, p1);
      ctx.stroke();
    }
    ctx.restore();

    // draw a yellow circle whose edges pass through p1 and p2
    const yellowColor = this.yellowColors[Math.floor(Math.random() * this.yellowColors.length)];
    ctx.save();
    {
      ctx.strokeStyle = yellowColor;
      ctx.lineWidth = 2;
      this.drawArcPath(ctx, p1, p2);
      ctx.stroke();
    }
    ctx.restore();

    // light blue circle with thick border at p2
    ctx.save();
    {
      ctx.beginPath();
      // a non-filled circle with a wide border
      ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2), 0), 0, Math.PI * 2);
      ctx.strokeStyle = `rgb(1, 193, 193)`;
      ctx.lineWidth = 40;
      ctx.stroke();

      // Add a gradient effect to the circle
      if (false) {
        const gradient = ctx.createRadialGradient(p2.getX(), p2.getY(), 0, p2.getX(), p2.getY(), radius3 / 2);
        gradient.addColorStop(0, 'rgba(1, 193, 193, 0.8)');
        gradient.addColorStop(0.5, 'rgb(1, 193, 193)');
        gradient.addColorStop(1, 'rgba(1, 193, 193, 0.6)');

        ctx.beginPath();
        ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2), 0), 0, Math.PI * 2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 40;
        ctx.stroke();
      }

      // Add faint texture overlay with dashed pattern
      if (false) {
        ctx.beginPath();
        ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2), 0), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`; // faint white overlay
        ctx.lineWidth = 40;
        ctx.setLineDash([3, 3]); // dashed pattern
        ctx.stroke();
        ctx.setLineDash([]); // reset dash pattern
      }

      // Layer with pattern
      if (false) {
        ctx.beginPath();
        ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2), 0), 0, Math.PI * 2);
        ctx.strokeStyle = this.texturePattern;
        ctx.lineWidth = 40;
        ctx.stroke();
      }

      // extra nuance on the edge
      ctx.beginPath();
      ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2) + 18, 1), Math.PI / 2.2, 3 * Math.PI / 2, false);
      // ctx.strokeStyle =  `rgb(65, 1, 193)`;  // deep blue
      ctx.strokeStyle = `rgb(148, 186, 196)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Red circle around p3
    ctx.save();
    {
      ctx.strokeStyle = 'rgb(255, 25, 10)';
      ctx.lineWidth = 2;
      this.drawArcPath(ctx, p2, p3);
      ctx.stroke();
    }
    ctx.restore();
  }

  clear() {
    // Draw a filled rectangle that covers the entire canvas
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
