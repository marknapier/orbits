/**
 * Generates sequential sin or cos values that progress over time using performance.now().
 * Usage for orbits:
 * X position: centerX + cos_oscillator.getValue() * radius
 * Y position: centerY + sin_oscillator.getValue() * radius
 * Elliptical: Use different radii for x and y
*/
export default class Oscillator {
    static instances = [];

    constructor(frequency = 1, type = 'sin', phase = 0) {
        this.frequency = frequency;  // Controls orbit speed (Hz = cycles per second) 1.0 = 1 second per orbit, 0.5 = 2 secs per, 0.1 = 10 secs per
        this.type = type;    // 'sin' or 'cos', use cos for x, sin for y for standard circular orbit
        this.phase = phase;  // Optional starting angle offset (in radians)
        this.startTime = performance.now();
        this.elapsedTime = 0; // time since startTime in seconds, floating point
        this.pausedTime = 0;  // current time when pause() was called
        this.paused = false;
        Oscillator.instances.push(this);
    }

    // returns -1 to 1
    getValue(currentTime = performance.now()) {
        if (!this.paused) {
            this.elapsedTime = (currentTime - this.startTime) / 1000;
        }
        const angle = 2 * Math.PI * this.frequency * this.elapsedTime + this.phase;
        return this.type === 'cos' ? Math.cos(angle) : Math.sin(angle);
    }

    pause() {
        if (!this.paused) {
            this.paused = true;
            this.pausedTime = performance.now();
        }
    }

    resume() {
        if (this.paused) {
            this.paused = false;
            this.startTime += performance.now() - this.pausedTime;
        }
    }

    static pauseAll() {
        for (const p of Oscillator.instances) {
            p.pause();
        }
    }

    static resumeAll() {
        for (const p of Oscillator.instances) {
            p.resume();
        }
    }
}

