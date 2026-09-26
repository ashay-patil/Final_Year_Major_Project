import React, { useState } from 'react';
import { Send, Brain, Sparkles } from 'lucide-react';
import apiService from '../../services/api';

const PolicyRagPanel = ({ claimId }) => {
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "What's covered?",
    "Pre-auth requirements?",
    "Exclusions?",
    "Room rent limit?"
  ];

  const handleAsk = async (qText) => {
    if (!qText || !claimId) return;
    
    setChat(prev => [...prev, { role: 'user', text: qText }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await apiService.insurancePolicyAsk(claimId, qText);
      setChat(prev => [...prev, { role: 'ai', text: res.answer || 'No answer found.', sources: res.source_chunks }]);
    } catch (err) {
      console.error(err);
      setChat(prev => [...prev, { role: 'ai', text: 'Error querying policy data.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-[500px]">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Policy AI Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {chat.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Ask anything about the patient's policy.</p>
          </div>
        ) : (
          chat.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#0a0e1a] border border-white/10 text-gray-300'}`}>
                {msg.text}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-500">
                    Source: {msg.sources[0].substring(0, 50)}...
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0a0e1a] border border-white/10 rounded-xl p-3 text-sm text-gray-400 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestions.map(s => (
          <button 
            key={s} 
            onClick={() => handleAsk(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk(question)}
          placeholder="Ask a question..."
          className="flex-1 bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        />
        <button 
          onClick={() => handleAsk(question)}
          disabled={loading || !question}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PolicyRagPanel;
