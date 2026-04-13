import RenderSimple from './RenderSimple.js';
import Oscillator from './Oscillator.js';
import ImageLoader from './ImageLoader.js';
import ColorPalette from './ColorPalette.js';
import TexturedCircle from './TexturedCircle.js';

export default class RenderLenses extends RenderSimple {
  M = 30;
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
    this.gradient = this.makeGradient();
    this.pattern = null;
    this.bgTexture = null;
    this.grayPalette = null;
    this.texturedCircle = null;
    this.redButton = null;
  }

  async init() {
    try {
      this.grayPalette = await ColorPalette.createFromImage('./images/gray_ridges.png');
      this.bgTexture = await ImageLoader.loadImage('./images/gray_ridges.png');
      this.pattern = this.ctx.createPattern(this.bgTexture, 'repeat');
      this.texturedCircle = new TexturedCircle(
        this.particles[1].getX(), this.particles[1].getY(), this.particles[1].getRadius(), './images/cloud_wisp_200.jpg' //'./images/saturns_rings.jpg'
      );
      const redButton = await ImageLoader.loadImage('./images/shiny_button_red.png');
      this.redButton = this.scaleImage(redButton, 30, 30);
      this.redButtonRadius = 15;
    } catch (error) {
      console.error(error.message);
    }
  }

  scaleImage(img, newWidth, newHeight) {
    const offscreenCanvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = offscreenCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    return offscreenCanvas;
  }

  render() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.globalAlpha = 0.2;

    // Calculate giant planet position (elliptical path based on sin/cos)
    const giant = this.particles[1];
    const ex = 600 + this.xOscillator.getValue() * 1200;
    const ey = 500 + this.yOscillator.getValue() * 400;
    giant.pos.setXY(ex, ey);

    // draw large circles centered on each particle
    for (const p of this.particles) {
      p.sizeMultiplier = this.M;
      if (p === giant) {
        // this.texturedCircle.x = p.getX();
        // this.texturedCircle.y = p.getY();
        // this.texturedCircle.radius = p.getRadius() * p.sizeMultiplier;
        // this.texturedCircle.draw(ctx, 0.018);
                      ctx.globalCompositeOperation = 'overlay';
        this.drawCircle(ctx, p, p.radius * p.sizeMultiplier, 'rgba(221, 255, 3, 0.58)');
                      ctx.globalCompositeOperation = 'source-over';
      }
      else if (p.label === 'tiny') {
        this.drawCircle(ctx, p, p.radius * p.sizeMultiplier, 'rgba(141, 151, 53, 0.48)');
      }
      else {
        this.drawCircle(ctx, p, p.radius * p.sizeMultiplier, 'rgba(0, 10, 0, 0.48)');
      }
    }

    // draw intersections between circles
    for (let i = 0; i < this.particles.length - 1; i++) {
      const p1 = this.particles[i];
      if (p1.label === 'one') {
        // first particle is an "eraser": paint it a solid color
                      // ctx.globalCompositeOperation = 'source-over';
        this.fillCircle(this.ctx, p1, p1.radius * p1.sizeMultiplier, 'rgba(2, 0, 20, .8)');
                      // ctx.globalCompositeOperation = 'source-over';
        this.drawCircle(this.ctx, p1, p1.radius * p1.sizeMultiplier, this.pattern);
      }

      // intersect p1 with each other circle
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        if (p2.label === 'red') {
          // make this one bright red
          // this.fillCircle(this.ctx, p2, p2.radius * p2.sizeMultiplier, 'rgba(225, 20, 28, .28)');
          ctx.filter = "opacity(25%)";
          ctx.drawImage(this.redButton, p2.getX() - this.redButtonRadius, p2.getY() - this.redButtonRadius);
          ctx.filter = "none";
        }
        this.drawCrescentFromIntersections(
          p1.getX(), p1.getY(), p1.radius * p1.sizeMultiplier,
          p2.getX(), p2.getY(), p2.radius * p2.sizeMultiplier,
          true
        );
      }
    }
  }

  clampV(v, min, max) {
    return Math.min(max, Math.max(min, Math.abs(v)));
  }

  // Create a linear gradient object
  makeGradient() {
    // The gradient goes from x=0, y=0 to x=300, y=0 (horizontal)
    const gradient = this.ctx.createLinearGradient(0, 0, 1300, 0);
    // Add color stops
    gradient.addColorStop(0, 'rgba(255, 0, 0, .1)');       // Start color (at position 0 or 0%)
    gradient.addColorStop(0.5, 'yellow');  // Middle color (at position 0.5 or 50%)
    gradient.addColorStop(1, 'blue');      // End color (at position 1 or 100%)
    return gradient;
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
    if (false) {
      // ctx.strokeStyle = 'rgba(253, 184, 19 .1)';
      ctx.strokeStyle = 'rgba(255, 213, 44, 0.14)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Outer arc from interP1 to interP2
      ctx.arc(x1, y1, r1, angle1_outer, angle2_outer, false);
      // Inner arc from interP2 back to interP1 (counterclockwise)
      ctx.arc(x2, y2, r2, angle2_inner, angle1_inner, true);
      ctx.closePath();
      ctx.stroke();
    }

    // Draw the p2 crescent in turquoise
    if (false) {
      ctx.save();
      {
        ctx.fillStyle = this.turquoises[Math.floor(Math.random() * this.turquoises.length)];
        // ctx.fillStyle = 'rgba(1, 131, 109, 0.03)';
        ctx.beginPath();
        // Inner arc from interP2 back to interP1 (counterclockwise)
        ctx.arc(x2, y2, r2, angle2_inner, angle1_inner, false);
        // Outer arc from interP1 to interP2
        ctx.arc(x1, y1, r1, angle1_outer, angle2_outer, true);
        ctx.closePath();
              ctx.globalCompositeOperation = 'multiply';
        ctx.fill();
              ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    }

    // Draw the intersection "lens" in bright green outline, magenta fill
    if (true) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(6, 254, 18, .5)';
      // Inner arc of circle 2 (counterclockwise)
      ctx.beginPath();
      ctx.arc(x2, y2, r2, angle2_inner, angle1_inner, true);
      // Inner arc of circle 1 (counterclockwise)
      ctx.arc(x1, y1, r1, angle1_outer, angle2_outer, true);
      ctx.stroke();
              ctx.globalCompositeOperation = 'source-over';

      // ctx.fillStyle = 'rgba(255, 0, 217, 0.13)';
      ctx.fillStyle = 'rgba(212, 0, 255, 0.04)';
      ctx.fill()
              ctx.globalCompositeOperation = 'source-over';
    }

    // Show guide circles if requested
    if (false && showGuides) {
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
      // ctx.strokeStyle = 'rgba(255, 217, 0, 0.6)';
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

  drawEllipseAroundPoints(x1, y1, x2, y2, minorRatio = 0.6, padding = 20) {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const a = distance / 2 + padding;
    const b = a * minorRatio;
    const rotation = Math.atan2(dy, dx);

    const ctx = this.ctx;

    // Draw ellipse
    ctx.fillStyle = 'rgba(107, 155, 209, 0.2)';
    ctx.strokeStyle = '#6B9BD1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, a, b, rotation, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw center point
    ctx.fillStyle = '#8B7EC8';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw the two points
    ctx.fillStyle = '#F4D03F';
    ctx.beginPath();
    ctx.arc(x1, y1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw line connecting points
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawArcBetweenPoints(centerX, centerY, radius, p1, p2, color, counterclockwise = false) {
    // Calculate angles
    const angle1 = Math.atan2(p1.y - centerY, p1.x - centerX);
    const angle2 = Math.atan2(p2.y - centerY, p2.x - centerX);
    const ctx = this.ctx;

    // Draw reference circle
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arc
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angle1, angle2, counterclockwise);
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#F4D03F';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Label points
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText('p1', p1.x + 10, p1.y);
    ctx.fillText('p2', p2.x + 10, p2.y);
  }

  pauseOscillators() {
    Oscillator.pauseAll();
  }

  resumeOscillators() {
    Oscillator.resumeAll();
  }
}
