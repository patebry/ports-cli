/**
 * @module clampIndex
 *
 * Index clamping utility for navigation within bounded lists.
 */

/**
 * Clamps an index to valid array bounds [0, maxIndex].
 *
 * Used by navigation handlers (moveUp/moveDown) to ensure selectedIndex
 * never goes negative or exceeds the last valid array position.
 *
 * Edge cases:
 * - Empty array (maxIndex = -1): returns 0 (ensures non-negative index)
 * - Negative input: returns 0
 * - Input > maxIndex: returns maxIndex
 *
 * @param index - Proposed index (can be negative or out of bounds)
 * @param maxIndex - Maximum valid index (array.length - 1)
 * @returns Clamped index in range [0, max(0, maxIndex)]
 *
 * @example
 * ```typescript
 * clampIndex(-1, 5)   // => 0
 * clampIndex(10, 5)   // => 5
 * clampIndex(3, 5)    // => 3
 * clampIndex(2, -1)   // => 0 (empty array case)
 * ```
 */
export function clampIndex(index: number, maxIndex: number): number {
  return Math.min(Math.max(0, index), Math.max(0, maxIndex));
}
