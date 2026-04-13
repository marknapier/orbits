import PhysicsEngine from '../physics2D/PhysicsEngine.js';
import Particle from '../physics2D/Particle.js';
import Vector2D from '../physics2D/Vector2D.js';

export default class MovingImageDots {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    // Create transparent canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    
    // Create 20 random particles
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      const name = `particle${i + 1}`;
      const posX = Math.random() * width;
      const posY = Math.random() * height;
      const velX = (Math.random() - 0.5) * 50; // Random velocity between -25 and 25
      const velY = (Math.random() - 0.5) * 50;
      const mass = Math.random() * 9 + 1; // Random mass between 1 and 10
      const radius = Math.random() * 40 + 10; // Random radius between 10 and 50
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