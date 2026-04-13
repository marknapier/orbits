import Vector2D from './Vector2D.js';
import Particle from './Particle.js';
import Spring from './Spring.js';
import MyMath from './MyMath.js';
import CollisionList from './CollisionList.js';

export default class PhysicsEngine {
  constructor() {
    this.particles = [];
    this.springs = [];
    this.attractiveParticles = this.particles;
    this.D = { width: 800, height: 600 };

    this.WALL_NONE = 0;
    this.WALL_ABSORBING = 1;
    this.WALL_REFLECTING = 2;
    this.wallLabels = ['None', 'Absorbing', 'Reflecting'];
    this.wallTypes = {
      none: this.WALL_NONE,
      absorbing: this.WALL_ABSORBING,
      reflecting: this.WALL_REFLECTING,
    }
    // Only particles with mass > MIN_MASS_FOR_GRAVITY will attract to one another.
    // Below this mass, particles are considered massless and will not attract.
    // This optimizes code, otherwise in systems with many particles the calculations
    // for gravity attraction between particles is very slow.
    this.MIN_MASS_FOR_GRAVITY = 20.0;

    this.gravConst = 0;
    this.elecConst = 0;
    this.timeStep = 0.2;  // how much time passes with each step().  Larger time steps will speed up the simulation, but may cause it to be less accurate and more likely to miss collisions.
    this.simTime = 0;
    this.detectCollisions = false;

    this.gravX = 0;
    this.gravY = 3;
    this.elecX = 0;
    this.elecY = 0;
    this.magZ = 0;
    this.airRes = 0;
    this.maxAcc = 0;
    this.maxVel = 0;
    this.wallFriction = 0.5;
    this.wallType = this.WALL_NONE;
    this.margin = 12;

    this.deltaMouseDragLengthX = 0;
    this.deltaMouseDragLengthY = 0;
  }

  setDimensions(w, h) {
    if (w && h) {
      this.D = { width: w, height: h };
      console.log(`Sim dimensions set to ${w}x${h}`);
    }
  }

  setTimeStep(t) {
    this.timeStep = t; 
  }

  setWallType(typenum = 0) {
    if (typenum >= 0 && typenum < this.wallLabels.length) {
      this.wallType = typenum;
    }
    // Reset friction flag on all particles when wall type changes
    for (let p of this.particles) {
      p.setVertFriction(false);
      p.setHoriFriction(false);
    }
  }

  setWallTypeStr(typestr = 'none') {
    this.setWallType(this.wallTypes[typestr.toLowerCase()] || this.WALL_NONE);
  }

  clear() {
    this.springs = [];
    this.particles = [];
    this.attractiveParticles = this.particles;
  }

  addModel(particles, springs = null, envConfig = null) {
    this.addParticles(particles);
    this.addSprings(springs);
    this.setupEnvironment(envConfig);
  }

  setupEnvironment(envConfig) {
    if (!envConfig) return;
    this.setWallTypeStr(envConfig.wallType);
    this.wallFriction = envConfig.wallFriction;
    this.gravConst = envConfig.gravityConstant;
    this.elecConst = envConfig.electricConstant;
    this.gravX = envConfig.gravityFieldX;
    this.gravY = envConfig.gravityFieldY;
    this.elecX = envConfig.electricFieldX;
    this.elecY = envConfig.electricFieldY;
    this.magZ = envConfig.magneticFieldZ;
    this.airRes = envConfig.airResistance;
    this.setDimensions(envConfig.width, envConfig.height);
  }

  addParticle(p) { this.particles.push(p); }
  addParticles(parts) { 
    parts && parts.forEach(p => { this.particles.push(p) }) 
  }
  addSpring(s) { this.springs.push(s); }
  addSprings(springs) { 
    springs && springs.forEach(s => { this.springs.push(s) })     
  }

