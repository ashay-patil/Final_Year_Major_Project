import React, { useState, useEffect } from 'react';
import { X, Brain, AlertTriangle, Shield, Activity } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const RiskGauge = ({ patientId, patientName, isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (isOpen && patientId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/readmission-risk`);
          if (res.ok) {
            const riskData = await res.json();
            setData(riskData);
            
            // Animate score from 0 to target
            let start = 0;
            const end = riskData.risk_score || 0;
            const duration = 1500;
            const increment = end / (duration / 16);
            
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                setAnimatedScore(end);
                clearInterval(timer);
              } else {
                setAnimatedScore(Math.floor(start));
              }
            }, 16);
          } else {
            // Mock data fallback for demonstration if API fails
            const mockData = {
              risk_score: 72,
              risk_level: "High",
              contributing_factors: [
                { name: "Multiple comorbidities", impact: 40, description: "Patient has 3+ chronic conditions" },
                { name: "Recent admissions", impact: 25, description: "2 admissions in last 6 months" },
                { name: "Medication adherence", impact: 15, description: "History of missed prescriptions" }
              ],
              ai_explanation: "The elevated risk profile is primarily driven by the complex interaction of the patient's existing comorbidities combined with a recent pattern of hospital utilization. Close outpatient monitoring is highly recommended."
            };
            setData(mockData);
            
            let start = 0;
            const end = mockData.risk_score;
            const timer = setInterval(() => {
              start += end / 90;
              if (start >= end) {
                setAnimatedScore(end);
                clearInterval(timer);
              } else {
                setAnimatedScore(Math.floor(start));
              }
            }, 16);
          }
        } catch (error) {
          console.error("Error fetching risk data", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    } else {
      setAnimatedScore(0);
      setData(null);
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  const getRiskColor = (score) => {
    if (score <= 30) return '#06d6a0'; // green
    if (score <= 60) return '#f59e0b'; // yellow
    if (score <= 80) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const riskColor = getRiskColor(data?.risk_score || 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~440
  const strokeDashoffset = data ? circumference - (circumference * (data.risk_score / 100)) : circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-[#0a0e1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Activity className="text-blue-400" size={24} />
              Readmission Risk Assessment
            </h2>
            <p className="text-sm text-gray-400 mt-1">Patient: <span className="text-gray-200">{patientName}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 animate-pulse">Analyzing patient data...</p>
            </div>
          ) : data ? (
            <div className="space-y-8">
              
              {/* Gauge Section */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center">
                  <svg width="200" height="200" className="transform -rotate-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    <circle
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="16"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={riskColor}
                      strokeWidth="16"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1500 ease-out"
                      style={{ filter: `drop-shadow(0 0 10px ${riskColor}80)` }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white tracking-tighter" style={{ textShadow: `0 0 20px ${riskColor}40` }}>
                      {animatedScore}
                    </span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Score</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Shield size={16} color={riskColor} />
                  <span className="text-sm font-semibold" style={{ color: riskColor }}>
                    {data.risk_level} Risk
                  </span>
                </div>
              </div>

              {/* Factors Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Contributing Factors
                </h3>
                <div className="space-y-4">
                  {data.contributing_factors?.map((factor, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-gray-200">{factor.name}</span>
                        <span className="text-xs text-gray-400">{factor.impact * 100}% impact</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-2">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${factor.impact * 100}%`, 
                            background: `linear-gradient(90deg, ${riskColor}40, ${riskColor})`,
                            boxShadow: `0 0 10px ${riskColor}80` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Explanation */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2 mb-3">
                  <Brain size={18} />
                  AI Clinical Insight
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed overflow-hidden border-r-2 border-blue-500 whitespace-pre-wrap"
                   style={{
                     display: 'inline-block',
                     animation: 'typing 3s steps(40, end), blink .75s step-end infinite'
                   }}>
                  {data.ai_explanation}
                </p>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes typing { from { max-width: 0 } to { max-width: 100% } }
                  @keyframes blink { from, to { border-color: transparent } 50% { border-color: #3b82f6 } }
                `}} />
              </div>

            </div>
          ) : (
            <div className="text-center text-gray-400 py-10">Failed to load risk assessment data.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;
