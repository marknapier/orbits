import Vector2D from '../physics2D/Vector2D.js';
import Particle from '../physics2D/Particle.js';
import Spring from '../physics2D/Spring.js';

export default class ModelLoader {
  constructor(configJSON = null) {
    this.config = configJSON;
    this.particles = [];
    this.springs = [];
    this.environment = null;
    this.colors = {
      "black": "#000000",
      "blue": "#0000FF",
      "cyan": "#00FFFF",
      "darkgray": "#A9A9A9",
      "gray": "#808080",
      "green": "#00FF00",
      "lightgray": "#D3D3D3",
      "magenta": "#FF00FF",
      "orange": "#FFC800",
      "pink": "#FFAFAF",
      "red": "#FF0000",
      "white": "#FFFFFF",
      "yellow": "#FFFF00"
    };
  }

  async loadModel(configUrl) {
    if (configUrl) {
      try {
        const response = await fetch(configUrl);
        const configJSON = await response.json();
        this.parseConfig(configJSON);
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    }
  }

  parseConfig(configJSON = this.config) {
    if (configJSON) {
      this.config = configJSON;
      this.particles = [];
      this.springs = [];
      this.parseEnvironment();
      this.parseParticles();
      this.parseSprings();
    }
  }

  parseEnvironment() {
    const env = this.config.environment || {};
    this.environment = {
      wallType: env.wallType,
      wallFriction: env.wallFriction,
      gravityConstant: env.gravityConstant,
      electricConstant: env.electricConstant,
      gravityFieldX: env.gravityFieldX,
      gravityFieldY: env.gravityFieldY,
      electricFieldX: env.electricFieldX,
      electricFieldY: env.electricFieldY,
      magneticFieldZ: env.magneticFieldZ,
      airResistance: env.airResistance,
      width: env.width,
      height: env.height
    };
  }

  parseParticles() {
    const particleConfigs = this.config.particles || {};
    
    for (const particleConfig of particleConfigs) {
      const particle = new Particle(
        particleConfig.label,
        new Vector2D(particleConfig.initialPositionX, particleConfig.initialPositionY),
        new Vector2D(particleConfig.initialVelocityX, particleConfig.initialVelocityY),
        new Vector2D(),
        particleConfig.mass,
        particleConfig.radius,
        particleConfig.charge
      );
      
      particle.setTrace(particleConfig.trace || false);
      particle.setFixedX(particleConfig.fixedXPosition || false);
      particle.setFixedY(particleConfig.fixedYPosition || false);
      particle.setColor(this.colors[particleConfig.color] || this.colors.black);
      
      this.particles.push(particle);
    }
  }

  parseSprings() {
    const springConfigs = this.config.springs || {};
    
    for (const springConfig of springConfigs) {
      const spring = new Spring(
        this.particles[springConfig.particle1],
        this.particles[springConfig.particle2],
        springConfig.springConstant,
        springConfig.damping,
        springConfig.relaxedLength
      );
      
      spring.setHarmonic(
        springConfig.amplitude,
        springConfig.frequency,
        springConfig.phase
      );
      this.springs.push(spring);
    }
  }

  getParticles() {
    return this.particles;
  }

  getSprings() {
    return this.springs;
  }

  getEnvironment() {
    return this.environment;
  }

  /**
   * Compute the centroid of the current particles.
   * @returns {{x:number,y:number}|null} coordinates of centroid or null if no particles
   */
  computeCentroid() {
    if (!this.particles || this.particles.length === 0) {
      return null;
    }
    let cx = 0;
    let cy = 0;
    for (const p of this.particles) {
      cx += p.pos.x;
      cy += p.pos.y;
    }
    cx /= this.particles.length;
    cy /= this.particles.length;
    return { x: cx, y: cy };
  }

  /**
   * Shift all particles so that the model's centroid is at (x, y).
   *
   * This computes the average position of the current particles and then
   * translates each particle by the difference between the target coordinates
   * and the current centroid.  If there are no particles the call is a no-op.
   *
   * @param {number} x - desired x-coordinate for the centre of the model
   * @param {number} y - desired y-coordinate for the centre of the model
   */
  centerAt(x, y) {
    const centroid = this.computeCentroid();
    if (!centroid) {
      return;
    }

    // translation vector
    const dx = x - centroid.x;
    const dy = y - centroid.y;

    // apply to every particle
    for (const p of this.particles) {
      p.pos.x += dx;
      p.pos.y += dy;
    }
  }

  /**
   * Scale all particle positions by the given factor.
   *
   * @param {number} scaleFactor - factor by which to scale particle positions
   */
  scalePositions(scaleFactor = 1) {
    if (scaleFactor === 1) {
      return;
    }
    // apply to every particle
    for (const p of this.particles) {
      p.pos.x *= scaleFactor;
      p.pos.y *= scaleFactor;
      p.radius *= scaleFactor;
    }
  }
}
