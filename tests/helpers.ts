/**
 * Shared test utilities for ink-testing-library tests.
 */

/**
 * Wait for React 18's MessageChannel-based scheduler to flush pending work.
 *
 * CRITICAL INK TESTING PATTERN:
 * - await tick() BEFORE stdin.write() - lets useInput's useEffect register listener
 * - stdin.write('key') - now someone is listening
 * - await tick() AFTER stdin.write() - lets React re-render with new state
 *
 * Mode changes require a tick between them:
 * ```ts
 * stdin.write('/');   // Enter search mode
 * await tick();       // Let mode change take effect
 * stdin.write('node'); // Now typing filters
 * await tick();       // Let filter update render
 * ```
 *
 * IMPORTANT: vi.useFakeTimers() must NOT be active. This uses real setTimeout.
 *
 * @returns Promise that resolves after 10ms
 */
export const tick = () => new Promise<void>(resolve => setTimeout(resolve, 10));
