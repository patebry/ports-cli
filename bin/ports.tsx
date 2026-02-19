/**
 * CLI entry point for ports-cli.
 *
 * Handles --help and --version flags before booting the Ink runtime.
 *
 * Invoking this file without flags boots the Ink runtime, which takes over
 * the terminal: it switches to raw mode (disabling line buffering and echo),
 * opens an alternate screen buffer (so the UI disappears cleanly on exit),
 * and begins a React render loop driven by stdin events. Cleanup — restoring
 * the terminal to its original state — is handled automatically by Ink when
 * the process exits.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const version: string = pkg.version;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`ports-cli v${version}

Interactive TUI for viewing and killing listening TCP ports on macOS.

Usage:
  ports [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

Keybindings:
  j/k, Up/Down    Navigate ports
  /               Search/filter
  x               Kill selected port
  ?               Toggle help overlay
  q               Quit`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(version);
  process.exit(0);
}

// Ink's render() is analogous to ReactDOM.render(): it mounts the component
// tree into the terminal viewport and begins the event loop that drives
// re-renders in response to state changes and keypresses.
const { render } = await import('ink');
const { App } = await import('../src/app.js');

render(<App />);
