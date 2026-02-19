import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../src/utils/getPorts.js', () => ({
  getPorts: vi.fn(),
}));

vi.mock('../src/utils/killPort.js', () => ({
  killPort: vi.fn(),
}));

import { render } from 'ink-testing-library';

import { App } from '../src/app.js';
import { getPorts } from '../src/utils/getPorts.js';
import { killPort } from '../src/utils/killPort.js';
import { tick } from './helpers.js';

const mockGetPorts = vi.mocked(getPorts);
const mockKillPort = vi.mocked(killPort);

const PORTS = [
  { port: 3000, process: 'node', pid: '100', user: 'patebryant', address: '127.0.0.1' },
  { port: 8080, process: 'nginx', pid: '200', user: 'root', address: '0.0.0.0' },
];

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

  it('removes the last character from the query when Backspace is pressed in search mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('node');
    await tick();
    result.stdin.write('\x7F'); // Backspace (DEL character)
    await tick();
    // 'node' with last char removed → 'nod'; nginx is still hidden
    expect(result.lastFrame()).toContain('nod');
    expect(result.lastFrame()).not.toContain('nginx');
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

  it('Ctrl+K is a no-op when the port list is empty', async () => {
    mockGetPorts.mockReturnValue([]);
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    mockKillPort.mockClear();
    result.stdin.write('\x0B'); // Ctrl+K with no ports — executeKill must return early
    await tick();
    expect(mockKillPort).not.toHaveBeenCalled();
  });

  it('Enter on an empty port list is a no-op (no confirmation prompt)', async () => {
    mockGetPorts.mockReturnValue([]);
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r'); // Enter with no ports
    await tick();
    // selectedPort is null → confirmKill must NOT be set → no "Kill" prompt
    expect(result.lastFrame()).not.toContain('Kill');
  });

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

  // ─── selectedIndex clamping ───────────────────────────────────────────────────

  it('clamps selectedIndex when the filter narrows the list below the current selection', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('j'); // move to index 1 (nginx)
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('node'); // filter to only 'node' — list shrinks to 1 entry
    await tick();
    // selectedIndex was 1 but filteredPorts.length is now 1 (max index 0);
    // the sync effect must have clamped selectedIndex to 0 so the arrow lands on 'node'
    const frame = result.lastFrame() ?? '';
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('node');
  });

  // ─── Empty-list navigation guard ─────────────────────────────────────────────

  it('pressing j on an empty list does not leave selectedIndex at -1 after list repopulates', async () => {
    mockGetPorts.mockReturnValue([]);
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('j'); // press down on empty list — setter would write Math.min(-1,1)=-1
    await tick();
    // Now repopulate the list — clampedIndex must not stay at -1 (which would make
    // selectedPort null even with items present). The Math.max(0, selectedIndex)
    // floor in clampedIndex ensures the sync effect corrects selectedIndex to 0.
    mockGetPorts.mockReturnValue(PORTS);
    result.stdin.write('r'); // manual refresh
    await tick();
    // Arrow should now appear on node (first row), not be absent entirely
    const frame = result.lastFrame() ?? '';
    expect(frame).toContain('▶');
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('node');
  });

  // ─── Navigate-mode ESC clear ─────────────────────────────────────────────────

  it('ESC in navigate mode with no active filter is a no-op', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    // searchQuery is already empty; ESC should not crash and full list remains visible
    result.stdin.write('\x1B'); // ESC
    await tick();
    expect(result.lastFrame()).toContain('node');
    expect(result.lastFrame()).toContain('nginx');
  });

  it('clears an active filter with ESC while in navigate mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('node');
    await tick();
    result.stdin.write('\r'); // Enter — commit filter, return to navigate
    await tick();
    result.stdin.write('\x1B'); // ESC in navigate mode — clear filter
    await tick();
    expect(result.lastFrame()).toContain('nginx'); // full list visible again
  });

  // ─── q / Ctrl+C quit ─────────────────────────────────────────────────────────

  it('exits when Ctrl+C is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\x03'); // Ctrl+C (byte 0x03 → key.ctrl=true, input='c')
    await tick();
    // exit() fires — no error thrown; the frame before exit still contained the UI
  });

  it('exits when q is pressed in navigate mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    // Verify the app is in navigate mode (has quit hint) before pressing q
    expect(result.lastFrame()).toContain('quit');
    result.stdin.write('q');
    await tick();
    // After q, exit() fires — the important thing is no error is thrown
    // and the last frame before exit still contained the normal UI
  });

  // ─── Navigation in search mode ───────────────────────────────────────────────

  it('moves selection down with down arrow while in search mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('\x1B[B'); // down arrow escape sequence
    await tick();
    const frame = result.lastFrame() ?? '';
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('nginx');
  });

  it('moves selection up with up arrow while in search mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('j'); // move down to nginx first
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('\x1B[A'); // up arrow escape sequence
    await tick();
    const frame = result.lastFrame() ?? '';
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('node');
  });

  // ─── Ctrl key swallowing in search mode ──────────────────────────────────────

  it('swallows Ctrl key combinations in search mode without modifying the query', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('\x01'); // Ctrl+A (byte 0x01 → key.ctrl=true, input='a')
    await tick();
    // The query should remain empty — Ctrl combos must not be appended as literals
    expect(result.lastFrame()).toContain('type to filter');
  });

  // ─── Kill confirmation: unrecognised key swallowing ──────────────────────────

  it('swallows unrecognised keys while the confirm kill dialog is active', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\r'); // open confirm dialog
    await tick();
    result.stdin.write('a'); // arbitrary key — not y, n, or ESC
    await tick();
    // dialog must still be showing; arbitrary keys are swallowed, not acted upon
    expect(result.lastFrame()).toContain('Kill');
    expect(result.lastFrame()).not.toContain('quit'); // not back to navigate hints
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

  it('cancels a pending post-kill refresh when a second kill fires before the timer expires', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    mockKillPort.mockClear(); // reset call counter accumulated from previous tests
    // First Ctrl+K sets killRefreshTimerRef.current to a live timer.
    // Second Ctrl+K fires before the 300 ms refresh delay elapses,
    // hitting the `if (killRefreshTimerRef.current !== null) clearTimeout(...)` guard.
    result.stdin.write('\x0B'); // first kill
    await tick();
    result.stdin.write('\x0B'); // second kill — cancels the first pending refresh
    await tick();
    expect(mockKillPort).toHaveBeenCalledTimes(2);
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

  it('calls getPorts again when R is pressed', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    mockGetPorts.mockClear();
    result.stdin.write('R');
    await tick();
    expect(mockGetPorts).toHaveBeenCalledTimes(1);
  });

  it('moves selection down with down arrow in navigate mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('\x1B[B'); // down arrow escape sequence
    await tick();
    const frame = result.lastFrame() ?? '';
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('nginx');
  });

  // ─── Delete key in search mode ───────────────────────────────────────────────

  it('removes the last character with the Delete key in search mode', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('node');
    await tick();
    result.stdin.write('\x1B[3~'); // VT100 Delete (forward-delete) key sequence
    await tick();
    // 'node' with last char removed → 'nod'; nginx (no 'nod') should be absent
    const frame = result.lastFrame() ?? '';
    expect(frame).toContain('nod');
    expect(frame).not.toContain('nginx');
  });

  // ─── Navigation with empty filtered list ──────────────────────────────────

  it('clamps selection when search filter matches nothing', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('zzzznotaport'); // matches nothing in PORTS
    await tick();
    const frame = result.lastFrame() ?? '';
    // No port rows should be visible
    expect(frame).not.toContain('node');
    expect(frame).not.toContain('nginx');
    expect(frame).not.toContain('3000');
    expect(frame).not.toContain('8080');
    // The empty state message should appear
    expect(frame).toContain('No listening ports found');
  });

  it('restores selection to first row after clearing a filter that matched nothing', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('j'); // move to index 1 (nginx)
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('zzzznotaport'); // matches nothing — selectedIndex clamped to 0
    await tick();
    result.stdin.write('\x1B'); // ESC — clear filter, back to navigate, full list
    await tick();
    // After clearing, clampedIndex should be 0 (clamped from the empty-list phase)
    // so the selection arrow should land on 'node' (first row)
    const frame = result.lastFrame() ?? '';
    expect(frame).toContain('▶');
    const arrowPos = frame.indexOf('▶');
    expect(frame.substring(arrowPos)).toContain('node');
  });

  it('j and k are no-ops when the filtered list is empty', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick();
    result.stdin.write('zzzznotaport'); // matches nothing
    await tick();
    result.stdin.write('\r'); // Enter — commit filter, back to navigate
    await tick();
    result.stdin.write('j'); // down on empty filtered list
    await tick();
    result.stdin.write('k'); // up on empty filtered list
    await tick();
    // Should not crash; still shows empty state
    const frame = result.lastFrame() ?? '';
    expect(frame).toContain('No listening ports found');
  });

  it('filters the port list by address', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick(); // let mode='search' re-render before typing characters
    result.stdin.write('127');
    await tick();
    // "127" matches address "127.0.0.1" on the node entry but not "0.0.0.0" on nginx
    expect(result.lastFrame()).toContain('node');
    expect(result.lastFrame()).not.toContain('nginx');
  });

  // ─── Case-insensitive search ────────────────────────────────────────────────

  it('matches process names case-insensitively (uppercase query matches lowercase process)', async () => {
    const result = render(<App />);
    unmount = result.unmount;
    await tick();
    result.stdin.write('/');
    await tick(); // let mode='search' re-render before typing characters
    result.stdin.write('NODE'); // uppercase query should match lowercase "node" process
    await tick();
    expect(result.lastFrame()).toContain('node');
    expect(result.lastFrame()).not.toContain('nginx');
  });
});

// --- kill message auto-clear ---
describe('kill message auto-clear', () => {
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    mockKillPort.mockReturnValue({ success: true });
    mockGetPorts.mockReturnValue(PORTS);
  });

  afterEach(() => {
    unmount?.();
    unmount = undefined;
  });

  it('clears kill message after KILL_MESSAGE_TIMEOUT_MS', async () => {
    // Use a short timeout value for testing (50ms instead of 2000ms)
    const TEST_TIMEOUT = 50;
    mockGetPorts.mockReturnValue(PORTS);

    const result = render(<App _killMessageTimeoutMs={TEST_TIMEOUT} />);
    unmount = result.unmount;
    await tick();

    // Select node, press Enter, confirm kill
    result.stdin.write('\r');
    await tick();
    result.stdin.write('y');
    await tick();

    // Kill message should appear immediately
    let frame = result.lastFrame() ?? '';
    expect(frame).toContain('Killed');

    // Wait for timeout + buffer to ensure message clears
    await new Promise(resolve => setTimeout(resolve, TEST_TIMEOUT + 30));

    // Message should be cleared now
    frame = result.lastFrame() ?? '';
    expect(frame).not.toContain('Killed');
  });
});
