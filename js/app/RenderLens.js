import RenderSimple from './RenderSimple.js';
import Oscillator from './Oscillator.js';
import ImageLoader from './ImageLoader.js';

export default class RenderLens extends RenderSimple {
  M = 50;
  turquoises = ['rgba(29, 110, 117, 0.03)', 'rgba(66, 146, 129, 0.03)', 'rgba(1, 131, 109, 0.03)', 'rgba(3, 167, 140, 0.03)'];

  // particles: array, springs: array, target: HTMLCanvasElement or 2D context
  constructor(particles = [], springs = [], target = null) {
    super(particles, null, target)
    this.particles = particles;
    this.springs = springs;
    this.mouseX = 0;
    this.mouseY = 0;
    this.bgColor = 'black';
    this.setTarget(target);
    this.xOscillator = new Oscillator(0.005, 'cos');
    this.yOscillator = new Oscillator(0.005, 'sin');
    this.grayRidgesPattern = null;
    this.grayRidgesImage = null;
    this.scaleFactor = 1;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    this.halfW = this.W / 2;
    this.halfH = this.H / 2;
    this.giant = this.particles.find(p => p.label === 'giant');
  }

  async init(scale = 1) {
    try {
      // adjust sizes based on screen size
      this.scaleFactor = scale;
      
      this.grayRidgesImage = await ImageLoader.loadImage('./images/gray_ridges.png');
      this.grayRidgesPattern = this.ctx.createPattern(this.grayRidgesImage, 'repeat');

      // canvas for drawing, will be copied to display canvas with overlay added
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      // save the on-screen context
      this.ctxDisplay = this.ctx;
      // we'll draw into the off screen context by default
      // We're only using the offscreen canvas to allow an overlay for one particle, the tiny
      // pink one, but it's overkill for such a small detail. Just draw 'seven' particle directly to the display canvas and skip the offscreen canvas entirely.
      // this.ctx = this.offscreenCanvas.getContext('2d');  // don't do the overlay for now, just draw directly to the display canvas

      // list of particles that we'll draw in overlay
      this.overlayParticles = this.particles.filter(p => p.label === 'seven');
    } catch (error) {
      console.error(error.message);
    }
  }

  render() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.globalAlpha = 0.2;

    // Calculate giant planet position (elliptical path based on sin/cos)
    const ex = (600 * this.scaleFactor) + (this.xOscillator.getValue() * 1200 * this.scaleFactor);
    const ey = (500 * this.scaleFactor) + (this.yOscillator.getValue() * 400 * this.scaleFactor);
    this.giant.pos.setXY(ex, ey);

    // draw large circles centered on each particle
    for (const p of this.particles) {
      p.sizeMultiplier = this.M;
      if (p === this.giant) {
        this.drawCircle(ctx, p, p.radius * p.sizeMultiplier, 'rgba(4, 1, 31, 0.63)');
      }
      else if (p.label === 'seven') {
        this.fillCircle(this.ctx, p, p.radius * p.sizeMultiplier, 'rgba(253, 76, 135, 0.5)');
        this.drawCircle(ctx, p, p.radius * p.sizeMultiplier, 'rgba(114, 115, 116, 0.48)');
      }
      else {
        this.drawCircle(ctx, p, p.radius * p.sizeMultiplier, 'rgba(114, 115, 116, 0.48)');
      }
    }

