export default class MyMath {
  static sigmoid(d, d1) {
    return 2 / (1.0 + Math.exp(-d / d1)) - 1.0;
  }

  static signum(d) {
    return d < 0 ? -1 : 1;
  }
}
