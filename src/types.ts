/**
 * @module types
 *
 * Shared domain types used across multiple modules.
 *
 * Centralising these here prevents circular import chains:
 * - `AppMode` and `KillMessage` previously lived in `app.tsx`, which is
 *   imported by `StatusBar.tsx`; importing types back from `app.tsx` created
 *   a component → parent → component cycle.
 * - `PortEntry` previously lived in `utils/getPorts.ts`; components
 *   referencing a domain type via a utility module inverted the dependency
 *   direction (UI layer → data layer for a type-only import).
 */

/**
 * Represents a single listening TCP port entry returned by lsof.
 */
export interface PortEntry {
  /** Numeric TCP port number the process is listening on. */
  port: number;

  /**
   * Process name as reported by lsof (the COMMAND column).
   * Note: macOS truncates long process names in lsof output; this value
   * may not be the full executable name.
   */
  process: string;

  /**
   * Process ID as a string.
   * Kept as a string because lsof outputs strings and converting to a number
   * here would force every callsite to deal with the int — callers that pass
   * the PID to `killPort()` can pass it through without any conversion.
   */
  pid: string;

  /**
   * Normalized IP address the process is bound to.
   * Wildcard listeners (`*`, `0.0.0.0`, `[::]`, `::`) are all normalized to
   * `0.0.0.0`. IPv6 loopback (`[::1]`, `::1`) is normalized to `127.0.0.1`.
   * This gives callers a consistent, display-friendly address string.
   */
  address: string;

  /** OS user account that owns the process, as reported by lsof's USER column. */
  user: string;
}

/**
 * The two interaction modes the app can be in at any time.
 * - `'navigate'` — default mode; keyboard controls move the list selection
 * - `'search'`   — entered via `/`; printable keystrokes are appended to
 *                  searchQuery and filter the visible port list in real time
 */
export type AppMode = 'navigate' | 'search';

/**
 * Transient feedback message displayed in the StatusBar after a kill attempt.
 * Auto-clears after 2 seconds via a useEffect timer.
 *
 * @property type - `'success'` renders green; `'error'` renders red
 * @property text - Human-readable description, e.g. "Killed nginx (1234)" or "Failed: EPERM"
 */
export interface KillMessage {
  type: 'success' | 'error';
  text: string;
}
