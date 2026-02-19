/**
 * Modal overlay that displays all keybindings for the application.
 *
 * Rendered on top of the main UI when the user presses "?". Because Ink
 * renders components in document order and does not have a true z-index,
 * the App component conditionally appends this below the main layout
 * when showHelp is true, achieving the modal effect.
 */
import React from 'react';
import { Box, Text } from 'ink';

/**
 * Complete list of application keybindings shown in the help overlay.
 *
 * Data-driven design: adding or renaming a shortcut only requires editing
 * this array. The rendering loop computes column widths dynamically, so
 * alignment stays correct regardless of label length.
 *
 * Each entry contains:
 * - key: Visual representation of the keystroke (e.g., "↑ / k", "ctrl+c")
 * - desc: Brief plain-English description of what the key does
 *
 * IMPORTANT: Keep this list in sync with the actual keyboard handler in
 * src/hooks/useKeyboardInput.ts. Changes to keybindings must be reflected here.
 */
const KEYBINDINGS: Array<{ key: string; desc: string }> = [
  { key: '↑ / k',    desc: 'Move up' },
  { key: '↓ / j',    desc: 'Move down' },
  { key: 'enter',    desc: 'Kill selected port (with confirm)' },
  { key: 'ctrl+k',   desc: 'Kill selected port (no confirm)' },
  { key: '/ + type', desc: 'Filter by name, port, or address' },
  { key: 'ESC',      desc: 'Clear filter / exit search' },
  { key: 'r / R',    desc: 'Refresh port list' },
  { key: '?',        desc: 'Toggle this help' },
  { key: 'q',        desc: 'Quit' },
  { key: 'ctrl+c',   desc: 'Quit' },
];

const maxKeyLen = Math.max(...KEYBINDINGS.map(b => b.key.length));

/**
 * Renders the help overlay with a complete keybinding reference.
 *
 * Displayed when the user presses "?" in navigate mode. The overlay acts
 * as a modal: any keypress dismisses it (handled by App's useInput hook).
 *
 * Architecture:
 * - This component is purely presentational
 * - App controls visibility via showHelp state
 * - Closure is handled in app.tsx (any keypress when showHelp=true)
 * - Keybindings are defined in KEYBINDINGS constant for easy maintenance
 *
 * Layout uses Ink's Box with cyan rounded border and proper padding for
 * visual separation from the main port list.
 *
 * @returns Full-screen help overlay with keybinding table
 */
export function HelpOverlay(): React.JSX.Element {
  return (
    <Box borderStyle='round' borderColor='cyan' flexDirection='column' paddingX={2} paddingY={1}>
      <Text bold color='cyan'>  Keybindings</Text>
      <Text> </Text>
      {KEYBINDINGS.map(({ key, desc }) => (
        <Text key={key}>
          <Text color='cyan' bold>{key.padEnd(maxKeyLen)}</Text>{'  '}{desc}
        </Text>
      ))}
      <Text> </Text>
      {/* App handles closure: any keypress while showHelp is true dismisses
          the overlay, so no dedicated close key is needed. */}
      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}