  // Optimize Electrical charge and gravitational attraction here.
  // Forces between particles require N^2 comparisons, which slows down systems
  // with many particles.  So, copy charged and "hi-mass" particles into a separate
  // list for forces calculations (see force()).
  optimize() {
    if (this.gravConst === 0 && this.elecConst === 0) {
      this.attractiveParticles = this.particles;
    } else {
      this.attractiveParticles = [];
      for (let p of this.particles) {
        if (p.getCharge() !== 0 || p.getMass() > this.MIN_MASS_FOR_GRAVITY) this.attractiveParticles.push(p);
      }
      console.log('Sim.optimize(): total particles: ' + this.particles.length + '. ' + this.attractiveParticles.length + ' are charged or hi-mass.');
    }
  }

  // Move simulation objects one step
  step(customForcesHook = null) {
    this.checkBounds();
    this.calcAllForces();
    customForcesHook && customForcesHook();
    this.updateVelocities();
    if (this.detectCollisions) 
      this.handleCollisions(); 
    else 
      this.updatePositions(this.timeStep);
  }

  // Keep particles inside of walls
  // If particle is against a wall (collides with absorbing wall),
  // then set friction ON for that particle.
  checkBounds() {
    let rebound = 0;
    if (this.wallType === this.WALL_REFLECTING) rebound = 1;
    if (this.wallType === this.WALL_ABSORBING || this.wallType === this.WALL_REFLECTING) {
      for (let particle of this.particles) {
        particle.setVertFriction(false);
        particle.setHoriFriction(false);
        if (particle.pos.getX() + particle.getRadius() > (this.D.width + this.margin) && particle.vel.getX() > 0) {
          particle.vel.setX(-particle.vel.getX() * rebound);
          particle.pos.setX((this.D.width + this.margin) - particle.getRadius());
          if (this.wallType === this.WALL_ABSORBING) particle.setVertFriction(true);
        }
        if (particle.pos.getX() - particle.getRadius() < -this.margin && particle.vel.getX() < 0) {
          particle.vel.setX(-particle.vel.getX() * rebound);
          particle.pos.setX(-this.margin + particle.getRadius());
          if (this.wallType === this.WALL_ABSORBING) particle.setVertFriction(true);
        }
        if (particle.pos.getY() + particle.getRadius() > (this.D.height + this.margin) && particle.vel.getY() > 0) {
          particle.vel.setY(-particle.vel.getY() * rebound);
          particle.pos.setY((this.D.height + this.margin) - particle.getRadius());
          if (this.wallType === this.WALL_ABSORBING) particle.setHoriFriction(true);
        }
        if (particle.pos.getY() - particle.getRadius() < -this.margin && particle.vel.getY() < 0) {
          particle.vel.setY(-particle.vel.getY() * rebound);
          particle.pos.setY(-this.margin + particle.getRadius());
          if (this.wallType === this.WALL_ABSORBING) particle.setHoriFriction(true);
        }
      }
    }
  }

