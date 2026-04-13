import Particle from '../physics2D/Particle.js';

export default class RenderOrbits {
  // Configurable options
  bgColor = "rgb(60,0,0)";          // background color
  lineWidth = 10;                     // outline thickness offset
  opacity = 0.5;                      // alpha for all paint operations
  clearBG = true;                     // if false, leaves motion trails
  yellowColors = ["rgb(255, 255, 0)", "rgb(240, 240, 10)", "rgb(210, 210, 50)", "rgb(250, 250, 100)"];
  violetColors = ["rgb(25, 15, 30)", "rgb(20, 10, 25)", "rgb(15, 5, 20)", "rgb(10, 0, 15)"];

  constructor(particles = [], springs = null, canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = particles;
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
    const radiusPercent = Math.max(Math.min(radius1/this.canvas.height, 1), 0.1);
    ctx.save();
    ctx.strokeStyle = this.violetColors[(radiusPercent * 3) | 0];
    ctx.lineWidth = 20 * radiusPercent;
    ctx.beginPath();
    ctx.arc(p0.getX(), p0.getY(), radius1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // draw a yellow outline around p1
    const yellowColor = this.yellowColors[Math.floor(Math.random() * this.yellowColors.length)];
    ctx.save();
    ctx.strokeStyle = yellowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p1.getX(), p1.getY(), radius1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // light blue circle with thick border at p2
    const gradientPercent = Math.max(Math.min(radius3/this.canvas.height, 1), 0.1);
    ctx.save();
    {
      ctx.beginPath();
      if (gradientPercent < .4) {
        ctx.arc(p2.getX(), p2.getY(), radius3/2, 0, Math.PI * 2);
        ctx.fillStyle =  `rgb(1, 193, 193)`; 
        ctx.fill();
      }
      else {
        // switch to a non-filled circle with a wide border, 
        // subtract 1/2 of border width to keep the same overall radius
        ctx.arc(p2.getX(), p2.getY(), Math.max((radius3/2)-20, 0), 0, Math.PI * 2);
        ctx.strokeStyle =  `rgb(1, 193, 193)`;
        ctx.lineWidth = 40;
        ctx.stroke();
      }
      // extra nuance on the edge
      ctx.beginPath();
      ctx.arc(p2.getX(), p2.getY(), Math.max((radius3/2)-2, 1), Math.PI/2, 3*Math.PI/2, false);
      // ctx.strokeStyle =  `rgb(65, 1, 193)`;  // deep blue
      ctx.strokeStyle =  `rgb(148, 196, 196)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Red circle around p3
    ctx.save();
    ctx.strokeStyle = 'rgb(255, 25, 10)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p3.getX(), p3.getY(), radius4/10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgb(208, 51, 3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p3.getX(), p3.getY(), (radius4/10)+Math.random()*2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();


    ctx.restore();
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

  setClosestParticle(particle) {
    const closestParticle = particle;
    if (particle) {
      this.canvas.style.cursor = "pointer"; // Change cursor to hand when hovering near a particle
    } else {
      this.canvas.style.cursor = "crosshair"; // Reset cursor when not near any particle
    }
  }

  setMouseXY(x, y) {
    // This method can be used to track mouse position for hover effects or other interactions
  }
}
