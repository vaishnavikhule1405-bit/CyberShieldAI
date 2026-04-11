import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SpamShield = () => {
    const [isActive, setIsActive] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🔌 Replace this with backend API later
    const fetchLogs = async () => {
        setLoading(true);

        setTimeout(() => {
            const newLog = {
                id: Date.now(),
                email:
                    "alert@" +
                    Math.random().toString(36).substring(7) +
                    ".com",
                action: "Detected & Sent to Spam",
                risk: ["High", "Medium", "Low"][
                    Math.floor(Math.random() * 3)
                ],
                time: new Date().toLocaleTimeString(),
            };

            setLogs((prev) => [newLog, ...prev]);
            setLoading(false);
        }, 1000);
    };

    // 🔄 Auto scanning when active
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            fetchLogs();
        }, 4000);

        return () => clearInterval(interval);
    }, [isActive]);

    const toggleProtection = () => {
        setIsActive((prev) => !prev);
    };

    return (
        <div className="flex bg-[#0a0f1c] text-white min-h-screen">

            {/* Sidebar (use your existing one instead) */}
            <div className="w-64 bg-[#0f172a] p-6 border-r border-gray-800">
                <h2 className="text-xl font-bold text-cyan-400">
                    CyberShieldAI
                </h2>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">

                {/* Header */}
                <h1 className="text-3xl font-bold text-cyan-400 mb-6">
                    Spam Shield
                </h1>

                {/* User Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl mb-6 shadow-lg"
                >
                    <p className="text-lg font-semibold">Vaishnavi</p>
                    <p className="text-cyan-400 font-medium">
                        vaishnavi@gmail.com
                    </p>
                </motion.div>

                {/* Toggle + Status */}
                <div className="grid grid-cols-2 gap-6 mb-6">

                    {/* Toggle */}
                    <motion.div
                        className="bg-white/5 p-6 rounded-2xl border border-white/10"
                        whileHover={{ scale: 1.02 }}
                    >
                        <h2 className="mb-4 font-semibold">
                            Spam Protection
                        </h2>

                        <div
                            onClick={toggleProtection}
                            className={`w-20 h-10 flex items-center rounded-full p-1 cursor-pointer transition ${isActive ? "bg-green-500" : "bg-gray-600"
                                }`}
                        >
                            <motion.div
                                className="bg-white w-8 h-8 rounded-full shadow-md"
                                animate={{ x: isActive ? 40 : 0 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            />
                        </div>

                        <p className="mt-3 text-sm text-gray-400">
                            {isActive
                                ? "Protection is running..."
                                : "Click to activate protection"}
                        </p>
                    </motion.div>

                    {/* Status */}
                    <motion.div
                        className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-center"
                    >
                        <h2 className="font-semibold mb-2">Status</h2>

                        <div className="flex items-center gap-2">
                            <span
                                className={`w-3 h-3 rounded-full ${isActive
                                    ? "bg-green-400 animate-pulse"
                                    : "bg-red-400"
                                    }`}
                            ></span>

                            <span
                                className={`font-bold ${isActive
                                    ? "text-green-400"
                                    : "text-red-400"
                                    }`}
                            >
                                {isActive ? "Active" : "Stopped"}
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={fetchLogs}
                    className="mb-6 px-5 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-600 transition"
                >
                    Refresh Logs
                </button>

                {/* Logs Section */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">

                    <h2 className="text-lg font-semibold mb-4">
                        Live Threat Logs
                    </h2>

                    {loading && (
                        <div className="text-cyan-400 animate-pulse mb-3">
                            Scanning inbox...
                        </div>
                    )}

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {logs.length === 0 && (
                            <p className="text-gray-400 text-sm">
                                No threats detected yet.
                            </p>
                        )}

                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 rounded-xl bg-[#0f172a] border border-gray-700 flex justify-between"
                            >
                                <div>
                                    <p className="text-sm">{log.email}</p>
                                    <p className="text-xs text-gray-400">
                                        {log.action}
                                    </p>

                                    <span
                                        className={`text-xs font-bold ${log.risk === "High"
                                            ? "text-red-400"
                                            : log.risk === "Medium"
                                                ? "text-yellow-400"
                                                : "text-green-400"
                                            }`}
                                    >
                                        {log.risk} Risk
                                    </span>
                                </div>

                                <span className="text-xs text-gray-500">
                                    {log.time}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SpamShield;