import React, { useState, useEffect } from 'react';
import { Box, useInput, useApp } from 'ink';
import { Header } from './components/Header.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { PortList } from './components/PortList.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { HelpOverlay } from './components/HelpOverlay.jsx';
import { getPorts } from './utils/getPorts.js';
import { killPort } from './utils/killPort.js';

export function App() {
  const { exit } = useApp();

  const [ports, setPorts] = useState(() => getPorts());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [killMessage, setKillMessage] = useState(null);
  const [mode, setMode] = useState('navigate');
  const [showHelp, setShowHelp] = useState(false);
  const [confirmKill, setConfirmKill] = useState(false);

  const filteredPorts = ports.filter(p =>
    !searchQuery ||
    ['process', 'port', 'address'].some(k =>
      String(p[k]).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const clampedIndex = Math.min(selectedIndex, Math.max(0, filteredPorts.length - 1));
  const selectedPort = filteredPorts[clampedIndex] ?? null;

  useEffect(() => {
    if (selectedIndex !== clampedIndex) {
      setSelectedIndex(clampedIndex);
    }
  }, [clampedIndex, selectedIndex]);

  useEffect(() => {
    if (!killMessage) return;
    const timer = setTimeout(() => setKillMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [killMessage]);

  const refresh = () => setPorts(getPorts());

  useEffect(() => {
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  const executeKill = () => {
    if (!selectedPort) return;
    const result = killPort(selectedPort.pid);
    setKillMessage(result.success
      ? { type: 'success', text: `Killed ${selectedPort.process} (${selectedPort.pid})` }
      : { type: 'error', text: `Failed: ${result.error}` }
    );
    setTimeout(refresh, 300);
  };

  const handleKill = () => {
    executeKill();
  };

  useInput((input, key) => {
    // Always fires regardless of mode
    if (key.ctrl && input === 'c') { exit(); return; }
    if (key.ctrl && input === 'k') { handleKill(); return; }

    // Toggle help only in navigate mode and not during confirm
    if (input === '?' && mode === 'navigate' && !confirmKill) {
      setShowHelp(s => !s);
      return;
    }

    // When help is open, any key closes it
    if (showHelp) {
      setShowHelp(false);
      return;
    }

    // When confirm kill dialog is active
    if (confirmKill) {
      if (input === 'y') {
        executeKill();
        setConfirmKill(false);
      } else if (key.escape || input === 'n') {
        setConfirmKill(false);
      }
      return;
    }

    // Navigate mode
    if (mode === 'navigate') {
      if (key.upArrow || input === 'k') {
        setSelectedIndex(i => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow || input === 'j') {
        setSelectedIndex(i => Math.min(filteredPorts.length - 1, i + 1));
        return;
      }
      if (input === '/') {
        setMode('search');
        return;
      }
      if (key.return) {
        if (selectedPort) setConfirmKill(true);
        return;
      }
      if (input === 'r' || input === 'R') {
        refresh();
        return;
      }
      if (key.escape) {
        if (searchQuery) setSearchQuery('');
        return;
      }
      if (input === 'q') {
        exit();
        return;
      }
      return;
    }

    // Search mode
    if (mode === 'search') {
      if (key.escape) {
        setSearchQuery('');
        setMode('navigate');
        return;
      }
      if (key.backspace || key.delete) {
        setSearchQuery(q => q.slice(0, -1));
        return;
      }
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex(i => Math.min(filteredPorts.length - 1, i + 1));
        return;
      }
      if (key.return) {
        setMode('navigate');
        return;
      }
      // Ignore ctrl/meta combos
      if (key.ctrl || key.meta) return;
      // Printable characters go into the search box
      if (input) {
        setSearchQuery(q => q + input);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Header />
      <SearchBar value={searchQuery} isActive={mode === 'search'} />
      <PortList ports={filteredPorts} selectedIndex={clampedIndex} />
      <StatusBar mode={mode} confirmKill={confirmKill} killMessage={killMessage} selectedPort={selectedPort} />
      {showHelp && <HelpOverlay />}
    </Box>
  );
}
