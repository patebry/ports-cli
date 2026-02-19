import React from 'react';
import { Box, Text } from 'ink';

export function Header() {
  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">ports</Text>
      <Text dimColor>  — listening TCP ports</Text>
    </Box>
  );
}
