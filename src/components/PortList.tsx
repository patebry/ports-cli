/**
 * Renders the full port table: column headers followed by all port rows.
 *
 * Delegates individual row rendering to PortRow and imports the shared
 * COL_* constants from it to guarantee header and row columns stay aligned.
 */
import React from 'react';
import { Box, Text, useStdout } from 'ink';
import type { PortEntry } from '../types.js';
import { PortRow, COL_PORT, COL_PID, COL_USER, UNSELECTED_PREFIX } from './PortRow.js';

/** Fallback terminal width when stdout.columns is not available. */
const DEFAULT_TERMINAL_WIDTH = 80;
/** Width of the row prefix glyph ("  " or "▶ ") in characters. */
const ROW_PREFIX_WIDTH = 2;
/** Minimum characters reserved for the ADDRESS column at the right edge. */
const ADDRESS_COL_MIN_WIDTH = 20;
/** Minimum character width for the PROCESS column before it starts truncating. */
const MIN_PROCESS_COL_WIDTH = 16;
/** Maximum character width for the PROCESS column on very wide terminals. */
const MAX_PROCESS_COL_WIDTH = 40;

/**
 * UI overhead constants for viewport calculation.
 * These account for non-port-row UI elements that consume vertical space.
 */
const SEARCH_BAR_HEIGHT = 3;  // Border + padding + content
const HEADER_ROW_HEIGHT = 1;  // Column headers
const STATUS_BAR_HEIGHT = 1;  // Bottom status bar
const BUFFER_HEIGHT = 1;       // Prevents content from touching bottom edge
const TOTAL_UI_OVERHEAD = SEARCH_BAR_HEIGHT + HEADER_ROW_HEIGHT + STATUS_BAR_HEIGHT + BUFFER_HEIGHT;

/**
 * Calculates the dynamic width for the PROCESS column based on terminal width.
 *
 * The PROCESS column receives whatever space remains after allocating fixed
 * widths for PORT, USER, PID, and ADDRESS columns, clamped between min/max bounds.
 *
 * @param terminalWidth - Current terminal width in characters (from stdout.columns)
 * @returns Character width for PROCESS column, clamped to [MIN_PROCESS_COL_WIDTH, MAX_PROCESS_COL_WIDTH]
 */
function calculateProcessColWidth(terminalWidth: number): number {
  // Allocate space: row prefix (2) + PORT + USER + PID + ADDRESS reserve
  const reserved = ROW_PREFIX_WIDTH + COL_PORT + COL_USER + COL_PID + ADDRESS_COL_MIN_WIDTH;
  const available = terminalWidth - reserved;

  // Clamp to min/max bounds so column doesn't become unusably narrow or wastefully wide
  return Math.min(MAX_PROCESS_COL_WIDTH, Math.max(MIN_PROCESS_COL_WIDTH, available));
}

/**
 * Props for the PortList component.
 */
interface PortListProps {
  /** The list of port entries to render, already filtered and sorted by App. */
  ports: PortEntry[];
  /** Index into `ports` of the currently selected row. */
  selectedIndex: number;
}

/**
 * Renders the column header row and the full list of port entry rows.
 *
 * Handles the empty state when no ports are found, which can mean either
 * no servers are running on this machine or that lsof failed silently
 * (e.g. due to permissions). The message is intentionally neutral to cover
 * both cases without misleading the user.
 *
 * Implements a scrolling viewport that keeps the selected item visible:
 * calculates how many rows fit in the terminal and only renders that window
 * of ports, centered around the selection when possible.
 */
export function PortList({ ports, selectedIndex }: PortListProps): React.JSX.Element {
  const { stdout } = useStdout();
  // Reserve space for the row prefix (2), PORT, USER, PID, and a ~20-char
  // ADDRESS column at the end. Whatever remains goes to PROCESS so it expands
  // naturally on wider terminals instead of truncating at a fixed character limit.
  const colProcess = calculateProcessColWidth(stdout?.columns ?? DEFAULT_TERMINAL_WIDTH);

  // Calculate how many port rows can fit in the terminal by subtracting
  // UI overhead (search bar, header, status bar, buffer) from available rows.
  const terminalRows = stdout?.rows ?? 24; // Fallback to 24 if rows unavailable
  const maxVisiblePorts = Math.max(1, terminalRows - TOTAL_UI_OVERHEAD);

  // Calculate the visible window of ports to display.
  // Strategy: keep the selected item roughly centered in the viewport when scrolling.
  let startIndex = 0;
  let endIndex = ports.length;

  if (ports.length > maxVisiblePorts) {
    // Try to center the selected item in the viewport
    const halfWindow = Math.floor(maxVisiblePorts / 2);
    startIndex = Math.max(0, selectedIndex - halfWindow);
    endIndex = startIndex + maxVisiblePorts;

    // If we're near the end, adjust to show the last N ports
    if (endIndex > ports.length) {
      endIndex = ports.length;
      startIndex = Math.max(0, endIndex - maxVisiblePorts);
    }
  }

  const visiblePorts = ports.slice(startIndex, endIndex);

  // Headers use the same widths as PortRow so column labels always sit
  // directly above their corresponding data values.
  const portHeader = 'PORT'.padEnd(COL_PORT);
  const processHeader = 'PROCESS'.padEnd(colProcess);
  const userHeader = 'USER'.padEnd(COL_USER);
  const pidHeader = 'PID'.padEnd(COL_PID);

  return (
    <Box flexDirection='column'>
      <Box paddingX={1}>
        <Text>{UNSELECTED_PREFIX}</Text>
        <Text bold color='gray'>{portHeader}</Text>
        <Text bold color='gray'>{processHeader}</Text>
        <Text bold color='gray'>{userHeader}</Text>
        <Text bold color='gray'>{pidHeader}</Text>
        <Text bold color='gray'>ADDRESS</Text>
      </Box>
      {ports.length === 0 ? (
        // Empty state: shown when the filtered or unfiltered port list is empty.
        // Zero ports could mean no servers are currently listening, OR that
        // lsof exited without output (e.g. insufficient permissions). Keeping
        // the message generic avoids a false "no servers running" claim.
        <Box paddingX={1}>
          <Text dimColor>No listening ports found.</Text>
        </Box>
      ) : (
        visiblePorts.map((port, i) => {
          // The actual index in the full ports array (not the visible slice)
          const actualIndex = startIndex + i;
          return (
            <PortRow
              // Key combines pid, port number, and address because port number
              // alone is not unique — two processes can bind the same port number
              // on different interfaces (e.g. 0.0.0.0:3000 and 127.0.0.1:3000).
              // All three fields together form a stable, unique identifier.
              key={`${port.pid}-${port.port}-${port.address}`}
              port={port}
              isSelected={actualIndex === selectedIndex}
              colProcess={colProcess}
            />
          );
        })
      )}
    </Box>
  );
}
