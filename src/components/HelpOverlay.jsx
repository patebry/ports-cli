import React from 'react';
import { Box, Text } from 'ink';

export function HelpOverlay() {
  return (
    <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="cyan">  Keybindings</Text>
      <Text> </Text>
      <Text><Text color="cyan" bold>{'↑ / k          '}</Text>Move up</Text>
      <Text><Text color="cyan" bold>{'↓ / j          '}</Text>Move down</Text>
      <Text><Text color="cyan" bold>{'enter          '}</Text>Kill selected port (with confirm)</Text>
      <Text><Text color="cyan" bold>{'ctrl+k         '}</Text>Kill selected port (no confirm)</Text>
      <Text><Text color="cyan" bold>{'/ + type       '}</Text>Filter by name, port, or address</Text>
      <Text><Text color="cyan" bold>{'ESC            '}</Text>Clear filter / exit search</Text>
      <Text><Text color="cyan" bold>{'r / R          '}</Text>Refresh port list</Text>
      <Text><Text color="cyan" bold>{'?              '}</Text>Toggle this help</Text>
      <Text><Text color="cyan" bold>{'q              '}</Text>Quit</Text>
      <Text><Text color="cyan" bold>{'ctrl+c         '}</Text>Quit</Text>
      <Text> </Text>
      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}
