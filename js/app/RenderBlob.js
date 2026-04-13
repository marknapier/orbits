/**
 * RenderBlob.js
 * -------------
 * JavaScript port of the Java RenderBlob class.
 *
 * Assumptions:
 * - You already have the Blob class (from earlier) available in scope.
 * - "particles" is an array of Particle objects with roughly these fields:
 *    - getX(), getY()   OR   x, y
 *    - trace (boolean)
 *    - tracePoints: Array<[x,y]>  (or array of {x,y})
 *    - color: CSS color string (e.g. "#ff00aa" or "rgb(0,0,0)")
 *    - pos: { x, y } (or { getX(), getY() })
 *    - radius: number
 */

import Blob from './Blob.js';
import RenderSimple from './RenderSimple.js'

export default class RenderBlob extends RenderSimple {
  // Configurable options
  fillColor = "rgb(255,127,90)";    // good flesh tone
  bgColor = "rgb(60,0,0)";          // background color
  particleTrailColor = "black";       // (not directly used in Java either; particle.color is used)
  gradientColor1 = "green";           // begin gradient color
  gradientColor2 = "red";             // end gradient color
  lineWidth = 10;                     // outline thickness offset (used when blobOutline=true)
  opacity = 0.1;                      // alpha for all paint operations
  gradient = false;                   // paint blob with gradient
  doParticleTrails = false;           // draw arced trails behind first and last particles
  blobOutline = false;                // outline blob (worm effect) vs filled
  clearBG = true;                     // if false, leaves motion trails
  closestParticle = null;             // reference to closest particle to mouse (set by MouseHandler)
  
  /**
   * @param {object} opts
   * @param {HTMLCanvasElement} opts.canvas
   * @param {CanvasRenderingContext2D} [opts.ctx]
   * @param {Array<any>} [opts.particles]
   */
  constructor(canvas, springs = null, particles = []) {
    super(particles, null, canvas)
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = particles;

    // Blob instance: set number of steps to curve, more steps = smoother curve but more CPU
    this.BB = new Blob(20);
    this.BB.setCurveType(2);
  }

  setParticles(particles) {
    this.particles = particles ?? [];
  }

  // ============================================================
  // Render the physics simulation into the canvas
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear bg (or leave trails)
    if (this.clearBG) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Match Java: set a constant alpha composite for subsequent drawing
    ctx.save();
    ctx.globalAlpha = this.opacity;

    this.BB.clear();

    const particles = this.particles;
    if (particles && particles.length > 0) {
      for (let i = 0; i < particles.length; i++) {
        const p0 = particles[i];
        const x = p0.getX();
        const y = p0.getY();

        // add particles to blob to use as guide points
        this.BB.addKnotXY(x, y);

        // draw green dot at each particle
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.ellipse(x, y, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outline mode: add same points in reverse with offset
      if (this.blobOutline) {
        for (let i = particles.length - 1; i > 0; i--) {
          const p0 = particles[i];
          const x = p0.getX() - this.lineWidth;
          const y = p0.getY() - this.lineWidth;
          this.BB.addKnotXY(x, y);
        }
      }

      // set up gradient or solid color
      if (this.gradient) {
        const p0 = particles[0];
        const pN = particles[particles.length - 1];
        const x1 = p0.getX(), y1 = p0.getY();
        const x2 = pN.getX(), y2 = pN.getY();

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        // starting color of the gradient
        grad.addColorStop(0, this.gradientColor1);
        // ending color of the gradient
        grad.addColorStop(1, this.gradientColor2);
        ctx.fillStyle = grad;

        this._trailP0 = p0;
        this._trailPN = pN;
      } else {
        ctx.fillStyle = this.fillColor;
        this._trailP0 = particles[0];
        this._trailPN = particles[particles.length - 1];
      }

      // draw blob polygon
      ctx.save();
      this.BB.makePolygon();
      this.draw(this.BB.polygonPoints, ctx, {
        fillStyle: ctx.fillStyle, // may be gradient object
        strokeStyle: null,
      });
      ctx.restore();

      // draw trails behind first and last particle
      if (this.doParticleTrails) {
        this.paintParticleAndTrail(this._trailP0, ctx);
        this.paintParticleAndTrail(this._trailPN, ctx);
      }
    }

    ctx.restore();
  }

  // Draw the generated polygon on a canvas context
  draw(pts, ctx, { fillStyle = null, strokeStyle = null, lineWidth = 2 } = {}) {
    if (!pts || pts.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  // ============================================================
  // Draw one particle (and optionally its filled trace polygon)
  paintParticleAndTrail(p, ctx) {
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
