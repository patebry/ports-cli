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
      {/* Each key label is manually padded to a fixed width with trailing spaces.
          Ink's Text component does not support CSS-style column layouts, so
          fixed-width string literals are the only way to achieve visual alignment
          between the key column and the description column. */}
      <Text><Text color="cyan" bold>{'↑ / k          '}</Text>Move up</Text>
      <Text><Text color="cyan" bold>{'↓ / j          '}</Text>Move down</Text>
      <Text><Text color="cyan" bold>{'enter          '}</Text>Kill selected port (with confirm)</Text>
      <Text><Text color="cyan" bold>{'ctrl+k         '}</Text>Kill selected port (no confirm)</Text>
      <Text><Text color="cyan" bold>{'/ + type       '}</Text>Filter by name, port, or address</Text>
      <Text><Text color="cyan" bold>{'ESC            '}</Text>Clear filter / exit search</Text>
      <Text><Text color="cyan" bold>{'r / R          '}</Text>Refresh port list</Text>
      <Text><Text color="cyan" bold>{'?              '}</Text>Toggle this help</Text>
      <Text><Text color="cyan" bold>{'q              '}</Text>Quit</Text>
      <Text><Text color="cyan" bold>{'ctrl+c         '}</Text>Quit</Text>
      <Text> </Text>
      {/* App handles closure: any keypress while showHelp is true dismisses
          the overlay, so no dedicated close key is needed. */}
      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}
