import { describe, it, expect } from 'vitest';
import { clampIndex } from '../../src/utils/clampIndex.js';

describe('clampIndex', () => {
  it('returns index unchanged when within bounds', () => {
    expect(clampIndex(3, 5)).toBe(3);
    expect(clampIndex(0, 5)).toBe(0);
    expect(clampIndex(5, 5)).toBe(5);
  });

  it('clamps negative index to 0', () => {
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(-10, 5)).toBe(0);
  });

  it('clamps index above maxIndex', () => {
    expect(clampIndex(10, 5)).toBe(5);
    expect(clampIndex(100, 5)).toBe(5);
  });

  it('handles empty array (maxIndex = -1)', () => {
    expect(clampIndex(0, -1)).toBe(0);
    expect(clampIndex(5, -1)).toBe(0);
    expect(clampIndex(-1, -1)).toBe(0);
  });

  it('handles single-element array (maxIndex = 0)', () => {
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(1, 0)).toBe(0);
    expect(clampIndex(-1, 0)).toBe(0);
  });
});
