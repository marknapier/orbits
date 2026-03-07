export default class CollisionList {
  constructor() {
    this.list = []; // array of Collision
    this.collisionTime = 0;
  }

  // inner Collision class
  static Collision = class {
    constructor(p1, p2, time = 0) {
      this.p1 = p1;
      this.p2 = p2;
      this.time = time;
    }
    getP1() { return this.p1; }
    getP2() { return this.p2; }
    getTime() { return this.time; }
    setP1(p) { this.p1 = p; }
    setP2(p) { this.p2 = p; }
    setTime(t) { this.time = t; }
    subTime(d) { this.time -= d; }
  }

  size() { return this.list.length; }

  addElement(p1, p2, t = 0) {
    if (p1 instanceof CollisionList.Collision) {
      this.list.push(p1);
    } else {
      this.list.push(new CollisionList.Collision(p1, p2, t));
    }
  }

  removeElementAt(i) { this.list.splice(i, 1); }

  removeElement(particle) {
    for (let i = 0; i < this.list.length; i++) {
      const c = this.list[i];
      if (c.p1 === particle || c.p2 === particle) {
        this.list.splice(i, 1);
        i--;
      }
    }
  }

  getParticleList() {
    const arr = [];
    for (let i = 0; i < this.list.length; i++) {
      const c = this.list[i];
      if (arr.indexOf(c.getP1()) < 0) arr.push(c.getP1());
      if (arr.indexOf(c.getP2()) < 0) arr.push(c.getP2());
    }
    return arr;
  }

  getP1At(i) { return this.list[i].getP1(); }
  getP2At(i) { return this.list[i].getP2(); }

  getElements() {
    const result = new CollisionList();
    const tmin = this.getMinTime();
    this.collisionTime = tmin;
    for (let i = 0; i < this.list.length; i++) {
      const c = this.list[i];
      if (c.getTime() <= tmin) result.addElement(c);
    }
    return result;
  }

  subTime(d) {
    for (let i = 0; i < this.list.length; i++) {
      this.list[i].subTime(d);
    }
  }

  getMinTime() {
    if (this.list.length === 0) return 0;
    let t = this.list[0].getTime();
    for (let i = 1; i < this.list.length; i++) {
      const timeToCollide = this.list[i].getTime();
      if (timeToCollide < t) t = timeToCollide;
    }
    return t;
  }

  getCollisionTime() { return this.collisionTime; }
}
