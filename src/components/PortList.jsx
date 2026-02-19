import React from 'react';
import { Box, Text } from 'ink';
import { PortRow, COL_PORT, COL_PROCESS, COL_PID } from './PortRow.jsx';

export function PortList({ ports, selectedIndex }) {
  const portHeader = 'PORT'.padEnd(COL_PORT);
  const processHeader = 'PROCESS'.padEnd(COL_PROCESS);
  const pidHeader = 'PID'.padEnd(COL_PID);

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text>{'  '}</Text>
        <Text bold color="gray">{portHeader}</Text>
        <Text bold color="gray">{processHeader}</Text>
        <Text bold color="gray">{pidHeader}</Text>
        <Text bold color="gray">ADDRESS</Text>
      </Box>
      {ports.length === 0 ? (
        <Box paddingX={1}>
          <Text dimColor>No listening ports found.</Text>
        </Box>
      ) : (
        ports.map((port, i) => (
          <PortRow
            key={`${port.pid}-${port.port}-${port.address}`}
            port={port}
            isSelected={i === selectedIndex}
          />
        ))
      )}
    </Box>
  );
}
