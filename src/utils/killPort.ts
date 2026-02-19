/**
 * @module killPort
 *
 * Sends SIGKILL to a process by PID, immediately terminating it.
 *
 * **Why SIGKILL (`kill -9`) instead of SIGTERM?**
 * SIGTERM gives the target process a chance to catch the signal and perform
 * graceful cleanup (flushing buffers, closing DB connections, etc.). For a
 * port-management tool the user has already made the decision to forcibly
 * reclaim a port — waiting for a process to clean up voluntarily would make
 * the tool feel unreliable. SIGKILL is unblockable and unignorable, so the
 * port is guaranteed to be free immediately after the call succeeds.
 *
 * **Safety implication:** The target process gets no opportunity to clean up.
 * Temporary files, open connections, and in-flight writes may be left in an
 * inconsistent state. This is an acceptable trade-off for an interactive
 * developer tool where speed and certainty are more important than graceful
 * shutdown.
 */
import { execSync } from 'child_process';

/**
 * The result of a kill attempt.
 *
 * Modelled as a discriminated union so the compiler guarantees that
 * `error` is present when `success` is `false` and absent when `success`
 * is `true`. This makes it impossible to represent an inconsistent state
 * such as `{ success: true, error: "..." }`.
 */
export type KillResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Sends SIGKILL to the process identified by `pid`.
 *
 * @param pid - The process ID to kill, as a string. Accepts a string because
 *              `PortEntry.pid` (from lsof output) is already a string; this
 *              avoids forcing callers to parse it only to have it stringified
 *              again when building the shell command.
 * @returns A {@link KillResult} indicating whether the kill succeeded.
 */
export function killPort(pid: string): KillResult {
  try {
    // parseInt with explicit radix 10 prevents octal interpretation.
    // Without the radix, a PID string like '0777' would be parsed as octal
    // (511 decimal), potentially targeting the wrong process entirely.
    const safePid = parseInt(pid, 10);

    // Guard against dangerous PID values before touching the shell.
    // PID 0 is the swapper/scheduler (a kernel pseudo-process on most Unixes).
    // Negative PIDs are interpreted by kill(2) as process group IDs, which
    // would broadcast SIGKILL to an entire group — far wider than intended.
    if (isNaN(safePid) || safePid <= 0) {
      return { success: false, error: 'Invalid PID' };
    }

    execSync(`kill -9 ${safePid}`);
    return { success: true };
  } catch (err) {
    // execSync throws on non-zero exit (e.g. process already gone, permission
    // denied). TypeScript types catch-clause bindings as `unknown` in strict
    // mode; instanceof narrows the type safely before accessing `.message`.
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
