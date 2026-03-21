import { motion } from 'framer-motion';
import { Shield, Activity, Search, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { title: 'Real-Time Monitoring', desc: 'Continuous surveillance of your infrastructure.', icon: Activity },
    { title: 'Advanced Threat Hunting', desc: 'AI-driven detection of novel attack vectors.', icon: Search },
    { title: 'Automated Hardening', desc: 'Proactive policy enforcement across servers.', icon: Server },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Elements */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="z-10 text-center"
      >
        <Shield className="w-24 h-24 mx-auto text-cyber-neonCyan mb-6 drop-shadow-[0_0_15px_rgba(0,243,255,0.8)] animate-glow" />
        <h1 className="text-5xl md:text-7xl font-black mb-4 neon-text">
          CYBERSHIELD AI
        </h1>
        <p className="text-xl md:text-2xl text-cyber-neonGreen font-mono mb-10 tracking-widest drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">
          AI-Powered Cybersecurity Platform for Real-Time Threat Detection
        </p>
        
        <div className="flex gap-6 justify-center mt-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="neon-button text-lg flex items-center gap-2"
          >
            Initiate Uplink <Activity className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 z-10 w-full max-w-6xl">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div 
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.2 }}
              className="glass-panel p-6 text-center hover:-translate-y-2 transition-transform cursor-pointer"
            >
              <Icon className="w-12 h-12 mx-auto text-cyber-neonCyan mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
};

export default LandingPage;
