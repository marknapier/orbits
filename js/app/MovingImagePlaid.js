import MovingImageDots from './MovingImageDots.js';
import Particle from '../physics2D/Particle.js';
import Vector2D from '../physics2D/Vector2D.js';

export default class MovingImagePlaid extends MovingImageDots {
  constructor(width, height) {
    super(width, height);

    // Make 20 random particles (overriding parent constructor)
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      const name = `particle${i}`;
      const posX = Math.random() * this.canvas.width;
      const posY = Math.random() * this.canvas.height;
      const velX = (Math.random() - 0.5) * 6; // Random velocity between -3 and 3
      const velY = (Math.random() - 0.5) * 6;
      const mass = Math.random() * 9 + 1; // Random mass between 1 and 10
      const radius = Math.random() * 98 + 2; // Random radius between 2 and 100
      const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;

      this.particles.push(new Particle(
        name,
        new Vector2D(posX, posY), // random position
        new Vector2D(velX, velY), // random velocity
        new Vector2D(0, 0), // force
        mass, // random mass
        radius, // random radius
      ));
      this.particles[i].setColor(color); // set random color
    }
    this.engine.addParticles(this.particles);

    this.engine.timeStep = 0.01; // slower physics for more visible plaid effect
    this.ctx.globalAlpha = 0.4;
  }

  step() {
    // Advance physics
    this.engine.step();

    // Render to canvas (transparent background)
    // this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw plaid lines for each particle
    for (const particle of this.particles) {
      this.ctx.save();
      this.ctx.strokeStyle = particle.getColor() ?? "black";
      this.ctx.lineWidth = particle.getRadius() * 2;
      this.ctx.globalAlpha = 0.4; // Plaid transparency
      this.drawLineV(particle.getX(), particle.getY());
      this.drawLineH(particle.getX(), particle.getY());
      this.ctx.restore();
    }
  }

  drawLineV(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.height);
    this.ctx.stroke();
  }

  drawLineH(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.width, y);
    this.ctx.stroke();
  }
}