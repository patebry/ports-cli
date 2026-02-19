import React from 'react';
import { Box, Text } from 'ink';
import { PortEntry } from '../utils/getPorts.js';

interface KillMessage {
  type: 'success' | 'error';
  text: string;
}

interface StatusBarProps {
  mode: 'navigate' | 'search';
  confirmKill: boolean;
  killMessage: KillMessage | null;
  selectedPort: PortEntry | null;
}

export function StatusBar({ mode, confirmKill, killMessage, selectedPort }: StatusBarProps) {
  // Confirm kill state takes priority
  if (confirmKill && selectedPort) {
    return (
      <Box paddingX={1}>
        <Text color="red">Kill </Text>
        <Text bold>{selectedPort.process}</Text>
        <Text color="red">:{selectedPort.port}?  </Text>
        <Text color="green">y </Text>
        <Text dimColor>confirm  </Text>
        <Text color="gray">ESC </Text>
        <Text dimColor>cancel</Text>
      </Box>
    );
  }

  const rightContent = killMessage
    ? <Text color={killMessage.type === 'success' ? 'green' : 'red'}>{killMessage.text}</Text>
    : selectedPort
    ? <Text dimColor>{selectedPort.process}:{selectedPort.port}</Text>
    : null;

  const hints = mode === 'search'
    ? <Text dimColor>type to filter  <Text color="cyan">↑↓/j k</Text> navigate  <Text color="cyan">enter</Text> done  <Text color="cyan">ESC</Text> clear</Text>
    : <Text dimColor><Text color="cyan">↑↓/j k</Text> navigate  <Text color="cyan">/</Text> search  <Text color="cyan">enter</Text> kill  <Text color="cyan">r</Text> refresh  <Text color="cyan">?</Text> help  <Text color="cyan">q</Text> quit</Text>;

  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Box>{hints}</Box>
      <Box>{rightContent}</Box>
    </Box>
  );
}
