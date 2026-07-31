import MovingImageDots from './MovingImageDots.js';
import Particle from '../physics2D/Particle.js';
import Vector2D from '../physics2D/Vector2D.js';
import Stripe from './Stripe.js';
import Oscillator from './Oscillator.js';

export default class MovingImageStripesRandom extends MovingImageDots {
  constructor(width, height) {
    super(width, height);

    const DIM = Math.min(width, height)/8; // max stripe width based on canvas size

    // clear the particles created by the parent constructor
    this.engine.clear();

    // Make 10 random particles (overriding parent constructor)
    this.particles = [];
    for (let i = 0; i < 10; i++) {
      const name = `particle${i}`;
      const posX = Math.random() * this.canvas.width;
      const posY = Math.random() * this.canvas.height;
      const velX = (Math.random() - 0.5) * 6; // Random velocity between -3 and 3
      const velY = (Math.random() - 0.5) * 6;
      const mass = Math.random() * 9 + 1; // Random mass between 1 and 10
      const radius = Math.random() * DIM + 2; // Random radius between 2 and 1/8 of the smaller canvas dimension
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

    this.engine.timeStep = 0.1; // slower physics for more visible stripe effect
    this.ctx.globalAlpha = 0.2; // soft, blurry build-up

    // Build an animated Stripe per particle: width oscillates and color
    // lerps between the particle's color (dark) and a random light color.
    this.stripes = this.particles.map(p => new Stripe({
      widthBase: p.getRadius(),
      widthDelta: Math.random() * 30 + 5,
      position: p.getX(),
      darkColor: MovingImageStripesRandom.parseRGB(p.getColor()),
      lightColor: MovingImageStripesRandom.randomRGB(),
      oscWidth: MovingImageStripesRandom.randomOsc(),
      oscColor: MovingImageStripesRandom.randomOsc(),
      alpha: Math.random() * 0.7 + 0.3, // random alpha between 0.3 and 1.0
    }));

    // Give a couple of stripes a dashed pattern for variety
    this.stripes[5].dashPattern = [20, 10];
    this.stripes[9].dashPattern = [7, 31];
  }

  step() {
    // Advance physics
    this.engine.step();

    // Render to canvas (transparent background)
    // this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw an animated vertical stripe for each particle
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const stripe = this.stripes[i];
      stripe.position = particle.getX();
      stripe.step();

      this.ctx.save();
      this.ctx.strokeStyle = stripe.cssColor;
      this.ctx.lineWidth = stripe.w;
      this.ctx.setLineDash(stripe.dashPattern || []);
      this.drawLineV(particle.getX());
      this.ctx.restore();
    }
  }

  drawLineV(x) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.height);
    this.ctx.stroke();
  }

  /** @param {string} cssColor - e.g. "rgb(12, 34, 56)" @returns {[number, number, number]} */
  static parseRGB(cssColor) {
    const m = cssColor.match(/\d+/g) ?? ['0', '0', '0'];
    return [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])];
  }

  /** @returns {[number, number, number]} */
  static randomRGB() {
    return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
  }

  /** @returns {Oscillator} */
  static randomOsc() {
    const freq = Math.random() * 0.04 + 0.005;
    const type = Math.random() < 0.5 ? 'sin' : 'cos';
    const phase = Math.random() * Math.PI * 2;
    return new Oscillator(freq, type, phase);
  }
}
