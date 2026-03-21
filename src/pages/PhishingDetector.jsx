import { useState } from 'react';
import { motion } from 'framer-motion';
import { MailSearch, Wand2, UploadCloud, X } from 'lucide-react';

const PhishingDetector = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeContent = async () => {
    if (!text.trim() && !file) return;
    
    setAnalyzing(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }

      // We need axios or fetch, fetch is fine.
      const res = await fetch('http://127.0.0.1:5000/api/phish/analyze', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        let isPh = data.data.isPhishing;
        let conf = data.data.confidence;

        // Override: If the AI says it's "clean" but with low confidence (< 70%), 
        // it means there are heavily suspicious elements. Flag it as RED (Phishing).
        if (!isPh && conf < 70) {
           isPh = true;
           // Keep the original low confidence score so the user sees it's a border case
        }

        setResult({
          isPhishing: isPh,
          confidence: conf,
          highlighted: data.data.explanation
        });
      } else {
        setResult({
          isPhishing: false,
          confidence: 0,
          highlighted: data.details ? `Error: ${JSON.stringify(data.details)}` : (data.error || 'Analysis failed or no response from AI models.')
        });
      }
    } catch (err) {
      console.error(err);
      setResult({
        isPhishing: false,
        confidence: 0,
        highlighted: 'System connection error to deep learning clusters.'
      });
    } finally {
      setAnalyzing(false);
    }
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
            <MailSearch className="text-cyber-neonCyan" /> Input Payload
          </h3>
          
          <div className="flex-1 flex flex-col gap-4">
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!!file}
              className="flex-1 min-h-[150px] bg-black/50 border border-cyber-neonCyan/30 rounded p-4 text-gray-200 font-mono text-sm focus:outline-none focus:border-cyber-neonCyan focus:shadow-[0_0_10px_rgba(0,243,255,0.3)] resize-none disabled:opacity-50"
              placeholder="Paste suspicious HTTP/SMTP payload or raw text here..."
            />
            
            <div className={`relative border-2 border-dashed ${file ? 'border-cyber-neonCyan bg-cyber-neonCyan/10' : 'border-gray-600'} rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[120px]`}>
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                disabled={!!text.trim()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                accept="image/*,video/*,.eml,.txt"
              />
              {file ? (
                <div className="flex flex-col items-center z-10">
                   <UploadCloud className="text-cyber-neonCyan w-8 h-8 mb-2" />
                   <span className="text-gray-200 font-mono text-sm truncate max-w-[200px]">{file.name}</span>
                   <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-cyber-neonRed hover:text-red-400 mt-2 text-xs relative z-30 bg-black/50 px-2 py-1 rounded">Remove File</button>
                </div>
              ) : (
                <div className="flex flex-col items-center z-10">
                  <UploadCloud className={`w-8 h-8 mb-2 ${text.trim() ? 'text-gray-600' : 'text-gray-400'}`} />
                  <span className={`font-mono text-xs ${text.trim() ? 'text-gray-600' : 'text-gray-400'}`}>
                    Drag & Drop or Click to upload suspect files<br/>
                    (Images, Videos, Emails)
                  </span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={analyzeContent}
            disabled={analyzing || (!text && !file)}
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
                {result.isPhishing ? `PHISHING DETECTED (${result.confidence}%)` : `CLEAN COMMUNICATION (${result.confidence}%)`}
              </div>
              
              <div className="flex-1 bg-black/40 rounded p-4 font-mono text-sm border border-gray-800 overflow-y-auto">
                <div className="text-gray-500 mb-2 border-b border-gray-700 pb-1">AI Reasoning & Tokenized Threats:</div>
                <div dangerouslySetInnerHTML={{ __html: result.highlighted }} className="whitespace-pre-wrap leading-relaxed space-y-2" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PhishingDetector;
