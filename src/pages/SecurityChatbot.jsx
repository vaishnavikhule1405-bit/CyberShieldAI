import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Paperclip, Send } from 'lucide-react';

const SecurityChatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "INTELLIGENCE UPLINK SECURED. State your query regarding network policy or incident response." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = "I am processing your request through the global threat matrix.";
      const q = input.toLowerCase();
      
      if (q.includes("policy") || q.includes("firewall")) {
        aiResponse = "Firewall Policy 402-B dictates that all inbound connections on ports 20-25 are strictly blocked unless routed through the secure bastion host.";
      } else if (q.includes("breach") || q.includes("compromised")) {
        aiResponse = "IMMEDIATE ACTION REQUIRED: Isolate affected nodes. Revoke active JWT tokens. Initiate memory dump of the compromised server for forensic analysis.";
      } else if (q.includes("generate") || q.includes("report")) {
        aiResponse = "Compiling 24h threat telemetry... Report generated and sent to SecOps aliases.";
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] flex gap-6 max-w-6xl mx-auto">
      
      {/* Sidebar / Uploaded Docs */}
      <div className="w-1/3 glass-panel hidden md:flex flex-col p-4">
        <h3 className="font-display text-lg text-cyber-neonCyan border-b border-cyber-neonCyan/30 pb-2 mb-4 flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> KNOWLEDGE BASE
        </h3>
        <div className="flex-1 space-y-2 overflow-y-auto">
          <DocItem name="ISO_27001_Compliance.pdf" size="2.4MB" />
          <DocItem name="Incident_Response_Playbook.md" size="45KB" />
          <DocItem name="Firewall_Ruleset_v3.json" size="12KB" />
          <DocItem name="ZeroTrust_Architecture.docx" size="1.1MB" />
        </div>
        <button className="w-full neon-button text-sm py-2 mt-4">+ INGEST DOCUMENT</button>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 glass-panel flex flex-col p-0 overflow-hidden relative border-t-4 border-t-cyber-neonCyan shadow-[0_0_20px_rgba(0,243,255,0.15)]">
        
        {/* Chat Header */}
        <div className="bg-black/60 p-4 border-b border-cyber-neonCyan/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-cyber-neonCyan flex items-center justify-center bg-cyber-neonCyan/20 shadow-[0_0_10px_#00f3ff]">
            <MessageSquare className="text-cyber-neonCyan w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white tracking-widest text-lg">NEXUS COPILOT</h2>
            <p className="text-xs font-mono text-cyber-neonGreen">ONLINE - LLM VER: 7.4.2</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-black/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-lg font-mono text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-cyber-neonCyan/20 text-cyber-neonCyan border border-cyber-neonCyan/50 rounded-br-none' 
                  : 'bg-black/60 text-gray-300 border border-gray-600 rounded-bl-none shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]'
              }`}>
                {msg.role === 'ai' && <span className="text-cyber-neonCyan font-bold mb-1 block">{"[NEXUS] >"}</span>}
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-black/60 border border-gray-600 p-4 rounded-lg rounded-bl-none">
                <span className="text-cyber-neonCyan font-mono animate-pulse">Computing correlation...</span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/60 border-t border-cyber-neonCyan/20">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-cyber-neonCyan font-bold">{">"}</span>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query security parameters..."
              className="w-full bg-cyber-dark border border-gray-700 rounded-full py-3 pl-10 pr-12 text-white font-mono focus:outline-none focus:border-cyber-neonCyan focus:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 p-2 text-cyber-neonCyan hover:text-white transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

const DocItem = ({ name, size }) => (
  <div className="p-3 bg-black/40 border border-gray-800 rounded flex justify-between items-center hover:border-cyber-neonCyan/50 transition-colors cursor-pointer group">
    <div className="truncate pr-2 font-mono text-sm text-gray-300 group-hover:text-white">{name}</div>
    <div className="text-xs text-cyber-neonCyan whitespace-nowrap">{size}</div>
  </div>
);

export default SecurityChatbot;
