import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('ink', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ink')>();
  const noStdout = { stdout: undefined as unknown as NodeJS.WriteStream, write: () => {} };
  return { ...actual, useStdout: vi.fn(() => noStdout) };
});

import React from 'react';
import { render } from 'ink-testing-library';
import { useStdout } from 'ink';
import { PortList } from '../../src/components/PortList.js';
import type { PortEntry } from '../../src/types.js';

const portA: PortEntry = { port: 3000, process: 'node', pid: '11111', user: 'alice', address: '127.0.0.1' };
const portB: PortEntry = { port: 8080, process: 'python', pid: '22222', user: 'bob', address: '0.0.0.0' };
const portC: PortEntry = { port: 5432, process: 'postgres', pid: '33333', user: 'root', address: '127.0.0.1' };

describe('PortList', () => {
  describe('empty state', () => {
    it('renders "No listening ports found." when ports array is empty', () => {
      const { lastFrame } = render(<PortList ports={[]} selectedIndex={0} />);
      expect(lastFrame()).toContain('No listening ports found.');
    });
  });

  describe('with ports', () => {
    it('renders the PORT column header', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('PORT');
    });

    it('renders the PROCESS column header', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('PROCESS');
    });

    it('renders the PID column header', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('PID');
    });

    it('renders the USER column header', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('USER');
    });

    it('renders the ADDRESS column header', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('ADDRESS');
    });

    it('renders the port number of a single port', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('3000');
    });

    it('renders the process name of a single port', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('node');
    });

    it('renders the pid of a single port', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('11111');
    });

    it('renders the address of a single port', () => {
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      expect(lastFrame()).toContain('127.0.0.1');
    });
  });

  describe('selectedIndex', () => {
    it('renders the selection arrow on the selected row', () => {
      const { lastFrame } = render(<PortList ports={[portA, portB]} selectedIndex={1} />);
      expect(lastFrame()).toContain('▶');
    });

    it('the non-selected row does not show a selection arrow when first row is selected', () => {
      const { lastFrame } = render(<PortList ports={[portA, portB]} selectedIndex={0} />);
      // Only one arrow should appear — portA is selected
      const frame = lastFrame() ?? '';
      const arrowCount = (frame.match(/▶/g) ?? []).length;
      expect(arrowCount).toBe(1);
    });
  });

  describe('multiple ports', () => {
    it('renders data for all ports', () => {
      const { lastFrame } = render(<PortList ports={[portA, portB, portC]} selectedIndex={0} />);
      const frame = lastFrame() ?? '';
      expect(frame).toContain('3000');
      expect(frame).toContain('node');
      expect(frame).toContain('8080');
      expect(frame).toContain('python');
      expect(frame).toContain('5432');
      expect(frame).toContain('postgres');
    });
  });

  describe('terminal width adaptation', () => {
    afterEach(() => {
      vi.mocked(useStdout).mockReset();
      vi.mocked(useStdout).mockReturnValue({
        stdout: undefined as unknown as NodeJS.WriteStream,
        write: () => {},
      });
    });

    it('uses stdout.columns when available to compute process column width', () => {
      // Provide a real terminal width so the stdout?.columns branch is taken.
      vi.mocked(useStdout).mockReturnValue({
        stdout: { columns: 160 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const { lastFrame } = render(<PortList ports={[portA]} selectedIndex={0} />);
      // The list still renders correctly regardless of terminal width.
      expect(lastFrame()).toContain('PORT');
      expect(lastFrame()).toContain('node');
    });

    it('clamps process column to MIN_PROCESS_COL_WIDTH on very narrow terminals', () => {
      // stdout.columns = 40 (very narrow terminal)
      // colProcess = clamp(16, 40, 40 - 2 - 8 - 8 - 14 - 20) = clamp(16, 40, -12) = 16
      vi.mocked(useStdout).mockReturnValue({
        stdout: { columns: 40 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const narrowPort: PortEntry = { ...portA, process: 'verylongprocessname' };
      const { lastFrame } = render(<PortList ports={[narrowPort]} selectedIndex={0} />);
      const frame = lastFrame() ?? '';
      // Component must not crash and must still render the port number and PID.
      expect(frame).toContain('3000');
      expect(frame).toContain('11111');
    });
  });

  describe('viewport scrolling for limited terminal height', () => {
    afterEach(() => {
      vi.mocked(useStdout).mockReset();
      vi.mocked(useStdout).mockReturnValue({
        stdout: undefined as unknown as NodeJS.WriteStream,
        write: () => {},
      });
    });

    it('renders all ports when they fit within terminal height', () => {
      // Terminal with 20 rows can show 14 ports (20 - 6 overhead)
      vi.mocked(useStdout).mockReturnValue({
        stdout: { rows: 20, columns: 80 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const ports = [portA, portB, portC];
      const { lastFrame } = render(<PortList ports={ports} selectedIndex={0} />);
      const frame = lastFrame() ?? '';
      // All three ports should be visible
      expect(frame).toContain('3000');
      expect(frame).toContain('8080');
      expect(frame).toContain('5432');
    });

    it('truncates port list when too many ports for terminal height', () => {
      // Terminal with 8 rows can show only 2 ports (8 - 6 overhead)
      vi.mocked(useStdout).mockReturnValue({
        stdout: { rows: 8, columns: 80 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const manyPorts = Array.from({ length: 10 }, (_, i) => ({
        port: 3000 + i,
        process: `process${i}`,
        pid: String(10000 + i),
        user: 'user',
        address: '127.0.0.1',
      }));
      const { lastFrame } = render(<PortList ports={manyPorts} selectedIndex={0} />);
      const frame = lastFrame() ?? '';
      // First port should be visible (selectedIndex=0, centered in viewport)
      expect(frame).toContain('3000');
      // Last port should NOT be visible
      expect(frame).not.toContain('3009');
    });

    it('keeps selected item visible when scrolling down in a truncated list', () => {
      // Terminal with 8 rows can show only 2 ports (8 - 6 overhead)
      vi.mocked(useStdout).mockReturnValue({
        stdout: { rows: 8, columns: 80 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const manyPorts = Array.from({ length: 10 }, (_, i) => ({
        port: 3000 + i,
        process: `process${i}`,
        pid: String(10000 + i),
        user: 'user',
        address: '127.0.0.1',
      }));
      // Select an item near the end (index 8)
      const { lastFrame } = render(<PortList ports={manyPorts} selectedIndex={8} />);
      const frame = lastFrame() ?? '';
      // The selected port (3008) should be visible
      expect(frame).toContain('3008');
      // Should show item before it in the 2-port viewport (centered on selection)
      expect(frame).toContain('3007');
      // First port should NOT be visible
      expect(frame).not.toContain('3000');
    });

    it('centers selected item in viewport when in middle of long list', () => {
      // Terminal with 9 rows can show 3 ports (9 - 6 overhead)
      vi.mocked(useStdout).mockReturnValue({
        stdout: { rows: 9, columns: 80 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const manyPorts = Array.from({ length: 10 }, (_, i) => ({
        port: 3000 + i,
        process: `process${i}`,
        pid: String(10000 + i),
        user: 'user',
        address: '127.0.0.1',
      }));
      // Select middle item (index 5)
      const { lastFrame } = render(<PortList ports={manyPorts} selectedIndex={5} />);
      const frame = lastFrame() ?? '';
      // The selected port (3005) should be visible and roughly centered
      expect(frame).toContain('3005');
      // Should show items around it (viewport: index 4, 5, 6)
      expect(frame).toContain('3004');
      expect(frame).toContain('3006');
      // First and last ports should NOT be visible
      expect(frame).not.toContain('3000');
      expect(frame).not.toContain('3009');
    });

    it('handles minimum viewport size of 1 port on very short terminals', () => {
      // Terminal with 7 rows results in maxVisiblePorts = max(1, 7-6) = 1
      vi.mocked(useStdout).mockReturnValue({
        stdout: { rows: 7, columns: 80 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const { lastFrame } = render(<PortList ports={[portA, portB]} selectedIndex={1} />);
      const frame = lastFrame() ?? '';
      // Should show at least the selected port
      expect(frame).toContain('8080');
    });

    it('shows last N ports when selecting the very last item', () => {
      // Terminal with 8 rows can show 2 ports
      vi.mocked(useStdout).mockReturnValue({
        stdout: { rows: 8, columns: 80 } as unknown as NodeJS.WriteStream,
        write: () => {},
      });
      const manyPorts = Array.from({ length: 10 }, (_, i) => ({
        port: 3000 + i,
        process: `process${i}`,
        pid: String(10000 + i),
        user: 'user',
        address: '127.0.0.1',
      }));
      // Select the very last item (index 9)
      const { lastFrame } = render(<PortList ports={manyPorts} selectedIndex={9} />);
      const frame = lastFrame() ?? '';
      // Should show the last port
      expect(frame).toContain('3009');
      // Should show the second-to-last port (viewport: indices 8, 9)
      expect(frame).toContain('3008');
      // First ports should NOT be visible
      expect(frame).not.toContain('3000');
      expect(frame).not.toContain('3001');
    });

    it('corrects viewport when centered selection would cause endIndex overflow', () => {
      // Regression test for PortList.tsx lines 89-90: if centering the selected item
      // would push endIndex beyond the array length, snap to show the last N ports.
      vi.mocked(useStdout).mockReturnValue({
        stdout: { rows: 11, columns: 80 } as unknown as NodeJS.WriteStream, // 5 visible ports (11 - 6 overhead)
        write: () => {},
      });
      const ports = Array.from({ length: 7 }, (_, i) => ({
        port: 3000 + i,
        process: `p${i}`,
        pid: String(i),
        user: 'u',
        address: '127.0.0.1',
      }));
      // Select index 5 (port 3005). With halfWindow = 2, centering would give:
      // startIndex = 5 - 2 = 3, endIndex = 3 + 5 = 8 (exceeds length 7).
      // The correction should snap to: startIndex = 2, endIndex = 7 (showing last 5 ports).
      const { lastFrame } = render(<PortList ports={ports} selectedIndex={5} />);
      const frame = lastFrame() ?? '';
      // Should show the last 5 ports (indices 2-6: ports 3002-3006)
      expect(frame).toContain('3002'); // First in viewport
      expect(frame).toContain('3006'); // Last in viewport
      expect(frame).toContain('3005'); // Selected port
      // First two ports should be scrolled out of view
      expect(frame).not.toContain('3000');
      expect(frame).not.toContain('3001');
    });
  });
});
