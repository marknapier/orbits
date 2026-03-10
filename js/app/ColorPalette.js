const defaultColors = [
    { "r": 255, "g": 255, "b": 86 },
    { "r": 250, "g": 131, "b": 61 },
    { "r": 155, "g": 128, "b": 56 },
    { "r": 100, "g": 171, "b": 10 },
];

// wrapper class for the palette
class ColorPalette {
    constructor(colors) {
        this.colors = colors ?? defaultColors;
        this.index = 0;
        this.loadedColors = null; // getColorSampleFrom() stores colors here
    }

    // return the color object {r, g, b}
    getNextColorRGB() {
        const color = this.colors[this.index];
        this.index = (this.index + 1) % this.colors.length;
        return color;
    }

    // return a color formatted as an "rgb()" string
    getNextColor() {
        const c = this.getNextColorRGB();
        return `rgb(${c.r} ${c.g} ${c.b})`;
    }

    static convertFlatRGBAtoColorObjects(data) {
        const colors = [];
        // The length of the data array must be a multiple of 4 (for RGBA)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            colors.push({ r, g, b, a });
        }
        return colors;
    }

    // Draw the image into a temporary canvas, then sample one row of pixels from it.
    // Return a ColorPalette instance containing the pixel color values.
    static async createFromImage(imgURL, row = 0) {
        // wait for the image to load
        const img = new Image();
        const loadPromise = new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        img.src = imgURL;
        await loadPromise;

        // draw image into offscreen canvas
        const tmpCanvas = document.createElement('canvas');
        const tmpContext = tmpCanvas.getContext('2d');
        tmpCanvas.width = img.width;
        tmpCanvas.height = img.height;
        tmpContext.drawImage(img, 0, 0);

        // Extract 1 row of pixels
        const rowData = tmpContext.getImageData(1, row, img.width, 1).data;
        // rowData is a flat Uint8ClampedArray: [r,g,b,a, r,g,b,a...]
        // Store in a standard JS array
        const pixelArray = Array.from(rowData);
        // convert to rgb objects
        const colorArray = ColorPalette.convertFlatRGBAtoColorObjects(pixelArray);

        // store result for later reference and return
        this.loadedColors = colorArray;
        window.loadedColors = colorArray;
        //return colorArray;
        return new ColorPalette(colorArray);
    }
}

export default ColorPalette;