  // Calculate forces on all particles in World
  calcAllForces() {
    // zero out forces on all particles
    for (let p of this.particles) p.force.setXY(0, 0);

    // For each particle in world, add up all forces from other particles, 
    // gravity, electric field, magnetic field, air resistance, and wall friction
    for (let j = 0; j < this.particles.length; j++) {
      const particle = this.particles[j];
      // Don't bother if gravity and electric field are off
      if (this.gravConst !== 0 || this.elecConst !== 0) {
        for (let k = j + 1; k < this.attractiveParticles.length; k++) {
          const particle1 = this.attractiveParticles[k];
          const vf = this.calcParticleForce(particle, particle1);
          const f1 = vf.getX();
          const f2 = vf.getY();
          particle.force.addX(f1); particle.force.addY(f2);
          particle1.force.addX(-f1); particle1.force.addY(-f2);
        }
      }
      // add environment gravity field
      if (this.gravX !== 0) particle.force.addX(particle.getMass() * this.gravX);
      if (this.gravY !== 0) particle.force.addY(particle.getMass() * this.gravY);
      // add environment electrical field
      if (this.elecX !== 0) particle.force.addX(particle.getCharge() * this.elecX);
      if (this.elecY !== 0) particle.force.addY(particle.getCharge() * this.elecY);
      // add magnetic field
      if (this.magZ !== 0) {
        particle.force.addX(this.magZ * particle.getCharge() * particle.vel.length() * Math.cos(particle.vel.angle() + Math.PI/2));
        particle.force.addY(this.magZ * particle.getCharge() * particle.vel.length() * Math.sin(particle.vel.angle() + Math.PI/2));
      }
      // add air resistance
      if (this.airRes !== 0) {
        particle.force.addX(-this.airRes * Math.pow(particle.vel.length(), 2) * Math.cos(particle.vel.angle()));
        particle.force.addY(-this.airRes * Math.pow(particle.vel.length(), 2) * Math.sin(particle.vel.angle()));
      }
      // add horizontal friction (true if particle is touching ground)
      if (particle.getHoriFriction()) {
        if (particle.pos.getY() === 0 && particle.force.getY() < 0) {
          particle.force.addX(-this.wallFriction * particle.force.getY() * MyMath.sigmoid(particle.vel.getX(), 0.1));
        } else if (particle.force.getY() > 0) {
          particle.force.addX(-this.wallFriction * particle.force.getY() * MyMath.sigmoid(particle.vel.getX(), 0.1));
        }
      }
      // add verticle friction (true if particle is touching wall)
      if (particle.getVertFriction()) {
        if (particle.pos.getX() === 0 && particle.force.getX() < 0) {
          particle.force.addY(-this.wallFriction * particle.force.getX() * MyMath.sigmoid(particle.vel.getY(), 0.1));
        } else if (particle.force.getX() > 0) {
          particle.force.addY(-this.wallFriction * particle.force.getX() * MyMath.sigmoid(particle.vel.getY(), 0.1));
        }
      }
    }

    // add forces created by springs.
    // Assumes that all springs may be muscles, so calls
    // extertForces(simTime) to change spring length over time.
    for (let s of this.springs) s.exertForces(this.simTime);

    // limit force if acceleration is over 50 units per time step
    this.maxAcc = 0;
    for (let p of this.particles) {
      let f1 = Math.abs(p.force.length() / p.getMass());
      if (f1 * this.timeStep > 50) {
        p.force.setLength((50 * p.getMass()) / this.timeStep);
        f1 = Math.abs(p.force.length() / p.getMass());
      }
      if (f1 > this.maxAcc) this.maxAcc = f1;
    }
  }

  updateVelocities() {
    this.maxVel = 0;
    for (let p of this.particles) {
      // if not being dragged, calc acceleration * timeStep to get velocity
      if (!p.getForced()) {
        p.vel.addX((p.force.getX() / p.getMass()) * this.timeStep);
        p.vel.addY((p.force.getY() / p.getMass()) * this.timeStep);
      }
      if (p.getFixedX()) p.vel.setX(0);
      if (p.getFixedY()) p.vel.setY(0);
      // Cap the velocity at 50 units per timestep
      if (p.vel.length() * this.timeStep > 50) p.vel.setLength(50 / this.timeStep);
      // Track maximum velocity
      if (p.vel.length() > this.maxVel) this.maxVel = p.vel.length();
    }
  }

  updatePositions(simTimeElapsed) {
    for (let p of this.particles) {
      // if not being dragged, calc velocity * timeStep to get position
      if (!p.getForced() && !p.getFixedX()) {
        p.pos.addX(p.vel.getX() * simTimeElapsed);
      }
      if (!p.getForced() && !p.getFixedY()) {
        p.pos.addY(p.vel.getY() * simTimeElapsed);
      }
      // Update the particle trail
      p.traceUpdate();
    }
    // Advance simulation time by timeStep
    this.simTime += simTimeElapsed;
  }

