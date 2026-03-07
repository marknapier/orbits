import Vector2D from './Vector2D.js';
import MyMath from './MyMath.js';

export default class Particle {
  constructor(label = 'Particle', pos = new Vector2D(), vel = new Vector2D(), force = new Vector2D(), mass = 1, radius = 10, charge = 0) {
    this.initPos = new Vector2D(pos.getX(), pos.getY());
    this.initVel = new Vector2D(vel.getX(), vel.getY());
    this.pos = new Vector2D(pos.getX(), pos.getY());
    this.vel = new Vector2D(vel.getX(), vel.getY());
    this.force = new Vector2D(force.getX(), force.getY());
    this.mass = mass;
    this.radius = radius;
    this.charge = charge;
    this.fixedX = false;
    this.fixedY = false;
    this.forced = false;
    this.trace = false;
    this.horiFriction = false;
    this.vertFriction = false;
    this.color = 'blue';
    this.tracePoints = [];
    this.label = label;
  }

  setInitPos(p) { this.initPos.set(p); }
  getInitPos() { return this.initPos; }
  setInitVel(v) { this.initVel.set(v); }
  getInitVel() { return this.initVel; }
  setHoriFriction(flag) { this.horiFriction = flag; }
  getHoriFriction() { return this.horiFriction; }
  setVertFriction(flag) { this.vertFriction = flag; }
  getVertFriction() { return this.vertFriction; }
  setPos(xy) { this.pos.set(xy); }
  getPos() { return this.pos; }
  setX(x) { this.pos.setX(x); }
  getX() { return this.pos.getX(); }
  setY(y) { this.pos.setY(y); }
  getY() { return this.pos.getY(); }
  setVel(v) { this.vel.set(v); }
  getVel() { return this.vel; }
  setForce(f) { this.force = f; }
  getForce() { return this.force; }
  setMass(d) { this.mass = d; }
  getMass() { return this.mass; }
  setCharge(d) { this.charge = d; }
  getCharge() { return this.charge; }
  setRadius(d) { this.radius = d; }
  getRadius() { return this.radius; }
  setTrace(flag) { this.clearTrace(); this.trace = flag; }
  getTrace() { return this.trace; }
  setForced(flag) { this.forced = flag; }
  getForced() { return this.forced; }
  setColor(c) { this.color = c; }
  getColor() { return this.color; }
  setFixed(flag) { this.vel.setX(0); this.vel.setY(0); this.fixedX = flag; this.fixedY = flag; }
  setFixedX(flag) { this.vel.setX(0); this.fixedX = flag; }
  setFixedY(flag) { this.vel.setY(0); this.fixedY = flag; }
  getFixed() { return this.fixedX && this.fixedY; }
  getFixedX() { return this.fixedX; }
  getFixedY() { return this.fixedY; }
  setLabel(s) { this.label = s; }
  getLabel() { return this.label; }

  static angle(particle, particle1) {
    const lenX = particle1.pos.getX() - particle.pos.getX();
    const lenY = particle1.pos.getY() - particle.pos.getY();
    let a;
    if (lenX !== 0) a = Math.atan(lenY / lenX);
    else a = (MyMath.signum(lenY) * Math.PI) / 2;
    if (lenX < 0) a += MyMath.signum(lenY) * Math.PI;
    return a;
  }

  static distance(particle, particle1, flag=false) {
    if (flag) {
      return Math.pow(particle1.pos.getY() - particle.pos.getY(), 2) + Math.pow(particle1.pos.getX() - particle.pos.getX(), 2);
    }
    return Math.sqrt(Math.pow(particle1.pos.getY() - particle.pos.getY(), 2) + Math.pow(particle1.pos.getX() - particle.pos.getX(), 2));
  }

  traceUpdate() {
    if (this.trace) {
      const particleXY = [(intOf(this.pos.getX())), (intOf(this.pos.getY()))];
      this.tracePoints.push(particleXY);
      if (this.tracePoints.length > 250) this.tracePoints.shift();
    }
  }

  clearTrace() { this.tracePoints = []; }

  initialize() {
    this.clearTrace();
    this.pos.set(this.initPos);
    this.vel.set(this.initVel);
  }
}

function intOf(v) { return Math.floor(v); }
