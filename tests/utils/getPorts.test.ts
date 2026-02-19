import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
import { getPorts } from '../../src/utils/getPorts.js';

const mockExecSync = vi.mocked(execSync);

const HEADER = 'COMMAND     PID      USER   FD   TYPE DEVICE SIZE/OFF NODE NAME';

function makeLine(
  command: string,
  pid: string,
  user: string,
  addrPort: string,
): string {
  // Produce a line with at least 9 whitespace-separated tokens.
  // lsof columns: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
  return `${command}  ${pid}  ${user}  20u  IPv4  0xabc  0t0  TCP  ${addrPort} (LISTEN)`;
}

describe('getPorts', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
  });

  // ---------------------------------------------------------------------------
  // 1. Error handling
  // ---------------------------------------------------------------------------
  it('returns empty array when execSync throws', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('lsof not found');
    });

    expect(getPorts()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 2. Single basic IPv4 entry
  // ---------------------------------------------------------------------------
  it('parses a single basic IPv4 entry', () => {
    const output = [
      HEADER,
      makeLine('node', '12345', 'user', '127.0.0.1:3000'),
    ].join('\n');

    mockExecSync.mockReturnValue(output);

    expect(getPorts()).toEqual([
      { port: 3000, process: 'node', pid: '12345', user: 'user', address: '127.0.0.1' },
    ]);
  });

  // ---------------------------------------------------------------------------
  // 3. Multiple entries sorted by port ascending
  // ---------------------------------------------------------------------------
  it('parses multiple entries and sorts by port ascending', () => {
    const output = [
      HEADER,
      makeLine('nginx', '99', 'root', '0.0.0.0:8080'),
      makeLine('node', '42', 'user', '127.0.0.1:3000'),
    ].join('\n');

    mockExecSync.mockReturnValue(output);

    const result = getPorts();
    expect(result).toHaveLength(2);
    expect(result[0].port).toBe(3000);
    expect(result[1].port).toBe(8080);
  });

  // ---------------------------------------------------------------------------
  // 4. Wildcard address normalization → 0.0.0.0
  // ---------------------------------------------------------------------------
  it('normalizes * to 0.0.0.0', () => {
    mockExecSync.mockReturnValue([HEADER, makeLine('app', '1', 'u', '*:8080')].join('\n'));
    const [entry] = getPorts();
    expect(entry.address).toBe('0.0.0.0');
    expect(entry.port).toBe(8080);
  });

  it('normalizes 0.0.0.0 address to 0.0.0.0', () => {
    mockExecSync.mockReturnValue([HEADER, makeLine('app', '2', 'u', '0.0.0.0:9000')].join('\n'));
    const [entry] = getPorts();
    expect(entry.address).toBe('0.0.0.0');
    expect(entry.port).toBe(9000);
  });

  it('normalizes [::] to 0.0.0.0', () => {
    mockExecSync.mockReturnValue([HEADER, makeLine('app', '3', 'u', '[::]:7000')].join('\n'));
    const [entry] = getPorts();
    expect(entry.address).toBe('0.0.0.0');
    expect(entry.port).toBe(7000);
  });

  it('normalizes :: to 0.0.0.0', () => {
    // lsof can emit ":::6000" meaning host "::" port 6000
    mockExecSync.mockReturnValue([HEADER, makeLine('app', '4', 'u', ':::6000')].join('\n'));
    const [entry] = getPorts();
    expect(entry.address).toBe('0.0.0.0');
    expect(entry.port).toBe(6000);
  });

  // ---------------------------------------------------------------------------
  // 5. IPv6 localhost normalization → 127.0.0.1
  // ---------------------------------------------------------------------------
  it('normalizes [::1] to 127.0.0.1', () => {
    mockExecSync.mockReturnValue([HEADER, makeLine('app', '5', 'u', '[::1]:5000')].join('\n'));
    const [entry] = getPorts();
    expect(entry.address).toBe('127.0.0.1');
    expect(entry.port).toBe(5000);
  });

  it('normalizes ::1 (without brackets) to 127.0.0.1', () => {
    // Some lsof versions emit "::1:4000"
    mockExecSync.mockReturnValue([HEADER, makeLine('app', '6', 'u', '::1:4000')].join('\n'));
    const [entry] = getPorts();
    expect(entry.address).toBe('127.0.0.1');
    expect(entry.port).toBe(4000);
  });

  // ---------------------------------------------------------------------------
  // 6. Deduplication of identical address:port:pid combinations
  // ---------------------------------------------------------------------------
  it('deduplicates identical address:port:pid combinations', () => {
    const line = makeLine('node', '77', 'user', '127.0.0.1:3000');
    const output = [HEADER, line, line].join('\n');

    mockExecSync.mockReturnValue(output);

    expect(getPorts()).toHaveLength(1);
  });

  it('does not deduplicate entries with the same port but different PIDs', () => {
    const output = [
      HEADER,
      makeLine('node', '10', 'user', '127.0.0.1:3000'),
      makeLine('ruby', '20', 'user', '127.0.0.1:3000'),
    ].join('\n');

    mockExecSync.mockReturnValue(output);

    expect(getPorts()).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // 7. Lines with fewer than 9 fields are skipped
  // ---------------------------------------------------------------------------
  it('skips lines with fewer than 9 fields', () => {
    const shortLine = 'node 12345 user 20u IPv4';
    const output = [HEADER, shortLine].join('\n');

    mockExecSync.mockReturnValue(output);

    expect(getPorts()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 8. Lines where the port parses to NaN are skipped
  // ---------------------------------------------------------------------------
  it('skips lines where the port field is not a number', () => {
    const output = [
      HEADER,
      makeLine('node', '999', 'user', '127.0.0.1:notaport'),
    ].join('\n');

    mockExecSync.mockReturnValue(output);

    expect(getPorts()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 9. Lines with no colon in the address:port field are skipped
  // ---------------------------------------------------------------------------
  it('skips lines where the address:port field contains no colon', () => {
    // Replace the addrPort column with something that has no colon.
    // Build a raw 9-token line manually.
    const noColonLine = 'node  123  user  20u  IPv4  0xabc  0t0  TCP  NOCOLON';
    const output = [HEADER, noColonLine].join('\n');

    mockExecSync.mockReturnValue(output);

    expect(getPorts()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 10. Empty lsof output (header only) returns empty array
  // ---------------------------------------------------------------------------
  it('returns empty array when lsof output contains only the header line', () => {
    mockExecSync.mockReturnValue(HEADER + '\n');

    expect(getPorts()).toEqual([]);
  });

  it('returns empty array when lsof output is entirely empty', () => {
    mockExecSync.mockReturnValue('');

    expect(getPorts()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 11. Blank lines interspersed in output are skipped
  // ---------------------------------------------------------------------------
  it('skips blank lines interspersed in lsof output', () => {
    const output = [
      HEADER,
      '',
      makeLine('node', '12345', 'user', '127.0.0.1:3000'),
      '',
    ].join('\n');

    mockExecSync.mockReturnValue(output);

    expect(getPorts()).toEqual([
      { port: 3000, process: 'node', pid: '12345', user: 'user', address: '127.0.0.1' },
    ]);
  });
});
