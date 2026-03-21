import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, FileText, CheckCircle, Loader, Shield } from 'lucide-react';
import axios from 'axios';

const PolicyChatbot = () => {
  const [policyLoaded, setPolicyLoaded] = useState(false);
  const [policyInfo, setPolicyInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Upload your security policy document (PDF) and I will answer any questions about it.',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const checkPolicy = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:5000/api/policy-status');
        if (res.data.data.loaded) {
          setPolicyLoaded(true);
          setPolicyInfo({ filename: res.data.data.filename });
        }
      } catch (err) {
        console.log('No policy loaded yet');
      }
    };
    checkPolicy();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('policy', file);

      const response = await axios.post(
        'http://127.0.0.1:5000/api/upload-policy',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        setPolicyLoaded(true);
        setPolicyInfo(response.data.data);
        setMessages([
          {
            role: 'assistant',
            content: `✅ Policy document loaded successfully!

📄 File: ${response.data.data.filename}
📝 Characters: ${response.data.data.characters}

You can now ask me anything about your security policy! For example:
- "What is the password policy?"
- "Can employees use personal USB drives?"
- "What should I do if I suspect a breach?"`,
          }
        ]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload PDF. Make sure your backend is running.');
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!input.trim() || loading) return;

    const question = input;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: question }]);

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/api/ask-policy',
        { question }
      );

      if (response.data.success) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: response.data.data.answer 
          }
        ]);
      }
    } catch (err) {
      console.error('Question error:', err);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: '[ERROR] Failed to get answer. Make sure your backend is running.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What is the password policy?",
    "Can employees use personal USB drives?",
    "What should I do if I suspect a data breach?",
    "What are the remote work security requirements?",
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-4"
    >
      <h2 className="text-3xl font-display border-b border-cyber-neonCyan/30 pb-2">
        <span className="text-cyber-neonCyan">{"//"}</span> SECURITY POLICY INTERFACE
      </h2>

      <div className="flex gap-4 flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-72 flex flex-col gap-4">
          <div className="glass-panel p-4">
            <h3 className="font-display text-sm text-cyber-neonCyan mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> POLICY DOCUMENT
            </h3>

            {policyLoaded ? (
              <div className="p-3 bg-cyber-neonGreen/10 border border-cyber-neonGreen/30 rounded">
                <div className="flex items-center gap-2 text-cyber-neonGreen text-xs font-mono mb-1">
                  <CheckCircle className="w-4 h-4" />
                  POLICY LOADED
                </div>
                <div className="text-xs text-gray-400 font-mono truncate">
                  {policyInfo?.filename}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-black/40 border border-dashed border-gray-600 rounded text-center">
                <FileText className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p className="text-xs text-gray-500 font-mono">No policy loaded</p>
              </div>
            )}

            <input
              type="file"
              id="policyUpload"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />

            <button
              onClick={() => document.getElementById('policyUpload').click()}
              disabled={uploading}
              className="w-full neon-button text-xs py-2 mt-3 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader className="w-3 h-3 animate-spin" /> UPLOADING...</>
              ) : (
                <><Upload className="w-3 h-3" /> {policyLoaded ? 'CHANGE POLICY' : 'UPLOAD PDF'}</>
              )}
            </button>

            {error && (
              <p className="text-cyber-neonRed text-xs font-mono mt-2">{error}</p>
            )}
          </div>

          {policyLoaded && (
            <div className="glass-panel p-4">
              <h3 className="font-display text-sm text-cyber-neonCyan mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> SAMPLE QUESTIONS
              </h3>
              <div className="space-y-2">
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="w-full text-left text-xs font-mono text-gray-400 hover:text-cyber-neonCyan p-2 bg-black/40 border border-gray-800 hover:border-cyber-neonCyan/50 rounded transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-panel flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-xl font-mono text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-cyber-neonCyan/15 text-cyber-neonCyan border border-cyber-neonCyan/40 rounded-br-none'
                      : msg.isError
                        ? 'bg-cyber-neonRed/10 text-cyber-neonRed border border-cyber-neonRed/40'
                        : 'bg-black/50 text-gray-300 border border-white/10 rounded-bl-none'
                  }`}>
                    {msg.role === 'assistant' && !msg.isError && (
                      <span className="text-cyber-neonCyan font-bold text-xs mb-2 block">
                        [POLICY AI] {'>'}
                      </span>
                    )}
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyber-neonCyan"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                  <span className="text-xs font-mono text-gray-500 ml-2">
                    Reading policy document...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={endRef} />
          </div>

          <div className="p-4 border-t border-cyber-neonCyan/20 bg-black/40">
            {!policyLoaded && (
              <p className="text-yellow-400 font-mono text-xs mb-2 text-center animate-pulse">
                ⚠ Upload a policy document first to start asking questions
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-cyber-neonCyan font-bold font-mono text-lg">{'>'}</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder={policyLoaded ? "Ask about your security policy..." : "Upload a PDF first..."}
                disabled={!policyLoaded || loading}
                className="flex-1 bg-cyber-dark border border-gray-700 rounded-full py-3 px-5 text-white font-mono text-sm focus:outline-none focus:border-cyber-neonCyan transition-all disabled:opacity-50"
              />
              <button
                onClick={handleAsk}
                disabled={!input.trim() || !policyLoaded || loading}
                className="p-3 bg-cyber-neonCyan/20 border border-cyber-neonCyan/50 text-cyber-neonCyan hover:bg-cyber-neonCyan hover:text-black rounded-full transition-all disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PolicyChatbot;