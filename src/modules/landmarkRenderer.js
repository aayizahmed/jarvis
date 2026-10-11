/**
 * GestureFlow — JARVIS Edition
 * Holographic 2D Canvas Landmark Renderer with Tactical HUD Vectors,
 * Corner Brackets, and HiDPI Crispness
 */

import {
  SKELETAL_CONNECTIONS,
  FINGER_COLORS,
  KEY_LANDMARKS
} from './constants.js';

export class LandmarkRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;

    this.options = {
      showLandmarks: true,
      showSkeleton: true,
      showCoordinates: true,
      mirrored: true,
      pointRadius: 3.5,
      lineWidth: 1.8,
      colorScheme: 'jarvisCyan' // 'jarvisCyan' | 'fingerCoded'
    };
  }

  resize(displayWidth, displayHeight) {
    this.dpr = window.devicePixelRatio || 1;
    this.width = displayWidth;
    this.height = displayHeight;

    this.canvas.width = Math.round(displayWidth * this.dpr);
    this.canvas.height = Math.round(displayHeight * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  render(handsLandmarks = [], handednessList = []) {
    this.clear();
    if (!handsLandmarks || handsLandmarks.length === 0) return;

    const { mirrored, showSkeleton, showLandmarks } = this.options;
    const w = this.width;
    const h = this.height;

    handsLandmarks.forEach((landmarks, handIndex) => {
      if (!landmarks || landmarks.length !== 21) return;

      const handInfo = handednessList[handIndex] && handednessList[handIndex][0]
        ? handednessList[handIndex][0]
        : null;

      // Project landmarks to pixel space
      const screenPoints = landmarks.map((lm, idx) => {
        const px = mirrored ? (1.0 - lm.x) * w : lm.x * w;
        const py = lm.y * h;
        return {
          x: px,
          y: py,
          z: lm.z,
          index: idx
        };
      });

      // 1. Draw Skeleton Bones
      if (showSkeleton) {
        this._drawHolographicSkeleton(screenPoints, handIndex);
      }

      // 2. Draw Landmark Joints
      if (showLandmarks) {
        this._drawHolographicJoints(screenPoints);
      }

      // 3. Draw Tactical Wrist Badge
      this._drawWristTag(screenPoints[0], handInfo, handIndex);
    });
  }

  _drawHolographicSkeleton(points, handIndex) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const baseColor = handIndex === 0 ? '#00f0ff' : '#00f59b';
    const glowColor = handIndex === 0 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 245, 155, 0.25)';

    SKELETAL_CONNECTIONS.forEach(conn => {
      const p1 = points[conn.from];
      const p2 = points[conn.to];
      if (!p1 || !p2) return;

      // Outer holographic glow
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Core vector line
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.restore();
  }

  _drawHolographicJoints(points) {
    const ctx = this.ctx;
    ctx.save();

    const tipIndices = [4, 8, 12, 16, 20];

    points.forEach(pt => {
      const isTip = tipIndices.includes(pt.index);
      const isWrist = pt.index === 0;

      // Fingertip pulse brackets
      if (isTip) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.fill();
      } else if (isWrist) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#70c5ff';
        ctx.fill();
      } else {
        // Standard Joint Dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    ctx.restore();
  }

  _drawWristTag(wrist, handInfo, handIndex) {
    if (!wrist) return;
    const ctx = this.ctx;
    ctx.save();

    const side = handInfo ? handInfo.categoryName.toUpperCase() : `HAND ${handIndex + 1}`;
    const score = handInfo ? `${Math.round(handInfo.score * 100)}%` : '';
    const text = `${side} [${score}]`;

    ctx.font = '600 9px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(text).width;
    const x = Math.max(30, Math.min(this.width - 30, wrist.x));
    const y = Math.min(this.height - 12, wrist.y + 16);

    ctx.fillStyle = 'rgba(6, 10, 18, 0.85)';
    ctx.fillRect(x - textWidth / 2 - 4, y - 9, textWidth + 8, 14);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - textWidth / 2 - 4, y - 9, textWidth + 8, 14);

    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 2);

    ctx.restore();
  }
}
