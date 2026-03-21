import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const HoneypotLogs = () => {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);

  const mockIPs = ['192.168.1.14', '45.33.22.1', '104.22.5.3', '8.8.8.8', '110.43.2.1'];
  const mockActions = [
    { text: 'Incoming request blocked at edge firewall', color: 'text-yellow-400' },
    { text: 'Decoy response sent mapping fake internal directory', color: 'text-cyber-neonCyan' },
    { text: 'SQL Injection payload dropped', color: 'text-cyber-neonRed' },
    { text: 'Port scan detected and tar-pitted', color: 'text-orange-500' },
    { text: 'Brute force credential harvested into false DB', color: 'text-cyber-neonGreen' }
  ];

  useEffect(() => {
    // Start with some initial logs
    const initialLogs = Array(5).fill(null).map(() => generateRandomLog());
    setLogs(initialLogs);

    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev, generateRandomLog()];
        // Keep only last 50 logs so it doesn't crash
        if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50);
        return newLogs;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const generateRandomLog = () => {
    const ip = mockIPs[Math.floor(Math.random() * mockIPs.length)];
    const action = mockActions[Math.floor(Math.random() * mockActions.length)];
    const time = new Date().toISOString().split('T')[1].slice(0, 11); // HH:MM:SS.mmm
    
    return {
      time,
      ip,
      ...action
    };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] max-w-6xl mx-auto flex flex-col">
      <h2 className="text-3xl font-display mb-4 border-b border-cyber-neonCyan/30 pb-2 flex justify-between items-center">
        <span><span className="text-cyber-neonCyan">{"//"}</span> HONEYPOT TRAFFIC VISUALIZATION</span>
        <span className="text-sm font-mono text-cyber-neonRed bg-cyber-neonRed/10 border border-cyber-neonRed px-3 py-1 rounded animate-pulse">
          LIVE FEED
        </span>
      </h2>

      <div className="flex-1 glass-panel bg-black/90 p-6 overflow-hidden flex flex-col font-mono text-sm relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Terminal Header */}
        <div className="flex gap-2 mb-4 pb-2 border-b border-gray-800 text-gray-500 text-xs">
          <div className="w-1/6">TIMESTAMP</div>
          <div className="w-1/6">SOURCE IP</div>
          <div className="w-4/6">DECOY ACTION LOG</div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {logs.map((log, idx) => (
            <motion.div 
              key={idx} 
              initial={{ x: -10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              className="flex gap-2 hover:bg-white/5 p-1 rounded transition-colors"
            >
              <div className="w-1/6 text-gray-500">[{log.time}]</div>
              <div className="w-1/6 text-gray-300">{log.ip}</div>
              <div className={`w-4/6 ${log.color} font-bold`}>{log.text}</div>
            </motion.div>
          ))}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Scan line overlay for retro effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20"></div>
      </div>
    </motion.div>
  );
};

export default HoneypotLogs;