  // Check for collisions between particles and update positions and velocities accordingly
  handleCollisions() {
    let clist1 = new CollisionList();
    let clist2 = new CollisionList();
    let dt = 0;

    // for each particle, check if it will collide with any other
    // particle, within this time step and add to collision list if so
    for (let j = 0; j < this.particles.length; j++) {
      const p1 = this.particles[j];
      for (let i = j + 1; i < this.particles.length; i++) {
        const p2 = this.particles[i];
        // If neither particle is being dragged check for collision
        if (!p1.getForced() && !p2.getForced()) {
          const t = this.timeToCollision(p1, p2, this.timeStep);
          if (t >= 0) clist2.addElement(p1, p2, t);
        }
      }
    }

    // now have list of colliding particles in collissionlist2
    while (dt < this.timeStep) {
      clist1 = clist2.getElements();
      let advanceT = 0;

      // Determine how far to advance physics engine:
      // If no collisions, advance to the end of this time step
      // If we have collisions, advance to first collision
      if (clist1.size() === 0) advanceT = this.timeStep - dt;
      else advanceT = clist1.getCollisionTime();

      // update particle positions based on time slice calc'd above
      this.updatePositions(advanceT);

      // add to dt and advance simTime:
      // if no collisions, add timestep (this should exit the loop (while dt < timestep))
      // if collisions, add time to first collision
      dt += advanceT; 
      this.simTime += advanceT;

      // process the collisions
      for (let i2 = 0; i2 < clist1.size(); i2++) {
        const p1 = clist1.getP1At(i2);
        const p2 = clist1.getP2At(i2);
        const a = Particle.angle(p1, p2);
        const p1V = p1.vel.comp(a);
        const p2V = p2.vel.comp(a);
        const d8 = p1.getMass() * p1V + p2.getMass() * p2V;
        const d9 = 1.0 / (p1.getMass() + p2.getMass());
        const d10 = d9 * (d8 - p2.getMass() * (p1V - p2V));
        const d13 = d9 * (d8 + p1.getMass() * (p1V - p2V));
        let d16 = d10 * Math.cos(a);
        let d17 = d10 * Math.sin(a);
        let d18 = d13 * Math.cos(a);
        let d19 = d13 * Math.sin(a);
        const d20 = p1V * Math.cos(a);
        const d21 = p1V * Math.sin(a);
        const d22 = p2V * Math.cos(a);
        const d23 = p2V * Math.sin(a);
        if (p1.getFixedX()) { d18 = -d22; d16 = 0; }
        if (p1.getFixedY()) { d17 = -d21; d19 = 0; }
        if (p2.getFixedX()) { d16 = -d20; d18 = 0; }
        if (p2.getFixedY()) { d17 = -d21; d19 = 0; }
        // change velocity of particles
        p1.vel.addX(d16 - d20); p1.vel.addY(d17 - d21);
        p2.vel.addX(d18 - d22); p2.vel.addY(d19 - d23);
      }

      // if we have more collisions to process
      if (dt < this.timeStep) {
        const clist = clist1.getParticleList();
        // remove the collisions that we have processed from clist2
        for (let i = 0; i < clist.length; i++) clist2.removeElement(clist[i]);
        // subtract dt from time-to-collision for remaining collisions
        clist2.subTime(dt);
        // Check if particles in current collisions will collide (rebound?) with any other 
        // particles in remaining time step and add to collision list if so
        for (let j2 = 0; j2 < clist.length; j2++) {
          const proccesedP1 = clist[j2];
          // will particle collide with other collision particles?
          for (let k2 = j2 + 1; k2 < clist.length; k2++) {
            const proccesedP2 = clist[k2];
            if (!proccesedP1.getForced() && !proccesedP2.getForced()) {
              const t = this.timeToCollision(proccesedP1, proccesedP2, this.timeStep);
              if (t >= 0) clist2.addElement(proccesedP1, proccesedP2, t);
            }
          }
          // will particle collide with any other particle in sim?
          for (let l2 = 0; l2 < this.particles.length; l2++) {
            const particle10 = this.particles[l2];
            if (clist.indexOf(particle10) < 0 && (!proccesedP1.getForced() && !particle10.getForced())) {
              const t = this.timeToCollision(proccesedP1, particle10, this.timeStep);
              if (t >= 0) clist2.addElement(proccesedP1, particle10, t);
            }
          }
        } // end of for each particle in clist1
      } // end of if (dt < timestep)
    } // end of while(dt < timeStep)
  }

  // Calculate gravity and charge forces between two particles
  calcParticleForce(particle, particle1) {
    let len = Particle.distance(particle, particle1, true);
    const a = Particle.angle(particle, particle1);
    let f = 0;
    const v = new Vector2D();
    if (len < particle.getRadius() + particle1.getRadius()) len = particle.getRadius() + particle1.getRadius();
    // add gravitational attaction to force
    f += (this.gravConst * particle.getMass() * particle1.getMass()) / len;
    // add charge to force
    f -= (this.elecConst * particle.getCharge() * particle1.getCharge()) / len;
    // break force into x,y components
    v.setX(f * Math.cos(a));
    v.setY(f * Math.sin(a));
    return v;
  }

