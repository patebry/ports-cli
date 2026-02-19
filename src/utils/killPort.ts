import { execSync } from 'child_process';

export interface KillResult {
  success: boolean;
  error?: string;
}

export function killPort(pid: string): KillResult {
  try {
    const safePid = parseInt(pid, 10);
    if (isNaN(safePid) || safePid <= 0) {
      return { success: false, error: 'Invalid PID' };
    }
    execSync(`kill -9 ${safePid}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
