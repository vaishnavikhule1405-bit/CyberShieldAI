import { useState } from 'react';
import { motion } from 'framer-motion';
import { MailSearch, Wand2 } from 'lucide-react';

const PhishingDetector = () => {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeText = () => {
    if (!text.trim()) return;
    
    setAnalyzing(true);
    setResult(null);

    // Simulated NLP processing delay
    setTimeout(() => {
      setAnalyzing(false);
      
      const lowerText = text.toLowerCase();
      const isPhishing = lowerText.includes('urgent') || lowerText.includes('verify') || lowerText.includes('click') || lowerText.includes('password');

      let highlightedHTML = text;
      // Simple highlight replace
      ['urgent', 'verify', 'click', 'password', 'account', 'invoice'].forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        highlightedHTML = highlightedHTML.replace(regex, `<span class="bg-red-900/40 text-cyber-neonRed border border-cyber-neonRed/50 px-1 rounded animate-pulse">$1</span>`);
      });

      setResult({
        isPhishing,
        confidence: isPhishing ? Math.floor(Math.random() * 10 + 90) : Math.floor(Math.random() * 10 + 10),
        highlighted: highlightedHTML
      });
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto h-full flex flex-col">
      <h2 className="text-3xl font-display mb-6 border-b border-cyber-neonCyan/30 pb-2">
        <span className="text-cyber-neonCyan">{"//"}</span> NLP PHISHING INTERCEPTOR
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Input Area */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-xl mb-4 font-bold flex items-center gap-2">
            <MailSearch className="text-cyber-neonCyan" /> Raw Email Content
          </h3>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-black/50 border border-cyber-neonCyan/30 rounded p-4 text-gray-200 font-mono text-sm focus:outline-none focus:border-cyber-neonCyan focus:shadow-[0_0_10px_rgba(0,243,255,0.3)] resize-none"
            placeholder="Paste suspicious HTTP/SMTP payload or raw text here..."
          />
          <button 
            onClick={analyzeText}
            disabled={analyzing || !text}
            className="neon-button mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <><span className="animate-spin text-xl">🛡️</span> DEEP SCANNING...</>
            ) : (
              <><Wand2 className="w-5 h-5"/> INITIATE NLP ANALYSIS</>
            )}
          </button>
        </div>

        {/* Output Area */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-xl mb-4 font-bold text-gray-300">Analysis Output</h3>
          
          {!result && !analyzing && (
            <div className="flex-1 flex items-center justify-center text-gray-500 font-mono text-center border border-dashed border-gray-600 rounded">
              SYSTEM STANDBY.<br/>AWAITING PAYLOAD.
            </div>
          )}

          {analyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-cyber-neonCyan font-mono space-y-4">
              <div className="w-16 h-16 border-4 border-cyber-neonCyan border-t-transparent rounded-full animate-spin"></div>
              <p className="animate-pulse">Loading neural weights...</p>
            </div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className={`p-4 rounded border-2 mb-4 font-display font-bold text-2xl text-center ${result.isPhishing ? 'bg-red-900/20 text-cyber-neonRed border-cyber-neonRed shadow-[0_0_15px_rgba(255,0,60,0.3)]' : 'bg-green-900/20 text-cyber-neonGreen border-cyber-neonGreen'}`}>
                {result.isPhishing ? `PHISHING DETECTED (${result.confidence}%)` : `CLEAN COMMUNICATION (${100 - result.confidence}%)`}
              </div>
              
              <div className="flex-1 bg-black/40 rounded p-4 font-mono text-sm border border-gray-800 overflow-y-auto">
                <div className="text-gray-500 mb-2 border-b border-gray-700 pb-1">Tokenized Threat Highlights:</div>
                <div dangerouslySetInnerHTML={{ __html: result.highlighted }} className="whitespace-pre-wrap leading-relaxed" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PhishingDetector;
