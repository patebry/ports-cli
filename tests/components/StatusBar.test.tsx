import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { StatusBar } from '../../src/components/StatusBar.js';
import type { PortEntry } from '../../src/utils/getPorts.js';

const samplePort: PortEntry = {
  port: 3000,
  process: 'node',
  pid: '12345',
  address: '127.0.0.1',
};

describe('StatusBar', () => {
  describe('navigate mode, no selected port', () => {
    it('renders the navigate hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('navigate');
    });

    it('renders the search hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('search');
    });

    it('renders the kill hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('kill');
    });

    it('renders the refresh hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('refresh');
    });

    it('renders the help hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('help');
    });

    it('renders the quit hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('quit');
    });
  });

  describe('search mode', () => {
    it('renders the filter hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="search" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('filter');
    });

    it('renders the done hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="search" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('done');
    });

    it('renders the clear hint', () => {
      const { lastFrame } = render(
        <StatusBar mode="search" confirmKill={false} killMessage={null} selectedPort={null} />
      );
      expect(lastFrame()).toContain('clear');
    });
  });

  describe('confirm kill dialog', () => {
    it('renders "Kill" text', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={true} killMessage={null} selectedPort={samplePort} />
      );
      expect(lastFrame()).toContain('Kill');
    });

    it('renders the process name', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={true} killMessage={null} selectedPort={samplePort} />
      );
      expect(lastFrame()).toContain('node');
    });

    it('renders the port number with question mark', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={true} killMessage={null} selectedPort={samplePort} />
      );
      expect(lastFrame()).toContain('3000?');
    });

    it('renders the "y" confirm key', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={true} killMessage={null} selectedPort={samplePort} />
      );
      expect(lastFrame()).toContain('y');
    });

    it('renders the ESC cancel key', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={true} killMessage={null} selectedPort={samplePort} />
      );
      expect(lastFrame()).toContain('ESC');
    });
  });

  describe('kill messages', () => {
    it('renders a success kill message', () => {
      const { lastFrame } = render(
        <StatusBar
          mode="navigate"
          confirmKill={false}
          killMessage={{ type: 'success', text: 'Killed node on port 3000' }}
          selectedPort={samplePort}
        />
      );
      expect(lastFrame()).toContain('Killed node on port 3000');
    });

    it('renders an error kill message', () => {
      const { lastFrame } = render(
        <StatusBar
          mode="navigate"
          confirmKill={false}
          killMessage={{ type: 'error', text: 'Failed to kill process' }}
          selectedPort={samplePort}
        />
      );
      expect(lastFrame()).toContain('Failed to kill process');
    });
  });

  describe('selected port display', () => {
    it('shows process:port when no kill message is present', () => {
      const { lastFrame } = render(
        <StatusBar mode="navigate" confirmKill={false} killMessage={null} selectedPort={samplePort} />
      );
      expect(lastFrame()).toContain('node:3000');
    });
  });
});
