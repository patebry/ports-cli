import React from 'react';
import { Box, Text } from 'ink';

interface SearchBarProps {
  value: string;
  isActive: boolean;
}

export function SearchBar({ value, isActive }: SearchBarProps) {
  return (
    <Box borderStyle="single" borderColor={isActive ? 'cyan' : value ? 'yellow' : 'gray'} paddingX={1}>
      <Text color={isActive ? 'cyan' : 'gray'}>{'/ '}</Text>
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
