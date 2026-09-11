import React, { useState, useEffect } from 'react';
import { Activity, Brain, ShieldAlert, Cpu, HeartPulse, FileText, Pill, DollarSign, MessageCircle, ScanLine, Clock, Users, ArrowRight } from 'lucide-react';
import apiService from '../services/api';

const AGENTS_REGISTRY = [
  { id: 'DischargeReadinessAgent', name: 'Discharge Agent', icon: <Activity />, description: 'Evaluates vitals and treatment status using Groq LLM to determine readiness.', status: 'Active' },
  { id: 'RiskPredictor', name: 'Risk Predictor', icon: <ShieldAlert />, description: 'Random Forest ML model predicting readmission risk based on clinical vectors.', status: 'Active' },
  { id: 'NurseAgent', name: 'Nurse Task Agent', icon: <HeartPulse />, description: 'Generates patient-specific nursing checklists for discharge prep.', status: 'Active' },
  { id: 'PharmacyAgent', name: 'Pharmacy Agent', icon: <Pill />, description: 'Drafts discharge prescriptions and medication instructions.', status: 'Active' },
  { id: 'BillingAgent', name: 'Billing Agent', icon: <DollarSign />, description: 'Calculates room, doctor, and treatment charges dynamically.', status: 'Active' },
  { id: 'SummaryAgent', name: 'Summary Agent', icon: <FileText />, description: 'Generates comprehensive NLP discharge summaries for the doctor.', status: 'Active' },
  { id: 'XRayAI', name: 'X-Ray CV Model', icon: <ScanLine />, description: 'DenseNet121 model generating Grad-CAM heatmaps for chest X-rays.', status: 'Active' },
  { id: 'ChatbotAgent', name: 'Medical Chatbot', icon: <MessageCircle />, description: 'RAG-powered conversational agent using ChromaDB.', status: 'Active' },
];

export default function AIActivityCenter({ onNavigateToPatient }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getDischargeLogs()
      .then(res => {
        // Filter out manual system actions if we want pure AI, but for now we take the AI ones
        const aiLogs = (res.logs || []).filter(log => log.agent !== 'System' && log.agent !== 'Doctor' && log.agent !== 'Nurse');
        setLogs(aiLogs);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load AI logs", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 bg-[#0a0e1a] min-h-screen text-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-xl">
          <Cpu className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Agent Activity Center</h1>
          <p className="text-sm text-emerald-400 font-medium mt-1">Live Multi-Agent Orchestration Telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {/* AGENT REGISTRY */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-black/20">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" /> Deployed Capabilities
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {AGENTS_REGISTRY.map(agent => (
              <div key={agent.id} className="p-4 bg-black/40 border border-white/5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-gray-200 font-bold">
                    <span className="text-blue-400">{React.cloneElement(agent.icon, { className: 'w-5 h-5' })}</span>
                    {agent.name}
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-md">
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE ACTIVITY FEED */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> AI Agent Activity Feed
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
            {loading ? (
               <div className="flex h-full items-center justify-center">
                 <Activity className="w-8 h-8 animate-spin text-blue-500" />
               </div>
            ) : logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Brain className="w-12 h-12 mb-4 opacity-50" />
                  <p>No recent AI agent activity recorded.</p>
               </div>
            ) : (
               <div className="absolute left-10 top-0 bottom-0 w-px bg-white/10 z-0"></div>
            )}
            
            {!loading && logs.map((log, i) => {
              const date = new Date(log.timestamp);
              
              return (
                <div key={i} className="relative z-10 flex gap-6 group">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-8 h-8 rounded-full bg-[#0a0e1a] border-2 border-blue-500 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                      <Cpu className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 bg-black/40 border border-white/10 p-5 rounded-xl group-hover:border-blue-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-bold text-gray-200 capitalize flex items-center gap-2">
                        {log.action.replace(/_/g, ' ')}
                      </h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {date.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4">{log.details}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                       <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                         <Brain className="w-4 h-4" /> Agent: {log.agent}
                       </div>
                       
                       {log.patient_id && (
                         <button 
                           onClick={() => onNavigateToPatient(log.patient_id)}
                           className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                         >
                           View Patient {log.patient_id} <ArrowRight className="w-3 h-3" />
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
