/**
 * Renders a single port entry row in the port table.
 *
 * Each row displays port number, process name, PID, and address in fixed-width
 * columns. The currently selected row receives a full blue background highlight
 * and a "▶" arrow indicator so it stands out clearly from the rest of the list.
 */
import React from 'react';
import { Box, Text } from 'ink';
import type { PortEntry } from '../types.js';

/**
 * Fixed character widths for PORT, PID, and USER columns. These are stable
 * regardless of terminal size: port numbers top out at 5 digits, PIDs at 7,
 * and macOS usernames are typically well under 14 characters.
 */
export const COL_PORT = 8;
export const COL_PID = 8;
export const COL_USER = 14;

const SELECTION_ARROW = '▶ ';

/**
 * Props for the PortRow component.
 */
interface PortRowProps {
  /** The port entry data to display in this row. */
  port: PortEntry;
  /** Whether this row is the currently focused/selected row in the list. */
  isSelected: boolean;
  /**
   * Character width allocated to the PROCESS column. Computed dynamically by
   * PortList based on the current terminal width so the column expands on
   * wider terminals rather than always truncating at a fixed 16-character limit.
   */
  colProcess: number;
}

/**
 * Renders one row of the port table.
 *
 * Renders two distinct layouts: a highlighted layout for the selected row
 * (blue background, cyan text, arrow indicator) and a plain layout for all
 * other rows. The column values are padded to fixed widths for alignment.
 */
export function PortRow({ port, isSelected, colProcess }: PortRowProps) {
  // padEnd() pads each value to its column's fixed character width so all rows
  // line up vertically in a monospace terminal regardless of content length.
  const portStr = String(port.port).padEnd(COL_PORT);
  // slice() truncates long process names before padEnd() to prevent overflow
  // into the next column. colProcess is computed dynamically by PortList based
  // on the current terminal width, so this truncation point grows with the window.
  const processStr = port.process.slice(0, colProcess).padEnd(colProcess);
  const userStr = port.user.slice(0, COL_USER).padEnd(COL_USER);
  const pidStr = String(port.pid).padEnd(COL_PID);
  const addressStr = port.address;

  if (isSelected) {
    return (
      // @ts-expect-error — Ink's BoxProps is a `type` alias (Except<Styles, 'textWrap'>)
      // so it cannot be extended via module augmentation. `backgroundColor` is
      // supported at runtime by Ink's yoga renderer but absent from the type
      // definitions. Applied to Box (not Text) so the highlight covers the full
      // row width rather than only the text content.
      <Box backgroundColor="blue">
        {/* "▶" provides an unambiguous visual marker of the current selection
            position — more scannable than background color alone. */}
        <Text color="cyan">{SELECTION_ARROW}</Text>
        <Text color="cyan">{portStr}</Text>
        <Text color="cyan">{processStr}</Text>
        <Text color="cyan">{userStr}</Text>
        <Text color="cyan">{pidStr}</Text>
        <Text color="cyan">{addressStr}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text>{'  '}</Text>
      <Text>{portStr}</Text>
      <Text>{processStr}</Text>
      <Text dimColor>{userStr}</Text>
      <Text>{pidStr}</Text>
      <Text dimColor>{addressStr}</Text>
    </Box>
  );
}
