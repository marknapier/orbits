import Oscillator from './Oscillator.js';
import MovingImageDots from './MovingImageDots.js';
import Stripe from './Stripe.js';

/**
 * @typedef {{ frequency: number, type: string, phase: number }} OscillatorConfig
 *
 * @typedef {{
 *   widthBase: number,
 *   widthDelta?: number,
 *   position?: number,
 *   darkColor: [number, number, number],
 *   lightColor: [number, number, number],
 *   oscColor: OscillatorConfig,
 *   oscWidth?: OscillatorConfig,
 *   alpha?: number,
 * }} StripeConfig
 */

export default class MovingImagePlaid2 extends MovingImageDots {
  /**
   * @param {number} width
   * @param {number} height
   * @param {StripeConfig[]} [config]
   */
  constructor(width = 480, height = 240, config) {
    super(width, height);
    this.stripeConfigs = config ?? MovingImagePlaid2.defaultConfig(width, height);
    this.stripes = this.stripeConfigs.map(cfg => MovingImagePlaid2._makeStripe(cfg));
  }

  /** @param {StripeConfig} cfg */
  static _makeStripe(cfg) {
    return new Stripe({
      ...cfg,
      oscColor: new Oscillator(cfg.oscColor.frequency, cfg.oscColor.type, cfg.oscColor.phase, cfg.oscColor.cycleDuration),
      oscWidth: cfg.oscWidth
        ? new Oscillator(cfg.oscWidth.frequency, cfg.oscWidth.type, cfg.oscWidth.phase, cfg.oscColor.cycleDuration)
        : null,
    });
  }

  /**
   * @param {number} width
   * @param {number} height
   * @returns {StripeConfig[]}
   */
  static defaultConfig(width, height) {
    return [
      { // background stripe is full width, and has no oscWidth so it always fills full width
        widthBase: width,
        position: width / 2,
        darkColor: [40, 10, 0], // red
        lightColor: [180, 60, 40],
        oscColor: { frequency: 0.025, type: 'sin', phase: Math.PI * 0.2 },
      },
      {
        widthBase: width * 0.33,
        widthDelta: width * 0.2,
        position: width * 0.33,
        darkColor: [10, 70, 30], // green
        lightColor: [30, 210, 55],
        oscWidth: { frequency: 0.008, type: 'sin', phase: 0 },
        oscColor: { frequency: 0.012, type: 'sin', phase: 0 },
        alpha: 0.65,
      },
      {
        widthBase: width * 0.1,
        widthDelta: width * 0.1,
        position: width * 0.75,
        darkColor: [200, 140, 10], // orange
        lightColor: [250, 200, 40],
        oscWidth: { frequency: 0.05, type: 'sin', phase: Math.PI * 1.5 },
        oscColor: { frequency: 0.03, type: 'sin', phase: Math.PI * 2.1 },
        alpha: 0.70,
      },
    ];
  }

  step() {
    for (const stripe of this.stripes) {
      stripe.step();
      this.ctx.fillStyle = stripe.cssColor;
      this.ctx.fillRect(stripe.x, 0, stripe.w, this.height); // vertical
      this.ctx.fillRect(0, stripe.x, this.width, stripe.w);  // horizontal
    }
  }
}
