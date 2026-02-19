import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { PortList } from '../../src/components/PortList.js';
import type { PortEntry } from '../../src/utils/getPorts.js';

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
});
