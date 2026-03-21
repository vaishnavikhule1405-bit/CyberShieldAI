import { NavLink } from 'react-router-dom';
import { Shield, Activity, Bug, Mail, AlertTriangle, MessageSquare, Terminal, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity },
    { name: 'Malware Detector', path: '/malware', icon: Bug },
    { name: 'Phishing Filter', path: '/phishing', icon: Mail },
    { name: 'Vulnerabilities', path: '/vulnerabilities', icon: AlertTriangle },
    { name: 'Security Chatbot', path: '/chatbot', icon: MessageSquare },
    { name: 'Honeypot Logs', path: '/honeypot', icon: Terminal },
    { name: 'Policy Chatbot', path: '/policy', icon: FileText },
  ];

  return (
    <div className="w-64 h-full glass-panel flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-6 flex items-center space-x-3 mb-6 border-b border-cyber-neonCyan/20">
          <Shield className="w-8 h-8 text-cyber-neonCyan animate-pulse-slow" />
          <h1 className="text-xl font-display font-bold text-cyber-neonCyan drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]">
            CyberShield
          </h1>
        </div>
        
        <nav className="flex flex-col gap-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-300 font-bold tracking-wide ${
                    isActive 
                      ? 'bg-cyber-neonCyan/20 text-cyber-neonCyan border-r-4 border-cyber-neonCyan shadow-[inset_0_0_10px_rgba(0,243,255,0.2)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-cyber-neonCyan/20 m-4 rounded glass-panel bg-black/40">
        <div className="text-xs text-cyber-neonGreen flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-cyber-neonGreen animate-pulse"></div>
          SYSTEM ONLINE
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          NODE: ALPHA-7<br/>
          LATENCY: 12ms
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