  timeToCollision(particle, particle1, d) {
    let d1 = d + 1.0;
    const d2 = Particle.angle(particle, particle1);
    const d3 = particle1.pos.getX() - particle.pos.getX();
    const d4 = particle1.pos.getY() - particle.pos.getY();
    const d5 = particle1.vel.getX() - particle.vel.getX();
    const d6 = particle1.vel.getY() - particle.vel.getY();
    const vector2d = new Vector2D({ x: d3, y: d4 });
    const vector2d1 = new Vector2D({ x: d5, y: d6 });
    const d7 = vector2d.comp(d2);
    const d8 = vector2d1.comp(d2);
    if (MyMath.signum(d7) !== MyMath.signum(d8)) {
      if (Math.abs(d8 * d) >= Math.abs(Particle.distance(particle, particle1, false) - (particle.getRadius() + particle1.getRadius()))) {
        const d9 = d3 * d3 + d4 * d4;
        const d10 = d5 * d5 + d6 * d6;
        const d11 = (d3 * d5 + d4 * d6) / d10;
        const d12 = (d9 - Math.pow(particle.getRadius() + particle1.getRadius(), 2)) / d10;
        const disc = d11 * d11 - d12;
        if (disc >= 0) {
          const d13 = -d11 + Math.sqrt(disc);
          const d14 = -d11 - Math.sqrt(disc);
          if (d13 > 0) d1 = d13;
          if (d14 > 0 && d14 < d1) d1 = d14;
        }
      }
      if (Particle.distance(particle, particle1, false) < particle.getRadius() + particle1.getRadius()) d1 = 0.0;
    }
    if (d1 > d) d1 = -1;
    return d1;
  }

