import Particle from '../physics2D/Particle.js';
import ColorPalette from './ColorPalette.js';
import RenderSimple from './RenderSimple.js'

export default class RenderCassini2 extends RenderSimple {
  // Configurable options
  bgColor = "rgb(60,0,0)";          // background color
  opacity = 0.5;                      // alpha for all paint operations
  clearBG = true;                     // if false, leaves motion trails
  violetColors = ["rgb(25, 15, 30)", "rgb(20, 10, 25)", "rgb(15, 5, 20)", "rgb(10, 0, 15)"];

  constructor(particles = [], springs = null, canvas) {
    super(particles, null, canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = particles;
    this.yellowGreenPalette = null; // colors will be loaded in init()
    this.grayPalette = null; // colors will be loaded in init()
    this.yellowBlurPalette = null; // colors will be loaded in init()
  }

  setParticles(particles) {
    this.particles = particles ?? [];
  }

  async init() {
    this.yellowGreenPalette = await ColorPalette.createFromImage('./images/beige_rings.jpg');
    this.grayPalette = await ColorPalette.createFromImage('./images/gray_ridges.png');
    this.yellowBlurPalette = await ColorPalette.createFromImage('./images/titan_blur.jpg');
    window.yellowGreenPalette = this.yellowGreenPalette;
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
    ctx.save();
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

    // ------------------------------------------------------------------------------------------------
    // Draw a circle for each particle pair, using the distance between particles as the radius.
    // ------------------------------------------------------------------------------------------------

    // Dark gray circle around p0
    // Make a 0-1 value that represents the radius length relative to the canvas height
    const radiusPercent = Math.max(Math.min(radius1 / this.canvas.height, 1), 0.1);
    ctx.save();
    {
      ctx.strokeStyle = this.grayPalette.getNextColor();
      ctx.lineWidth = 8 * radiusPercent;
      this.drawArcPath(ctx, p0, p1);
      ctx.stroke();
      this.drawLineV(p1.getX(), p1.getY()); // was p0
      ctx.stroke();
    }
    ctx.restore();



    // draw a yellow circle whose edges pass through p1 and p2
    // const yellowColor = 'rgb(80,80,150)'; //this.yellowGreenPalette.getNextColor();
    const yellowColor = 'rgb(11, 179, 137)'; //this.yellowGreenPalette.getNextColor();
    ctx.save();
    {
      ctx.strokeStyle = yellowColor;
      ctx.lineWidth = 5;
      this.drawArcPath(ctx, p1, p2);
      ctx.stroke();
      // greenish horizontal
      ctx.strokeStyle = "rgb(44, 217, 151)";
      this.drawLineH(p3.getX(), p3.getY());
      ctx.stroke();
      ctx.strokeStyle = "rgb(160, 12, 23, .05)";
      ctx.lineWidth = 4;
      this.drawLineH(p1.getX(), p1.getY());
      ctx.stroke();
    }
    ctx.restore();



    // light blue circle with thick border at p2
    const gradientPercent = Math.max(Math.min(radius3 / this.canvas.height, 1), 0.1);
    ctx.save();
    {
      ctx.beginPath();
      // if (gradientPercent < .4) {
      //   ctx.arc(p2.getX(), p2.getY(), radius3/2, 0, Math.PI * 2);
      //   ctx.fillStyle =  `rgb(1, 193, 193)`; 
      //   ctx.fill();
      // }
      // else {
      // switch to a non-filled circle with a wide border, 
      // subtract 1/2 of border width to keep the same overall radius
      ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2) - 20, 0), 0, Math.PI * 2);
      // ctx.fillStyle = this.yellowBlurPalette.getNextColor(); //`rgb(1, 193, 193)`;
      ctx.strokeStyle = this.yellowBlurPalette.getNextColor(); //`rgb(1, 193, 193)`;
      ctx.lineWidth = 10;
      ctx.stroke();
      // ctx.fill()
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#FDB813';

      // }
      // extra nuance on the edge
      ctx.beginPath();
      ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2) - 2, 1), Math.PI / 2, 3 * Math.PI / 2, false);
      // ctx.strokeStyle =  `rgb(65, 1, 193)`;  // deep blue
      ctx.strokeStyle = `rgb(148, 196, 196)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Red circle around p3
    ctx.save();
    {
      ctx.strokeStyle = 'rgb(250, 88, 13)';
      ctx.lineWidth = 2;
      this.drawArcPath(ctx, p2, p3);
      ctx.stroke();
      this.drawLineV(p2.getX(), p2.getY());
      ctx.stroke();
    }
    ctx.restore();

    // draw green circles at each particle
    ctx.save();
    {
      ctx.fillStyle = "green";
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.ellipse(p.getX(), p.getY(), 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.restore();
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
  // Draw a vertical line from top to bottom of canvas through point (x, y)
  drawLineV(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.canvas.height);
  }

  drawLineH(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
  }

  // ============================================================
  // Draw one particle (and optionally its filled trace polygon)
  paintParticle(p, ctx) {
    if (!p) return;

    // If trace is on, draw a filled trail behind particle
    if (p.trace && Array.isArray(p.tracePoints)) {
      const pts = [];
      for (let i = 0; i < p.tracePoints.length; i++) {
        const tp = p.tracePoints[i];
        if (!tp) continue;

        // Accept [x,y] or {x,y}
        const x = Array.isArray(tp) ? tp[0] : tp.x;
        const y = Array.isArray(tp) ? tp[1] : tp.y;

        if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
      }

      if (pts.length >= 3) {
        ctx.save();
        ctx.fillStyle = p.color ?? "black";

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    // Draw the particle (filled circle centered on particle pos)
    ctx.save();
    ctx.fillStyle = p.color ?? "black";
    ctx.beginPath();
    ctx.arc(p.getX(), p.getY(), p.getRadius(), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  clear() {
    // Draw a filled rectangle that covers the entire canvas
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
