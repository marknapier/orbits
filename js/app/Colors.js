/**
 * Generate color palettes using established color relationships.
 * Example usage:
 * let myPalette = Colors.generateSplitComplementaryPalette()
 * Colors.appendColorSquares(myPalette)
 */
export default class Colors {
  // Return array of 3 CSS color strings for triadic color scheme
  static generateTriadicPalette() {
    // Pick a random base hue (0 to 359 degrees)
    const baseHue = Math.floor(Math.random() * 360)
    // Saturation %: 0 is gray, 100 is brilliant color
    const saturation = 75
    // Lightness %: 0 is black, 50 is the pure color, 100 is white
    const lightness = 55 // 55% lightness
    // Pick the triadic colors: (0°, 120°, 240°) on the color wheel
    const hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360]

    const alpha = 1.0

    return hues.map((hue) => Colors.hslToHSL(hue, saturation, lightness, alpha))
  }

  // Return array of 4 CSS color strings - 2 complementary pairs evenly spaced on color wheel
  static generateDoubleComplementaryPalette() {
    // Pick a random base hue (0 to 359 degrees)
    const baseHue = Math.floor(Math.random() * 360)
    // Saturation %: 0 is gray, 100 is brilliant color
    const saturation = 75
    // Lightness %: 0 is black, 50 is the pure color, 100 is white
    const lightness = 55
    // Offset between the two complementary pairs (90° = square tetradic)
    const pairOffset = 60
    // Two complementary pairs: (base, base+180°) and (base+offset, base+offset+180°)
    const hues = [
      baseHue,
      (baseHue + 180) % 360,
      (baseHue + pairOffset) % 360,
      (baseHue + pairOffset + 180) % 360,
    ]

    const alpha = 1.0

    return hues.map((hue) => Colors.hslToHSL(hue, saturation, lightness, alpha))
  }

  // Return array of 3 CSS color strings - base + two hues flanking its complement
  static generateSplitComplementaryPalette() {
    // Pick a random base hue (0 to 359 degrees)
    const baseHue = Math.floor(Math.random() * 360)
    // Saturation %: 0 is gray, 100 is brilliant color
    const saturation = 75
    // Lightness %: 0 is black, 50 is the pure color, 100 is white
    const lightness = 55
    // How far each flank sits from the true complement (30° is classic)
    const splitOffset = 30
    // Base + the two neighbors of its complement (180° ± splitOffset)
    const hues = [
      baseHue,
      (baseHue + 180 - splitOffset) % 360,
      (baseHue + 180 + splitOffset) % 360,
    ]

    const alpha = 1.0

    return hues.map((hue) => Colors.hslToHSL(hue, saturation, lightness, alpha))
  }

  // Helper function to convert HSL values into a clean Hex string
  static hslToHex(h, s, l) {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
  }

  // Helper function to format hsl values as a CSS color style
  static hslToHSL(h, s, l, a = 1.0) {
    return `hsl(${h} ${s}% ${l}% / ${a})`
  }

  // Palette generators return CSS hsl() strings; convert to [r, g, b] array
  static cssHslToRgbArray(cssHsl) {
    const [h, s, l] = cssHsl.match(/[\d.]+/g).map(Number);
    const hex = Colors.hslToHex(h, s, l);
    return [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16));
  }

  // Test
  static appendColorSquares(cssColors) {
    const container = document.createElement('div')
    container.style.cssText = 'display:flex;gap:4px;'
    for (const color of cssColors) {
      const square = document.createElement('div')
      square.style.cssText = `width:50px;height:50px;background:${color};`
      container.appendChild(square)
    }
    document.body.appendChild(container)
  }
}
