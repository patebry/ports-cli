import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Header } from '../../src/components/Header.js';

describe('Header', () => {
  it('renders the word "ports"', () => {
    const { lastFrame } = render(<Header />);
    expect(lastFrame()).toContain('ports');
  });

  it('renders "listening TCP ports"', () => {
    const { lastFrame } = render(<Header />);
    expect(lastFrame()).toContain('listening TCP ports');
  });
});
