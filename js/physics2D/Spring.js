import Particle from './Particle.js';

export default class Spring {
  constructor(p1, p2, k = 0, damping = 0, len = null) {
    if (!len && p1 && p2) {
      // If no rest length is provided, calculate it based on the initial positions of the particles
      const dx = p2.pos.getX() - p1.pos.getX();
      const dy = p2.pos.getY() - p1.pos.getY();
      len = Math.sqrt(dx * dx + dy * dy);
    }
    this.p1 = p1;
    this.p2 = p2;
    this.springConst = k;
    this.damp = damping;
    this.restlength = len || 0;
    this.harmonicAmplitude = 0;
    this.harmonicFrequency = 0;
    this.harmonicPhase = 0;
    this.selected = false;
  }

  setSpring(p1, p2, k, damping, len) {
    this.p1 = p1;
    this.p2 = p2;
    this.springConst = k;
    this.damp = damping;
    this.restlength = len;
    this.setHarmonic(0, 0, 0);
  }

  setSelected(flag) { this.selected = flag; }
  getSelected() { return this.selected; }
  setSpringConst(d) { this.springConst = d; }
  getSpringConst() { return this.springConst; }
  setLength(l) { this.restlength = l; }
  getLength() { return this.restlength; }

  getLengthAt(t) {
    return this.restlength * (1.0 + (this.harmonicAmplitude / 100.0) * Math.sin((this.harmonicFrequency * t) / 30.0 + (this.harmonicPhase * Math.PI) / 180.0));
  }

  setHarmonic(d, d1, d2) {
    this.harmonicAmplitude = d;
    this.harmonicFrequency = Math.abs(d1);
    this.harmonicPhase = d2;
    if (this.harmonicAmplitude > 100) this.harmonicAmplitude = 100;
    if (this.harmonicAmplitude < -100) this.harmonicAmplitude = -100;
  }

  setAmplitude(d) { this.setHarmonic(d, this.harmonicFrequency, this.harmonicPhase); }
  setFrequency(d) { this.harmonicFrequency = Math.abs(d); }
  setPhase(d) { this.harmonicPhase = d; }
  getAmplitude() { return this.harmonicAmplitude; }
  getFrequency() { return this.harmonicFrequency; }
  getPhase() { return this.harmonicPhase; }
  setDamp(d) { this.damp = d; }
  getDamp() { return this.damp; }
  setP1(p) { this.p1 = p; }
  getP1() { return this.p1; }
  setP2(p) { this.p2 = p; }
  getP2() { return this.p2; }

  exertForces(simTime) {
    const angle = Particle.angle(this.p1, this.p2);
    const f = this.force(angle, simTime);
    this.p1.force.addX(f * Math.cos(angle));
    this.p1.force.addY(f * Math.sin(angle));
    this.p2.force.addX(-f * Math.cos(angle));
    this.p2.force.addY(-f * Math.sin(angle));
  }

  force(a, t) {
    const rlen = (this.harmonicAmplitude > 0) ? this.getLengthAt(t) : this.restlength;
    const dx = this.p2.pos.getX() - this.p1.pos.getX();
    const dy = this.p2.pos.getY() - this.p1.pos.getY();
    const clen = Math.sqrt(dx * dx + dy * dy);
    const tension = this.springConst * (clen - rlen);
    const damping = this.damp * (this.p1.vel.comp(a) - this.p2.vel.comp(a));
    return tension - damping;
  }
}
