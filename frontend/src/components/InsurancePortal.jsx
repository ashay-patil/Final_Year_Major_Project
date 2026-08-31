import React, { useState, useEffect } from 'react';
import { Shield, Building2, Heart, DollarSign, CheckCircle, AlertTriangle, Percent, Send, Brain, Sparkles, Info, Search, TrendingUp, Users } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const InsurancePortal = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [recDiagnosis, setRecDiagnosis] = useState('');
  const [recBill, setRecBill] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/insurance/companies`)
      .then(r => r.json())
      .then(data => {
        setCompanies(data.companies || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleAskAI = async (question) => {
    if (!question) return;
    setChatLoading(true);
    setChatInput(question);
    try {
      const res = await fetch(`${API_BASE_URL}/api/insurance/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, diagnosis: '' })
      });
      const data = await res.json();
      setChatResponse(data.answer || 'No response from AI.');
    } catch (err) {
      setChatResponse('Error reaching AI advisor.');
    }
    setChatLoading(false);
  };

  const handleRecommend = async () => {
    if (!recDiagnosis || !recBill) return;
    setRecLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/insurance/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosis: recDiagnosis, total_bill: Number(recBill) })
      });
      const data = await res.json();
      setRecommendation(data);
    } catch (err) {
      console.error(err);
    }
    setRecLoading(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-[#0a0e1a] to-[#111827] min-h-screen text-white animate-[fadeIn_0.3s_ease-out]">
      <div className="max-w-7xl mx-auto">
        {/* Section 1 - Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="text-indigo-500 w-8 h-8"/> 
            Insurance Portal
          </h1>
          <p className="text-gray-400">AI-powered insurance coverage analysis with LangChain RAG</p>
        </div>

        {/* Section 2 - Insurance Company Cards */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Building2 className="text-indigo-400"/> Partner Networks</h2>
          {loading ? (
            <div className="text-gray-400 flex items-center gap-2">Loading companies...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companies.map(c => (
                <div key={c.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: c.logo_color || '#6366f1' }}></div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg" style={{ color: c.logo_color || '#fff' }}>{c.name}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-lg">{c.plan_name}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 h-10">{c.description}</p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400"/> Coverage</span>
                      <span className="font-medium text-white">Up to ₹{(c.max_coverage/100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400"/> Concession</span>
                      <span className="font-medium text-white">{c.bill_concession_percent}% Bill Coverage</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400"/> Co-pay</span>
                      <span className="font-medium text-white">{c.copay_percent}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-white/5 p-2 rounded-lg text-center">
                        <div className="text-xs text-gray-400">Settlement</div>
                        <div className="font-medium text-white">{c.claim_settlement_ratio}%</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg text-center">
                        <div className="text-xs text-gray-400">Network</div>
                        <div className="font-medium text-white">{c.network_hospitals}+</div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-indigo-500/20 text-indigo-300 font-medium rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">
                    Select Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Section 3 - AI Insurance Advisor */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><Brain className="text-purple-400"/> AI Insurance Advisor</h2>
            
            <div className="mb-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about insurance coverage..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI(chatInput)}
                />
                <button 
                  onClick={() => handleAskAI(chatInput)}
                  disabled={chatLoading || !chatInput}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {chatLoading ? <Search className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {["Which plan covers cardiac surgery?", "Compare Star Health vs HDFC ERGO", "What's covered under Ayushman Bharat?"].map(s => (
                <button 
                  key={s} 
                  onClick={() => handleAskAI(s)}
                  className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {chatResponse && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 text-sm text-purple-100 leading-relaxed shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-1"/>
                  <div className="whitespace-pre-wrap">{chatResponse}</div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4 - AI Plan Recommender */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><TrendingUp className="text-emerald-400"/> AI Plan Recommender</h2>
            <p className="text-sm text-gray-400 mb-4">Enter patient details to get the best insurance plan recommendation.</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Diagnosis</label>
                <select 
                  value={recDiagnosis}
                  onChange={(e) => setRecDiagnosis(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="" className="bg-[#0f172a]">Select Diagnosis...</option>
                  <option value="Cardiac Surgery" className="bg-[#0f172a]">Cardiac Surgery</option>
                  <option value="Appendectomy" className="bg-[#0f172a]">Appendectomy</option>
                  <option value="Dengue Fever" className="bg-[#0f172a]">Dengue Fever</option>
                  <option value="Fracture" className="bg-[#0f172a]">Fracture</option>
                  <option value="Maternity" className="bg-[#0f172a]">Maternity</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Estimated Bill (₹)</label>
                <input 
                  type="number"
                  value={recBill}
                  onChange={(e) => setRecBill(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleRecommend}
              disabled={recLoading || !recDiagnosis || !recBill}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl mb-6 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {recLoading ? <Search className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
              Get AI Recommendation
            </button>

            {recommendation && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                {recommendation.recommendation && (
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 mb-4 text-sm text-emerald-100">
                    <strong className="text-emerald-400 block mb-1">AI Recommendation:</strong>
                    <div className="whitespace-pre-wrap">{recommendation.recommendation}</div>
                  </div>
                )}

                {recommendation.all_plans && recommendation.all_plans.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                          <th className="pb-2">Company</th>
                          <th className="pb-2">Coverage</th>
                          <th className="pb-2">You Pay</th>
                          <th className="pb-2">Savings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recommendation.all_plans.map((c, idx) => (
                          <tr key={idx} className={idx === 0 ? "bg-emerald-500/10" : ""}>
                            <td className="py-2 font-medium">{c.company}</td>
                            <td className="py-2">{c.concession_percent}%</td>
                            <td className="py-2 text-rose-300">₹{c.final_amount?.toLocaleString('en-IN')}</td>
                            <td className="py-2 text-emerald-400 font-bold">₹{c.savings?.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InsurancePortal;
