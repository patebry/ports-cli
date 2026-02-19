/**
 * Renders a single port entry row in the port table.
 *
 * Each row displays port number, process name, PID, and address in fixed-width
 * columns. The currently selected row receives a full blue background highlight
 * and a "▶" arrow indicator so it stands out clearly from the rest of the list.
 */
import React from 'react';
import { Box, Text } from 'ink';
// PortEntry is the normalized data shape produced by getPorts.js after lsof
// parsing and IPv6 normalization. Importing from utils keeps the type in one place.
import { PortEntry } from '../utils/getPorts.js';

/**
 * Fixed character widths for each column. These must match the header widths
 * defined in PortList so that header labels and row values remain aligned.
 * Changing any of these values requires a matching change in PortList's headers.
 */
const COL_PORT = 8;
const COL_PROCESS = 16;
const COL_PID = 8;

/**
 * Props for the PortRow component.
 */
interface PortRowProps {
  /** The port entry data to display in this row. */
  port: PortEntry;
  /** Whether this row is the currently focused/selected row in the list. */
  isSelected: boolean;
}

/**
 * Renders one row of the port table.
 *
 * Renders two distinct layouts: a highlighted layout for the selected row
 * (blue background, cyan text, arrow indicator) and a plain layout for all
 * other rows. The column values are padded to fixed widths for alignment.
 */
export function PortRow({ port, isSelected }: PortRowProps) {
  // padEnd() pads each value to its column's fixed character width so all rows
  // line up vertically in a monospace terminal regardless of content length.
  const portStr = String(port.port).padEnd(COL_PORT);
  // slice() truncates long process names before padEnd() to prevent overflow
  // into the next column; a 17-character process name would push PID sideways.
  const processStr = port.process.slice(0, COL_PROCESS).padEnd(COL_PROCESS);
  const pidStr = String(port.pid).padEnd(COL_PID);
  const addressStr = port.address;

  if (isSelected) {
    return (
      // @ts-expect-error — Ink's TypeScript type definitions do not declare
      // backgroundColor as a valid prop on Box, but Ink does support it at
      // runtime via its internal yoga-based renderer. The suppress directive
      // avoids a compile error without altering any behavior.
      // backgroundColor is applied to Box rather than individual Text nodes
      // so the highlight covers the full row width, not just the text cells.
      <Box backgroundColor="blue">
        {/* "▶" provides an unambiguous visual marker of the current selection
            position — more scannable than background color alone. */}
        <Text color="cyan">{'▶ '}</Text>
        <Text color="cyan">{portStr}</Text>
        <Text color="cyan">{processStr}</Text>
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
      <Text>{pidStr}</Text>
      <Text dimColor>{addressStr}</Text>
    </Box>
  );
}

export { COL_PORT, COL_PROCESS, COL_PID };
