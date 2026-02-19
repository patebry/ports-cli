/**
 * @module getPorts
 *
 * Parses `lsof` output to produce a deduplicated list of all TCP ports
 * currently in the LISTEN state on the local machine.
 *
 * **Why `lsof -nP -iTCP -sTCP:LISTEN +c 0`?**
 * - `-n`  Skip DNS reverse lookups. Without this, lsof queries DNS for every
 *         address it finds, which can add several seconds of latency.
 * - `-P`  Use numeric port numbers instead of looking up service names in
 *         /etc/services (e.g. `3000` instead of `hbci`).
 * - `-iTCP`       Filter to TCP sockets only; ignores UDP, pipes, files, etc.
 * - `-sTCP:LISTEN` Further filter to sockets in the LISTEN state only;
 *                  excludes ESTABLISHED, TIME_WAIT, and other transient states.
 * - `+c 0` Remove lsof's default 9-character truncation of the COMMAND column
 *          so long process names like "com.docker.backend" are shown in full.
 *
 * **Why a 5-second timeout?**
 * `lsof` can hang indefinitely when the machine has stale NFS or network
 * mount points. The timeout ensures the CLI stays responsive even in those
 * environments. On failure or timeout we return an empty array rather than
 * crashing.
 */
import { execSync } from 'child_process';
import type { PortEntry } from '../types.js';

/** Maximum milliseconds to wait for lsof before treating the output as empty. */
const LSOF_TIMEOUT_MS = 5000;

/**
 * Runs `lsof` and returns a sorted, deduplicated list of listening TCP ports.
 *
 * @returns Array of {@link PortEntry} objects sorted by port number ascending.
 *          Returns an empty array if lsof is unavailable, times out, or
 *          produces no output.
 */
export function getPorts(): PortEntry[] {
  try {
    // +c 0 removes lsof's default 9-character truncation on the COMMAND column
    // so process names like "com.docker.backend" are not clipped to "com.docke".
    const output = execSync('lsof -nP -iTCP -sTCP:LISTEN +c 0 2>/dev/null', {
      encoding: 'utf8',
      timeout: LSOF_TIMEOUT_MS,
    });

    const lines = output.trim().split('\n');

    // slice(1) skips the lsof header row:
    // "COMMAND  PID  USER  FD  TYPE  DEVICE  SIZE/OFF  NODE  NAME"
    const dataLines = lines.slice(1);

    const seen = new Set<string>();
    const ports: PortEntry[] = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);

      // lsof columns (0-indexed):
      //   0:COMMAND  1:PID  2:USER  3:FD  4:TYPE  5:DEVICE  6:SIZE/OFF  7:NODE  8:NAME
      // NAME (index 8) holds the address:port string we need to parse.
      // Any line with fewer than 9 columns is malformed; skip it.
      if (parts.length < 9) continue;

      const processName = parts[0];
      const pid = parts[1];
      const user = parts[2];
      const addrPort = parts[8];

      // Use lastIndexOf instead of indexOf to correctly split IPv6 addresses.
      // An IPv6 NAME field looks like `[::1]:3000` — the host portion itself
      // contains colons, so indexOf(':') would land inside the address rather
      // than at the separator before the port number.
      const lastColon = addrPort.lastIndexOf(':');
      if (lastColon === -1) continue;

      const rawAddr = addrPort.slice(0, lastColon);
      const port = parseInt(addrPort.slice(lastColon + 1), 10);

      if (isNaN(port)) continue;

      // Normalize wildcard address variants to 0.0.0.0.
      // lsof may report wildcard listeners as `*`, `0.0.0.0`, `[::]`, or `::`.
      // All four mean "listening on all interfaces"; unify them so the UI can
      // display and deduplicate them consistently.
      let address = rawAddr;
      if (address === '*' || address === '0.0.0.0' || address === '[::]' || address === '::') {
        address = '0.0.0.0';
      }
      // Normalize IPv6 loopback to the equivalent IPv4 loopback address.
      // `[::1]` and `::1` are the IPv6 form of 127.0.0.1; treating them as
      // identical avoids confusing users who see two "localhost" rows.
      if (address === '[::1]' || address === '::1') {
        address = '127.0.0.1';
      }

      // Deduplicate by address + port + PID.
      // Many processes (e.g. node, python) bind dual-stack: they open one
      // socket on `0.0.0.0` (IPv4) and another on `[::]` (IPv6) for the same
      // port. After normalization both produce the same key, so we only keep
      // the first row lsof reports rather than showing a duplicate entry.
      const key = `${address}:${port}:${pid}`;
      if (seen.has(key)) continue;
      seen.add(key);

      ports.push({
        port,
        process: processName,
        pid,
        user,
        address,
      });
    }

    // Sort numerically by port ascending
    ports.sort((a, b) => a.port - b.port);

    return ports;
  } catch {
    return [];
  }
}
