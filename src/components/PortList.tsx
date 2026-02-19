/**
 * Renders the full port table: column headers followed by all port rows.
 *
 * Delegates individual row rendering to PortRow and imports the shared
 * COL_* constants from it to guarantee header and row columns stay aligned.
 */
import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { PortEntry } from '../utils/getPorts.js';
import { PortRow, COL_PORT, COL_PID, COL_USER } from './PortRow.js';

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
 */
export function PortList({ ports, selectedIndex }: PortListProps) {
  const { stdout } = useStdout();
  // Reserve space for the row prefix (2), PORT, USER, PID, and a ~20-char
  // ADDRESS column at the end. Whatever remains goes to PROCESS so it expands
  // naturally on wider terminals instead of truncating at a fixed character limit.
  const colProcess = Math.min(40, Math.max(16, (stdout?.columns ?? 80) - 2 - COL_PORT - COL_USER - COL_PID - 20));

  // Headers use the same widths as PortRow so column labels always sit
  // directly above their corresponding data values.
  const portHeader = 'PORT'.padEnd(COL_PORT);
  const processHeader = 'PROCESS'.padEnd(colProcess);
  const userHeader = 'USER'.padEnd(COL_USER);
  const pidHeader = 'PID'.padEnd(COL_PID);

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text>{'  '}</Text>
        <Text bold color="gray">{portHeader}</Text>
        <Text bold color="gray">{processHeader}</Text>
        <Text bold color="gray">{userHeader}</Text>
        <Text bold color="gray">{pidHeader}</Text>
        <Text bold color="gray">ADDRESS</Text>
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
        ports.map((port, i) => (
          <PortRow
            // Key combines pid, port number, and address because port number
            // alone is not unique — two processes can bind the same port number
            // on different interfaces (e.g. 0.0.0.0:3000 and 127.0.0.1:3000).
            // All three fields together form a stable, unique identifier.
            key={`${port.pid}-${port.port}-${port.address}`}
            port={port}
            isSelected={i === selectedIndex}
            colProcess={colProcess}
          />
        ))
      )}
    </Box>
  );
}
