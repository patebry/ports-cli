<h1 align="center">ports-cli</h1>

<p align="center">
  Interactive TUI for viewing and killing listening TCP ports on macOS.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ports-cli"><img src="https://img.shields.io/npm/v/ports-cli.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/ports-cli"><img src="https://img.shields.io/npm/dm/ports-cli.svg" alt="monthly downloads"></a>
  <a href="https://github.com/patebryant/ports-cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="node version"></a>
  <img src="https://img.shields.io/badge/platform-macOS-lightgrey.svg" alt="platform">
  <img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg" alt="coverage">
</p>

---

## Demo

```
  ┌ ports ──────────────────────────────────────────────┐
  │                                                     │
  └─────────────────────────────────────────────────────┘
   Port     Address        PID      Process
 > 3000     127.0.0.1      41022    node
   5432     127.0.0.1      1205     postgres
   8080     0.0.0.0        8834     nginx
   8443     127.0.0.1      41022    node
   9090     0.0.0.0        5501     grafana

  ↑↓/jk navigate | enter/x kill | / search | ? help | q quit
```

## Quick Start

Run it directly with npx -- no install required:

```sh
npx ports-cli
```

Or install globally:

```sh
npm install -g ports-cli
```

Then run:

```sh
ports
```

## Features

- **Real-time monitoring** -- port list auto-refreshes every 2 seconds
- **Interactive search** -- filter by port number, address, PID, or process name
- **Kill processes** -- terminate processes with a confirmation prompt, or skip it with `ctrl+k`
- **Vim-style navigation** -- `j`/`k` to move, `g`/`G` to jump to first/last
- **IPv6 normalization** -- `[::1]` maps to `127.0.0.1`, `[::]` maps to `0.0.0.0`, deduplicating entries
- **Viewport scrolling** -- adapts to terminal height, keeps selection visible
- **Help overlay** -- press `?` for a full keybinding reference
- **Zero config** -- no flags, no setup, just run it

## Keybindings

| Key            | Action                                    |
| -------------- | ----------------------------------------- |
| `↑` / `k`      | Move selection up                         |
| `↓` / `j`      | Move selection down                       |
| `g` / `G`      | Jump to first / last                      |
| `enter` / `x`  | Kill selected process (with confirmation) |
| `ctrl+k`       | Kill selected process (skip confirmation) |
| `/`            | Enter search mode                         |
| `ESC`          | Clear search / cancel                     |
| `r` / `R`      | Refresh port list                         |
| `?`            | Toggle help overlay                       |
| `q` / `ctrl+c` | Quit                                      |

## Options

```
ports --help, -h       Show help
ports --version, -v    Show version
```

## How It Works

`ports-cli` runs `lsof -iTCP -sTCP:LISTEN -nP` to discover all processes listening on TCP ports. The raw output is parsed, deduplicated, and normalized (converting IPv6 loopback and wildcard addresses to their IPv4 equivalents). The result is rendered as a full-screen terminal UI using [Ink](https://github.com/vadimdemedes/ink), a React renderer for the terminal. The list refreshes automatically every 2 seconds. Killing a process sends `SIGKILL` to the target PID.

## Requirements

- **macOS** -- relies on `lsof` for port discovery
- **Node.js >= 18**

## Contributing

```sh
git clone https://github.com/patebryant/ports-cli.git
cd ports-cli
npm install
```

Development commands:

```sh
npm run build        # Compile to dist/ports.js
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm test             # Run test suite (189 tests)
npm run coverage     # Run tests with coverage report
```

Built with TypeScript, React 18, Ink 4, esbuild, and Vitest.

## License

[MIT](LICENSE)
