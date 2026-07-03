import RenderSimple from './RenderSimple.js'

export default class RenderCurves extends RenderSimple {
  constructor(sim, canvas) {
    super(sim, canvas);
    this.bgColor = 'rgba(255, 245, 230, 0.1)';
  }

  render(curveParticles = []) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // clear canvas
    // this.clear();

    curveParticles.forEach(wavePoints => {
      // draw particles
      if (this.wavePoints && this.wavePoints.length > 0) {
        for (let i = 0; i < this.wavePoints.length; i++) {
          this.paintParticle(ctx, this.wavePoints[i].x, this.wavePoints[i].y, 2);
        }
      }

      ctx.strokeStyle = '#6B9BD1';
      ctx.lineWidth = 2;
      this.drawQuadraticBezier(ctx, wavePoints);
    });
  }

  // Draw a circle at particle position
  paintParticle(ctx, x, y, r) {
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
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
