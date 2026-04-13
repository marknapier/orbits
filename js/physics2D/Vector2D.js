export default class Vector2D {
  constructor(x = 0, y = 0) {
    // Support both formats: new Vector2D(x, y) and new Vector2D({ x, y })
    if (typeof x === 'object' && x !== null) {
      this.x = x.x ?? 0;
      this.y = x.y ?? 0;
    } else {
      this.x = x;
      this.y = y;
    }
  }

  set(v) {
    this.x = v.getX();
    this.y = v.getY();
  }

  setXY(x, y) {
    this.x = x;
    this.y = y;
  }

  setX(x) { this.x = x; }
  addX(x) { this.x += x; }
  getX() { return this.x; }
  setY(y) { this.y = y; }
  addY(y) { this.y += y; }
  getY() { return this.y; }

  setLength(newLen) {
    const currLen = this.length();
    if (currLen > 0) {
      this.x = this.x * (newLen / currLen);
      this.y = this.y * (newLen / currLen);
    }
  }

  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  comp(d) {
    return this.x * Math.cos(d) + this.y * Math.sin(d);
  }

  addComp(d, d1) {
    this.x += d * Math.cos(d1);
    this.y += d * Math.sin(d1);
  }

  scalProd(v) {
    return this.x * v.getX() + this.y * v.getY();
  }

  angle() {
    const len = this.length();
    if (len !== 0) {
      return (this.y < 0 ? -1 : 1) * Math.acos(this.x / len);
    }
    return 0;
  }

  normalize() {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    if (magnitude > 0) {
      this.x /= magnitude;
      this.y /= magnitude;
    } 
    else {
        this.x = 0;
        this.y = 0;
    }
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
  }
}