    // draw intersections between circles
    for (let i = 0; i < this.particles.length - 1; i++) {
      const p1 = this.particles[i];
      if (p1.label === 'one') {
        // first particle is an "eraser": paint it a solid color
        this.fillCircle(this.ctx, p1, p1.radius * p1.sizeMultiplier, 'rgba(2, 0, 20, .8)');
        this.drawCircle(this.ctx, p1, p1.radius * p1.sizeMultiplier, this.grayRidgesPattern);
      }
      
      // intersect p1 with each other circle
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        if (p2.label === 'six') {
          // make this one bright red
          this.fillCircle(this.ctx, p2, p2.radius * p2.sizeMultiplier, 'rgba(225, 20, 28, .28)');
        }
        this.drawCrescentFromIntersections(
          p1.getX(), p1.getY(), p1.radius * p1.sizeMultiplier,
          p2.getX(), p2.getY(), p2.radius * p2.sizeMultiplier,
          true
        );
      }
    }

    // draw the offscreen canvas to the visible canvas
    // this.ctxDisplay.globalAlpha = 1;
    // this.ctxDisplay.drawImage(
    //   this.offscreenCanvas,
    //   0, 0, this.canvas.width, this.canvas.height, // from
    //   0, 0, this.canvas.width, this.canvas.height  // to
    // );

    // // draw overlay circles on top of rendered canvas
    // this.ctxDisplay.globalAlpha = 1;
    // for (const p of this.overlayParticles) {
    //   this.fillCircle(this.ctxDisplay, p, p.radius * p.sizeMultiplier, 'rgba(253, 76, 135, 0.7)');
    // }
  }

  clampV(v, min, max) {
    return Math.min(max, Math.max(min, Math.abs(v)));
  }

  drawCrescentFromIntersections(x1, y1, r1, x2, y2, r2, showGuides = false) {
    const points = this.getCircleIntersections(x1, y1, r1, x2, y2, r2);
    const interP1 = points[0];
    const interP2 = points[1];
    const ctx = this.ctx;

    if (points.length < 2) {
      // circles do not intersect at two points
      return;
    }

    // Calculate start and end angles for outer arc (circle 1)
    const angle1_outer = Math.atan2(interP1.y - y1, interP1.x - x1);
    const angle2_outer = Math.atan2(interP2.y - y1, interP2.x - x1);

    // Calculate angles for inner arc (circle 2)
    const angle1_inner = Math.atan2(interP1.y - y2, interP1.x - x2);
    const angle2_inner = Math.atan2(interP2.y - y2, interP2.x - x2);

    // Draw the p1 crescent in yellow
    if (true) {
      // ctx.strokeStyle = 'rgba(253, 184, 19 .1)';
      ctx.strokeStyle = 'rgba(255, 213, 44, 0.14)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Outer arc from interP1 to interP2
      ctx.arc(x1, y1, r1, angle1_outer, angle2_outer, false);
      // Inner arc from interP2 back to interP1 (counterclockwise)
      ctx.arc(x2, y2, r2, angle2_inner, angle1_inner, true);
      ctx.stroke();
    }

    // Draw the p2 crescent in turquoise
    if (true) {
      ctx.save();
      {
        ctx.fillStyle = this.turquoises[Math.floor(Math.random() * this.turquoises.length)];
        // ctx.fillStyle = 'rgba(1, 131, 109, 0.03)';
        ctx.beginPath();
        // Inner arc from interP2 back to interP1 (counterclockwise)
        ctx.arc(x2, y2, r2, angle2_inner, angle1_inner, false);
        // Outer arc from interP1 to interP2
        ctx.arc(x1, y1, r1, angle1_outer, angle2_outer, true);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw the intersection "lens" in bright green outline, magenta fill
    if (true) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(6, 254, 18, 1)';
      // Inner arc of circle 2 (counterclockwise)
      ctx.beginPath();
      ctx.arc(x2, y2, r2, angle2_inner, angle1_inner, true);
      // Inner arc of circle 1 (counterclockwise)
      ctx.arc(x1, y1, r1, angle1_outer, angle2_outer, true);
      ctx.stroke();

      // blend modes kill performance when many circles overlap (starts stuttering)
      ctx.globalCompositeOperation = 'multiply'; // nice effect, darker, richer
      ctx.fillStyle = 'rgba(255, 0, 217, 0.38)'; // use this fill with the blend modes
      // use this fill without blend modes for better performance, but less vibrant colors
      // ctx.fillStyle = 'rgba(255, 0, 217, 0.03)';
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over';
    }

    // Show guide circles if requested
    if (showGuides) {
      // inner arc in blue
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(8, 119, 245, 0.3)';
      ctx.beginPath();
      ctx.arc(x1, y1, r1, 0, Math.PI * 2);
      ctx.stroke();
      // outer arc in green
      ctx.strokeStyle = 'rgba(13, 254, 86, 0.3)';
      ctx.beginPath();
      ctx.arc(x2, y2, r2, 0, Math.PI * 2);
      ctx.stroke();
      // Mark intersection points
      ctx.strokeStyle = 'rgba(174, 58, 0, 0.63)';
      ctx.beginPath();
      ctx.arc(interP1.x, interP1.y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(interP2.x, interP2.y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 225, 0, 0.26)';
    }
  }

  // Draw a circle at particle position
  paintParticle(ctx, particle) {
    if (!particle || !particle.pos) return;
    const x = particle.getX();
    const y = particle.getY();
    const r = Math.min(particle.getRadius(), 80);
    ctx.save();
    {
      ctx.fillStyle = particle.getColor();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawCircle(ctx, p, r, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.getX(), p.getY(), r, 0, Math.PI * 2);
    ctx.stroke();
  }

  fillCircle(ctx, p, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.getX(), p.getY(), r, 0, Math.PI * 2);
    ctx.fill();
  }

  clear() {
    // Draw a filled rectangle that covers the entire canvas
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getCircleIntersections(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > r1 + r2 || d < Math.abs(r1 - r2)) return [];

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);

    const px = x1 + (dx * a) / d;
    const py = y1 + (dy * a) / d;

    const offsetX = -(dy * h) / d;
    const offsetY = (dx * h) / d;

    return [
      { x: px + offsetX, y: py + offsetY },
      { x: px - offsetX, y: py - offsetY }
    ];
  }

  pauseOscillators() {
    Oscillator.pauseAll();
  }

  resumeOscillators() {
    Oscillator.resumeAll();
  }
}
