import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../src/utils/getPorts.js', () => ({
  getPorts: vi.fn(),
}));

vi.mock('../src/utils/killPort.js', () => ({
  killPort: vi.fn(),
}));

import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../src/app.js';
import { getPorts } from '../src/utils/getPorts.js';
import { killPort } from '../src/utils/killPort.js';

const mockGetPorts = vi.mocked(getPorts);
const mockKillPort = vi.mocked(killPort);

const PORTS = [
  { port: 3000, process: 'node', pid: '100', address: '127.0.0.1' },
  { port: 8080, process: 'nginx', pid: '200', address: '0.0.0.0' },
];

/**
 * Wait for one macro-task cycle so React 18's MessageChannel-based scheduler
 * can flush pending work.
 *
 * Two separate uses:
 * 1. Called BEFORE stdin.write() to let `useInput`'s useEffect fire.
 *    The effect calls setRawMode(true) which registers stdin's 'readable'
 *    listener. Without this first tick, stdin.write() is silently dropped
 *    because no one is listening yet.
 * 2. Called AFTER stdin.write() to let the resulting React state updates
 *    re-render before we read lastFrame().
 *
 * Note: vi.useFakeTimers() must NOT be active — it prevents React's internal
 * scheduler (which uses real setTimeout/MessageChannel) from firing.
 */
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 10));

describe('App', () => {
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    mockGetPorts.mockReturnValue(PORTS);
    mockKillPort.mockReturnValue({ success: true });
  });

  afterEach(() => {
    // Unmount to stop the 2-second lsof polling interval between tests.
    unmount?.();
    unmount = undefined;
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  it('renders the port list from getPorts', () => {
    const result = render(<App />);
    unmount = result.unmount;
    expect(result.lastFrame()).toContain('3000');
    expect(result.lastFrame()).toContain('node');
    expect(result.lastFrame()).toContain('8080');
    expect(result.lastFrame()).toContain('nginx');
  });

  it('renders empty state when no ports are available', () => {
    mockGetPorts.mockReturnValue([]);
    const result = render(<App />);
    unmount = result.unmount;
    expect(result.lastFrame()).toContain('No listening ports found');
  });

  it('renders the selection indicator on the first row by default', () => {
    const result = render(<App />);
    unmount = result.unmount;
    expect(result.lastFrame()).toContain('▶');
  });

  it('renders the app header', () => {
    const result = render(<App />);
    unmount = result.unmount;
    expect(result.lastFrame()).toContain('ports');
  });

  it('renders navigate-mode keyboard hints', () => {
    const result = render(<App />);
    unmount = result.unmount;
    expect(result.lastFrame()).toContain('search');
    expect(result.lastFrame()).toContain('quit');
  });

  // ─── Search mode ────────────────────────────────────────────────────────────

  it('enters search mode when / is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick(); // wait for useInput's useEffect to register the stdin listener
    result.stdin.write('/');
    await tick(); // wait for React to re-render with new mode
    expect(result.lastFrame()).toContain('type to filter');
  });

  it('shows search-mode hints while in search mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    expect(result.lastFrame()).toContain('clear');
  });

  it('filters the port list by process name', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick(); // let mode='search' re-render before typing characters
    result.stdin.write('node');
    await tick();
    expect(result.lastFrame()).toContain('node');
    expect(result.lastFrame()).not.toContain('nginx');
  });

  it('filters the port list by port number', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick(); // let mode='search' re-render before typing characters
    result.stdin.write('8080');
    await tick();
    expect(result.lastFrame()).toContain('8080');
    expect(result.lastFrame()).not.toContain('3000');
  });

  it('clears filter and exits search mode on ESC', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    result.stdin.write('node');
    await tick();
    result.stdin.write('\x1B'); // ESC
    await tick();
    expect(result.lastFrame()).toContain('nginx'); // full list restored
  });

  it('returns to navigate mode when Enter is pressed in search mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('\r'); // Enter
    await tick();
    expect(result.lastFrame()).toContain('quit'); // navigate hints visible
  });

  // ─── Kill confirmation ───────────────────────────────────────────────────────

  it('shows the kill confirmation prompt when Enter is pressed on a port', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r'); // Enter
    await tick();
    expect(result.lastFrame()).toContain('Kill');
    expect(result.lastFrame()).toContain('node');
    expect(result.lastFrame()).toContain('3000');
  });

  it('dismisses the confirm dialog on ESC', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r');
    await tick();
    result.stdin.write('\x1B'); // ESC
    await tick();
    expect(result.lastFrame()).toContain('quit'); // back to normal hints
  });

  it('dismisses the confirm dialog on n', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r');
    await tick();
    result.stdin.write('n');
    await tick();
    expect(result.lastFrame()).not.toContain('Kill node');
  });

  it('calls killPort with the selected PID when y is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r');
    await tick();
    result.stdin.write('y');
    await tick();
    expect(mockKillPort).toHaveBeenCalledWith('100');
  });

  it('shows a success message after a successful kill', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r');
    await tick();
    result.stdin.write('y');
    await tick();
    expect(result.lastFrame()).toContain('Killed node');
  });

  it('shows an error message when the kill fails', async () => {
    mockKillPort.mockReturnValue({ success: false, error: 'Permission denied' });
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r');
    await tick();
    result.stdin.write('y');
    await tick();
    expect(result.lastFrame()).toContain('Failed: Permission denied');
  });

  // ─── Help overlay ────────────────────────────────────────────────────────────

  it('opens the help overlay when ? is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('?');
    await tick();
    expect(result.lastFrame()).toContain('Keybindings');
  });

  it('closes the help overlay when any key is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('?');
    await tick();
    result.stdin.write(' '); // any key
    await tick();
    expect(result.lastFrame()).not.toContain('Keybindings');
  });

  // ─── Navigation ──────────────────────────────────────────────────────────────

  it('moves selection down with j', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('j');
    await tick();
    const frame = result.lastFrame() ?? '';
    // After moving down, the selected row should be nginx (port 8080)
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('nginx');
  });

  it('does not move selection above row 0', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('k'); // already at top; should stay on node
    await tick();
    const frame = result.lastFrame() ?? '';
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('node');
  });

  // ─── Ctrl+K direct kill ───────────────────────────────────────────────────────

  it('calls killPort directly when Ctrl+K is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\x0B'); // Ctrl+K (character code 11)
    await tick();
    expect(mockKillPort).toHaveBeenCalledWith('100');
  });

  // ─── Manual refresh ───────────────────────────────────────────────────────────

  it('calls getPorts again when r is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    mockGetPorts.mockClear(); // reset call counter after initial mount
    result.stdin.write('r');
    await tick();
    expect(mockGetPorts).toHaveBeenCalledTimes(1);
  });
});
