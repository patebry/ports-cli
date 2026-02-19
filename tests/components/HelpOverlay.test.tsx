import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { HelpOverlay } from '../../src/components/HelpOverlay.js';

describe('HelpOverlay', () => {
  it('renders "Keybindings" heading', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('Keybindings');
  });

  it('renders the up/k navigation key', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('↑ / k');
  });

  it('renders the down/j navigation key', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('↓ / j');
  });

  it('renders the enter key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('enter');
  });

  it('renders the ctrl+k key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('ctrl+k');
  });

  it('renders the / search key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('/');
  });

  it('renders the ESC key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('ESC');
  });

  it('renders the r / R refresh key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('r / R');
  });

  it('renders the ? toggle help key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('?');
  });

  it('renders the q quit key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('q');
  });

  it('renders the ctrl+c quit key entry', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('ctrl+c');
  });

  it('renders "Press any key to close"', () => {
    const { lastFrame } = render(<HelpOverlay />);
    expect(lastFrame()).toContain('Press any key to close');
  });
});
