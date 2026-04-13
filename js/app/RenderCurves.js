import RenderSimple from './RenderSimple.js'

export default class RenderCurves extends RenderSimple {
  // particles: array, springs: array, target: HTMLCanvasElement or 2D context
  constructor(particles = [], springs = [], target = null) {
    super(particles, null, target)
    this.particles = particles;
    this.springs = springs;
    this.mouseX = 0;
    this.mouseY = 0;
    this.bgColor = 'white';
    this.setTarget(target);
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // clear canvas
    this.clear();

    // draw particles
    if (this.particles && this.particles.length > 0) {
      for (let i = 0; i < this.particles.length; i++) {
        this.paintParticle(ctx, this.particles[i]);
      }
    }

    const wavePoints = this.particles.slice(0,10).map(p => ({ x: p.getX(), y: p.getY() }));
    // const vertPoints = this.particles.slice(10).map(p => ({ x: p.getX(), y: p.getY() }));
    ctx.strokeStyle = '#6B9BD1';
    ctx.lineWidth = 2;
    // this.drawSpline(ctx, wavePoints, 0.2, false); // tension: 0.3, not closed  
    // this.drawCatmullRomSpline(ctx, wavePoints, 1); // tension: 0 = sharp corners, 1 = very smooth  
    this.drawQuadraticBezier(ctx, wavePoints);
    // this.drawQuadraticBezier(ctx, vertPoints);
  }

  // Draw a circle at particle position
  paintParticle(ctx, particle) {
    if (!particle || !particle.pos) return;
    const x = particle.getX();
    const y = particle.getY();
    const r = Math.min(particle.getRadius(), 80);
    ctx.fillStyle = particle.getColor();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    // ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw a blue line connecting the two particles of the spring
  paintSpring(ctx, spring) {
    // return;
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

  clear() {
    // Draw a filled rectangle that covers the entire canvas
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // cardinal spline
  drawCardinalSpline(ctx, points, tension = 0.5, closed = false) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    const pts = closed ? [...points, points[0], points[1]] : points;

    for (let i = 0; i < pts.length - 2; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.stroke();
  }

  drawCatmullRomSpline(ctx, points, tension = 0.5) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      // Calculate control points using Catmull-Rom
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.stroke();
  }

  drawQuadraticBezier(ctx, points) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      // Use midpoint as control point for smooth curve
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    // Curve through the last point
    const lastPoint = points[points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
  }
}
