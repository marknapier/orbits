import PhysicsEngine from '../physics2D/PhysicsEngine.js';
import Particle from '../physics2D/Particle.js';
import Vector2D from '../physics2D/Vector2D.js';

export default class MovingImageDots {
  constructor(width=200, height=200) {
    this.width = width;
    this.height = height;

    const DIM = Math.min(width, height)/10; // max radius for particles based on canvas size

    // Create transparent canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    /** @type {CanvasRenderingContext2D} */
    this.ctx = ctx;
    
    // Create 20 random particles
    this.particles = [];
    for (let i = 0; i < 12; i++) {
      const name = `particle${i + 1}`;
      const posX = Math.random() * width;
      const posY = Math.random() * height;
      const velX = (Math.random() - 0.5) * 20; // Random velocity between -25 and 25
      const velY = (Math.random() - 0.5) * 20;
      const mass = Math.random() * 9 + 1; // Random mass between 1 and 10
      const radius = Math.random() * DIM + 10; // Random radius between 10 and 50
      const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
      
      const particle = new Particle(
        name,
        new Vector2D(posX, posY), // position
        new Vector2D(velX, velY), // velocity
        new Vector2D(0, 0), // force
        mass, // mass
        radius, // radius
      );
      particle.setColor(color);
      this.particles.push(particle);
    }
    
    // Setup physics engine
    this.engine = new PhysicsEngine();
    this.engine.setDimensions(width, height);
    this.engine.detectCollisions = true;
    this.engine.setWallTypeStr('reflecting');
    this.engine.addParticles(this.particles);
    this.engine.gravY = 0; // No gravity for floating effect
    this.engine.margin = 0; // No margin so particles can go to edge of canvas
  }
  
  step() {
    // Advance physics
    this.engine.step();
    
    // Clear the canvas (transparent background)
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw particles
    for (const particle of this.particles) {
      this.ctx.save();
      this.ctx.fillStyle = particle.color ?? "black";
      this.ctx.beginPath();
      this.ctx.arc(particle.getX(), particle.getY(), Math.min(particle.getRadius(), 80), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
  
  getCanvas() {
    return this.canvas;
  }
}