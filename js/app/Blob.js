export default class Blob {
  static MAX_PRECISION = 50;
  static MIN_PRECISION = 2;
  static SPLINE_BIAS = 0.25; // same as 0.25F
  static MAX_KNOTS = 150;

  constructor(precision = 12) {
    // "fields"
    this.PRECISION = 0;
    this.nBezPoints = 0;
    this.nBezSegments = 0;

    // matrix[12][4]
    this.matrix = Array.from({ length: Blob.MAX_PRECISION }, () => [0, 0, 0, 0]);

    // knots
    this.knots = Array.from({ length: Blob.MAX_KNOTS }, () => ({ x: 0, y: 0 }));
    this.nKnots = 0;

    // bounds (replaces Rectangle)
    this.rBounds = { x: 0, y: 0, width: 0, height: 0 };

    // polygon points (replaces java.awt.Polygon)
    this.polygonPoints = [];

    // curve type
    this.curveType = 1;

    // temp vars (kept for parity with Java; not strictly necessary)
    this.fph = null;
    this.fpi = null;
    this.fpj = null;
    this.fpk = null;

    this.x0 = this.x1 = this.x2 = this.x3 = 0;
    this.y0 = this.y1 = this.y2 = this.y3 = 0;
    this.m0 = this.m1 = this.m2 = this.m3 = 0;
    this.M = null;

    this.n = 0;
    this.nK = 0;
    this.nKnotsm2 = 0;

    this.setPrecision(precision);
    this.clear();
  }

  clear() {
    this.nKnots = 0;
    this.polygonPoints = [];
  }

  setPrecision(i) {
    const p = Math.max(Blob.MIN_PRECISION, Math.min(i, Blob.MAX_PRECISION));
    this.PRECISION = p;
    this.nBezPoints = p;
    this.nBezSegments = p - 1;
    this.generateInternalMatrix();
  }

  setCurveType(i) {
    this.curveType = i;
    this.generateInternalMatrix();
  }

  // matrix describes how bezier curves are shaped
  generateInternalMatrix() {
    for (let i = 0; i < this.nBezPoints; i++) {
      const f = i / this.nBezSegments;
      const f1 = f * f;
      const f2 = 1.0 - f;
      const f3 = f2 * f2;

      if (this.curveType === 1) {
        // orig
        this.matrix[i][0] = f * f1 * 1.0;
        this.matrix[i][1] = f2 * f3 * 1.0;
        this.matrix[i][2] = f * f3 * 3.0;
        this.matrix[i][3] = f1 * f2 * 3.0;
      } else if (this.curveType === 2) {
        // MJN
        this.matrix[i][0] = f * f1 * 1.0;
        this.matrix[i][1] = f2 * f3 * 1.0;
        this.matrix[i][2] = f * f3 * 3.0;
        this.matrix[i][3] = f1 * f2 * 3.1;
      } else if (this.curveType === 3) {
        // MJN
        this.matrix[i][0] = f * f1 * 1.0;
        this.matrix[i][1] = f2 * f3 * 1.0;
        this.matrix[i][2] = f * f3 * 2.99;
        this.matrix[i][3] = f1 * f2 * 3.01;
      } else {
        // fallback to type 1 behavior
        this.matrix[i][0] = f * f1 * 1.0;
        this.matrix[i][1] = f2 * f3 * 1.0;
        this.matrix[i][2] = f * f3 * 3.0;
        this.matrix[i][3] = f1 * f2 * 3.0;
      }
    }
  }

  addKnot(point) {
    // mimic Java behavior: overwrite existing slot, clamp nKnots <= 149
    if (this.nKnots >= Blob.MAX_KNOTS) return;
    this.knots[this.nKnots] = { x: point.x, y: point.y };
    this.nKnots = Math.min(this.nKnots + 1, Blob.MAX_KNOTS - 1);
  }

  addKnotXY(x, y) {
    if (this.nKnots >= Blob.MAX_KNOTS) return;
    this.knots[this.nKnots].x = x;
    this.knots[this.nKnots].y = y;
    this.nKnots++;
  }

  // helper: bounds contains (int) x,y like Java Rectangle.contains(int,int)
  _boundsContainsInt(x, y) {
    const ix = x | 0;
    const iy = y | 0;
    const { x: bx, y: by, width, height } = this.rBounds;
    return ix >= bx && iy >= by && ix < bx + width && iy < by + height;
  }

  pointWithin(x, y) {
    // compute bounds from knots (same as Java)
    this.rBounds.x = 99999;
    this.rBounds.y = 99999;
    let maxX = -99999;
    let maxY = -99999;

    for (let i = 0; i < this.nKnots; i++) {
      const k = this.knots[i];
      this.rBounds.x = (Math.min(this.rBounds.x, k.x)) | 0;
      this.rBounds.y = (Math.min(this.rBounds.y, k.y)) | 0;
      maxX = (Math.max(maxX, k.x)) | 0;
      maxY = (Math.max(maxY, k.y)) | 0;
    }

    this.rBounds.height = (maxY - this.rBounds.y) | 0;
    this.rBounds.width = (maxX - this.rBounds.x) | 0;

    if (!this._boundsContainsInt(x, y)) return false;

    // Ray casting logic port (kept very close to your Java)
    let crossings = 0;
    let ySave = 0.0;
    const n = this.nKnots;

    let i11;
    for (i11 = 0; i11 < n && this.knots[i11].y === y; i11++) {
      // empty
    }

    for (let i12 = 0; i12 < n; i12++) {
      const i13 = (i11 + 1) % n;

      const dx = this.knots[i13].x - this.knots[i11].x;
      const dy = this.knots[i13].y - this.knots[i11].y;

      if (dy !== 0.0) {
        const px = x - this.knots[i11].x;
        const py = y - this.knots[i11].y;

        if (this.knots[i13].y === y && this.knots[i13].x >= x) {
          ySave = this.knots[i11].y;
        }

        const condA = this.knots[i11].y === y && this.knots[i11].x >= x;
        const condB = (ySave > y) !== (this.knots[i13].y > y);
        if (condA && condB) crossings--;

        const t = py / dy;
        if (t >= 0.0 && t <= 1.0 && t * dx >= px) crossings++;
      }

      i11 = i13;
    }

    return (crossings % 2) !== 0;
  }

  // create curved connecting lines between knots then return polygon as points list
  makePolygon() {
    if (this.nKnots <= 0) return null;

    this.n = 0;
    this.nK = this.nKnots;
    this.nKnotsm2 = this.nKnots - 2;

    // total points in final polygon
    const nPts = this.nK * this.nBezPoints;
    const points = new Array(nPts);

    for (let i = 0; i < this.nK; i++) {
      if (i > 0 && i < this.nKnotsm2) {
        // not at first or last knot
        this.fph = this.knots[i - 1];
        this.fpi = this.knots[i];
        this.fpj = this.knots[i + 1];
        this.fpk = this.knots[i + 2];
      } else {
        // at first or last knot (wrap)
        this.fpi = this.knots[i];
        this.fpj = this.knots[(i + 1) % this.nK];
        this.fph = this.knots[(i - 1 + this.nK) % this.nK];
        this.fpk = this.knots[(i + 2) % this.nK];
      }

      // control points
      this.x0 = this.fpi.x;
      this.y0 = this.fpi.y;

      this.x3 = this.fpj.x;
      this.y3 = this.fpj.y;

      this.x1 = this.x0 + (this.x3 - this.fph.x) * Blob.SPLINE_BIAS;
      this.y1 = this.y0 + (this.y3 - this.fph.y) * Blob.SPLINE_BIAS;

      this.x2 = this.x3 - (this.fpk.x - this.x0) * Blob.SPLINE_BIAS;
      this.y2 = this.y3 - (this.fpk.y - this.y0) * Blob.SPLINE_BIAS;

      for (let j = 0; j < this.nBezPoints; j++) {
        this.M = this.matrix[j];

        this.m1 = this.M[1];
        this.m2 = this.M[2];
        this.m3 = this.M[3];
        this.m0 = this.M[0];

        const xVal =
          this.m1 * this.x0 +
          this.m2 * this.x1 +
          this.m3 * this.x2 +
          this.m0 * this.x3;

        const yVal =
          this.m1 * this.y0 +
          this.m2 * this.y1 +
          this.m3 * this.y2 +
          this.m0 * this.y3;

        // match Java int cast behavior
        points[this.n++] = { x: xVal | 0, y: yVal | 0 };
      }
    }

    this.polygonPoints = points;
    return points;
  }

  // Optional convenience: draw the generated polygon on a canvas context
  draw(ctx, { fillStyle = null, strokeStyle = null, lineWidth = 2 } = {}) {
    const pts = this.polygonPoints?.length ? this.polygonPoints : this.makePolygon();
    if (!pts || pts.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }
}
