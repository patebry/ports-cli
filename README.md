# ports-cli

An interactive TUI for viewing and killing listening TCP ports on macOS.

## Installation

```sh
npm install -g ports-cli
```

## Usage

```sh
ports
```

The tool launches a full-screen terminal UI that lists all processes currently listening on TCP ports. The list auto-refreshes every 2 seconds.

## Keybindings

| Key | Action |
|---|---|
| `↑` / `k` | Move selection up |
| `↓` / `j` | Move selection down |
| `enter` | Kill selected port (with confirmation) |
| `ctrl+k` | Kill selected port (no confirmation) |
| `/` + type | Filter by name, port number, or address |
| `ESC` | Clear filter / exit search mode |
| `r` / `R` | Refresh port list immediately |
| `?` | Toggle keybinding help overlay |
| `q` / `ctrl+c` | Quit |

## Requirements

- macOS (uses `lsof`)
- Node.js >= 18

## Development

```sh
npm run build      # compile to dist/ports.js
npm run typecheck  # TypeScript type check
npm test           # run test suite
npm run coverage   # run tests with coverage report
```

## Architecture

```
bin/ports.tsx          — CLI entry point (boots Ink runtime)
src/
  app.tsx              — root component; owns all application state
  components/
    SearchBar.tsx      — title + filter state display
    PortList.tsx       — column headers + scrollable port rows
    PortRow.tsx        — single port entry with selection highlight
    StatusBar.tsx      — hints, kill confirmation, kill feedback
    HelpOverlay.tsx    — modal keybinding reference
  utils/
    getPorts.ts        — lsof invocation, parsing, IPv6 normalization
    killPort.ts        — SIGKILL wrapper with PID validation
```

All application state lives in `App`. Child components are purely presentational.

## License

MIT
