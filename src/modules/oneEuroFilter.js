/**
 * GestureFlow — JARVIS Edition
 * 1€ (One Euro) Adaptive Low-Latency Filter
 * Reference: Casiez, Roussel, Vogel (CHI 2012)
 * Eliminates jitter at low speeds while maintaining instant responsiveness at high speeds.
 */

class LowPassFilter {
  constructor(alpha = 0) {
    this.setAlpha(alpha);
    this.s = null;
  }

  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  filter(value) {
    if (this.s === null) {
      this.s = value;
    } else {
      this.s = this.alpha * value + (1.0 - this.alpha) * this.s;
    }
    return this.s;
  }

  hasLastRawValue() {
    return this.s !== null;
  }

  last() {
    return this.s;
  }

  reset() {
    this.s = null;
  }
}

export class OneEuroFilter1D {
  constructor(freq = 60, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;

    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
    this.lastTime = null;
  }

  _alpha(rate, cutoff) {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  filter(value, timestamp) {
    if (this.lastTime === null || timestamp === undefined) {
      this.lastTime = timestamp;
      return this.xFilter.filter(value);
    }

    const dt = Math.max(1e-4, (timestamp - this.lastTime) / 1000.0);
    this.lastTime = timestamp;
    const rate = 1.0 / dt;

    // Estimate derivative
    const prev = this.xFilter.last();
    const dx = prev !== null ? (value - prev) * rate : 0.0;

    // Filter derivative
    this.dxFilter.setAlpha(this._alpha(rate, this.dCutoff));
    const edx = this.dxFilter.filter(dx);

    // Dynamic cutoff frequency based on speed
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    // Filter value
    this.xFilter.setAlpha(this._alpha(rate, cutoff));
    return this.xFilter.filter(value);
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/**
 * 3D Vector One Euro Filter for Spatial Points
 */
export class OneEuroFilter3D {
  constructor(freq = 60, minCutoff = 1.2, beta = 0.008, dCutoff = 1.0) {
    this.filterX = new OneEuroFilter1D(freq, minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter1D(freq, minCutoff, beta, dCutoff);
    this.filterZ = new OneEuroFilter1D(freq, minCutoff, beta, dCutoff);
  }

  filter(x, y, z, timestamp) {
    return {
      x: this.filterX.filter(x, timestamp),
      y: this.filterY.filter(y, timestamp),
      z: this.filterZ.filter(z, timestamp)
    };
  }

  setParameters(minCutoff, beta) {
    this.filterX.minCutoff = minCutoff;
    this.filterY.minCutoff = minCutoff;
    this.filterZ.minCutoff = minCutoff;
    this.filterX.beta = beta;
    this.filterY.beta = beta;
    this.filterZ.beta = beta;
  }

  reset() {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }
}
