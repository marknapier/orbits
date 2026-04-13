export default class Circles {
  static getCircleIntersections(cx1, cy1, r1, cx2, cy2, r2) {
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > r1 + r2 || d < Math.abs(r1 - r2)) return [];

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);

    const px = cx1 + (dx * a) / d;
    const py = cy1 + (dy * a) / d;

    const offsetX = -(dy * h) / d;
    const offsetY = (dx * h) / d;

    return [
      { x: px + offsetX, y: py + offsetY },
      { x: px - offsetX, y: py - offsetY }
    ];
  }

  /**
   * Finds the overlap shapes (lens and crescents) between two circles, if they intersect.
   * @param {*} x1 Circle 1 x
   * @param {*} y1 Circle 1 y
   * @param {*} r1 Circle 1 radius
   * @param {*} x2 Circle 2 x
   * @param {*} y2 Circle 2 y
   * @param {*} r2 Circle 2 radius
   * @returns object containing arc values for crescent 1, crescent2 and lens, or null if no overlap
   */
  static getOverlapShapes(x1, y1, r1, x2, y2, r2) {
    const points = Circles.getCircleIntersections(x1, y1, r1, x2, y2, r2);
    const interP1 = points[0];
    const interP2 = points[1];

    if (points.length < 2) {
      // circles do not intersect at two points
      return null;
    }

    // Calculate start and end angles for outer arc (circle 1)
    const angle1_outer = Math.atan2(interP1.y - y1, interP1.x - x1);
    const angle2_outer = Math.atan2(interP2.y - y1, interP2.x - x1);

    // Calculate angles for inner arc (circle 2)
    const angle1_inner = Math.atan2(interP1.y - y2, interP1.x - x2);
    const angle2_inner = Math.atan2(interP2.y - y2, interP2.x - x2);

    return {
      crescent1: {
        arc1: {
          x: x1, y: y1, r: r1, angleStart: angle1_outer, angleEnd: angle2_outer, counterClockwise: false
        },
        arc2: {
          x: x2, y: y2, r: r2, angleStart: angle2_inner, angleEnd: angle1_inner, counterClockwise: true
        }
      },
      crescent2: {
        arc1: {
          x: x2, y: y2, r: r2, angleStart: angle2_inner, angleEnd: angle1_inner, counterClockwise: false
        },
        arc2: {
          x: x1, y: y1, r: r1, angleStart: angle1_outer, angleEnd: angle2_outer, counterClockwise: true
        }
      },
      lens: {
        arc1: {
          x: x2, y: y2, r: r2, angleStart: angle2_inner, angleEnd: angle1_inner, counterClockwise: true
        },
        arc2: {
          x: x1, y: y1, r: r1, angleStart: angle1_outer, angleEnd: angle2_outer, counterClockwise: true
        }
      }
    };
  }

  /**
   * Finds the intersection points between a line segment and a circle.
   * @returns {Array} Array of objects {x, y} representing intersection points.
   */
  static getLineCircleIntersections(x1, y1, x2, y2, cx, cy, r) {
    // Translate points so circle is at (0,0)
    const x1_ = x1 - cx;
    const y1_ = y1 - cy;
    const x2_ = x2 - cx;
    const y2_ = y2 - cy;

    const dx = x2_ - x1_;
    const dy = y2_ - y1_;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const D = x1_ * y2_ - x2_ * y1_;

    // Discriminant determines if there are intersections
    const discriminant = r * r * dr * dr - D * D;

    if (discriminant < 0) return []; // No intersection

    const sqrtDisc = Math.sqrt(discriminant);
    const signDy = dy < 0 ? -1 : 1;

    // Standard formula for circle-line intersection
    const intersectX1 = (D * dy + signDy * dx * sqrtDisc) / (dr * dr);
    const intersectY1 = (-D * dx + Math.abs(dy) * sqrtDisc) / (dr * dr);

    if (discriminant === 0) {
      return [{ x: intersectX1 + cx, y: intersectY1 + cy }]; // Tangent line
    }

    const intersectX2 = (D * dy - signDy * dx * sqrtDisc) / (dr * dr);
    const intersectY2 = (-D * dx - Math.abs(dy) * sqrtDisc) / (dr * dr);

    return [
      { x: intersectX1 + cx, y: intersectY1 + cy },
      { x: intersectX2 + cx, y: intersectY2 + cy }
    ];
  }

  /**
   * Finds the overlap arc between line and circle.
   * @param {*} x1 Line start x
   * @param {*} y1 Line start y
   * @param {*} x2 Line end x
   * @param {*} y2 Line end y
   * @param {*} cx Circle center x
   * @param {*} cy Circle center y
   * @param {*} r Circle radius
   * @returns object containing arc values, or null if no overlap
   */
  static getLineOverlapShapes(x1, y1, x2, y2, cx, cy, r) {
    const points = Circles.getLineCircleIntersections(x1, y1, x2, y2, cx, cy, r);
    const interP1 = points[0];
    const interP2 = points[1];

    if (points.length < 2) {
      // circle does not intersect at two points
      return null;
    }

    // Calculate angles for intersection points relative to circle center
    const angle1 = Math.atan2(interP1.y - cy, interP1.x - cx);
    const angle2 = Math.atan2(interP2.y - cy, interP2.x - cx);

    return {
      arc1: {
        x: cx, y: cy, r: r, angleStart: angle1, angleEnd: angle2, counterClockwise: false
      },
      arc2: {
        x: cx, y: cy, r: r, angleStart: angle2, angleEnd: angle1, counterClockwise: false
      }
    };
  }
}

