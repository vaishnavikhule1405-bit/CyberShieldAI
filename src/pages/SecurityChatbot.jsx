import { useState, useRef, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Paperclip, Send, Trash2, Download, Zap } from 'lucide-react';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are NEXUS, an elite AI security copilot embedded in CyberShield — 
an advanced cybersecurity operations platform. You specialize in:
- Network security, firewall policies, and intrusion detection
- Malware analysis, ransomware response, and threat hunting
- CVE triage, patch management, and vulnerability remediation
- Incident response playbooks and forensic analysis
- Zero-trust architecture and compliance (ISO 27001, NIST, SOC2)

Respond in a concise, technical, no-nonsense style befitting a security operations center. 
Use markdown code blocks with language tags when showing commands or configs.
Keep responses focused and actionable. Use terminal-style formatting where appropriate.`;

const QUICK_PROMPTS = [
  { label: '🚨 Active Breach', prompt: 'Our server is sending unusual outbound traffic at 3AM. Give me the first 5 immediate steps.' },
  { label: '🛡️ Harden Linux', prompt: 'Give me a hardening checklist for a production Ubuntu 22.04 server.' },
  { label: '🔍 CVE Explain', prompt: 'Explain CVE-2023-44487 HTTP/2 Rapid Reset and how to patch it.' },
  { label: '🔥 Firewall Rules', prompt: 'Write UFW firewall rules for a Node.js web server exposing ports 80 and 443 only.' },
  { label: '🎭 Red Team', prompt: 'As a red teamer, what are the first 3 things you do after initial access to a corporate network?' },
  { label: '🦠 Ransomware IOCs', prompt: 'List key indicators of compromise (IOCs) for a ransomware infection.' },
];

// Simple code block + bold renderer
const renderContent = (content) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const lang = lines[0].trim() || 'bash';
      const code = lines.slice(1).join('\n').trim();
      return (
        <div key={i} className="my-3 rounded-lg overflow-hidden border border-cyber-neonCyan/30">
          <div className="flex items-center justify-between bg-black/80 px-4 py-2 border-b border-cyber-neonCyan/20">
            <span className="text-xs text-cyber-neonCyan font-mono uppercase tracking-widest">{lang}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="text-xs text-gray-500 hover:text-cyber-neonCyan transition-colors font-mono"
            >
              [ copy ]
            </button>
          </div>
          <pre className="bg-black/60 p-4 overflow-x-auto text-xs text-cyber-neonGreen leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    const formatted = part.split('\n').map((line, j) => {
      const boldParts = line.split(/(\*\*.*?\*\*)/g).map((seg, k) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={k} className="text-white font-bold">{seg.slice(2, -2)}</strong>;
        }
        return seg;
      });
      return <span key={j}>{boldParts}{j < part.split('\n').length - 1 && <br />}</span>;
    });
    return <span key={i}>{formatted}</span>;
  });
};

const SecurityChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'INTELLIGENCE UPLINK SECURED.\n\nI am NEXUS — your AI security copilot. I can help with incident response, threat hunting, CVE analysis, firewall configuration, and more.\n\nState your query or select a quick action below.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [tokenCount, setTokenCount] = useState(0);
  const endOfMessagesRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = useCallback(async (overrideInput) => {
    const query = overrideInput ?? input;
    if (!query.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const history = [...messages, userMessage]
        .filter((_, i) => i !== 0)
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          max_tokens: 1024,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            fullText += delta;
            totalTokens = parsed.x_groq?.usage?.completion_tokens ?? totalTokens;
            setStreamingText(fullText);
          } catch (e) {
            console.warn('Failed to parse chunk', e);
          }
        }
      }

      setTokenCount((prev) => prev + totalTokens);
      setMessages((prev) => [...prev, { role: 'assistant', content: fullText, timestamp: new Date() }]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `[ERROR] UPLINK FAILED: ${err.message}\n\nCheck your VITE_GROQ_API_KEY in .env`, timestamp: new Date(), isError: true },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  }, [input, isStreaming, messages]);

  const handleAbort = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingText('');
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: 'Session cleared. NEXUS uplink re-established. Ready for new queries.', timestamp: new Date() }]);
    setTokenCount(0);
    setError(null);
  };

  const handleExport = () => {
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleTimeString()}\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-session-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] flex gap-6 max-w-6xl mx-auto">

      {/* Sidebar */}
      <div className="w-72 glass-panel hidden md:flex flex-col p-4 gap-4">
        <div>
          <h3 className="font-display text-sm text-cyber-neonCyan border-b border-cyber-neonCyan/30 pb-2 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> QUICK ACTIONS
          </h3>
          <div className="space-y-2">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => handleSend(qp.prompt)}
                disabled={isStreaming}
                className="w-full text-left px-3 py-2 bg-black/40 border border-gray-800 rounded text-xs font-mono text-gray-400 hover:text-cyber-neonCyan hover:border-cyber-neonCyan/50 hover:bg-cyber-neonCyan/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-display text-sm text-cyber-neonCyan border-b border-cyber-neonCyan/30 pb-2 mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4" /> KNOWLEDGE BASE
          </h3>
          <div className="space-y-2">
            <DocItem name="ISO_27001_Compliance.pdf" size="2.4MB" />
            <DocItem name="Incident_Response_Playbook.md" size="45KB" />
            <DocItem name="Firewall_Ruleset_v3.json" size="12KB" />
            <DocItem name="ZeroTrust_Architecture.docx" size="1.1MB" />
          </div>
          <button className="w-full neon-button text-xs py-2 mt-3">+ INGEST DOCUMENT</button>
        </div>

        <div className="p-3 bg-black/40 border border-cyber-neonCyan/20 rounded text-xs font-mono space-y-1">
          <div className="text-cyber-neonGreen">▸ MODEL: llama-3.3-70b</div>
          <div className="text-gray-500">▸ MESSAGES: {messages.length}</div>
          <div className="text-gray-500">▸ TOKENS USED: ~{tokenCount}</div>
          <div className="text-gray-500">▸ PROVIDER: Groq (free)</div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 glass-panel flex flex-col p-0 overflow-hidden border-t-4 border-t-cyber-neonCyan shadow-[0_0_30px_rgba(0,243,255,0.1)]">

        {/* Header */}
        <div className="bg-black/70 px-5 py-3 border-b border-cyber-neonCyan/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isStreaming ? 'border-cyber-neonGreen bg-cyber-neonGreen/20 shadow-[0_0_15px_#39ff14]' : 'border-cyber-neonCyan bg-cyber-neonCyan/20 shadow-[0_0_10px_#00f3ff]'}`}>
              <MessageSquare className={`w-5 h-5 ${isStreaming ? 'text-cyber-neonGreen animate-pulse' : 'text-cyber-neonCyan'}`} />
            </div>
            <div>
              <h2 className="font-display font-bold text-white tracking-widest text-base">NEXUS COPILOT</h2>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-cyber-neonGreen animate-pulse' : 'bg-cyber-neonGreen'}`} />
                <p className="text-xs font-mono text-gray-400">
                  {isStreaming ? 'COMPUTING RESPONSE...' : 'ONLINE — Groq / Llama 3.3 70B'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleExport} title="Export session" className="p-2 text-gray-500 hover:text-cyber-neonCyan transition-colors rounded">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleClear} title="Clear session" className="p-2 text-gray-500 hover:text-cyber-neonRed transition-colors rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-xl font-mono text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyber-neonCyan/15 text-cyber-neonCyan border border-cyber-neonCyan/40 rounded-br-none'
                      : msg.isError
                        ? 'bg-cyber-neonRed/10 text-cyber-neonRed border border-cyber-neonRed/40 rounded-bl-none'
                        : 'bg-black/50 text-gray-300 border border-white/10 rounded-bl-none'
                  }`}>
                    {msg.role === 'assistant' && !msg.isError && (
                      <span className="text-cyber-neonCyan font-bold text-xs mb-2 block tracking-widest">{'[NEXUS] >'}</span>
                    )}
                    <div>{renderContent(msg.content)}</div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-600 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming bubble */}
          {isStreaming && streamingText && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="max-w-[85%] flex flex-col gap-1 items-start">
                <div className="p-4 rounded-xl rounded-bl-none bg-black/50 text-gray-300 border border-white/10 font-mono text-sm leading-relaxed">
                  <span className="text-cyber-neonCyan font-bold text-xs mb-2 block tracking-widest">{'[NEXUS] >'}</span>
                  <div>{renderContent(streamingText)}</div>
                  <span className="inline-block w-2 h-4 bg-cyber-neonCyan ml-1 animate-pulse align-middle" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Thinking dots */}
          {isStreaming && !streamingText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="p-4 rounded-xl rounded-bl-none bg-black/50 border border-white/10 flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyber-neonCyan"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-gray-500">Querying threat matrix...</span>
              </div>
            </motion.div>
          )}

          <div ref={endOfMessagesRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-black/60 border-t border-cyber-neonCyan/20">
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-cyber-neonRed font-mono text-xs mb-2 flex items-center gap-2">
              <span className="animate-pulse">⚠</span> {error}
            </motion.p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-cyber-neonCyan font-bold font-mono text-lg leading-none">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Query security parameters..."
              disabled={isStreaming}
              className="flex-1 bg-cyber-dark border border-gray-700 rounded-full py-3 px-5 text-white font-mono text-sm focus:outline-none focus:border-cyber-neonCyan focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all disabled:opacity-50 placeholder:text-gray-600"
            />
            {isStreaming ? (
              <button onClick={handleAbort} className="shrink-0 px-4 py-2 text-xs font-mono font-bold border border-cyber-neonRed text-cyber-neonRed hover:bg-cyber-neonRed hover:text-black rounded-full transition-all">
                STOP
              </button>
            ) : (
              <button onClick={() => handleSend()} disabled={!input.trim()} className="shrink-0 p-3 bg-cyber-neonCyan/20 border border-cyber-neonCyan/50 text-cyber-neonCyan hover:bg-cyber-neonCyan hover:text-black rounded-full transition-all disabled:opacity-30">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] font-mono text-gray-700 mt-2 text-center">
            ENTER to send · STOP to abort stream · Session not stored
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const DocItem = ({ name, size }) => (
  <div className="p-2.5 bg-black/40 border border-gray-800 rounded flex justify-between items-center hover:border-cyber-neonCyan/50 transition-colors cursor-pointer group">
    <div className="truncate pr-2 font-mono text-xs text-gray-400 group-hover:text-white">{name}</div>
    <div className="text-[10px] text-cyber-neonCyan whitespace-nowrap">{size}</div>
  </div>
);

export default SecurityChatbot;