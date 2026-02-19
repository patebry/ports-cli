import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { PortRow } from '../../src/components/PortRow.js';
import type { PortEntry } from '../../src/utils/getPorts.js';

const samplePort: PortEntry = {
  port: 3000,
  process: 'node',
  pid: '12345',
  address: '127.0.0.1',
};

// Use a fixed colProcess in unit tests so row rendering is deterministic
// regardless of the terminal width in the test environment.
const COL_PROCESS = 20;
const renderRow = (port: PortEntry, isSelected: boolean) =>
  render(<PortRow port={port} isSelected={isSelected} colProcess={COL_PROCESS} />);

describe('PortRow', () => {
  describe('unselected row', () => {
    it('renders the port number', () => {
      const { lastFrame } = renderRow(samplePort, false);
      expect(lastFrame()).toContain('3000');
    });

    it('renders the process name', () => {
      const { lastFrame } = renderRow(samplePort, false);
      expect(lastFrame()).toContain('node');
    });

    it('renders the pid', () => {
      const { lastFrame } = renderRow(samplePort, false);
      expect(lastFrame()).toContain('12345');
    });

    it('renders the address', () => {
      const { lastFrame } = renderRow(samplePort, false);
      expect(lastFrame()).toContain('127.0.0.1');
    });

    it('does not render the selection arrow', () => {
      const { lastFrame } = renderRow(samplePort, false);
      expect(lastFrame()).not.toContain('▶');
    });
  });

  describe('selected row', () => {
    it('renders the selection arrow', () => {
      const { lastFrame } = renderRow(samplePort, true);
      expect(lastFrame()).toContain('▶');
    });

    it('renders the port number', () => {
      const { lastFrame } = renderRow(samplePort, true);
      expect(lastFrame()).toContain('3000');
    });

    it('renders the process name', () => {
      const { lastFrame } = renderRow(samplePort, true);
      expect(lastFrame()).toContain('node');
    });

    it('renders the pid', () => {
      const { lastFrame } = renderRow(samplePort, true);
      expect(lastFrame()).toContain('12345');
    });

    it('renders the address', () => {
      const { lastFrame } = renderRow(samplePort, true);
      expect(lastFrame()).toContain('127.0.0.1');
    });
  });

  describe('process name truncation', () => {
    it('truncates a process name longer than colProcess', () => {
      const longNamePort: PortEntry = { ...samplePort, process: 'averylongprocessname_extra' };
      const { lastFrame } = render(
        <PortRow port={longNamePort} isSelected={false} colProcess={20} />,
      );
      // 'averylongprocessname_extra' is 26 chars; slice(0, 20) → 'averylongprocessname'
      expect(lastFrame()).toContain('averylongprocessname');
      expect(lastFrame()).not.toContain('averylongprocessname_extra');
    });

    it('does not truncate when process name fits within colProcess', () => {
      const { lastFrame } = render(
        <PortRow port={samplePort} isSelected={false} colProcess={20} />,
      );
      expect(lastFrame()).toContain('node');
    });
  });
});
