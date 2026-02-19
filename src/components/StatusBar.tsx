/**
 * Context-sensitive bottom bar that shows different content based on app state.
 *
 * The right side of the bar cycles through three states in priority order:
 * confirm kill prompt > transient kill feedback > passive port info.
 * The left side always shows mode-appropriate keyboard hints.
 */
import React from 'react';
import { Box, Text } from 'ink';
import { PortEntry } from '../utils/getPorts.js';

/**
 * Represents the result of a kill attempt, shown briefly after an action.
 */
interface KillMessage {
  /** Whether the kill succeeded or failed. Controls text color (green/red). */
  type: 'success' | 'error';
  /** Human-readable description of the outcome, e.g. "Killed nginx:80". */
  text: string;
}

/**
 * Props for the StatusBar component.
 */
interface StatusBarProps {
  /** Current interaction mode. Determines which keyboard hints are shown. */
  mode: 'navigate' | 'search';
  /**
   * Whether the app is waiting for the user to confirm a kill action.
   * When true, the entire status bar is replaced with the confirmation prompt —
   * this is the highest-priority display state.
   */
  confirmKill: boolean;
  /**
   * Transient feedback message after a kill attempt. Shown on the right side
   * of the bar until cleared by App (typically after a short timeout).
   * Null when no recent kill action has occurred.
   */
  killMessage: KillMessage | null;
  /**
   * The currently highlighted port entry, used for passive status display
   * and in the kill confirmation prompt. Null when the list is empty.
   */
  selectedPort: PortEntry | null;
}

/**
 * Renders the bottom status bar with hints and contextual state information.
 *
 * Display priority for the right-hand side (highest to lowest):
 * 1. Kill confirmation prompt — replaces the entire bar; user must decide now
 * 2. Kill result message — transient success/error feedback after an action
 * 3. Selected port info — passive "what's selected" context
 * 4. Empty — nothing to show
 *
 * Hints on the left are always shown but change based on mode because
 * different keys are active in search vs. navigate mode (e.g. typing
 * characters filters in search mode but does nothing in navigate mode).
 */
export function StatusBar({ mode, confirmKill, killMessage, selectedPort }: StatusBarProps) {
  // Confirm kill takes highest priority and replaces the entire bar layout.
  // The user must respond (y or ESC) before any other interaction is possible,
  // so showing anything else here would be distracting and misleading.
  if (confirmKill && selectedPort) {
    return (
      <Box paddingX={1}>
        <Text color="red">Kill </Text>
        <Text bold>{selectedPort.process}</Text>
        <Text color="red">:{selectedPort.port}?  </Text>
        <Text color="green">y </Text>
        <Text dimColor>confirm  </Text>
        <Text color="gray">ESC </Text>
        <Text dimColor>cancel</Text>
      </Box>
    );
  }

  // Right-side content: kill feedback takes priority over passive port info.
  // killMessage is set transiently by App after a kill attempt and cleared
  // after a short delay, so it naturally disappears without user action.
  const rightContent = killMessage
    ? <Text color={killMessage.type === 'success' ? 'green' : 'red'}>{killMessage.text}</Text>
    : selectedPort
    ? <Text dimColor>{selectedPort.process}:{selectedPort.port}</Text>
    : null;

  // Hints change based on mode because the active keyset changes:
  // - In search mode, typing characters goes to the filter; navigation still works.
  // - In navigate mode, typing "/" enters search; "enter" triggers kill.
  const hints = mode === 'search'
    ? <Text dimColor>type to filter  <Text color="cyan">↑↓/j k</Text> navigate  <Text color="cyan">enter</Text> done  <Text color="cyan">ESC</Text> clear</Text>
    : <Text dimColor><Text color="cyan">↑↓/j k</Text> navigate  <Text color="cyan">/</Text> search  <Text color="cyan">enter</Text> kill  <Text color="cyan">r</Text> refresh  <Text color="cyan">?</Text> help  <Text color="cyan">q</Text> quit</Text>;

  return (
    // justifyContent="space-between" pins hints to the left edge and status
    // content to the right edge, making both scannable without crowding.
    <Box justifyContent="space-between" paddingX={1}>
      <Box>{hints}</Box>
      <Box>{rightContent}</Box>
    </Box>
  );
}
