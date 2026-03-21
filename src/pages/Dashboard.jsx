import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://127.0.0.1:5000';

const getRelativeTime = (dateString) => {
  // Assuming dateString is UTC from Neon Database
  const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'));
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 0) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    malwareBlocked: 0,
    totalScans: 0,
    phishingAttempts: 0,
    pendingCVEs: 0,
    riskScore: 0
  });
  const [threatsData, setThreatsData] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    // 1. Fetch initial data
    const fetchData = async () => {
      try {
        const [statsRes, threatsRes, activityRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/stats`),
          axios.get(`${BACKEND_URL}/api/threats`),
          axios.get(`${BACKEND_URL}/api/activity`)
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (threatsRes.data.success) setThreatsData(threatsRes.data.data);
        if (activityRes.data.success) setActivityFeed(activityRes.data.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s for stats/threats
    
    // Force re-render every second to update relative times
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 1000);

    // 2. Setup WebSocket for real-time live activity feed
    const socket = io(BACKEND_URL);
    socket.on('new_activity', (newActivity) => {
      setActivityFeed(prev => [newActivity, ...prev].slice(0, 15)); // Keep latest 15
    });

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      socket.disconnect();
    };
  }, []);

  const riskLevel = stats.riskScore > 50 ? 'HIGH 🔴' : stats.riskScore > 20 ? 'MEDIUM 🟠' : 'LOW 🟢';
  const riskColor = stats.riskScore > 50 ? 'neonRed' : stats.riskScore > 20 ? 'neonPurple' : 'neonGreen';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="space-y-6 max-w-7xl mx-auto"
    >
      <header className="flex justify-between items-end border-b border-cyber-neonCyan/30 pb-4 mb-6">
        <div>
          <h1 className="text-3xl text-white">GLOBAL THREAT MATRIX</h1>
          <p className="text-cyber-neonCyan font-mono mt-1 text-sm">System Status: SECURE_UPLINK_ESTABLISHED</p>
        </div>
      </header>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="System Risk Level" value={riskLevel} subtitle={`Risk Score: ${stats.riskScore}%`} color={riskColor} />
        <MetricCard title="Malware Blocked" value={stats.malwareBlocked.toLocaleString()} subtitle={`${stats.totalScans} Total Scans`} color="neonCyan" />
        <MetricCard title="Phishing Attempts" value={stats.phishingAttempts.toLocaleString()} subtitle="Active mitigation" color="neonGreen" />
        <MetricCard title="Pending CVEs" value={stats.pendingCVEs.toLocaleString()} subtitle="Patch management active" color="neonPurple" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-xl mb-4 font-bold flex items-center gap-2">
            <Activity className="text-cyber-neonCyan" /> Threat Origin Vectors
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threatsData}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#151e32" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" tick={{fontFamily: 'monospace'}} />
                <YAxis stroke="#64748B" tick={{fontFamily: 'monospace'}} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050510', border: '1px solid #00f3ff', borderRadius: '4px' }}
                  itemStyle={{ color: '#00f3ff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="threats" stroke="#00f3ff" fillOpacity={1} fill="url(#colorThreats)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="glass-panel p-6 flex flex-col h-full">
          <h3 className="text-xl mb-4 font-bold flex items-center gap-2">
            <ShieldAlert className="text-cyber-neonRed" /> Live Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[320px] custom-scrollbar">
            {activityFeed.length === 0 ? (
              <div className="text-gray-500 font-mono text-sm">No recent activity...</div>
            ) : (
              activityFeed.map((item, idx) => (
                <FeedItem 
                  key={item.id || idx} 
                  type={item.type} 
                  text={item.text} 
                  time={getRelativeTime(item.created_at)} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Subcomponents
const MetricCard = ({ title, value, subtitle, color }) => {
  const colorMap = {
    neonCyan: 'text-cyber-neonCyan border-cyber-neonCyan shadow-[0_0_10px_rgba(0,243,255,0.2)]',
    neonRed: 'text-cyber-neonRed border-cyber-neonRed shadow-[0_0_10px_rgba(255,0,60,0.2)]',
    neonGreen: 'text-cyber-neonGreen border-cyber-neonGreen shadow-[0_0_10px_rgba(57,255,20,0.2)]',
    neonPurple: 'text-cyber-neonPurple border-cyber-neonPurple shadow-[0_0_10px_rgba(176,0,255,0.2)]',
  };

  return (
    <div className={`glass-panel p-5 border-t-4 ${colorMap[color].split(' ')[1]} ${colorMap[color].split(' ')[2]}`}>
      <div className="text-gray-400 font-bold mb-1 uppercase tracking-wider text-sm">{title}</div>
      <div className={`text-4xl font-black mb-2 font-display ${colorMap[color].split(' ')[0]}`}>{value}</div>
      <div className="text-xs font-mono text-gray-500">{subtitle}</div>
    </div>
  );
};

const FeedItem = ({ type, text, time }) => {
  const colors = {
    CRITICAL: 'text-cyber-neonRed bg-cyber-neonRed/10 border-cyber-neonRed',
    WARNING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400',
    INFO: 'text-cyber-neonCyan bg-cyber-neonCyan/10 border-cyber-neonCyan'
  };

  return (
    <div className={`p-3 rounded border-l-4 ${colors[type] || colors.INFO} bg-black/40`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-xs uppercase">{type}</span>
        <span className="text-xs font-mono opacity-70">{time}</span>
      </div>
      <div className="text-sm text-gray-300">{text}</div>
    </div>
  );
}

export default Dashboard;
