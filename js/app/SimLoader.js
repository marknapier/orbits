import Vector2D from '../physics2D/Vector2D.js';
import Particle from '../physics2D/Particle.js';
import Spring from '../physics2D/Spring.js';

export default class SimLoader {
  constructor(sim, configJSON = null) {
    this.sim = sim;
    this.config = configJSON;
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

  async loadSimulation(configUrl) {
    if (configUrl) {
      try {
        const response = await fetch(configUrl);
        const configJSON = await response.json();
        this.import(configJSON);
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    }
  }

  import(configJSON = this.config) {
    if (configJSON) {
      this.config = configJSON;
      this.sim.clear();
      this.importEnvironment();
      this.importParticles();
      this.importSprings();
    }
  }

  importEnvironment() {
    const env = this.config.environment;
    
    this.sim.setWallTypeStr(env.wallType);
    this.sim.wallFriction = env.wallFriction;
    this.sim.gravConst = env.gravityConstant;
    this.sim.elecConst = env.electricConstant;
    this.sim.gravX = env.gravityFieldX;
    this.sim.gravY = env.gravityFieldY;
    this.sim.elecX = env.electricFieldX;
    this.sim.elecY = env.electricFieldY;
    this.sim.magZ = env.magneticFieldZ;
    this.sim.airRes = env.airResistance;
    this.sim.setDimensions(env.width || 800, env.height || 600);
  }

  importParticles() {
    const particles = this.config.particles;
    
    for (const particleConfig of particles) {
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
      
      // console.log(`Adding particle: ${particle.getLabel()} at (${particle.getX()}, ${particle.getY()}) with velocity (${particle.getVel().getX()}, ${particle.getVel().getY()})`);
      this.sim.addParticle(particle);
    }
  }

  importSprings() {
    const springs = this.config.springs;
    const particles = this.sim.particles;
    
    for (const springConfig of springs) {
      const spring = new Spring(
        particles[springConfig.particle1],
        particles[springConfig.particle2],
        springConfig.springConstant,
        springConfig.damping,
        springConfig.relaxedLength
      );
      
      spring.setHarmonic(
        springConfig.amplitude,
        springConfig.frequency,
        springConfig.phase
      );
      this.sim.addSpring(spring);
    }
  }
}
