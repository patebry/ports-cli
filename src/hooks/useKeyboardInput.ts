/**
 * @module useKeyboardInput
 *
 * Custom hook that encapsulates all keyboard input handling for the ports-cli TUI.
 */

import { useInput } from 'ink';

import type { AppMode, PortEntry } from '../types.js';

/**
 * Props for the useKeyboardInput hook.
 */
export interface UseKeyboardInputProps {
  /** Current interaction mode (navigate or search). */
  mode: AppMode;

  /** Whether the help overlay is currently visible. */
  showHelp: boolean;

  /** Whether the kill confirmation dialog is active. */
  confirmKill: boolean;

  /** Current search filter string. */
  searchQuery: string;

  /** Currently selected port entry (null if list is empty). */
  selectedPort: PortEntry | null;

  /** Number of items in the filtered ports list (for boundary clamping). */
  filteredPortsLength: number;

  // --- Action callbacks (all state mutations delegated to parent) ---

  /** Exit the application. */
  exit: () => void;

  /** Execute kill on the selected port. */
  executeKill: () => void;

  /** Toggle help overlay visibility. */
  toggleHelp: () => void;

  /** Close the help overlay. */
  closeHelp: () => void;

  /** Set kill confirmation dialog state. */
  setConfirmKill: (value: boolean) => void;

  /** Set the current mode (navigate or search). */
  setMode: (mode: AppMode) => void;

  /** Set the search query string. */
  setSearchQuery: (query: string | ((prev: string) => string)) => void;

  /** Move selection up one row. */
  moveUp: () => void;

  /** Move selection down one row. */
  moveDown: () => void;

  /** Manually refresh the port list. */
  refresh: () => void;
}

/**
 * Custom hook that handles all keyboard input for the application.
 *
 * Implements a priority-based input handler:
 * 1. Global shortcuts (Ctrl+C, Ctrl+K) - always active
 * 2. Help toggle / help overlay catch-all
 * 3. Kill confirmation dialog
 * 4. Navigate mode bindings
 * 5. Search mode bindings
 *
 * This hook is a pure extraction of the useInput logic from app.tsx (lines 203-329).
 * It delegates all state mutations back to the parent via callbacks, maintaining
 * the single-source-of-truth state architecture.
 */
export function useKeyboardInput(props: UseKeyboardInputProps) {
  const {
    mode,
    showHelp,
    confirmKill,
    searchQuery,
    selectedPort,
    exit,
    executeKill,
    toggleHelp,
    closeHelp,
    setConfirmKill,
    setMode,
    setSearchQuery,
    moveUp,
    moveDown,
    refresh,
  } = props;

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
      toggleHelp();
      return;
    }

    // --- Help overlay catch-all ---
    // When the help overlay is open it acts as a modal: any keypress (except the
    // global shortcuts already handled above) dismisses it. This mirrors standard
    // modal/overlay UX and means the user does not need to memorise a specific close key.
    if (showHelp) {
      closeHelp();
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
        moveUp();
        return;
      }
      // Down arrow / j — move selection down, clamped at bottom of list
      if (key.downArrow || input === 'j') {
        moveDown();
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
        moveUp();
        return;
      }
      // Down arrow — same as above but downward
      if (key.downArrow) {
        moveDown();
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
}
