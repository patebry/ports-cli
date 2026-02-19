import { execSync } from 'child_process';

export function killPort(pid) {
  try {
    const safePid = parseInt(pid, 10);
    if (isNaN(safePid) || safePid <= 0) {
      return { success: false, error: 'Invalid PID' };
    }
    execSync(`kill -9 ${safePid}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
