/**
 * Tests for useKeyboardInput hook.
 *
 * This suite verifies the keyboard handler logic in isolation.
 * Integration tests in app.test.tsx verify end-to-end behavior.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Box } from 'ink';

import { useKeyboardInput, type UseKeyboardInputProps } from '../../src/hooks/useKeyboardInput.js';
import type { AppMode } from '../../src/types.js';
import { tick } from '../helpers.js';

// Test component that renders nothing but sets up the hook
function TestHarness(props: UseKeyboardInputProps) {
  useKeyboardInput(props);
  return <Box />;
}

describe('useKeyboardInput', () => {
  let props: UseKeyboardInputProps;
  let result: ReturnType<typeof render>;

  beforeEach(() => {
    props = {
      mode: 'navigate' as const,
      showHelp: false,
      confirmKill: false,
      searchQuery: '',
      selectedPort: { port: 3000, process: 'node', pid: '100', user: 'test', address: '127.0.0.1' },
      exit: vi.fn(),
      executeKill: vi.fn(),
      toggleHelp: vi.fn(),
      closeHelp: vi.fn(),
      setConfirmKill: vi.fn(),
      setMode: vi.fn(),
      setSearchQuery: vi.fn(),
      moveUp: vi.fn(),
      moveDown: vi.fn(),
      refresh: vi.fn(),
    };
  });

  afterEach(() => {
    if (result) result.unmount();
  });

  // --- Global shortcuts ---

  it('calls exit on Ctrl+C', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('\x03'); // Ctrl+C
    await tick();
    expect(props.exit).toHaveBeenCalledTimes(1);
  });

  it('calls executeKill on Ctrl+K', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('\x0B'); // Ctrl+K
    await tick();
    expect(props.executeKill).toHaveBeenCalledTimes(1);
  });

  // --- Help overlay ---

  it('toggles help on ? in navigate mode', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('?');
    await tick();
    expect(props.toggleHelp).toHaveBeenCalledTimes(1);
  });

  it('closes help on any key when help is visible', async () => {
    result = render(<TestHarness {...props} showHelp={true} />);
    await tick();
    result.stdin.write(' ');
    await tick();
    expect(props.closeHelp).toHaveBeenCalledTimes(1);
  });

  // --- Navigate mode ---

  it('moves up on k', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('k');
    await tick();
    expect(props.moveUp).toHaveBeenCalledTimes(1);
  });

  it('moves down on j', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('j');
    await tick();
    expect(props.moveDown).toHaveBeenCalledTimes(1);
  });

  it('enters search mode on /', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('/');
    await tick();
    expect(props.setMode).toHaveBeenCalledWith('search');
  });

  it('sets confirmKill on Enter when port is selected', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('\r');
    await tick();
    expect(props.setConfirmKill).toHaveBeenCalledWith(true);
  });

  it('does not set confirmKill on Enter when selectedPort is null', async () => {
    result = render(<TestHarness {...props} selectedPort={null} />);
    await tick();
    result.stdin.write('\r');
    await tick();
    expect(props.setConfirmKill).not.toHaveBeenCalled();
  });

  it('refreshes on r', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('r');
    await tick();
    expect(props.refresh).toHaveBeenCalledTimes(1);
  });

  it('exits on q', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('q');
    await tick();
    expect(props.exit).toHaveBeenCalledTimes(1);
  });

  // --- Search mode ---

  it('appends character to search query in search mode', async () => {
    result = render(<TestHarness {...props} mode="search" />);
    await tick();
    result.stdin.write('n');
    await tick();
    const updater = vi.mocked(props.setSearchQuery).mock.calls[0][0];
    expect(typeof updater).toBe('function');
    expect((updater as (prev: string) => string)('existing')).toBe('existingn');
  });

  it('exits search mode on ESC', async () => {
    result = render(<TestHarness {...props} mode="search" />);
    await tick();
    result.stdin.write('\x1B');
    await tick();
    expect(props.setSearchQuery).toHaveBeenCalledWith('');
    expect(props.setMode).toHaveBeenCalledWith('navigate');
  });

  it('removes last character on Backspace in search mode', async () => {
    result = render(<TestHarness {...props} mode="search" />);
    await tick();
    result.stdin.write('\x7F'); // Backspace
    await tick();
    const updater = vi.mocked(props.setSearchQuery).mock.calls[0][0];
    expect(typeof updater).toBe('function');
    expect((updater as (prev: string) => string)('hello')).toBe('hell');
  });

  // --- Kill confirmation ---

  it('executes kill and closes dialog on y', async () => {
    result = render(<TestHarness {...props} confirmKill={true} />);
    await tick();
    result.stdin.write('y');
    await tick();
    expect(props.executeKill).toHaveBeenCalledTimes(1);
    expect(props.setConfirmKill).toHaveBeenCalledWith(false);
  });

  it('closes dialog on n without killing', async () => {
    result = render(<TestHarness {...props} confirmKill={true} />);
    await tick();
    result.stdin.write('n');
    await tick();
    expect(props.executeKill).not.toHaveBeenCalled();
    expect(props.setConfirmKill).toHaveBeenCalledWith(false);
  });

  // --- Navigate mode: uppercase R ---

  it('refreshes on uppercase R', async () => {
    result = render(<TestHarness {...props} />);
    await tick();
    result.stdin.write('R');
    await tick();
    expect(props.refresh).toHaveBeenCalledTimes(1);
  });

  // --- Search mode: meta key swallowing ---

  it('swallows meta key combinations in search mode without modifying the query', async () => {
    result = render(<TestHarness {...props} mode="search" />);
    await tick();
    // Cmd+V on macOS sends meta=true — the hook must not append 'v' to the query
    result.stdin.write('\x1Bv'); // ESC + v is how terminals encode Meta+v / Cmd+V
    await tick();
    // setSearchQuery should NOT have been called with a function that appends 'v'.
    // The only allowed calls are from ESC handling (setSearchQuery('') + setMode('navigate')).
    // If meta was not swallowed, there would be an extra call appending 'v'.
    const calls = (props.setSearchQuery as ReturnType<typeof vi.fn>).mock.calls;
    // Filter out any calls that pass a function (the append call uses q => q + input)
    const appendCalls = calls.filter((c: unknown[]) => typeof c[0] === 'function');
    expect(appendCalls).toHaveLength(0);
  });

  // --- Search mode: non-printable key with empty input (line 219 false branch) ---

  it('does not append to search query when input is empty (e.g. Tab key)', async () => {
    result = render(<TestHarness {...props} mode="search" />);
    await tick();
    // Tab sends input='' with key.tab=true in ink; it is not handled by any
    // earlier branch in search mode, so it reaches the `if (input)` guard.
    result.stdin.write('\t');
    await tick();
    // setSearchQuery should not have been called with an appender function
    const calls = (props.setSearchQuery as ReturnType<typeof vi.fn>).mock.calls;
    const appendCalls = calls.filter((c: unknown[]) => typeof c[0] === 'function');
    expect(appendCalls).toHaveLength(0);
  });

  // --- Unreachable mode fallthrough (line 186 false branch) ---

  it('does nothing when mode is an unexpected value (defensive branch)', async () => {
    // TypeScript's AppMode is 'navigate' | 'search', but V8 coverage still
    // tracks the false branch of `if (mode === 'search')` at line 186.
    // Force an impossible mode value to exercise that branch.
    result = render(<TestHarness {...props} mode={'other' as unknown as AppMode} />);
    await tick();
    result.stdin.write('x');
    await tick();
    // No callbacks should fire beyond the initial render
    expect(props.moveUp).not.toHaveBeenCalled();
    expect(props.moveDown).not.toHaveBeenCalled();
    expect(props.setSearchQuery).not.toHaveBeenCalled();
    expect(props.setMode).not.toHaveBeenCalled();
    expect(props.refresh).not.toHaveBeenCalled();
  });
});
