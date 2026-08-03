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

export default class MovingImageStripes extends MovingImageDots {
  /**
   * @param {number} width
   * @param {number} height
   * @param {StripeConfig[]} [config]
   */
  constructor(width = 480, height = 240, config) {
    super(width, height);

    const stripeConfigs = config ?? MovingImageStripes.defaultConfig(width);
    this.stripes = stripeConfigs.map(cfg => new Stripe({
      ...cfg,
      oscColor: new Oscillator(cfg.oscColor.frequency, cfg.oscColor.type, cfg.oscColor.phase, cfg.oscColor.cycleDuration),
      oscWidth: cfg.oscWidth
        ? new Oscillator(cfg.oscWidth.frequency, cfg.oscWidth.type, cfg.oscWidth.phase, cfg.oscColor.cycleDuration)
        : null,
    }));
  }

  /**
   * @param {number} width
   * @returns {StripeConfig[]}
   */
  static defaultConfig(width) {
    return [
      { // background stripe is full width, and has no oscWidth so it always fills full width
        widthBase: width,
        position: width / 2,
        darkColor: [25, 45, 22],
        lightColor: [220, 250, 250],
        oscColor: { frequency: 0.0025, type: 'sin', phase: Math.PI * 0.2 },
      },
      {
        widthBase: width * 0.25,
        widthDelta: width * 0.20,
        position: width * 0.25,
        darkColor: [70, 128, 132],
        lightColor: [192, 226, 228],
        oscWidth: { frequency: 0.003, type: 'sin', phase: 0 },
        oscColor: { frequency: 0.003, type: 'sin', phase: Math.PI * 0.7 },
      },
      {
        widthBase: width * 0.20,
        widthDelta: width * 0.10,
        position: width * 0.25,
        darkColor: [255, 128, 132],
        lightColor: [255, 121, 13],
        oscWidth: { frequency: 0.0025, type: 'sin', phase: 0 },
        oscColor: { frequency: 0.0035, type: 'sin', phase: Math.PI * 0.8 },
        alpha: 0.6,
      },
      {
        widthBase: width * 0.10,
        widthDelta: width * 0.08,
        position: width * 0.70,
        darkColor: [218, 188, 88],
        lightColor: [208, 200, 184],
        oscWidth: { frequency: 0.0075, type: 'cos', phase: 0 },
        oscColor: { frequency: 0.02, type: 'sin', phase: Math.PI * 1.3 },
      },
      {
        widthBase: width * 0.10,
        widthDelta: width * 0.08,
        position: width * 0.80,
        darkColor: [218, 188, 88],
        lightColor: [208, 200, 184],
        oscWidth: { frequency: 0.0075, type: 'cos', phase: 0 },
        oscColor: { frequency: 0.02, type: 'sin', phase: Math.PI * 1.3 },
      },
    ];
  }

  step() {
    for (const stripe of this.stripes) {
      stripe.step();
      this.ctx.fillStyle = stripe.cssColor;
      this.ctx.fillRect(stripe.x, 0, stripe.w, this.height);
    }
    // debug: add border line
    this.ctx.strokeStyle = 'rgb(0, 0, 0)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, this.height);
    this.ctx.stroke();
  }
}
