/**
 * A simple seeded random number generator using the splitmix32 algorithm.
 * This allows us to have reproducible randomness by setting the seed.
 * The seed can be set using Random.setSeed(seed), and the current seed is logged to the console.
 * NOTE: The Math.random function is overridden with our seeded version, so all calls to Math.random() 
 * will use this generator. 
 * 
 * Usage: Just import this module at the start of your application, and you can set the seed as needed. For example:
 * 
 * import Random from './Random.js';
 * Random.setSeed(12345); // Set a specific seed for reproducibility
 * console.log(Random.num(), Math.random()); // Both will produce the same sequence of numbers for the same seed
 */


export default class Random {
  static seed = 10141961;

  static {
    this.setSeed((Math.random() * 2 ** 32) >>> 0);
  }

  static setSeed(seed) {
    this.seed = seed >>> 0;
    this.rand = splitmix32(this.seed);
    Math.random = this.rand; // Override Math.random with our seeded version
    console.log('Random Seed set to:', this.seed);
  }

  static num() {
    return this.rand();
  }
}

function splitmix32(a) {
  return function () {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    var t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}
