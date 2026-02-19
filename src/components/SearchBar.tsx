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
 * Renders a single-line title + search bar.
 *
 * Combines the app name with the filter state so both fit on one row,
 * saving the vertical space the old bordered Header + bordered SearchBar used.
 *
 * Visual states for the search portion:
 * - **Active + value**: cyan "/" and typed text with a simulated cursor
 * - **Active + empty**: cyan "/", dimmed placeholder, cursor
 * - **Inactive + value**: yellow "/" and value — signals an active filter
 * - **Inactive + empty**: gray "/", dimmed "to search" hint
 */
export function SearchBar({ value, isActive }: SearchBarProps) {
  return (
    <Box borderStyle="round" borderColor={isActive ? 'cyan' : value ? 'yellow' : 'gray'} paddingX={1}>
      <Text bold color="cyan">ports</Text>
      <Text color={isActive ? 'cyan' : value ? 'yellow' : 'gray'}>{'  / '}</Text>
      {isActive
        ? value
          ? <Text>{value}<Text color="cyan">█</Text></Text>
          : <Text dimColor>type to filter...<Text color="cyan">█</Text></Text>
        : value
          ? <Text color="yellow">{value}</Text>
          : <Text dimColor>to search</Text>
      }
    </Box>
  );
}
