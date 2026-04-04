import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));

        const users = JSON.parse(localStorage.getItem('cybershield_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            setError('Invalid credentials. Access denied.');
            setLoading(false);
            return;
        }
        login(user);
        navigate('/dashboard');
    };

    const handleDemo = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 600));
        const demoUser = {
            id: 'demo-001',
            name: 'Demo Analyst',
            email: 'demo@cybershield.ai',
            role: 'Senior Analyst',
            clearanceLevel: 'LEVEL-4',
            avatar: 'DA',
            organization: 'CyberShield AI',
            scansRun: 142,
            threatsBlocked: 37,
            createdAt: new Date().toISOString(),
        };
        login(demoUser);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-cyber-black flex items-center justify-center p-4 relative overflow-hidden">
            <style>{`
        @keyframes scanline { 0% { transform: translateY(-100vh); } 100% { transform: translateY(200vh); } }
        .scan { animation: scanline 10s linear infinite; }
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.4} 94%{opacity:1} 96%{opacity:0.6} 97%{opacity:1} }
      `}</style>

            <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-neonCyan/50 to-transparent scan pointer-events-none z-50" />

            <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(0,243,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[500, 350, 220].map((s, i) => (
                    <motion.div key={s} className="absolute rounded-full border border-cyber-neonCyan/10"
                        style={{ width: s, height: s }}
                        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                        transition={{ duration: 25 + i * 10, repeat: Infinity, ease: 'linear' }} />
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                className="relative z-10 w-full max-w-md">

                <div className="text-center mb-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.8 }}
                        className="inline-block mb-4">
                        <motion.div animate={{ filter: ['drop-shadow(0 0 8px rgba(0,243,255,0.4))', 'drop-shadow(0 0 25px rgba(0,243,255,1))', 'drop-shadow(0 0 8px rgba(0,243,255,0.4))'] }}
                            transition={{ duration: 2.5, repeat: Infinity }}>
                            <Shield className="w-14 h-14 text-cyber-neonCyan mx-auto" />
                        </motion.div>
                    </motion.div>
                    <h1 className="text-3xl font-display font-black text-white tracking-widest" style={{ animation: 'flicker 8s infinite' }}>
                        CYBER<span className="text-cyber-neonCyan">SHIELD</span>
                    </h1>
                    <p className="text-xs font-mono text-gray-500 tracking-widest mt-1">SECURE ACCESS PORTAL</p>
                </div>

                <div className="glass-panel p-8 relative border border-cyber-neonCyan/20">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-neonCyan/60" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-neonCyan/60" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-neonCyan/60" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-neonCyan/60" />

                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                        <div className="w-2 h-2 rounded-full bg-cyber-neonGreen animate-pulse" />
                        <span className="font-mono text-xs text-cyber-neonGreen tracking-widest">AUTHENTICATION REQUIRED</span>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mb-4 p-3 bg-cyber-neonRed/10 border border-cyber-neonRed/40 rounded font-mono text-xs text-cyber-neonRed">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 tracking-widest mb-2">EMAIL ADDRESS</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    placeholder="operator@domain.com"
                                    className="w-full bg-black/60 border border-gray-700 rounded pl-10 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyber-neonCyan transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 tracking-widest mb-2">PASSCODE</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                    placeholder="••••••••"
                                    className="w-full bg-black/60 border border-gray-700 rounded pl-10 pr-12 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyber-neonCyan transition-colors"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyber-neonCyan transition-colors">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="w-full py-3 bg-cyber-neonCyan text-black font-display font-black tracking-widest text-sm rounded flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] transition-all">
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> AUTHENTICATING...</>
                            ) : (
                                <><ChevronRight className="w-4 h-4" /> INITIATE ACCESS</>
                            )}
                        </motion.button>
                    </form>

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-800" />
                        <span className="text-gray-600 font-mono text-xs">OR</span>
                        <div className="flex-1 h-px bg-gray-800" />
                    </div>

                    <motion.button onClick={handleDemo} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-3 border border-cyber-neonCyan/40 text-cyber-neonCyan font-display font-bold tracking-widest text-sm rounded hover:bg-cyber-neonCyan/10 transition-all font-mono">
                        GUEST / DEMO ACCESS
                    </motion.button>

                    <p className="text-center mt-5 text-xs font-mono text-gray-600">
                        NO ACCOUNT?{' '}
                        <Link to="/signup" className="text-cyber-neonCyan hover:text-white transition-colors tracking-widest">
                            REQUEST CREDENTIALS
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;