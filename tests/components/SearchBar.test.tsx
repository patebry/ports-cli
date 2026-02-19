import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { SearchBar } from '../../src/components/SearchBar.js';

describe('SearchBar', () => {
  it('inactive with no value renders "to search" hint text', () => {
    const { lastFrame } = render(<SearchBar value="" isActive={false} />);
    expect(lastFrame()).toContain('to search');
  });

  it('active with no value renders "type to filter..." hint text', () => {
    const { lastFrame } = render(<SearchBar value="" isActive={true} />);
    expect(lastFrame()).toContain('type to filter...');
  });

  it('active with no value renders cursor block', () => {
    const { lastFrame } = render(<SearchBar value="" isActive={true} />);
    expect(lastFrame()).toContain('█');
  });

  it('active with a value renders the value text', () => {
    const { lastFrame } = render(<SearchBar value="node" isActive={true} />);
    expect(lastFrame()).toContain('node');
  });

  it('active with a value renders cursor block after the value', () => {
    const { lastFrame } = render(<SearchBar value="node" isActive={true} />);
    expect(lastFrame()).toContain('█');
  });

  it('inactive with a value renders the value text', () => {
    const { lastFrame } = render(<SearchBar value="node" isActive={false} />);
    expect(lastFrame()).toContain('node');
  });

  it('inactive with a value does not render the cursor block', () => {
    const { lastFrame } = render(<SearchBar value="node" isActive={false} />);
    expect(lastFrame()).not.toContain('█');
  });

  it('inactive with a value does not render hint text', () => {
    const { lastFrame } = render(<SearchBar value="node" isActive={false} />);
    expect(lastFrame()).not.toContain('to search');
    expect(lastFrame()).not.toContain('type to filter...');
  });
});
