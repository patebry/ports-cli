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
import { Box, useApp } from 'ink';
import { SearchBar } from './components/SearchBar.js';
import { PortList } from './components/PortList.js';
import { StatusBar } from './components/StatusBar.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { getPorts } from './utils/getPorts.js';
import { killPort } from './utils/killPort.js';
import { clampIndex } from './utils/clampIndex.js';
import { useKeyboardInput } from './hooks/useKeyboardInput.js';
import type { AppMode, KillMessage, PortEntry } from './types.js';

/** Milliseconds between automatic lsof polls. */
const AUTO_REFRESH_INTERVAL_MS = 2000;
/** Milliseconds a kill success/error message remains visible in the StatusBar. */
const KILL_MESSAGE_TIMEOUT_MS = 2000;
/** Milliseconds to wait after a kill before re-polling lsof, giving the process time to exit. */
const POST_KILL_REFRESH_DELAY_MS = 300;

interface AppProps {
  /** Override for kill message timeout (ms). For testing only. @internal */
  _killMessageTimeoutMs?: number;
}

export function App({ _killMessageTimeoutMs = KILL_MESSAGE_TIMEOUT_MS }: AppProps): React.JSX.Element {
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
  const query = searchQuery.toLowerCase();
  const filteredPorts = ports.filter(p =>
    !searchQuery ||
    [p.process, String(p.port), p.address].some(v =>
      v.toLowerCase().includes(query)
    )
  );

  /**
   * A safe read index for `filteredPorts`.
   * `selectedIndex` is persisted state and can lag behind list length changes (e.g.
   * when a filter narrows the list, or when a killed process disappears on refresh).
   * Clamping ensures we never access out-of-bounds indices.
   */
  const clampedIndex = clampIndex(selectedIndex, filteredPorts.length - 1);

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
    const timer = setTimeout(() => setKillMessage(null), _killMessageTimeoutMs);
    return () => clearTimeout(timer);
  }, [killMessage, _killMessageTimeoutMs]);

  /** Re-fetches the port list from lsof and updates state immediately. */
  const refresh = () => setPorts(getPorts());

  /**
   * Polls lsof every 2 seconds to keep the port list current without user interaction.
   * Returns `clearInterval` as the cleanup function so the interval does not accumulate
   * across re-renders or linger after the component unmounts.
   * The empty dependency array means this interval is set up once for the component lifetime.
   */
  useEffect(() => {
    const id = setInterval(refresh, AUTO_REFRESH_INTERVAL_MS);
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
    killRefreshTimerRef.current = setTimeout(refresh, POST_KILL_REFRESH_DELAY_MS);
  };

  /** Cancels any pending post-kill refresh timer when the component unmounts. */
  useEffect(() => () => {
    if (killRefreshTimerRef.current !== null) clearTimeout(killRefreshTimerRef.current);
  }, []);

  /** Move cursor up one row, clamped to index 0. */
  function moveUp() {
    setSelectedIndex(i => clampIndex(i - 1, filteredPorts.length - 1));
  }

  /** Move cursor down one row, clamped to last row of filteredPorts. */
  function moveDown() {
    setSelectedIndex(i => clampIndex(i + 1, filteredPorts.length - 1));
  }

  /**
   * Keyboard input handler. Extracted to custom hook for clarity and testability.
   * All state mutations are delegated via callbacks to maintain single-source-of-truth
   * state architecture in App.
   */
  useKeyboardInput({
    mode,
    showHelp,
    confirmKill,
    searchQuery,
    selectedPort,
    exit,
    executeKill,
    toggleHelp: () => setShowHelp(s => !s),
    closeHelp: () => setShowHelp(false),
    setConfirmKill,
    setMode,
    setSearchQuery,
    moveUp,
    moveDown,
    refresh,
  });

  /**
   * Component tree (top to bottom, column flex layout):
   *   SearchBar   — app title + filter input on one line
   *   PortList    — scrollable table of filteredPorts with the selected row highlighted
   *   StatusBar   — context-sensitive footer: mode indicator, kill confirm, kill message
   *   HelpOverlay — full-screen modal rendered on top when showHelp is true
   */
  return (
    <Box flexDirection='column'>
      <SearchBar value={searchQuery} isActive={mode === 'search'} />
      <PortList ports={filteredPorts} selectedIndex={clampedIndex} />
      <StatusBar mode={mode} confirmKill={confirmKill} killMessage={killMessage} selectedPort={selectedPort} />
      {showHelp && <HelpOverlay />}
    </Box>
  );
}
