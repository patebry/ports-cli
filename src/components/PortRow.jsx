import React from 'react';
import { Box, Text } from 'ink';

const COL_PORT = 8;
const COL_PROCESS = 16;
const COL_PID = 8;

export function PortRow({ port, isSelected }) {
  const portStr = String(port.port).padEnd(COL_PORT);
  const processStr = port.process.slice(0, COL_PROCESS).padEnd(COL_PROCESS);
  const pidStr = String(port.pid).padEnd(COL_PID);
  const addressStr = port.address;

  if (isSelected) {
    return (
      <Box backgroundColor="blue">
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
