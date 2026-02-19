import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
import { killPort } from '../../src/utils/killPort.js';

const mockExecSync = vi.mocked(execSync);

describe('killPort', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
  });

  // ---------------------------------------------------------------------------
  // Invalid PID validation
  // ---------------------------------------------------------------------------
  it('returns { success: false, error: "Invalid PID" } for non-numeric string "abc"', () => {
    expect(killPort('abc')).toEqual({ success: false, error: 'Invalid PID' });
  });

  it('returns { success: false, error: "Invalid PID" } for "0"', () => {
    expect(killPort('0')).toEqual({ success: false, error: 'Invalid PID' });
  });

  it('returns { success: false, error: "Invalid PID" } for negative PID "-5"', () => {
    expect(killPort('-5')).toEqual({ success: false, error: 'Invalid PID' });
  });

  it('does not call execSync for invalid PIDs', () => {
    killPort('abc');
    killPort('0');
    killPort('-5');
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Successful kill
  // ---------------------------------------------------------------------------
  it('returns { success: true } when execSync succeeds', () => {
    mockExecSync.mockReturnValue(undefined as unknown as string);

    expect(killPort('1234')).toEqual({ success: true });
  });

  it('passes the correct kill command to execSync', () => {
    mockExecSync.mockReturnValue(undefined as unknown as string);

    killPort('1234');

    expect(mockExecSync).toHaveBeenCalledWith('kill -9 1234');
  });

  it('handles string PID "1234" by parsing it to integer 1234', () => {
    mockExecSync.mockReturnValue(undefined as unknown as string);

    killPort('1234');

    // parseInt('1234', 10) === 1234, so the command uses the numeric value
    expect(mockExecSync).toHaveBeenCalledWith('kill -9 1234');
  });

  // ---------------------------------------------------------------------------
  // execSync throws
  // ---------------------------------------------------------------------------
  it('returns { success: false, error: <message> } when execSync throws', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('No such process');
    });

    expect(killPort('9999')).toEqual({
      success: false,
      error: 'No such process',
    });
  });

  it('still attempts execSync for a valid PID even when it will throw', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('permission denied');
    });

    killPort('42');

    expect(mockExecSync).toHaveBeenCalledWith('kill -9 42');
  });

  it('returns the stringified value when execSync throws a non-Error', () => {
    mockExecSync.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'raw string error';
    });

    expect(killPort('55')).toEqual({ success: false, error: 'raw string error' });
  });

  // ---------------------------------------------------------------------------
  // Empty and whitespace-only PID strings
  // ---------------------------------------------------------------------------
  it('returns { success: false, error: "Invalid PID" } for empty string ""', () => {
    expect(killPort('')).toEqual({ success: false, error: 'Invalid PID' });
  });

  it('does not call execSync for empty string PID', () => {
    killPort('');
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('returns { success: false, error: "Invalid PID" } for whitespace-only string "  "', () => {
    expect(killPort('  ')).toEqual({ success: false, error: 'Invalid PID' });
  });

  it('does not call execSync for whitespace-only PID', () => {
    killPort('  ');
    expect(mockExecSync).not.toHaveBeenCalled();
  });
});
