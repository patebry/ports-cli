/**
 * @file app.tsx
 * @description Root component of the ports-cli TUI. Owns ALL application state.
 *
 * Architecture notes:
 * - All state lives here (single source of truth) rather than being split across
 *   child components. Ink re-renders the full tree on every state change anyway,
 *   so co-locating state avoids prop-drilling pain without any rendering overhead.
 *
 * Two-mode system:
 * - `navigate` (default): arrow keys / j/k move the selection, Enter confirms a kill,
 *   `/` enters search mode, `q` quits. The cursor is always visible.
 * - `search`: typing filters the port list in real time. ESC clears and returns to
 *   navigate. Arrow keys still work so the user can refine selection while typing.
 *
 * Data flow:
 *   lsof (every 2s) → ports[] → filteredPorts[] → PortList + StatusBar
 *                                                ↑
 *                                         searchQuery (user input)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, useInput, useApp } from 'ink';
import { SearchBar } from './components/SearchBar.js';
import { PortList } from './components/PortList.js';
import { StatusBar } from './components/StatusBar.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { getPorts, PortEntry } from './utils/getPorts.js';
import { killPort } from './utils/killPort.js';

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

export function App() {
  const { exit } = useApp();

  /** Master list of listening TCP ports from lsof. Refreshed every 2 seconds by the auto-refresh effect. */
  const [ports, setPorts] = useState<PortEntry[]>(() => getPorts());

  /** 0-based index into `filteredPorts` (NOT `ports`). Clamped before use to handle list shrinkage. */
  const [selectedIndex, setSelectedIndex] = useState(0);

  /** Current filter string typed by the user in search mode. Empty string means no filter is active. */
  const [searchQuery, setSearchQuery] = useState<string>('');

  /**
   * Transient kill result shown in the StatusBar. Set after executeKill resolves,
   * then auto-cleared to null after 2 seconds. Null when no message should be shown.
   */
  const [killMessage, setKillMessage] = useState<KillMessage | null>(null);

  /** Current interaction mode. Starts in `'navigate'`; switches to `'search'` when user presses `/`. */
  const [mode, setMode] = useState<AppMode>('navigate');

  /** Whether the full-screen help overlay is visible. Toggled by `?` in navigate mode. */
  const [showHelp, setShowHelp] = useState<boolean>(false);

  /**
   * Tracks the pending post-kill refresh timer so it can be cancelled on unmount.
   * Without this, the timer fires after the component is gone and calls getPorts()
   * on a dead component — harmless in production but leaks in tests.
   */
  const killRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Whether the inline kill-confirmation prompt is active ("Kill process:port? [y/ESC]").
   * Set to true when the user presses Enter on a selection; cleared on y / n / ESC.
   */
  const [confirmKill, setConfirmKill] = useState<boolean>(false);

  /**
   * Derived list of ports matching the current searchQuery.
   * Derived rather than stored in state to avoid stale-data bugs: if `ports` refreshes
   * while a filter is active, `filteredPorts` automatically reflects the new data on
   * the next render without any extra effect or synchronisation logic.
   *
   * Matches against `process` name, `port` number (cast to string), and `address`.
   * Case-insensitive. Returns the full list when searchQuery is empty.
   */
  const filteredPorts = ports.filter(p =>
    !searchQuery ||
    [p.process, String(p.port), p.address].some(v =>
      v.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  /**
   * A safe read index for `filteredPorts`.
   * `selectedIndex` is persisted state and can lag behind list length changes (e.g.
   * when a filter narrows the list, or when a killed process disappears on refresh).
   * `Math.max(0, filteredPorts.length - 1)` ensures we return 0 rather than -1
   * when the list is empty, so downstream code never sees an out-of-bounds index.
   */
  const clampedIndex = Math.min(selectedIndex, Math.max(0, filteredPorts.length - 1));

  /**
   * The port entry currently highlighted in the list, or null when the list is empty.
   * Uses `?? null` instead of `|| null` so a falsy-but-valid PortEntry is never
   * accidentally replaced with null.
   */
  const selectedPort: PortEntry | null = filteredPorts[clampedIndex] ?? null;

  /**
   * Keeps `selectedIndex` state in sync with `clampedIndex` whenever the two diverge.
   * This is necessary because `selectedIndex` is stored state while `clampedIndex` is
   * derived — React will not automatically update state based on a derived value.
   * Without this effect, the StatusBar would correctly show the clamped row, but the
   * next arrow-key press would jump from the stale `selectedIndex` value.
   */
  useEffect(() => {
    if (selectedIndex !== clampedIndex) {
      setSelectedIndex(clampedIndex);
    }
  }, [clampedIndex, selectedIndex]);

  /**
   * Auto-clears the kill feedback message after 2 seconds.
   * Returns the cleanup function so that:
   *   1. If the component unmounts before 2s, the timer is cancelled (no state update on dead component).
   *   2. If a second kill fires before the first message clears, the previous timer is cancelled
   *      and a fresh 2-second window starts for the new message.
   */
  useEffect(() => {
    if (!killMessage) return;
    const timer = setTimeout(() => setKillMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [killMessage]);

  /** Re-fetches the port list from lsof and updates state immediately. */
  const refresh = () => setPorts(getPorts());

  /**
   * Polls lsof every 2 seconds to keep the port list current without user interaction.
   * Returns `clearInterval` as the cleanup function so the interval does not accumulate
   * across re-renders or linger after the component unmounts.
   * The empty dependency array means this interval is set up once for the component lifetime.
   */
  useEffect(() => {
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  /**
   * Sends SIGKILL to the selected port's owning process and records the result.
   * Guards on `!selectedPort` to be safe against the list being empty at call time.
   * The 300ms delay before refresh gives the killed process time to fully exit so
   * that the next lsof call no longer reports it — without the delay the entry can
   * briefly reappear in the list before disappearing on the following poll cycle.
   *
   * The timer is tracked in killRefreshTimerRef so that:
   *   - A rapid second kill cancels the previous pending refresh (avoiding a stale
   *     lsof snapshot from the first kill overwriting a fresher one).
   *   - The timer is cancelled on unmount so it does not fire after the component
   *     is gone (which would call getPorts on a dead component).
   */
  const executeKill = () => {
    if (!selectedPort) return;
    const result = killPort(selectedPort.pid);
    setKillMessage(result.success
      ? { type: 'success', text: `Killed ${selectedPort.process} (${selectedPort.pid})` }
      : { type: 'error', text: `Failed: ${result.error}` }
    );
    if (killRefreshTimerRef.current !== null) clearTimeout(killRefreshTimerRef.current);
    killRefreshTimerRef.current = setTimeout(refresh, 300);
  };

  /** Cancels any pending post-kill refresh timer when the component unmounts. */
  useEffect(() => () => {
    if (killRefreshTimerRef.current !== null) clearTimeout(killRefreshTimerRef.current);
  }, []);

  /**
   * Central keyboard handler. Ink calls this for EVERY keypress regardless of which
   * component is focused — there is no event bubbling or stopPropagation in Ink.
   * Keys are evaluated top-to-bottom; the first matching branch returns early so
   * later branches are not evaluated.
   *
   * Priority order:
   *   1. Global always-on shortcuts (Ctrl+C, Ctrl+K)
   *   2. Help toggle / help overlay catch-all
   *   3. Kill confirmation dialog
   *   4. Navigate mode bindings
   *   5. Search mode bindings
   */
  useInput((input, key) => {
    // --- Global shortcuts (always active, checked before any mode logic) ---
    // Ctrl+C is the universal "quit" chord; checked first so it always works.
    // Ctrl+K is a power-user shortcut that kills without requiring Enter + y confirmation.
    if (key.ctrl && input === 'c') { exit(); return; }
    if (key.ctrl && input === 'k') { executeKill(); return; }

    // --- Help toggle ---
    // `?` only toggles help in navigate mode so that typing `?` in a search query
    // (e.g. filtering for "nginx?") does not accidentally open the overlay.
    // confirmKill is also excluded: the confirmation prompt is a sub-state of navigate
    // mode and the `?` character could otherwise flicker the overlay open and closed.
    if (input === '?' && mode === 'navigate' && !confirmKill) {
      setShowHelp(s => !s);
      return;
    }

    // --- Help overlay catch-all ---
    // When the help overlay is open it acts as a modal: any keypress (except the
    // global shortcuts already handled above) dismisses it. This mirrors standard
    // modal/overlay UX and means the user does not need to memorise a specific close key.
    if (showHelp) {
      setShowHelp(false);
      return;
    }

    // --- Kill confirmation dialog ---
    // Active when the user pressed Enter on a port row. The dialog shows
    // "Kill process:port? [y/ESC]" in the StatusBar.
    // `y`       → execute the kill, dismiss dialog
    // `n`/ESC   → cancel, dismiss dialog (no destructive action)
    // All other keys are swallowed so the user cannot accidentally navigate
    // while the confirmation prompt is visible.
    if (confirmKill) {
      if (input === 'y') {
        executeKill();
        setConfirmKill(false);
      } else if (key.escape || input === 'n') {
        setConfirmKill(false);
      }
      return;
    }

    // --- Navigate mode ---
    // Default mode. The cursor is always visible; selection moves with arrows or vi keys.
    if (mode === 'navigate') {
      // Up arrow / k — move selection up, clamped at top of list
      if (key.upArrow || input === 'k') {
        setSelectedIndex(i => Math.max(0, i - 1));
        return;
      }
      // Down arrow / j — move selection down, clamped at bottom of list
      if (key.downArrow || input === 'j') {
        setSelectedIndex(i => Math.min(filteredPorts.length - 1, i + 1));
        return;
      }
      // `/` — enter search mode; cursor moves to SearchBar and subsequent printable
      // keystrokes are appended to searchQuery
      if (input === '/') {
        setMode('search');
        return;
      }
      // Enter — open the kill confirmation dialog for the currently selected port.
      // No-ops when the list is empty (selectedPort is null).
      if (key.return) {
        if (selectedPort) setConfirmKill(true);
        return;
      }
      // `r` / `R` — manual refresh; fetches lsof immediately outside the 2s cycle
      if (input === 'r' || input === 'R') {
        refresh();
        return;
      }
      // ESC — if a search filter is active, clear it and show all ports again.
      // Does nothing when searchQuery is already empty.
      if (key.escape) {
        if (searchQuery) setSearchQuery('');
        return;
      }
      // `q` — graceful quit (same effect as Ctrl+C)
      if (input === 'q') {
        exit();
        return;
      }
      return;
    }

    // --- Search mode ---
    // Activated by `/` in navigate mode. Printable keystrokes build the filter string.
    if (mode === 'search') {
      // ESC — clear the query and return to navigate mode (one keystroke undo)
      if (key.escape) {
        setSearchQuery('');
        setMode('navigate');
        return;
      }
      // Backspace / Delete — remove the last character from the query
      if (key.backspace || key.delete) {
        setSearchQuery(q => q.slice(0, -1));
        return;
      }
      // Up arrow — move selection up while staying in search mode so the user can
      // refine which result they want without leaving the search field
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1));
        return;
      }
      // Down arrow — same as above but downward
      if (key.downArrow) {
        setSelectedIndex(i => Math.min(filteredPorts.length - 1, i + 1));
        return;
      }
      // Enter — commit the current filter and return to navigate mode.
      // The searchQuery is intentionally NOT cleared so the filter remains visible.
      if (key.return) {
        setMode('navigate');
        return;
      }
      // Ignore ctrl/meta combos (e.g. Ctrl+A, Cmd+V) to prevent accidental command
      // chords from being appended as literal characters into the search query.
      if (key.ctrl || key.meta) return;
      // Any remaining printable character is appended to the live filter query.
      if (input) {
        setSearchQuery(q => q + input);
      }
    }
  });

  /**
   * Component tree (top to bottom, column flex layout):
   *   SearchBar   — app title + filter input on one line
   *   PortList    — scrollable table of filteredPorts with the selected row highlighted
   *   StatusBar   — context-sensitive footer: mode indicator, kill confirm, kill message
   *   HelpOverlay — full-screen modal rendered on top when showHelp is true
   */
  return (
    <Box flexDirection="column">
      <SearchBar value={searchQuery} isActive={mode === 'search'} />
      <PortList ports={filteredPorts} selectedIndex={clampedIndex} />
      <StatusBar mode={mode} confirmKill={confirmKill} killMessage={killMessage} selectedPort={selectedPort} />
      {showHelp && <HelpOverlay />}
    </Box>
  );
}
