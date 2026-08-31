import React, { useState, useEffect } from 'react';
import { X, Activity, Shield, Brain, CheckCircle, AlertCircle, FileText, Pill, DollarSign, Mail } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const PatientTimeline = ({ patientId, patientName, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchJourney();
    }
  }, [isOpen, patientId]);

  const fetchJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/journey`);
      const data = await response.json();
      setJourney(data);
    } catch (err) {
      setError('Failed to load patient journey.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getIcon = (iconName) => {
    const iconClass = "w-5 h-5 text-white";
    switch (iconName) {
      case 'hospital': return <Activity className={iconClass} />;
      case 'scan': return <Shield className={iconClass} />;
      case 'brain': return <Brain className={iconClass} />;
      case 'check':
      case 'check-circle': return <CheckCircle className={iconClass} />;
      case 'bell': return <AlertCircle className={iconClass} />;
      case 'list':
      case 'edit':
      case 'file-text': return <FileText className={iconClass} />;
      case 'pill': return <Pill className={iconClass} />;
      case 'dollar-sign': return <DollarSign className={iconClass} />;
      case 'mail': return <Mail className={iconClass} />;
      case 'activity':
      default: return <Activity className={iconClass} />;
    }
  };

  const getStageColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'admission': return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]';
      case 'detection':
      case 'doctor_approval': return 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]';
      case 'nurse_tasks':
      case 'nurse_complete': return 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
      case 'pharmacy':
      case 'pharmacy_complete': return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]';
      case 'summary': return 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]';
      case 'billing': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]';
      case 'notification': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]';
      case 'current': return 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Mock data fallback if API fails or returns empty
  const events = journey?.events || (error ? [] : [
    { type: 'admission', title: 'Admitted', agent: 'System', details: 'Patient registered.', timestamp: new Date(Date.now() - 86400000).toISOString(), icon: 'hospital' },
    { type: 'current', title: 'In Treatment', agent: 'Care Team', details: 'Pending doctor evaluation.', timestamp: new Date().toISOString(), icon: 'activity' }
  ]);

  return (
    <div className="fixed inset-0 bg-[#0a0e1a]/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0e1a]/50 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="text-blue-400" /> Patient Journey
            </h2>
            <p className="text-gray-400 text-sm mt-1">{patientName} • {events.length} Events Recorded</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-400">Reconstructing timeline...</p>
            </div>
          ) : (
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-[130px] md:left-[180px] top-4 bottom-4 w-1 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-emerald-500/50 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
              
              <div className="space-y-12">
                {events.map((ev, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-8 relative animate-in slide-in-from-bottom-8 fade-in fill-mode-both"
                    style={{ animationDelay: `${idx * 150}ms`, animationDuration: '600ms' }}
                  >
                    <div className="w-[100px] md:w-[150px] shrink-0 text-right pt-3">
                      <span className="text-sm font-semibold text-gray-300 bg-[#0a0e1a]/80 px-2 py-1 rounded-md border border-white/5">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-start pt-1">
                      <div className={`w-6 h-6 rounded-full border-4 border-[#0a0e1a] ${getStageColor(ev.type)} flex items-center justify-center`} />
                    </div>

                    <div className="flex-1 pb-4">
                      <div className="bg-[#0a0e1a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transform hover:-translate-y-1 group">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                              {getIcon(ev.icon)}
                            </div>
                            {ev.title}
                          </h3>
                          {ev.agent && (
                            <span className="px-2.5 py-1 bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-medium">
                              {ev.agent}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {ev.details}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {!loading && journey?.duration && (
          <div className="p-4 border-t border-white/10 bg-[#0a0e1a]/80 text-center relative z-10 text-sm text-gray-400">
            Total journey duration: <span className="font-bold text-white">{journey.duration}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTimeline;
