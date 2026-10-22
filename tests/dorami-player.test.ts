import { describe, expect, it } from 'vitest';
import { paint } from '../public/dorami-cartoon/player-core.js';

const animation = {
  width: 560,
  height: 360,
  ground: 310,
  scale: 0.9,
  hopDuration: 0.86,
  hopsEnd: 2.58,
  introEnd: 5.05,
  beats: [],
  work: [19],
  workStep: 0.16,
  frames: Array.from({ length: 24 }, (_, index) => ({ index, anchorX: 140, anchorY: 250 })),
};

function renderAt(time: number) {
  let alpha = 1;
  let draw: { x: number; alpha: number } | undefined;
  const context = {
    canvas: { width: 320, height: 360 },
    clearRect() {}, save() {}, restore() {}, beginPath() {}, ellipse() {}, fill() {},
    set globalAlpha(value: number) { alpha = value; },
    drawImage(_image: unknown, x: number) { draw = { x, alpha }; },
  };
  paint(context as unknown as CanvasRenderingContext2D, animation.frames.map(() => ({} as CanvasImageSource)), animation, time, true);
  return draw;
}

describe('compact Dorami animation', () => {
  it('keeps the entering frame invisible while the image is clipped by the left edge', () => {
    const frame = renderAt(0);
    expect(frame?.x).toBeLessThan(0);
    expect(frame?.alpha).toBe(0);
  });

  it('centers the settled work pose in the same stage as its controls', () => {
    const frame = renderAt(6);
    expect(frame?.x).toBe(34);
    expect(frame?.alpha).toBe(1);
    expect(frame!.x + 280 * animation.scale / 2).toBe(160);
  });
});
