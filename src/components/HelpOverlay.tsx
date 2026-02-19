/**
 * Modal overlay that displays all keybindings for the application.
 *
 * Rendered on top of the main UI when the user presses "?". Because Ink
 * renders components in document order and does not have a true z-index,
 * the App component conditionally renders this instead of the main layout
 * when showHelp is true, achieving the modal effect.
 */
import React from 'react';
import { Box, Text } from 'ink';

/**
 * Data-driven keybinding list. Adding or renaming a shortcut only requires
 * editing this array — the rendering loop below computes column widths
 * dynamically, so alignment stays correct regardless of label length.
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
 * Kept as a separate component so the full list of keybindings lives in
 * one place — adding or changing a shortcut only requires editing here,
 * with no risk of the overlay falling out of sync with scattered inline hints.
 *
 * "Press any key to close" at the bottom is not handled here — App catches
 * any keypress when showHelp is true and sets it back to false, so this
 * component stays purely presentational.
 */
export function HelpOverlay() {
  return (
    <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="cyan">  Keybindings</Text>
      <Text> </Text>
      {KEYBINDINGS.map(({ key, desc }) => (
        <Text key={key}>
          <Text color="cyan" bold>{key.padEnd(maxKeyLen)}</Text>{'  '}{desc}
        </Text>
      ))}
      <Text> </Text>
      {/* App handles closure: any keypress while showHelp is true dismisses
          the overlay, so no dedicated close key is needed. */}
      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}
