/**
 * Tests for useKeyboardInput hook.
 *
 * This suite verifies the keyboard handler logic in isolation.
 * Integration tests in app.test.tsx verify end-to-end behavior.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { Box } from 'ink';
import { useKeyboardInput, type UseKeyboardInputProps } from '../../src/hooks/useKeyboardInput.js';

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 10));

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
      filteredPortsLength: 2,
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
    expect(props.setSearchQuery).toHaveBeenCalled();
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
    expect(props.setSearchQuery).toHaveBeenCalled();
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
});
