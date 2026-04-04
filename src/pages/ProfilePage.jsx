import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Activity, Settings, LogOut, Edit3, Save, X, Camera, Lock, Bell, Cpu, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({ name: user?.name || '', organization: user?.organization || '', role: user?.role || 'Analyst' });

    const handleSave = () => {
        updateProfile(form);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const stats = [
        { label: 'Scans Run', value: user?.scansRun || 0, color: 'text-cyber-neonCyan' },
        { label: 'Threats Blocked', value: user?.threatsBlocked || 0, color: 'text-cyber-neonRed' },
        { label: 'Clearance', value: user?.clearanceLevel || 'LEVEL-1', color: 'text-cyber-neonPurple' },
        { label: 'Status', value: 'ACTIVE', color: 'text-cyber-neonGreen' },
    ];

    const activity = [
        { action: 'Malware scan completed', time: '2m ago', type: 'INFO' },
        { action: 'CVE-2024-1234 analyzed', time: '18m ago', type: 'WARNING' },
        { action: 'Phishing email detected', time: '1h ago', type: 'CRITICAL' },
        { action: 'Policy document uploaded', time: '3h ago', type: 'INFO' },
        { action: 'Dashboard accessed', time: '3h ago', type: 'INFO' },
    ];

    const typeColor = { CRITICAL: 'text-cyber-neonRed border-cyber-neonRed/40 bg-cyber-neonRed/10', WARNING: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10', INFO: 'text-cyber-neonCyan border-cyber-neonCyan/40 bg-cyber-neonCyan/10' };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-display mb-6 border-b border-cyber-neonCyan/30 pb-2">
                <span className="text-cyber-neonCyan">{"//"}</span> OPERATOR PROFILE
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

                {/* Left panel — identity card */}
                <div className="space-y-4">
                    <div className="glass-panel p-6 border border-cyber-neonCyan/20 relative">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyber-neonCyan/50" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyber-neonCyan/50" />

                        <div className="text-center">
                            <div className="relative inline-block mb-4">
                                <motion.div animate={{ boxShadow: ['0 0 10px rgba(0,243,255,0.3)', '0 0 25px rgba(0,243,255,0.7)', '0 0 10px rgba(0,243,255,0.3)'] }} transition={{ duration: 2.5, repeat: Infinity }}
                                    className="w-20 h-20 rounded-full bg-cyber-neonCyan/10 border-2 border-cyber-neonCyan flex items-center justify-center text-2xl font-display font-black text-cyber-neonCyan mx-auto">
                                    {user?.avatar || 'OP'}
                                </motion.div>
                                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-cyber-neonGreen border-2 border-cyber-black" />
                            </div>

                            <h3 className="text-lg font-display font-bold text-white">{user?.name || 'Unknown Operator'}</h3>
                            <p className="text-xs font-mono text-gray-500 mt-1">{user?.email}</p>
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-cyber-neonPurple/10 border border-cyber-neonPurple/40 rounded">
                                <Shield className="w-3 h-3 text-cyber-neonPurple" />
                                <span className="text-xs font-mono text-cyber-neonPurple font-bold">{user?.clearanceLevel || 'LEVEL-1'}</span>
                            </div>
                            <p className="text-xs font-mono text-gray-600 mt-2">{user?.organization || 'Independent'}</p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-800 space-y-2 text-xs font-mono">
                            <div className="flex justify-between"><span className="text-gray-500">ROLE</span><span className="text-gray-300">{user?.role || 'Analyst'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">JOINED</span><span className="text-gray-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">LAST LOGIN</span><span className="text-gray-300">{user?.loginTime ? new Date(user.loginTime).toLocaleTimeString() : 'Now'}</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {stats.map((s) => (
                            <div key={s.label} className="glass-panel p-3 text-center border border-gray-800">
                                <div className={`text-xl font-display font-black ${s.color}`}>{s.value}</div>
                                <div className="text-[10px] font-mono text-gray-600 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={handleLogout} className="w-full py-2.5 border border-cyber-neonRed/40 text-cyber-neonRed font-mono text-xs tracking-widest rounded hover:bg-cyber-neonRed/10 transition-all flex items-center justify-center gap-2">
                        <LogOut className="w-3 h-3" /> TERMINATE SESSION
                    </button>
                </div>

                {/* Right panel — tabs */}
                <div className="glass-panel border border-cyber-neonCyan/20 overflow-hidden">
                    <div className="flex border-b border-gray-800">
                        {[['overview', Activity, 'OVERVIEW'], ['settings', Settings, 'SETTINGS'], ['security', Lock, 'SECURITY']].map(([key, Icon, label]) => (
                            <button key={key} onClick={() => setTab(key)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-mono font-bold tracking-widest transition-all border-b-2 ${tab === key ? 'text-cyber-neonCyan border-cyber-neonCyan bg-cyber-neonCyan/5' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                                <Icon className="w-3.5 h-3.5" /> {label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {tab === 'overview' && (
                                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <h4 className="font-display text-sm text-gray-300 mb-4 tracking-widest">RECENT ACTIVITY</h4>
                                    <div className="space-y-3">
                                        {activity.map((a, i) => (
                                            <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}
                                                className={`p-3 rounded border text-xs font-mono flex justify-between items-center ${typeColor[a.type]}`}>
                                                <span>{a.action}</span>
                                                <span className="opacity-60 ml-4 whitespace-nowrap">{a.time}</span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="mt-6 p-4 bg-black/40 border border-cyber-neonCyan/20 rounded">
                                        <h4 className="font-display text-xs text-cyber-neonCyan mb-3 tracking-widest flex items-center gap-2">
                                            <Cpu className="w-3.5 h-3.5" /> SYSTEM PERMISSIONS
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Malware Scanner', 'Phishing Detector', 'CVE Analyzer', 'Policy AI', 'Honeypot Logs', 'NEXUS Chatbot'].map(p => (
                                                <div key={p} className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                                    <CheckCircle className="w-3 h-3 text-cyber-neonGreen" /> {p}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {tab === 'settings' && (
                                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <div className="flex justify-between items-center mb-5">
                                        <h4 className="font-display text-sm text-gray-300 tracking-widest">PROFILE SETTINGS</h4>
                                        {saved && <span className="text-cyber-neonGreen text-xs font-mono flex items-center gap-1"><CheckCircle className="w-3 h-3" /> SAVED</span>}
                                        {!editing ? (
                                            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-mono text-cyber-neonCyan hover:text-white transition-colors">
                                                <Edit3 className="w-3 h-3" /> EDIT
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={handleSave} className="flex items-center gap-1 text-xs font-mono text-cyber-neonGreen hover:text-white transition-colors">
                                                    <Save className="w-3 h-3" /> SAVE
                                                </button>
                                                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-white transition-colors">
                                                    <X className="w-3 h-3" /> CANCEL
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {[{ label: 'FULL NAME', key: 'name', type: 'text' }, { label: 'ORGANIZATION', key: 'organization', type: 'text' }, { label: 'ROLE', key: 'role', type: 'text' }].map(({ label, key, type }) => (
                                            <div key={key}>
                                                <label className="block text-xs font-mono text-gray-500 tracking-widest mb-1.5">{label}</label>
                                                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                                    disabled={!editing}
                                                    className={`w-full bg-black/60 border rounded px-4 py-2.5 text-white font-mono text-sm focus:outline-none transition-colors ${editing ? 'border-cyber-neonCyan/50 focus:border-cyber-neonCyan' : 'border-gray-800 text-gray-400'}`}
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-mono text-gray-500 tracking-widest mb-1.5">EMAIL ADDRESS</label>
                                            <input value={user?.email} disabled
                                                className="w-full bg-black/60 border border-gray-800 rounded px-4 py-2.5 text-gray-600 font-mono text-sm cursor-not-allowed" />
                                            <p className="text-[10px] font-mono text-gray-700 mt-1">Email cannot be changed</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {tab === 'security' && (
                                <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <h4 className="font-display text-sm text-gray-300 mb-5 tracking-widest">SECURITY STATUS</h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Authentication', status: 'LOCAL AUTH', ok: true },
                                            { label: 'Session Encryption', status: 'AES-256', ok: true },
                                            { label: 'Two-Factor Auth', status: 'NOT ENABLED', ok: false },
                                            { label: 'API Key', status: 'CONFIGURED', ok: true },
                                            { label: 'Last Password Change', status: 'TODAY', ok: true },
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-black/40 border border-gray-800 rounded font-mono text-sm">
                                                <span className="text-gray-400 text-xs">{item.label}</span>
                                                <span className={`text-xs font-bold ${item.ok ? 'text-cyber-neonGreen' : 'text-yellow-400'}`}>{item.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-5 p-4 bg-cyber-neonCyan/5 border border-cyber-neonCyan/20 rounded">
                                        <p className="text-xs font-mono text-gray-400">
                                            <span className="text-cyber-neonCyan font-bold">SECURITY NOTE:</span> Enable 2FA for enhanced account protection. Contact your administrator to upgrade clearance level.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfilePage;