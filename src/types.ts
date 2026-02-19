/**
 * @module types
 *
 * Shared domain types used across multiple modules.
 *
 * Centralising these here prevents circular import chains: previously
 * `AppMode` and `KillMessage` lived in `app.tsx`, which is imported by
 * `StatusBar.tsx`; `StatusBar.tsx` importing types back from `app.tsx`
 * created a component → parent → component cycle. Moving them here
 * breaks that cycle and makes the type contract explicit.
 */

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
