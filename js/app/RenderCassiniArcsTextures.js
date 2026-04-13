import Particle from '../physics2D/Particle.js';
import ColorPalette from './ColorPalette.js';
import RenderSimple from './RenderSimple.js';
import ImageLoader from './ImageLoader.js';

export default class RenderCassiniArcsTextures extends RenderSimple {
  // Configurable options
  bgColor = "rgb(60,0,0)";          // background color
  opacity = 0.5;                      // alpha for all paint operations
  clearBG = true;                     // if false, leaves motion trails
  violetColors = ["rgb(25, 15, 30)", "rgb(20, 10, 25)", "rgb(15, 5, 20)", "rgb(10, 0, 15)"];

  constructor(particles = [], springs = null, canvas) {
    super(particles, null, canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = particles;
    this.yellowGreenPalette = null; // colors will be loaded in init()
    this.woodPattern = null;
    this.bgTexture = null;
    this.flowerImage = null;
    this.flowerPattern = null;
  }

  setParticles(particles) {
    this.particles = particles ?? [];
  }

  async init() {
    this.yellowGreenPalette = await ColorPalette.createFromImage('./images/eye_closeup_green_extract.jpg');
    window.yellowGreenPalette = this.yellowGreenPalette;

    try {
      this.bgTexture = await ImageLoader.loadImage('./images/wood_panelling_light_s.jpg');
      this.flowerImage = await ImageLoader.loadImage('./images/flower_pattern_t.png');
      this.woodPattern = this.ctx.createPattern(this.bgTexture, 'repeat');
      this.flowerPattern = this.ctx.createPattern(this.flowerImage, 'repeat');
      // canvas for drawing, will be copied to display canvas in parts
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      document.body.appendChild(this.offscreenCanvas);

      this.ctxDisplay = this.ctx; // save the on-screen context
      this.ctx = this.offscreenCanvas.getContext('2d'); // off screen context
      this.ctxDisplay.drawImage(this.bgTexture, 0, 0, this.canvas.width, this.canvas.height);      
    } catch (error) {
      console.error(error.message);
    }
  }

  // ============================================================
  // Render the physics simulation into the canvas
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    let flowerP = null;

    // Clear bg if configured to do so, with a low alpha to create motion trails
    if (this.clearBG) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Set a constant alpha composite for subsequent drawing
    ctx.save();
    {
      ctx.globalAlpha = this.opacity;

      const particles = this.particles;

      const p0 = particles[0];
      const p1 = particles[1];
      const p2 = flowerP = particles[2];
      const p3 = particles[3];

      const radius1 = Particle.distance(p0, p1);
      const radius2 = Particle.distance(p1, p2);
      const radius3 = Particle.distance(p2, p3);
      const radius4 = Particle.distance(p3, p0);

      // ------------------------------------------------------------------------------------------------
      // Draw a circle for each particle pair, using the distance between particles as the radius.
      // ------------------------------------------------------------------------------------------------

      // Dark violet circle around p0
      // Make a 0-1 value that represents the radius length relative to the canvas height
      const radiusPercent = Math.max(Math.min(radius1 / this.canvas.height, 1), 0.1);
      ctx.save();
      {
        ctx.strokeStyle = this.woodPattern; //this.violetColors[(radiusPercent * 3) | 0];
        ctx.lineWidth = 5 * radiusPercent;
        this.drawArcPath(ctx, p0, p1);
        ctx.stroke();
        this.drawLineV(p0.getX(), p0.getY());
      }
      ctx.restore();

      // draw a yellow circle whose edges pass through p1 and p2
      const yellowColor = this.yellowGreenPalette.getNextColor();
      ctx.save();
      {
        ctx.strokeStyle = yellowColor;
        ctx.lineWidth = 1;
        this.drawArcPath(ctx, p1, p2);
        ctx.stroke();
        // greenish horizontal
        ctx.strokeStyle = "rgb(44, 217, 151)";
        this.drawLineH(p3.getX(), p3.getY());

        ctx.strokeStyle = "rgb(16, 12, 23)";
        ctx.lineWidth = 4;
        this.drawLineH(p1.getX(), p1.getY());
      }
      ctx.restore();

      // light blue circle with thick border at p2
      const gradientPercent = Math.max(Math.min(radius3 / this.canvas.height, 1), 0.1);
      ctx.save();
      {
        ctx.beginPath();
        // if (gradientPercent < .4) {
        //   ctx.arc(p2.getX(), p2.getY(), radius3/2, 0, Math.PI * 2);
        //   ctx.fillStyle =  `rgb(1, 193, 193)`; 
        //   ctx.fill();
        // }
        // else {
        // switch to a non-filled circle with a wide border, 
        // subtract 1/2 of border width to keep the same overall radius
        ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2) - 20, 0), 0, Math.PI * 2);
        ctx.strokeStyle = this.flowerPattern; //`rgb(1, 193, 193)`;
        ctx.lineWidth = 40;
        ctx.stroke();
        // }
        // extra nuance on the edge
        ctx.beginPath();
        ctx.arc(p2.getX(), p2.getY(), Math.max((radius3 / 2) - 2, 1), Math.PI / 2, 3 * Math.PI / 2, false);
        // ctx.strokeStyle =  `rgb(65, 1, 193)`;  // deep blue
        ctx.strokeStyle = `rgb(148, 196, 196)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Red circle around p3
      ctx.save();
      {
        ctx.strokeStyle = 'rgba(255, 10, 141, .5)';
        ctx.lineWidth = 2;
        this.drawArcPath(ctx, p2, p3);
        ctx.stroke();
        this.drawLineV(p2.getX(), p2.getY());
      }
      ctx.restore();

      // draw circles at each particle
      ctx.save();
      {
        ctx.globalAlpha = 0.9;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.getLabel() === 'red') {
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(208, 101, 0, 0.1)";
            ctx.fillStyle = "red";
            this.drawLineH(p.getX(), p.getY());
          }
          else if (p.getLabel() === 'green') {
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(44, 217, 151, 0.1)";
            ctx.fillStyle = "green";
            this.drawLineH(p.getX(), p.getY());
          }
          ctx.beginPath();
          ctx.ellipse(p.getX(), p.getY(), 2, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

    }
    ctx.restore();

    if (true) {
      this.ctxDisplay.drawImage(
        this.offscreenCanvas,
        500, 0, 100, this.canvas.height, // from
        0, 0, 100, this.canvas.height  // to
      );
      this.ctxDisplay.drawImage(
        this.offscreenCanvas,
        700, 0, 200, this.canvas.height, // from
        200, 0, 200, this.canvas.height  // to
      );
      this.ctxDisplay.drawImage(
        this.offscreenCanvas,
        0, 0, 200, this.canvas.height, // from
        400, 0, 200, this.canvas.height  // to
      );
      this.ctxDisplay.drawImage(
        this.offscreenCanvas,
        500, 0, 100, this.canvas.height, // from
        700, 0, 100, this.canvas.height  // to
      );
      this.ctxDisplay.drawImage(
        this.offscreenCanvas,
        flowerP.getX(), 0, 100, this.canvas.height, // from
        flowerP.getX(), 0, 100, this.canvas.height  // to
      );
    }
  }

  drawArcPath(ctx, p1, p2) {
    // compute midpoint and radius from p1 and p2
    const x1 = p1.getX(), y1 = p1.getY();
    const x2 = p2.getX(), y2 = p2.getY();
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const radius = Math.hypot(x2 - x1, y2 - y1) / 2;
    ctx.beginPath();
    ctx.arc(mx, my, radius, 0, Math.PI * 2);
  }

  drawLineV(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.canvas.height);
    this.ctx.stroke();
  }

  drawLineH(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
    this.ctx.stroke();
  }

  clear() {
    // Draw a filled rectangle that covers the entire canvas
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
