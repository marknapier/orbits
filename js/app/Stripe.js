/**
 * @typedef {[number, number, number]} RGB
 */

/**
 * @typedef {Object} OscillatorLike
 * @property {() => number} getValue - Returns a value, typically in [-1, 1]
 */

/**
 * @typedef {Object} StripeOptions
 * @property {number} widthBase - Base width of the stripe
 * @property {number} [widthDelta=0] - Amount width oscillates by
 * @property {number} [position=0] - Center x-position of the stripe
 * @property {RGB} darkColor - RGB color used at the low end of the oscillator
 * @property {RGB} lightColor - RGB color used at the high end of the oscillator
 * @property {OscillatorLike|null} [oscWidth=null] - Oscillator controlling width; null means fixed width
 * @property {OscillatorLike} oscColor - Oscillator controlling color interpolation
 * @property {number} [alpha=1.0] - Alpha value for the stripe
 */

export default class Stripe {
  /** @param {StripeOptions} options */
  constructor({ widthBase, widthDelta = 0, position = 0, darkColor, lightColor, oscWidth = null, oscColor, alpha = 1.0 }) {
    /** @type {number} */ this.widthBase = widthBase;
    /** @type {number} */ this.widthDelta = widthDelta;
    /** @type {number} */ this.position = position;
    /** @type {RGB} */    this.darkColor = darkColor;
    /** @type {RGB} */    this.lightColor = lightColor;
    /** @type {OscillatorLike|null} */ this.oscWidth = oscWidth;
    /** @type {OscillatorLike} */     this.oscColor = oscColor;

    /** @type {number} */ this.w = widthBase;
    /** @type {number} */ this.x = position - widthBase / 2;
    /** @type {RGB} */    this.rgb = [...darkColor];
    /** @type {string} */ this.cssColor = this._toCSS(this.rgb);
    /** @type {number} */ this.alpha = alpha;
  }

  step() {
    this.w = this.oscWidth
      ? this.widthBase + this.oscWidth.getValue() * this.widthDelta
      : this.widthBase;
    this.x = this.position - this.w / 2;
    const t = (this.oscColor.getValue() + 1) / 2;
    this.rgb = this._lerpRGB(this.darkColor, this.lightColor, t);
    this.cssColor = this._toCSS(this.rgb);
  }

  /**
   * @param {RGB} a
   * @param {RGB} b
   * @param {number} t - Interpolation factor in [0, 1]
   * @returns {RGB}
   */
  _lerpRGB(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  /**
   * @param {RGB} rgb
   * @returns {string}
   */
  _toCSS([r, g, b]) {
    return `rgb(${r},${g},${b},${this.alpha})`;
  }
}