  getParticleNamed(label) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.getLabel() === label) return p;
    }
    return null;
  }

  getNearestParticle(x, y) {
    if (this.particles.length === 0) return null;
    let particle = this.particles[0];
    let dist = Math.pow(particle.pos.getX() - x, 2) + Math.pow(particle.pos.getY() - y, 2);
    for (let i = 1; i < this.particles.length; i++) {
      const p = this.particles[i];
      const d = Math.pow(p.pos.getX() - x, 2) + Math.pow(p.pos.getY() - y, 2);
      if (d < dist) { dist = d; particle = p; }
    }
    return particle;
  }

  getNearestSpring(j, k) {
    if (this.springs.length === 0) return null;
    let spring1 = this.springs[0];
    let d1 = this.springDistance(j, k, spring1);
    for (let l = 1; l < this.springs.length; l++) {
      const spring = this.springs[l];
      const d = this.springDistance(j, k, spring);
      if (d < d1) { d1 = d; spring1 = spring; }
    }
    return spring1;
  }

  springDistance(j, k, spring) {
    const d = spring.getP1().pos.getX();
    const d1 = spring.getP1().pos.getY();
    const d2 = j - d;
    const d3 = k - d1;
    const d4 = spring.getP2().pos.getX() - d;
    const d5 = spring.getP2().pos.getY() - d1;
    const d8 = Math.sqrt(d4 * d4 + d5 * d5);
    const d6 = (d2 * d4 + d3 * d5) / d8;
    let d7;
    if (d6 < 0 || d6 > d8) {
      const d9 = d2 * d2 + d3 * d3;
      const d10 = (d4 - d2) * (d4 - d2) + (d5 - d3) * (d5 - d3);
      d7 = (d9 - d10 < 0) ? Math.sqrt(d9) : Math.sqrt(d10);
    } else {
      d7 = Math.sqrt((d2 * d2 + d3 * d3) - Math.pow(d6, 2));
    }
    return d7;
  }

  // Mouse handlers
  mousePressed(x, y) {
    // Deselect all particles (allow them to move)
    for (let p of this.particles) p.setForced(false);
    // Select the particle at mouse click (if within 40 pixels) 
    const nearest_p = this.getNearestParticle(x, y);
    if (nearest_p) {
      const distanceX = x - Math.floor(nearest_p.getX());
      const distanceY = y - Math.floor(nearest_p.getY());
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      if (distance < 40) {
        // set it to be forced (not moveable by physics engine) and set velocity to 0 
        nearest_p.setForced(true);
        nearest_p.vel.setX(0);
        nearest_p.vel.setY(0);
        this.dx = x - nearest_p.pos.getX();
        this.dy = y - nearest_p.pos.getY();
        this.dragParticle = nearest_p;
      } 
      else this.dragParticle = null;
      // Store simulation time that mouse click occurred
      this.last_x = x; this.last_y = y; this.last_simTime = this.simTime - this.timeStep;
    }
  }
  
  mouseDragged(x, y) {
    this.mouseX = x; this.mouseY = y;
    if (this.dragParticle) {
      const d1 = this.dragParticle.pos.getX();
      const d2 = this.dragParticle.pos.getY();
      this.dragParticle.pos.setX((this.mouseX - this.dx) + (this.dragParticle.pos.getX() - d1));
      this.dragParticle.pos.setY((this.mouseY - this.dy) + (this.dragParticle.pos.getY() - d2));
      if (this.last_simTime !== this.simTime && !this.dragParticle.getFixedX() && Math.abs(x - this.last_x) > 1 && Math.abs(y - this.last_y) > 1) {
        this.dragParticle.vel.setX((x - this.last_x) / (this.simTime - this.last_simTime));
        this.dragParticle.vel.setY((y - this.last_y) / (this.simTime - this.last_simTime));
      }
      if (this.wallType === this.WALL_ABSORBING || this.wallType === this.WALL_REFLECTING) {
        if (this.dragParticle.pos.getX() + this.dragParticle.getRadius() > (this.D.width - 10)) this.dragParticle.pos.setX((this.D.width - 10) - this.dragParticle.getRadius());
        if (this.dragParticle.pos.getX() - this.dragParticle.getRadius() < 10) this.dragParticle.pos.setX(10 + this.dragParticle.getRadius());
        if (this.dragParticle.pos.getY() + this.dragParticle.getRadius() > (this.D.height - 40)) this.dragParticle.pos.setY((this.D.height - 40) - this.dragParticle.getRadius());
        if (this.dragParticle.pos.getY() - this.dragParticle.getRadius() < 40) this.dragParticle.pos.setY(40 + this.dragParticle.getRadius());
      }
      // How far has the mouse moved since the last mouse event, in pixels
      this.deltaMouseDragLengthX = this.mouseX - this.last_x;
      this.deltaMouseDragLengthY = this.mouseY - this.last_y;

      // Store the current mouse position and sim time for mouse event velocity calculations on next mouse event
      this.last_x = this.mouseX; 
      this.last_y = this.mouseY; 
      this.last_simTime = this.simTime;
    }
  }

  mouseReleased(x, y) {
    if (this.dragParticle) {
      let mouseVX = 0; let mouseVY = 0; 
      let dragDuration = this.simTime - this.last_simTime; // how much sim time has elapsed since last mouse movement?
      // If time lapse > 0.1, calculate velocity of movement, in pixels per sim_time_unit
      // dragDuration must be at least 0.1 sim time units to prevents very fast throws from very short drags
      if (dragDuration >= 0.2) { 
        mouseVX = this.deltaMouseDragLengthX / (dragDuration);
        mouseVY = this.deltaMouseDragLengthY / (dragDuration);
        // If particle is not fixed position, change the velocity
        if (!this.dragParticle.getFixedX()) this.dragParticle.vel.setX(mouseVX);
        if (!this.dragParticle.getFixedY()) this.dragParticle.vel.setY(mouseVY);
      }
      // release the particle
      this.dragParticle.setForced(false);
    }
  }

  mouseMoved(x, y) {
    this.mouseX = x; this.mouseY = y;
    const closestParticle = this.getNearestParticle(x, y);
    if (closestParticle) {
      const distanceX = x - Math.floor(closestParticle.getX());
      const distanceY = y - Math.floor(closestParticle.getY());
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      if (distance < 40) {
        return closestParticle;
      }
    }
    return null;
  }
}
