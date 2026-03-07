export default class Renderer {
  // particles: array, springs: array, target: HTMLCanvasElement or 2D context
  constructor(particles = [], springs = [], target = null) {
    this.particles = particles;
    this.springs = springs;
    this.mouseX = 0;
    this.mouseY = 0;
    this.bgColor = 'white';
    this.setTarget(target);
  }

  setTarget(target) {
    if (!target) { 
      this.canvas = null; 
      this.ctx = null; 
    }
    else if (typeof target.getContext === 'function') {
      this.canvas = target;
      this.ctx = target.getContext('2d');
    } else {
      this.canvas = null;
      this.ctx = target;
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // clear canvas
    this.clear();

    // draw springs first (so particles appear on top)
    if (this.springs && this.springs.length > 0) {
      ctx.lineWidth = 2;
      for (let i = 0; i < this.springs.length; i++) {
        this.paintSpring(ctx, this.springs[i]);
      }
    }

    // draw particles
    if (this.particles && this.particles.length > 0) {    
      for (let i = 0; i < this.particles.length; i++) {
        this.paintParticle(ctx, this.particles[i]);
      }
    }
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

  setMouseXY(x, y) {
    this.mouseX = x;
    this.mouseY = y;
  }

  clear() {
    // Draw a filled rectangle that covers the entire canvas
    this.ctx.fillStyle = this.bgColor;
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
