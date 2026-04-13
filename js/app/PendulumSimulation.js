import PhysicsEngine from '../physics2D/PhysicsEngine.js';
import Particle from '../physics2D/Particle.js';
import Vector2D from '../physics2D/Vector2D.js';
import Renderer from './RenderSimple.js';
import MouseHandler from './MouseHandler.js';
import AnimationLoop from './AnimationLoop.js';

export default class PendulumSimulation {
  constructor(container, width = 100, height = 600, config = {}) {
    this.container = container;
    this.width = width;
    this.height = height;
    this.config = config;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.border = '1px solid black';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);
    
    // Initialize physics engine
    this.engine = new PhysicsEngine();
    this.engine.setDimensions(width, height);
    this.engine.detectCollisions = false;
    this.engine.setWallTypeStr('reflecting');
    this.engine.gravY = 0;
    this.engine.gravConst = 10;
    
    // Create particles (pendulum setup)
    this.createParticles();
    
    // Create renderer
    this.renderer = new Renderer(this.engine.particles, this.engine.springs, this.canvas);
    
    // Create mouse handler
    this.mouseHandler = new MouseHandler(this.canvas, this.engine, this.renderer);
    
    // Create animation loop (but don't start it yet)
    this.animationLoop = new AnimationLoop(this.engine, this.renderer);
  }
  
  createParticles() {
    const totalLength = this.height / 1.5;
    const canvasCenterX = this.width / 2;
    const stringStartX = canvasCenterX;
    const stringStartY = this.height / 5;
    
    // Particle 1 (top/anchor)
    const particle1 = new Particle(
      'top',
      new Vector2D(stringStartX, stringStartY),
      new Vector2D(Math.random() * 2 - 1, Math.random() * 2 - 1), // small random initial velocity
      new Vector2D(0, 0),
      10, // mass
      20  // radius
    );
    particle1.setColor('rgb(0, 180, 180)');
    this.engine.addParticle(particle1);
    
    // Particle 2 (middle)
    const particle2 = new Particle(
      'middle',
      new Vector2D(stringStartX, stringStartY + (totalLength * 0.4)),
      new Vector2D(0, 0),
      new Vector2D(0, 0),
      10, // mass
      15  // radius
    );
    particle2.setColor('rgb(0, 180, 0)');
    this.engine.addParticle(particle2);
    
    // Particle 3 (bottom)
    const particle3 = new Particle(
      'bottom',
      new Vector2D(stringStartX, stringStartY + (totalLength * 0.7)),
      new Vector2D(0, 0),
      new Vector2D(0, 0),
      15, // mass
      10  // radius
    );
    particle3.setColor('rgb(180, 0, 0)');
    this.engine.addParticle(particle3);
  }
  
  start() {
    if (this.animationLoop) {
      this.animationLoop.start();
    }
  }
  
  stop() {
    if (this.animationLoop) {
      this.animationLoop.stop();
    }
  }
  
  cleanup() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    // Additional cleanup if needed
  }
}