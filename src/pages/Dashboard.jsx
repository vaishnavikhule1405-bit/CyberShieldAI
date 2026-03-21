import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', threats: 10 },
  { time: '04:00', threats: 45 },
  { time: '08:00', threats: 25 },
  { time: '12:00', threats: 80 },
  { time: '16:00', threats: 30 },
  { time: '20:00', threats: 15 },
  { time: '24:00', threats: 5 },
];

const Dashboard = () => {
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
        <MetricCard title="System Risk Level" value="HIGH 🔴" subtitle="Critical patches required" color="neonRed" />
        <MetricCard title="Malware Blocked" value="1,245" subtitle="+12% from last hour" color="neonCyan" />
        <MetricCard title="Phishing Attempts" value="482" subtitle="3 active campaigns" color="neonGreen" />
        <MetricCard title="Pending CVEs" value="14" subtitle="3 Critical severity" color="neonPurple" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-xl mb-4 font-bold flex items-center gap-2">
            <Activity className="text-cyber-neonCyan" /> Threat Origin Vectors (24h)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#151e32" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" tick={{fontFamily: 'monospace'}} />
                <YAxis stroke="#64748B" tick={{fontFamily: 'monospace'}} />
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
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <FeedItem type="CRITICAL" text="Ransomware signature matched on Node-8" time="12s ago" />
            <FeedItem type="WARNING" text="Unusual outbound traffic spike" time="1m ago" />
            <FeedItem type="INFO" text="Routine scan completed successfully" time="5m ago" />
            <FeedItem type="WARNING" text="Failed login burst from 192.168.1.100" time="12m ago" />
            <FeedItem type="CRITICAL" text="Privilege escalation blocked" time="14m ago" />
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
    <div className={`p-3 rounded border-l-4 ${colors[type]} bg-black/40`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-xs uppercase">{type}</span>
        <span className="text-xs font-mono opacity-70">{time}</span>
      </div>
      <div className="text-sm text-gray-300">{text}</div>
    </div>
  );
}

export default Dashboard;
