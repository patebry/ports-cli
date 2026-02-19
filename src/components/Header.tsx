/**
 * Pure presentational component that renders the app title bar.
 *
 * No props, no state — output is always identical. Intended to be rendered
 * once at the top of the layout and never updated.
 */
import React from 'react';
import { Box, Text } from 'ink';

/**
 * Renders the application title bar with the app name and a short descriptor.
 *
 * Displays "ports  — listening TCP ports" inside a rounded border box.
 * The round border style and cyan color establish the visual identity of the
 * app and are intentionally consistent with the SearchBar and HelpOverlay
 * borders to give the UI a cohesive look.
 */
export function Header() {
  return (
    // borderStyle="round" and borderColor="cyan" set the app's brand color;
    // every bordered element in the UI uses cyan to signal interactivity or focus.
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">ports</Text>
      <Text dimColor>  — listening TCP ports</Text>
    </Box>
  );
}
