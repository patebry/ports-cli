/**
 * CLI entry point for ports-cli.
 *
 * Invoking this file boots the Ink runtime, which takes over the terminal:
 * it switches to raw mode (disabling line buffering and echo), opens an
 * alternate screen buffer (so the UI disappears cleanly on exit), and
 * begins a React render loop driven by stdin events. Cleanup — restoring
 * the terminal to its original state — is handled automatically by Ink
 * when the process exits.
 */
import { render } from 'ink';
import { App } from '../src/app.js';

// Ink's render() is analogous to ReactDOM.render(): it mounts the component
// tree into the terminal viewport and begins the event loop that drives
// re-renders in response to state changes and keypresses.
render(<App />);
