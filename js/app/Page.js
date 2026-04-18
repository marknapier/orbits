class Page {
  pauseFunction = null; // if provided, will be called when pause key is hit first
  resumeFunction = null; // if provided, will be called when pause key is hit again
  scaleFactor = 1; // global scale factor for the artwork, can be used to scale line widths proportionally to canvas sizes

  /**
   * Create a canvas with the given dimensions, appended to the document body. 
   * Clamp the width to 16x9 ratio. Sets the scaleFactor property based on the height of the canvas, 
   * treating 1080px as the base height for scaling (so a 1920x1080 canvas would have scaleFactor of 1, 
   * a 3456x2234 canvas would have scaleFactor of 2.07, etc).
   * @param {*} width 
   * @param {*} height 
   * @returns 
   */
  static createCanvas(width, height, id = 'sim') {
    const aspectRatio = 16 / 9;
    const canvas = document.createElement('canvas');
    canvas.id = id || 'sim';
    canvas.width = Math.min(width, height * aspectRatio);
    canvas.height = height;
    document.body.appendChild(canvas);
    Page.scaleFactor = Math.min(canvas.height, canvas.width) / 1080; // base height of 1600px for scaling
    console.log(`Canvas created with dimensions ${canvas.width}x${canvas.height}, scaleFactor ${Page.scaleFactor.toFixed(2)}`);
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
      // const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
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
}

export default Page;