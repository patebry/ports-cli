/**
 * Displays the current search/filter state with visual feedback.
 *
 * This component is read-only — it renders the current value and active state
 * passed down from App, but does not manage any input itself. The actual
 * character capture happens in App via Ink's useInput hook when search mode
 * is active.
 */
import React from 'react';
import { Box, Text } from 'ink';

/**
 * Props for the SearchBar component.
 */
interface SearchBarProps {
  /** The current filter string typed by the user. Empty string means no filter. */
  value: string;
  /** Whether the app is currently in search mode (i.e. the user pressed "/" to start filtering). */
  isActive: boolean;
}

/**
 * Renders the search/filter bar below the header.
 *
 * Provides three distinct visual states so the user always knows the filter
 * status at a glance without needing to read text:
 * - **Active + value**: cyan border, shows typed text with a simulated cursor
 * - **Active + empty**: cyan border, shows a dimmed placeholder hint with cursor
 * - **Inactive + value**: yellow border, shows the active filter in yellow text
 * - **Inactive + empty**: gray border, shows a dimmed "to search" hint
 */
export function SearchBar({ value, isActive }: SearchBarProps) {
  return (
    // Three-state border color communicates filter status at a glance:
    //   cyan   — search mode is active; the user is currently typing
    //   yellow — a filter is applied but focus has returned to navigate mode
    //   gray   — no filter set, search mode inactive
    <Box borderStyle="single" borderColor={isActive ? 'cyan' : value ? 'yellow' : 'gray'} paddingX={1}>
      <Text color={isActive ? 'cyan' : 'gray'}>{'/ '}</Text>
      {isActive
        ? value
          // Active with text: render the typed value followed by a block cursor.
          // Ink does not expose a real terminal text cursor, so the "█" character
          // manually simulates one. Coloring it cyan makes it visually distinct
          // from the typed text.
          ? <Text>{value}<Text color="cyan">█</Text></Text>
          // Active but empty: show the placeholder hint so the user knows what to do,
          // with the cursor to confirm input focus is here.
          : <Text dimColor>type to filter...<Text color="cyan">█</Text></Text>
        : value
          // Inactive with a filter value: yellow text signals an active filter is
          // narrowing the list even though search mode is not focused.
          ? <Text color="yellow">{value}</Text>
          // Inactive and empty: minimal hint so the user knows "/" opens search.
          : <Text dimColor>to search</Text>
      }
    </Box>
  );
}
