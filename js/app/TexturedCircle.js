export default class TexturedCircle {
    constructor(x, y, radius, textureImageSrc) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 3.14; // radians -> 90 degress

        this.textureImage = new Image();
        this.textureImage.src = textureImageSrc;

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');

        this.textureLoaded = false;
        this.textureImage.onload = () => {
            this.textureLoaded = true;
            this.updateOffscreenCanvas();
        };
    }

    updateOffscreenCanvas() {
        const diameter = Math.ceil(this.radius * 2);
        this.offscreenCanvas.width = diameter;
        this.offscreenCanvas.height = diameter;

        this.offscreenCtx.clearRect(0, 0, diameter, diameter);
        this.offscreenCtx.save();

        // Circular clip
        this.offscreenCtx.beginPath();
        this.offscreenCtx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
        this.offscreenCtx.clip();

        // Rotate texture
        this.offscreenCtx.translate(this.radius, this.radius);
        this.offscreenCtx.rotate(this.rotation);
        this.offscreenCtx.translate(-this.radius, -this.radius);

        // Draw texture
        if (this.textureLoaded) {
            this.offscreenCtx.drawImage(
                this.textureImage,
                0, 0,
                diameter, diameter
            );
        }

        this.offscreenCtx.restore();
    }

    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Bounce off walls
        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
        }
    }

    setRadius(radius) {
        if (this.radius !== radius) {
            this.radius = radius;
            if (this.textureLoaded) {
                this.updateOffscreenCanvas();
            }
        }
    }

    draw(ctx, alpha = 1.0) {
        if (!this.textureLoaded) return;

        ctx.save();
        {
            ctx.globalAlpha = alpha;
            ctx.drawImage(
                this.offscreenCanvas,
                this.x - this.radius,
                this.y - this.radius
            );
        }
        ctx.restore();
    }
}

