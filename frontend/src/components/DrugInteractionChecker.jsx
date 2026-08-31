import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle, Activity, Loader2, Info } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const DrugInteractionChecker = ({ medications = [] }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const checkInteractions = async () => {
    if (medications.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-drug-interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications })
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to check drug interactions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (medications.length < 2) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6 flex items-center gap-4 shadow-lg transition-all duration-300">
        <Info className="w-6 h-6 text-blue-400" />
        <p className="text-gray-300 font-medium">Need at least 2 medications to check interactions.</p>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'dangerous': return 'text-red-400 border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'caution': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      case 'safe':
      default: return 'text-green-400 border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">CRITICAL</span>;
      case 'severe':
        return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-full text-xs font-bold">SEVERE</span>;
      case 'moderate':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-bold">MODERATE</span>;
      case 'mild':
      default:
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-xs font-bold">MILD</span>;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6 transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-400" /> Drug Interactions
          </h3>
          <p className="text-sm text-gray-400 mt-1">Analyzing {medications.length} medications for potential risks.</p>
        </div>
        <button
          onClick={checkInteractions}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 disabled:opacity-50 flex items-center gap-2 border border-blue-400/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
          {loading ? 'Checking...' : 'Check Interactions'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap items-center gap-4">
            <div className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-2 ${getRiskColor(results.risk || (results.interactions?.length ? 'Caution' : 'Safe'))}`}>
              {(!results.interactions || results.interactions.length === 0) ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {results.risk || (results.interactions?.length ? 'Interactions Found' : 'Safe')}
            </div>
            
            <div className="flex gap-4 text-sm">
              <div className="bg-[#0a0e1a]/50 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-gray-400">Total Pairs:</span> <span className="text-white font-bold">{results.stats?.total_checked || 0}</span>
              </div>
              <div className="bg-[#0a0e1a]/50 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-gray-400">Safe:</span> <span className="text-green-400 font-bold">{results.stats?.safe_pairs || 0}</span>
              </div>
              <div className="bg-[#0a0e1a]/50 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-gray-400">Interactions:</span> <span className="text-yellow-400 font-bold">{results.stats?.interactions_found || (results.interactions?.length || 0)}</span>
              </div>
            </div>
          </div>

          {(!results.interactions || results.interactions.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-green-500/5 border border-green-500/20 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-green-400 mb-2">All Clear!</h4>
              <p className="text-gray-400 max-w-md">No known drug interactions were found among the prescribed medications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.interactions.map((interaction, idx) => (
                <div key={idx} className="bg-[#0a0e1a]/80 backdrop-blur-md border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg text-white font-medium">
                      <span className="font-bold text-blue-300">{interaction.drugs?.[0] || 'Drug A'}</span>
                      <span className="text-gray-500 mx-2">+</span>
                      <span className="font-bold text-blue-300">{interaction.drugs?.[1] || 'Drug B'}</span>
                    </h4>
                    {getSeverityBadge(interaction.severity)}
                  </div>
                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">{interaction.description}</p>
                  
                  {interaction.recommendation && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 items-start">
                      <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-blue-300 font-semibold text-xs uppercase tracking-wider block mb-1">Recommendation</span>
                        <span className="text-gray-300 text-sm">{interaction.recommendation}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DrugInteractionChecker;
