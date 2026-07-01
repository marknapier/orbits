export default class Page {
  static {
    // Inside a static block, "this" is the Page class, not an instance. Inside this file, Page.dpiRatio and this.dpiRatio refer to the same value.
    this.pauseFunction = null; // if provided, will be called when pause key is first hit
    this.resumeFunction = null; // if provided, will be called when pause key is hit again
    this.canvasScreenWidth = 800; // the dimensions of the canvas element as it appears on the screen - may be smaller than the actual size for high-DPI displays
    this.canvasScreenHeight = 600;

    // High-DPI monitors, such as Retina displays, can have 2 or 3 times the pixel density of standard displays. 
    // To ensure our canvas looks crisp on these displays, we scale up the canvas dimensions proportionally 
    // to the device pixel ratio, creating a larger image. The CSS width and height are set to the original 
    // dimensions to maintain the intended size on the page. 
    // Rendering needs to be scaled accordingly as well to draw into the larger canvas e.g.
    // ctx.scale(Page.dpiRatio, Page.dpiRatio);
    this.dpiRatio = window.devicePixelRatio || 1;
    this.scaleFactor = 1; // how large the artwork appears onscreen relative to its original size of 1080px - Can be used to scale line widths proportionally to canvas sizes
    console.log('Device Pixel Ratio:', this.dpiRatio);
  }

  /**
   * Create a canvas with the given dimensions, appended to the document body. 
   * Clamp the width to 16x9 ratio if possible (otherwise go fullscreen). 
   * Sets the scaleFactor property based on the height of the canvas, 
   * treating 1080px as the base height for scaling (so a 1920x1080 canvas would have scaleFactor of 1, 
   * a 3456x2234 canvas would have scaleFactor of 2.07, etc).
   * NOTE: the scaleFactor applies to the visual appearance of the canvas onscreen, e.g. its CSS
   * style dimentions, but the actual internal dimensions of the canvas may be larger for high-DPI displays.
   * @param {*} width 
   * @param {*} height 
   * @param {*} id - The ID to assign to the created canvas (optional, default is 'sim')
   * @returns HTMLCanvasElement

   */
  static createCanvas(width, height, id = 'sim') {
    const aspectRatio = 16 / 10;
    const canvas = document.createElement('canvas');
    canvas.id = id || 'sim';
    console.log(`Requested canvas dimensions: ${width}x${height}`);
    console.log(`aspectRatio: ${aspectRatio}, calculated screen dimensions: ${Math.min(width, height * aspectRatio)}x${height}`);
    // for a normal canvas, the screen dimensions are the same as the actual pixel dimensions.
    this.canvasScreenWidth = canvas.width = Math.min(width, height * aspectRatio);
    this.canvasScreenHeight = canvas.height = height;
    document.body.appendChild(canvas);
    this.scaleFactor = Math.min(canvas.height, canvas.width) / 1080; // base height of 1600px for scaling
    console.log(`Canvas created with dimensions ${canvas.width}x${canvas.height}, scaleFactor ${Page.scaleFactor.toFixed(2)}`);
    return canvas;
  }

  /**
   * Create a canvas with the given dimensions, appended to the document body. 
   * Always clamp the width to 16x9 ratio. Leave extra space on the sides or top/bottom as needed.
   * Sets the scaleFactor property based on the height of the canvas, 
   * treating 1080px as the base height for scaling (so a 1920x1080 canvas would have scaleFactor of 1, 
   * a 3456x2234 canvas would have scaleFactor of 2.07, etc).
   * NOTE: the scaleFactor applies to the visual appearance of the canvas onscreen, e.g. its CSS
   * style dimentions, but the actual internal dimensions of the canvas may be larger for high-DPI displays.
   * @param {*} width 
   * @param {*} height 
   * @param {*} id - The ID to assign to the created canvas (optional, default is 'sim')
   * @param {*} scaleForDPI - Whether to scale the canvas for high-DPI displays (optional, default is true)
   * @returns HTMLCanvasElement
   */
  static createCanvas16x9(width, height, id = 'sim', scaleForDPI = true) {
    const aspectRatio = 16 / 9;
    const canvas = document.createElement('canvas');
    canvas.id = id || 'sim';
    const canvasWidth = width / height >= aspectRatio ? Math.floor(height * aspectRatio) : width;
    const canvasHeight = width / height >= aspectRatio ? height : Math.floor(width / aspectRatio);
    console.log(`Requested canvas dimensions: ${width}x${height}`);
    console.log(`aspectRatio: ${aspectRatio}, calculated screen dimensions: ${canvasWidth}x${canvasHeight}`);

    if (!scaleForDPI) {
      this.dpiRatio = 1; // override DPI scaling if not desired
    }

    // the size of the canvas on screen in CSS pixels.
    this.canvasScreenWidth = canvasWidth;
    this.canvasScreenHeight = canvasHeight;

    // Scale up the internal dimensions of the canvas by the device pixel ratio 
    canvas.width = this.canvasScreenWidth * this.dpiRatio;
    canvas.height = this.canvasScreenHeight * this.dpiRatio;

    // Set the CSS dimensions of the canvas to the original width and height to maintain the intended size on the page
    canvas.style.width = this.canvasScreenWidth + 'px';
    canvas.style.height = this.canvasScreenHeight + 'px';

    document.body.appendChild(canvas);
    Page.scaleFactor = Math.min(canvas.height, canvas.width) / 1080;
    console.log(`Canvas created with dimensions ${canvas.width}x${canvas.height}, scaleFactor ${Page.scaleFactor.toFixed(2)}`);
    return canvas;
  }

  /** 
   * Create a canvas with the given dimensions, appended to the document body, scaled for high-DPI displays.
   */
  static createCanvasDPI(width, height, id = 'sim') {
    const aspectRatio = 16 / 10;

    // adjust canvas screen width to maintain aspect ratio
    this.canvasScreenWidth = Math.floor(Math.min(width, height * aspectRatio));
    this.canvasScreenHeight = Math.floor(height);

    const canvas = document.createElement('canvas');
    canvas.id = id;

    // Scale up the internal dimensions of the canvas by the device pixel ratio 
    canvas.width = this.canvasScreenWidth * this.dpiRatio;
    canvas.height = this.canvasScreenHeight * this.dpiRatio;

    // Set the CSS dimensions of the canvas to the original width and height to maintain the intended size on the page
    canvas.style.width = this.canvasScreenWidth + 'px';
    canvas.style.height = this.canvasScreenHeight + 'px';

    // Append canvas to body element in the DOM
    document.body.appendChild(canvas);

    // These pieces have been created on a screen height of 1080px. To adapt to larger screen 
    // sizes in the future, we set a scale factor based on the smaller dimension of the canvas, 
    // treating 1080px as the base for scaling. This scale factor can be used to scale line widths 
    // and physics parameters proportionally to the canvas size, so that the artwork maintains a 
    // similar look and feel across different screen sizes.
    Page.scaleFactor = Math.min(this.canvasScreenHeight, this.canvasScreenWidth) / 1080;
    console.log(`Canvas created with dimensions ${canvas.width}x${canvas.height}, scaleFactor ${Page.scaleFactor.toFixed(2)}`);

    return canvas;
  }

  /**
   * Create an off-screen canvas with the given CSS/screen dimensions. 
   * The internal pixel dimensions are scaled for high-DPI displays. 
   * Meant for buffering drawing operations.
   * @param {*} width - the width of the canvas as it appears on the screen in CSS pixels
   * @param {*} height - the height of the canvas as it appears on the screen in CSS pixels
   * @param {*} id -
   */
  static createOffscreenCanvasDPI(width, height, id = 'offscreen') {
    const canvas = document.createElement('canvas');

    // Scale up the internal dimensions of the canvas by the device pixel ratio 
    canvas.width = width * this.dpiRatio;
    canvas.height = height * this.dpiRatio;

    // Set the CSS dimensions of the canvas to the original width and height to maintain the intended size on the page
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    canvas.id = id;
    return canvas;
  }

  /**
   * Just a plain canvas, not visible on the page.
   * @param {*} width 
   * @param {*} height 
   * @param {*} id 
   * @returns 
   */
  static createOffscreenCanvas(width, height, id = 'offscreen') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.id = id;
    return canvas;
  }

  /**
   * Make a local date/time string to use as timestamp for saved files.
   * @returns the local date/time formatted as "YYYY-MM-DD_HH-MM-SS"
   */
  static getFormattedLocalDateTimeLocale() {
    const dateObj = new Date();
    // Using 'en-CA' locale provides the YYYY-MM-DD date format by default.
    // We explicitly set hour12 to false for 24-hour time.
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    // Remove comma, space and color
    const formatted = dateObj.toLocaleString('en-CA', options).replace(', ', '_').replace(/:/g, '-');
    // The output is "YYYY-MM-DD_HH-MM-SS"
    return formatted;
  }

  /**
   * Save the canvas to the given filename. Filename will have timestamp appended.
   * @param {*} canvas 
   * @param {*} filename 
   */
  static async saveCanvasToPNG(canvas, filename) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = Page.getFormattedLocalDateTimeLocale();
      const fullFilename = `${filename}-${timestamp}.png`;

      link.download = fullFilename;
      link.href = url;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
      console.log('Canvas saved to ', fullFilename);
    }, 'image/png', 1.0);
  }

  /**
   * Set the essential keypress events for the artwork.
   * ctrl S: save screen to PNG
   * ctrl P: pause the animation
   * @param {*} canvas 
   * @param {*} animationLoop 
   * @param {*} filename 
   */
  static setupKeyEvents(canvas, animationLoop, filename = document.title || 'screenshot') {
    document.addEventListener('keydown', async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        Page.saveCanvasToPNG(canvas, filename);
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (animationLoop.running()) {
          animationLoop.stop();
          Page.pauseFunction && Page.pauseFunction();
        }
        else {
          animationLoop.start();
          Page.resumeFunction && Page.resumeFunction();
        }
      }
    });
  }

  static onPause(pauseFunction) {
    Page.pauseFunction = pauseFunction || null;
  }

  static onResume(resumeFunction) {
    Page.resumeFunction = resumeFunction || null;
  }

  static loadImage(srcURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Page failed to load: ${srcURL}`));
      img.src = srcURL;
    });
  }
}
