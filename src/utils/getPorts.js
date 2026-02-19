import { execSync } from 'child_process';

export function getPorts() {
  try {
    const output = execSync('lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null', {
      encoding: 'utf8',
      timeout: 5000,
    });

    const lines = output.trim().split('\n');
    // Skip header line
    const dataLines = lines.slice(1);

    const seen = new Set();
    const ports = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length < 9) continue;

      const processName = parts[0];
      const pid = parts[1];
      const addrPort = parts[8];

      // Use lastIndexOf to handle IPv6 addresses like [::1]:3000
      const lastColon = addrPort.lastIndexOf(':');
      if (lastColon === -1) continue;

      const rawAddr = addrPort.slice(0, lastColon);
      const port = parseInt(addrPort.slice(lastColon + 1), 10);

      if (isNaN(port)) continue;

      // Normalize wildcard address variants to 0.0.0.0
      let address = rawAddr;
      if (address === '*' || address === '0.0.0.0' || address === '[::]' || address === '::') {
        address = '0.0.0.0';
      }
      // Normalize IPv6 localhost to 127.0.0.1
      if (address === '[::1]' || address === '::1') {
        address = '127.0.0.1';
      }

      const key = `${address}:${port}:${pid}`;
      if (seen.has(key)) continue;
      seen.add(key);

      ports.push({
        port,
        process: processName,
        pid,
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
