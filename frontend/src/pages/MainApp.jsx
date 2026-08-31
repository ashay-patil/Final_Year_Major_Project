import React, { useState, useEffect, createContext, useContext } from 'react';
import { Download, Menu, X, Activity, Users, Pill, FileText, DollarSign, User, CheckCircle, AlertCircle, Plus, Trash2, RefreshCw, Mail, Send, MessageCircle, BarChart3, Mic, MicOff, Heart, Thermometer, Wind, Droplets, Brain, Globe, TrendingUp, AlertTriangle, Zap, Shield, Scan } from 'lucide-react';
import ChatBot from '../components/ChatBot';
import DrugInteractionChecker from '../components/DrugInteractionChecker';
import PatientTimeline from '../components/PatientTimeline';
import QRCodeDisplay from '../components/QRCodeDisplay';
import RiskGauge from '../components/RiskGauge';
import VitalsMonitor from '../components/VitalsMonitor';
import VoiceNotes from '../components/VoiceNotes';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import InsurancePortal from '../components/InsurancePortal';
import {
  Volume2, Languages,  ShieldAlert,
 Sparkles, HeartPulse,
  ScanLine, Upload, ImageIcon    // <-- add these
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const apiService = {
  getPatients: () => fetch(`${API_BASE_URL}/api/patients`).then(r => r.json()),
  runDischargeDetection: () => fetch(`${API_BASE_URL}/api/run-discharge-detection`, { method: 'POST' }).then(r => r.json()),
  approvePatient: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/approve`, { method: 'POST' }).then(r => r.json()),
  getNurseTasks: (patientId) => fetch(`${API_BASE_URL}/api/nurse-tasks/${patientId}`).then(r => r.json()),
  updateNurseTasks: (patientId, data) => fetch(`${API_BASE_URL}/api/nurse-tasks/${patientId}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  addNurseTask: (patientId, item) => fetch(`${API_BASE_URL}/api/nurse-tasks/${patientId}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item })
  }).then(r => r.json()),
  getPharmacyPatients: () => fetch(`${API_BASE_URL}/api/pharmacy`).then(r => r.json()),
  getPharmacyPrescription: (patientId) => fetch(`${API_BASE_URL}/api/pharmacy/${patientId}`).then(r => r.json()),
  completePharmacy: (patientId, prescription) => fetch(`${API_BASE_URL}/api/pharmacy/${patientId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prescription })
  }).then(r => r.json()),
  getBillingPatients: () => fetch(`${API_BASE_URL}/api/billing`).then(r => r.json()),
  generateBill: (patientId) => fetch(`${API_BASE_URL}/api/billing/${patientId}/generate`, { method: 'POST' }).then(r => r.json()),
  sendToGuardian: (patientId) => fetch(`${API_BASE_URL}/api/billing/${patientId}/send-to-guardian`, { method: 'POST' }).then(r => r.json()),
  getSummaryPatients: () => fetch(`${API_BASE_URL}/api/summary`).then(r => r.json()),
  getPatientSummary: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/summary`).then(r => r.json()),
  downloadPDF: (patientId, type) => `${API_BASE_URL}/api/patients/${patientId}/download-${type}`,

  chatbot: (message, patientId, sessionId) => fetch(`${API_BASE_URL}/api/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, patient_id: patientId, session_id: sessionId })
  }).then(r => r.json()),

  getReadmissionRisk: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/readmission-risk`).then(r => r.json()),

  getVitalsHistory: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/vitals-history`).then(r => r.json()),

  getVitalsAnomalies: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/vitals-anomalies`).then(r => r.json()),

  processVoiceNotes: (rawText, patientId) => fetch(`${API_BASE_URL}/api/voice-notes/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText, patient_id: patientId })
  }).then(r => r.json()),

  saveClinicalNote: (patientId, note, soapFormat) => fetch(`${API_BASE_URL}/api/patients/${patientId}/clinical-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, soap_format: soapFormat })
  }).then(r => r.json()),

  getAnalytics: () => fetch(`${API_BASE_URL}/api/analytics/overview`).then(r => r.json()),
  getInsights: () => fetch(`${API_BASE_URL}/api/analytics/insights`).then(r => r.json()),

  translateText: (text, targetLanguage) => fetch(`${API_BASE_URL}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_language: targetLanguage })
  }).then(r => r.json()),
  checkDrugInteractions: (medications) => fetch(`${API_BASE_URL}/api/check-drug-interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medications })
  }).then(r => r.json()),
  getPatientJourney: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/journey`).then(r => r.json()),
  getPatientQR: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/qrcode`).then(r => r.json()),
  analyzeXray: (file, pathology) => {
    const formData = new FormData();
    formData.append('file', file);
    if (pathology) formData.append('pathology', pathology);
    return fetch(`${API_BASE_URL}/api/xray/analyze`, {
      method: 'POST',
      body: formData
    }).then(r => {
      if (!r.ok) throw new Error('Analysis failed');
      return r.json();
    });
  },
};

// Toast Context
const ToastContext = createContext();

const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto glass-card p-4 rounded-xl shadow-lg border-l-4 min-w-[300px] flex items-center justify-between transition-all transform animate-[slideInRight_0.3s_ease-out]
            ${t.type === 'success' ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 
              t.type === 'error' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 
              'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}>
            <span className="text-white text-sm font-medium">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} className="text-gray-400 hover:text-white ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};


// ==================== CHEST X-RAY AI DIAGNOSIS (Grad-CAM) ====================
const XrayDiagnosisPortal = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError('');
  };

  const runAnalysis = async (pathology = null) => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiService.analyzeXray(file, pathology);
      setResult(data);
    } catch (err) {
      setError('Could not analyze this image. Make sure the backend has torch/torchxrayvision installed and is running.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-2 rounded-xl">
          <ScanLine className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl-gray font-bold">Chest X-Ray AI Diagnosis</h1>
      </div>
      <p className="text-gray-600 mb-1">DenseNet121 (TorchXRayVision) — 18-pathology classifier with Grad-CAM explainability</p>
      <p className="text-xs text-amber-600 mb-6 font-medium">⚠️ Research/educational demo only — not a certified diagnostic tool.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload panel */}
        <div className="bg-white rounded-xl shadow p-6">
          <label className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:border-teal-400 transition">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to upload a chest X-ray (JPG/PNG)</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>

          {previewUrl && (
            <div className="mt-4">
              <img src={previewUrl} alt="Uploaded X-ray" className="w-full rounded-lg border" />
              <button
                onClick={() => runAnalysis()}
                disabled={loading}
                className="mt-4 w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                {loading ? 'Analyzing...' : 'Run AI Diagnosis'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="bg-white rounded-xl shadow p-6">
          {!result && !loading && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Upload an X-ray and run analysis to see predictions & heatmap here.
            </div>
          )}

          {result && (
            <div>
              <div className="mb-4">
                <h3 className="font-bold mb-1">Grad-CAM: {result.heatmap_target}</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Highlighted regions show where the model focused for this prediction
                  ({(result.heatmap_target_probability * 100).toFixed(1)}% confidence)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Original</p>
                    <img src={result.original_image_base64} alt="Original" className="rounded-lg border w-full" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Grad-CAM Heatmap</p>
                    <img src={result.heatmap_image_base64} alt="Grad-CAM heatmap" className="rounded-lg border w-full" />
                  </div>
                </div>
              </div>

              <h3 className="font-bold mb-2 mt-6">All Findings</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {result.predictions.map((p) => (
                  <button
                    key={p.pathology}
                    onClick={() => runAnalysis(p.pathology)}
                    className={`w-full text-left p-2.5 rounded-lg border transition hover:border-teal-400 ${
                      p.pathology === result.heatmap_target ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">{p.pathology}</span>
                      <span className="text-xs font-mono">{(p.probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${p.probability > 0.5 ? 'bg-red-500' : p.probability > 0.2 ? 'bg-amber-400' : 'bg-gray-300'}`}
                        style={{ width: `${p.probability * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-gray-400 mt-4">
                Model: {result.model_info.architecture} ({result.model_info.weights}) · Source: {result.model_info.source}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Auth Component
const AuthPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a] flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,rgba(0,0,0,0)_50%)] animate-[spin_10s_linear_infinite]" />
        
        <div className="relative z-10 text-center mb-8">
          <div className="inline-block p-4 bg-white/5 rounded-full mb-4 border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <Activity className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 gradient-text">MediFlow AI</h1>
          <p className="text-gray-400">Hospital Discharge Management</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 transform hover:-translate-y-1 mt-4 border border-blue-400/20">
            LOGIN
          </button>
        </form>
        <div className="text-center mt-6 relative z-10">
          <p className="text-xs text-gray-500 tracking-widest uppercase font-semibold">Powered by AI</p>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard
const MainDashboard = ({ onNavigate, onOpenChatbot }) => {
  const portals = [
    { name: 'Doctor Portal', icon: User, path: 'doctor', color: 'from-blue-600 to-blue-400', shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]', desc: 'Discharge readiness evaluation' },
    { name: 'Nurse Portal', icon: Activity, path: 'nurse', color: 'from-green-600 to-green-400', shadow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]', desc: 'Task management & patient care' },
    { name: 'Pharmacy Portal', icon: Pill, path: 'pharmacy', color: 'from-amber-600 to-amber-400', shadow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]', desc: 'Prescription management' },
    { name: 'Summary Portal', icon: FileText, path: 'summary', color: 'from-purple-600 to-purple-400', shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]', desc: 'Discharge summaries & translation' },
    { name: 'Billing Portal', icon: DollarSign, path: 'billing', color: 'from-red-600 to-red-400', shadow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]', desc: 'Generate invoices & notify guardian' },
    { name: 'Analytics Portal', icon: BarChart3, path: 'analytics', color: 'from-cyan-600 to-cyan-400', shadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]', desc: 'Hospital performance metrics' },
    { name: 'AI Assistant', icon: Brain, action: onOpenChatbot, color: 'from-emerald-600 to-emerald-400', shadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]', desc: 'Ask questions & get insights' },
    { name: 'Chest X-Ray AI', icon: ScanLine, path: 'xray', color: 'bg-teal-600', desc: 'Grad-CAM explainable diagnosis' },
    { name: 'Insurance Portal', icon: Shield, path: 'insurance', color: 'from-indigo-600 to-violet-400', shadow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]', desc: 'AI insurance coverage & claims' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a] text-white">
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-3 mb-6 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-blue-200 tracking-wider text-xs">ST. JUDE'S MEDICAL CENTER</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                AI-Powered <br/>
                <span className="gradient-text">Discharge Management</span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl font-light">
                Streamline your discharge workflow with intelligent automation, real-time analytics, and seamless care coordination.
              </p>
            </div>
            
            <div className="flex-1 w-full max-w-md">
              <div className="glass-card rounded-3xl p-8 border-t border-white/20 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-[50px] rounded-full" />
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2"><Zap className="w-6 h-6 text-amber-400"/> System Status</h3>
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-gray-400 font-medium">AI Engine</span>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-2 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-gray-400 font-medium">Active Patients</span>
                    <span className="font-bold text-white text-2xl tracking-tight">142</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Avg. Discharge Time</span>
                    <span className="font-bold text-blue-400 text-xl tracking-tight">45 mins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Select Your Portal</h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full" />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {portals.map((portal, idx) => (
            <div
              key={idx}
              onClick={() => portal.action ? portal.action() : onNavigate(portal.path)}
              className={`glass-card rounded-3xl p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 border border-white/10 ${portal.shadow} group`}
            >
              <div className={`bg-gradient-to-br ${portal.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/20`}>
                <portal.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{portal.name}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{portal.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Doctor Portal
const DoctorPortal = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [timelinePatient, setTimelinePatient] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiService.getPatients();
      setPatients(response.patients || []);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to fetch patients', 'error');
    }
  };

  const handleRunDetection = async () => {
    setLoading(true);
    try {
      await apiService.runDischargeDetection();
      await fetchPatients();
      showToast('AI Discharge detection completed successfully', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to run detection', 'error');
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    try {
      await apiService.approvePatient(selectedPatient.patient_id);
      await fetchPatients();
      setSelectedPatient(null);
      showToast('Patient approved! Nurse has been notified.', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to approve patient', 'error');
    }
  };

  const readyCount = patients.filter(p => p.ready_for_discharge).length;

  return (
    <div className="p-6 bg-gradient-to-br from-[#0a0e1a] to-[#111827] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><User className="text-blue-500"/> Doctor Portal</h1>
            <p className="text-gray-400">Review and approve patients for discharge</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchPatients} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 flex items-center gap-2 transition-all">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              Refresh
            </button>
            <button
              onClick={handleRunDetection}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 flex items-center gap-2 transition-all border border-blue-400/20"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-300" />}
              {loading ? 'Running AI...' : 'Run AI Detection'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-gray-500">
            <div className="text-gray-400 mb-2 font-medium">Total Patients</div>
            <div className="text-4xl font-bold text-white">{patients.length}</div>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 blur-[20px] rounded-full" />
            <div className="text-blue-400 mb-2 font-medium">Ready for Discharge</div>
            <div className="text-4xl font-bold text-blue-500">{readyCount}</div>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-amber-500 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 blur-[20px] rounded-full" />
            <div className="text-amber-400 mb-2 font-medium">In Treatment</div>
            <div className="text-4xl font-bold text-amber-500">{patients.length - readyCount}</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 text-xs tracking-wider">
                  <th className="px-6 py-4 font-semibold uppercase">Patient</th>
                  <th className="px-6 py-4 font-semibold uppercase">ID</th>
                  <th className="px-6 py-4 font-semibold uppercase">Age</th>
                  <th className="px-6 py-4 font-semibold uppercase">Diagnosis</th>
                  <th className="px-6 py-4 font-semibold uppercase">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {patients.map(patient => (
                  <tr key={patient.patient_id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={patient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`} alt={patient.name} className="w-12 h-12 rounded-full border border-white/20 shadow-md group-hover:border-blue-500/50 transition-colors" />
                        <span className="font-semibold text-white">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{patient.patient_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{patient.age}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{patient.diagnosis}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        patient.ready_for_discharge 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {patient.ready_for_discharge ? 'AI Ready' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewPatient(patient)}
                          className="bg-white/5 text-gray-300 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5" /> View
                        </button>
                        {patient.ready_for_discharge && patient.status !== 'doctor_approved' && (
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                          >
                            Review
                          </button>
                        )}
                        {patient.status === 'doctor_approved' && (
                          <span className="px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Approved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedPatient && (
          <div className="fixed inset-0 bg-[#0a0e1a]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]" onClick={() => setSelectedPatient(null)}>
            <div className="glass-card bg-[#0f172a]/95 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="text-blue-400"/> Discharge Approval</h2>
                <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-8 bg-white/5 p-5 rounded-2xl border border-white/10 relative z-10">
                <div className="flex items-center gap-6">
                  <img src={selectedPatient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=random`} alt={selectedPatient.name} className="w-20 h-20 rounded-full border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{selectedPatient.name}</h3>
                    <p className="text-blue-400 font-medium mb-1">{selectedPatient.diagnosis}</p>
                    <p className="text-sm text-gray-400 font-mono">ID: {selectedPatient.patient_id} • Age: {selectedPatient.age}</p>
                  </div>
                </div>
                <QRCodeDisplay patientId={selectedPatient.patient_id} patientName={selectedPatient.name} compact={true} />
              </div>
              
              <div className="mb-6 relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg text-white">Vital Signs:</h4>
                  <div className="flex gap-2">
                    <button onClick={() => setTimelinePatient(selectedPatient)} className="text-xs bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 font-medium">
                      <TrendingUp className="w-3.5 h-3.5" /> Patient Journey
                    </button>
                    <button onClick={() => setShowRiskModal(true)} className="text-xs bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Risk Score
                    </button>
                    <button onClick={() => setShowVitalsModal(true)} className="text-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-1.5 font-medium">
                      <Activity className="w-3.5 h-3.5" /> Vitals History
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                    <Heart className="w-6 h-6 text-red-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">BP</div>
                    <div className="font-bold text-white text-lg">{selectedPatient.vital_signs.blood_pressure}</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                    <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">HR</div>
                    <div className="font-bold text-white text-lg">{selectedPatient.vital_signs.heart_rate} <span className="text-[10px] text-gray-500 font-normal">bpm</span></div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                    <Thermometer className="w-6 h-6 text-amber-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Temp</div>
                    <div className="font-bold text-white text-lg">{selectedPatient.vital_signs.temperature}°F</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                    <Wind className="w-6 h-6 text-cyan-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">SpO2</div>
                    <div className="font-bold text-white text-lg">{selectedPatient.vital_signs.oxygen_saturation}%</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-5 mb-8 flex items-start gap-4 relative z-10 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
                <Brain className="w-8 h-8 text-blue-400 shrink-0 animate-pulse" />
                <p className="text-sm text-blue-100 leading-relaxed font-light">
                  <strong className="text-blue-300 font-semibold block mb-1">AI Recommendation:</strong> The system has analyzed the patient's vitals, lab results, and clinical notes. All parameters are stable and within normal ranges for discharge. Predicted readmission risk is LOW (12%). Recommended for immediate discharge.
                </p>
              </div>
              
              <div className="flex gap-4 relative z-10">
                <button onClick={() => setSelectedPatient(null)} className="flex-1 bg-white/5 border border-white/10 py-3.5 rounded-xl hover:bg-white/10 transition-colors font-medium text-white">
                  Cancel
                </button>
                <button onClick={handleApprove} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all font-bold flex items-center justify-center gap-2 border border-blue-400/30">
                  <CheckCircle className="w-5 h-5" /> Approve Discharge
                </button>
              </div>
            </div>
          </div>
        )}

        {viewPatient && (
          <div className="fixed inset-0 bg-[#0a0e1a]/90 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setViewPatient(null)}>
            <div className="glass-card bg-[#0f172a]/95 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><User className="text-cyan-400"/> Patient Details</h2>
                <button onClick={() => setViewPatient(null)} className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-6 bg-white/5 p-5 rounded-2xl border border-white/10 relative z-10">
                <div className="flex items-center gap-6">
                  <img src={viewPatient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewPatient.name)}&background=random`} alt={viewPatient.name} className="w-20 h-20 rounded-full border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{viewPatient.name}</h3>
                    <p className="text-cyan-400 font-medium mb-1">{viewPatient.diagnosis}</p>
                    <p className="text-sm text-gray-400 font-mono">ID: {viewPatient.patient_id} • Age: {viewPatient.age}</p>
                    <p className="text-sm text-gray-500 mt-1">Admitted: {viewPatient.admission_date || 'N/A'} • Status: <span className="text-gray-300">{(viewPatient.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></p>
                  </div>
                </div>
                <QRCodeDisplay patientId={viewPatient.patient_id} patientName={viewPatient.name} compact={true} />
              </div>
              
              {viewPatient.vital_signs && (
                <div className="mb-6 relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-lg text-white">Vital Signs:</h4>
                    <div className="flex gap-2">
                      <button onClick={() => { setTimelinePatient(viewPatient); }} className="text-xs bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 font-medium">
                        <TrendingUp className="w-3.5 h-3.5" /> Journey
                      </button>
                      <button onClick={() => { setSelectedPatient(viewPatient); setShowRiskModal(true); }} className="text-xs bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Risk
                      </button>
                      <button onClick={() => { setSelectedPatient(viewPatient); setShowVitalsModal(true); }} className="text-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-1.5 font-medium">
                        <Activity className="w-3.5 h-3.5" /> Vitals
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                      <Heart className="w-6 h-6 text-red-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">BP</div>
                      <div className="font-bold text-white text-lg">{viewPatient.vital_signs.blood_pressure}</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                      <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">HR</div>
                      <div className="font-bold text-white text-lg">{viewPatient.vital_signs.heart_rate} <span className="text-[10px] text-gray-500 font-normal">bpm</span></div>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                      <Thermometer className="w-6 h-6 text-amber-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Temp</div>
                      <div className="font-bold text-white text-lg">{viewPatient.vital_signs.temperature}°F</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                      <Wind className="w-6 h-6 text-cyan-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">SpO2</div>
                      <div className="font-bold text-white text-lg">{viewPatient.vital_signs.oxygen_saturation}%</div>
                    </div>
                  </div>
                </div>
              )}

              {viewPatient.medications && (
                <div className="mb-6 relative z-10">
                  <h4 className="font-semibold text-white mb-3">Medications:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(viewPatient.medications) ? viewPatient.medications : [viewPatient.medications]).map((med, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-medium">{typeof med === 'object' ? med.name || JSON.stringify(med) : med}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <button onClick={() => setViewPatient(null)} className="w-full bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors font-medium text-white relative z-10">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <RiskGauge
  patientId={selectedPatient?.patient_id}
  patientName={selectedPatient?.name}
  isOpen={showRiskModal}
  onClose={() => setShowRiskModal(false)}
/>
        
        <VitalsMonitor
  patientId={selectedPatient?.patient_id}
  patientName={selectedPatient?.name}
  isOpen={showVitalsModal}
  onClose={() => setShowVitalsModal(false)}
/>

        <PatientTimeline 
          patientId={timelinePatient?.patient_id}
          patientName={timelinePatient?.name}
          isOpen={!!timelinePatient}
          onClose={() => setTimelinePatient(null)}
        />
      </div>
    </div>
  );
};

// Nurse Portal
const NursePortal = () => {
  const [approvedPatients, setApprovedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [checked, setChecked] = useState({});
  const [note, setNote] = useState('');
  const [newTask, setNewTask] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchApprovedPatients();
  }, []);

  const fetchApprovedPatients = async () => {
    try {
      const response = await apiService.getPatients();
      const approved = response.patients.filter(p => p.status === 'doctor_approved');
      setApprovedPatients(approved);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to fetch patients', 'error');
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    try {
      const tasks = await apiService.getNurseTasks(patient.patient_id);
      setChecklist(tasks.tasks || []);
      setChecked({});
      setNote('');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load tasks', 'error');
    }
  };

  const handleAddTask = async () => {
    if (newTask.trim()) {
      try {
        await apiService.addNurseTask(selectedPatient.patient_id, newTask);
        setChecklist([...checklist, newTask]);
        setNewTask('');
      } catch (error) {
        console.error('Error:', error);
        showToast('Failed to add task', 'error');
      }
    }
  };

  const handleDeleteTask = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
    const newChecked = { ...checked };
    delete newChecked[index];
    setChecked(newChecked);
  };

  const handleSubmit = async () => {
    try {
      await apiService.updateNurseTasks(selectedPatient.patient_id, { checklist, checked, note });
      await fetchApprovedPatients();
      setSelectedPatient(null);
      showToast('Tasks completed and submitted to Pharmacy!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to submit tasks', 'error');
    }
  };

  const allChecked = checklist.length > 0 && Object.keys(checked).length === checklist.length && Object.values(checked).every(v => v);

  return (
    <div className="p-6 bg-gradient-to-br from-[#0a0e1a] to-[#111827] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Activity className="text-green-500"/> Nurse Portal</h1>
        <p className="text-gray-400 mb-8">Complete discharge checklist & clinical notes</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-card rounded-2xl p-5 border border-white/10 h-fit">
            <h2 className="text-lg font-bold mb-4 text-white flex items-center justify-between">
              Approved Patients
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">{approvedPatients.length}</span>
            </h2>
            <div className="space-y-3">
              {approvedPatients.map(patient => (
                <div
                  key={patient.patient_id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedPatient?.patient_id === patient.patient_id 
                      ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <img src={patient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`} alt={patient.name} className="w-12 h-12 rounded-full border border-white/20" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{patient.name}</div>
                    <div className="text-xs text-gray-400 truncate">{patient.diagnosis}</div>
                  </div>
                </div>
              ))}
              {approvedPatients.length === 0 && (
                <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 mb-3 opacity-20" />
                  No patients waiting for discharge
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-5 mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                  <img src={selectedPatient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=random`} alt={selectedPatient.name} className="w-16 h-16 rounded-full border border-white/20" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPatient.name}</h2>
                    <p className="text-green-400 text-sm">{selectedPatient.diagnosis}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs text-gray-400">Patient ID</div>
                    <div className="font-mono text-white">{selectedPatient.patient_id}</div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400"/> Discharge Checklist</h3>
                  
                  <div className="flex gap-3 mb-6">
                    <input
                      type="text"
                      placeholder="Add custom task..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-gray-500"
                    />
                    <button onClick={handleAddTask} className="bg-white/10 text-white px-5 py-2.5 rounded-xl hover:bg-white/20 flex items-center gap-2 transition-colors border border-white/10">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  <div className="space-y-3 mb-8">
                    {checklist.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                        <input
                          type="checkbox"
                          checked={checked[idx] || false}
                          onChange={(e) => setChecked({ ...checked, [idx]: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500/50 focus:ring-offset-gray-900 cursor-pointer"
                        />
                        <span className={`flex-1 transition-all ${checked[idx] ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task}</span>
                        <button onClick={() => handleDeleteTask(idx)} className="text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400"/> Handover Notes</h3>
                  <textarea
                    placeholder="Enter manual handover notes here..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-gray-500 mb-8"
                  />
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><Mic className="w-5 h-5 text-purple-400"/> AI Voice Clinical Notes</h3>
                    <div className="bg-[#111827]/50 rounded-xl p-4 border border-white/5">
                      <VoiceNotes patientId={selectedPatient.patient_id} />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!allChecked}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 border border-green-400/20"
                  >
                    {allChecked ? <><Send className="w-5 h-5"/> Complete & Submit to Pharmacy</> : 'Complete all checklist tasks to proceed'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-white/10 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                  <Users className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a Patient</h3>
                <p className="text-gray-500 max-w-sm">Select a patient from the list to view their discharge checklist and add clinical notes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Pharmacy Portal
const PharmacyPortal = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const extractMedications = (prescriptionText) => {
    if (!prescriptionText) return [];
    const lines = prescriptionText.split('\n');
    const meds = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[\d]+[\.)\s]/) || trimmed.match(/^[-•*]\s/)) {
        const cleaned = trimmed.replace(/^[\d]+[\.)\s]+/, '').replace(/^[-•*]\s+/, '');
        const medName = cleaned.split(/[\(\-:,\d]/)[0].trim();
        if (medName.length > 2) meds.push(medName);
      }
    }
    return [...new Set(meds)];
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiService.getPharmacyPatients();
      setPatients(response.patients || []);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to fetch patients', 'error');
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const data = await apiService.getPharmacyPrescription(patient.patient_id);
      setPrescription(typeof data.prescription === 'string' ? data.prescription : JSON.stringify(data.prescription, null, 2));
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load prescription', 'error');
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    try {
      await apiService.completePharmacy(selectedPatient.patient_id, prescription);
      await fetchPatients();
      setSelectedPatient(null);
      showToast('Prescription completed and sent to Summary Portal!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to complete prescription', 'error');
    }
  };

  const handleDownloadPDF = () => {
    window.open(apiService.downloadPDF(selectedPatient.patient_id, 'prescription'), '_blank');
  };

  return (
    <div className="p-6 bg-gradient-to-br from-[#0a0e1a] to-[#111827] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Pill className="text-amber-500"/> Pharmacy Portal</h1>
        <p className="text-gray-400 mb-8">Generate and verify discharge prescriptions</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-card rounded-2xl p-5 border border-white/10 h-fit">
            <h2 className="text-lg font-bold mb-4 text-white flex items-center justify-between">
              Nurse Completed
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full">{patients.length}</span>
            </h2>
            <div className="space-y-3">
              {patients.map(patient => (
                <div
                  key={patient.patient_id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedPatient?.patient_id === patient.patient_id 
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <img src={patient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`} alt={patient.name} className="w-12 h-12 rounded-full border border-white/20" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{patient.name}</div>
                    <div className="text-xs text-gray-400 truncate">{patient.diagnosis}</div>
                  </div>
                </div>
              ))}
              {patients.length === 0 && (
                <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 mb-3 opacity-20" />
                  No patients waiting for pharmacy
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-5">
                    <img src={selectedPatient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=random`} alt={selectedPatient.name} className="w-16 h-16 rounded-full border border-white/20" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedPatient.name}</h2>
                      <p className="text-amber-400 text-sm">{selectedPatient.diagnosis}</p>
                    </div>
                  </div>
                  {!loading && prescription && (
                    <button
                      onClick={handleDownloadPDF}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 flex items-center gap-2 border border-white/10 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF Download
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-16 h-16 relative mb-4">
                      <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <Pill className="absolute inset-0 m-auto w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                    <p className="text-amber-400 font-medium">Generating AI Prescription...</p>
                  </div>
                ) : (
                  <div className="animate-[fadeIn_0.3s_ease-out]">
                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><FileText className="w-5 h-5 text-amber-400"/> AI Generated Prescription</h3>
                    <div className="relative">
                      <div className="absolute top-0 right-0 p-2 opacity-50 pointer-events-none">
                        <Brain className="w-12 h-12 text-amber-500/20" />
                      </div>
                      <textarea
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        rows={14}
                        className="w-full px-5 py-4 bg-[#0a0e1a] border border-white/10 rounded-xl text-amber-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-mono text-sm mb-6 leading-relaxed shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                    {prescription && (
                      <DrugInteractionChecker medications={extractMedications(prescription)} />
                    )}
                    <button
                      onClick={handleComplete}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 border border-amber-400/20"
                    >
                      <CheckCircle className="w-5 h-5" /> Verify & Send to Summary
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-white/10 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                  <Pill className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a Patient</h3>
                <p className="text-gray-500 max-w-sm">Select a patient from the list to review and verify their AI generated prescriptions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Portal
const SummaryPortal = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  const [language, setLanguage] = useState('English');
  const languages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Bengali', 'Kannada'];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiService.getSummaryPatients();
      setPatients(response.patients || []);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to fetch patients', 'error');
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLanguage('English');
    setLoading(true);
    try {
      const data = await apiService.getPatientSummary(patient.patient_id);
      setSummary(data.summary || '');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load summary', 'error');
    }
    setLoading(false);
  };

  const handleTranslate = async (lang) => {
    setLanguage(lang);
    if (lang === 'English') {
      handleSelectPatient(selectedPatient);
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.translateText(summary, lang);
      setSummary(data.translated_text || data.text);
      showToast(`Translated to ${lang}`, 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('Translation failed', 'error');
    }
    setLoading(false);
  }

  const handleDownloadPDF = () => {
    window.open(apiService.downloadPDF(selectedPatient.patient_id, 'summary'), '_blank');
  };

  return (
    <div className="p-6 bg-gradient-to-br from-[#0a0e1a] to-[#111827] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><FileText className="text-purple-500"/> Summary Portal</h1>
        <p className="text-gray-400 mb-8">Review and translate AI generated discharge summaries</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-card rounded-2xl p-5 border border-white/10 h-fit">
            <h2 className="text-lg font-bold mb-4 text-white flex items-center justify-between">
              Pharmacy Completed
              <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full">{patients.length}</span>
            </h2>
            <div className="space-y-3">
              {patients.map(patient => (
                <div
                  key={patient.patient_id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedPatient?.patient_id === patient.patient_id 
                      ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <img src={patient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`} alt={patient.name} className="w-12 h-12 rounded-full border border-white/20" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{patient.name}</div>
                    <div className="text-xs text-gray-400 truncate">{patient.diagnosis}</div>
                  </div>
                </div>
              ))}
              {patients.length === 0 && (
                <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 mb-3 opacity-20" />
                  No patients waiting for summary
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/5 gap-4">
                  <div className="flex items-center gap-5">
                    <img src={selectedPatient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=random`} alt={selectedPatient.name} className="w-16 h-16 rounded-full border border-white/20" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedPatient.name}</h2>
                      <p className="text-purple-400 text-sm">{selectedPatient.diagnosis}</p>
                    </div>
                  </div>
                  {!loading && summary && (
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-2 bg-[#0a0e1a] px-3 py-1.5 rounded-lg border border-white/10">
                        <Globe className="w-4 h-4 text-purple-400" />
                        <select 
                          value={language} 
                          onChange={(e) => handleTranslate(e.target.value)}
                          className="bg-transparent border-none text-sm text-white focus:ring-0 cursor-pointer outline-none"
                        >
                          {languages.map(l => <option key={l} value={l} className="bg-[#111827] text-white">{l}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={handleDownloadPDF}
                        className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-4 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white flex items-center gap-2 transition-all text-sm w-full justify-center shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-16 h-16 relative mb-4">
                      <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <FileText className="absolute inset-0 m-auto w-5 h-5 text-purple-500 animate-pulse" />
                    </div>
                    <p className="text-purple-400 font-medium">Processing Summary Document...</p>
                  </div>
                ) : (
                  <div className="border-t border-white/10 pt-6 animate-[fadeIn_0.3s_ease-out] relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold text-white">Generated Discharge Summary</h3>
                      {language !== 'English' && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 ml-2">Translated: {language}</span>}
                    </div>
                    <div className="bg-[#0a0e1a]/80 p-6 rounded-xl border border-white/5 shadow-[inset_0_0_15px_rgba(0,0,0,0.3)]">
                      <div className="whitespace-pre-wrap font-sans text-sm text-gray-300 leading-relaxed overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                        {summary}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-white/10 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                  <FileText className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a Patient</h3>
                <p className="text-gray-500 max-w-sm">Select a patient to view their comprehensive AI-generated discharge summary.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Billing Portal
const BillingPortal = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [insuranceResult, setInsuranceResult] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPatients();
    fetch(`${API_BASE_URL}/api/insurance/companies`)
      .then(r => r.json())
      .then(data => setInsuranceCompanies(data.companies || []))
      .catch(() => {});
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiService.getBillingPatients();
      setPatients(response.patients || []);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to fetch patients', 'error');
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/billing/${patient.patient_id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insurance_company_id: selectedInsurance || null })
      });
      const data = await response.json();
      setBill(data.bill);
      setInsuranceResult(data.insurance || null);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to generate bill', 'error');
    }
    setLoading(false);
  };

  const handleDownloadPDF = (type) => {
    window.open(apiService.downloadPDF(selectedPatient.patient_id, type), '_blank');
  };

  const handleSendToGuardian = async () => {
    if (!selectedPatient.guardian_email) {
      showToast('No guardian email found for this patient!', 'error');
      return;
    }

    if (!window.confirm(`Send discharge documents to ${selectedPatient.guardian_email}?`)) {
      return;
    }

    setSending(true);
    try {
      const response = await apiService.sendToGuardian(selectedPatient.patient_id);
      if (response.success) {
        showToast(`Discharge documents sent successfully to ${selectedPatient.guardian_email}!`, 'success');
        await fetchPatients();
        setSelectedPatient(null);
      }
    } catch (error) {
      showToast('Failed to send email: ' + error.message, 'error');
      console.error('Error:', error);
    }
    setSending(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-[#0a0e1a] to-[#111827] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><DollarSign className="text-red-500"/> Billing Portal</h1>
        <p className="text-gray-400 mb-8">Generate AI invoices and notify guardians for final discharge</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-card rounded-2xl p-5 border border-white/10 h-fit">
            <h2 className="text-lg font-bold mb-4 text-white flex items-center justify-between">
              Ready for Billing
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">{patients.length}</span>
            </h2>
            <div className="space-y-3">
              {patients.map(patient => (
                <div
                  key={patient.patient_id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedPatient?.patient_id === patient.patient_id 
                      ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <img src={patient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`} alt={patient.name} className="w-12 h-12 rounded-full border border-white/20" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{patient.name}</div>
                    <div className="text-xs text-gray-400 truncate">{patient.diagnosis}</div>
                  </div>
                </div>
              ))}
              {patients.length === 0 && (
                <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 mb-3 opacity-20" />
                  No patients waiting for billing
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 bg-white/5 p-4 rounded-xl border border-white/5 gap-4 relative z-10 flex-wrap">
                  <div className="flex items-center gap-5">
                    <img src={selectedPatient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=random`} alt={selectedPatient.name} className="w-16 h-16 rounded-full border border-white/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedPatient.name}</h2>
                      <p className="text-red-400 text-sm">{selectedPatient.diagnosis}</p>
                    </div>
                  </div>
                  <QRCodeDisplay patientId={selectedPatient.patient_id} patientName={selectedPatient.name} compact={false} />
                </div>

                {loading ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-16 h-16 relative mb-4">
                      <div className="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      <DollarSign className="absolute inset-0 m-auto w-6 h-6 text-red-500 animate-pulse" />
                    </div>
                    <p className="text-red-400 font-medium">Calculating Final Invoice...</p>
                  </div>
                ) : bill ? (
                  <div className="border-t border-white/10 pt-6 animate-[fadeIn_0.3s_ease-out] relative z-10">
                    <div className="bg-[#0a0e1a]/80 p-6 rounded-2xl mb-8 border border-white/5 shadow-[inset_0_0_15px_rgba(0,0,0,0.3)]">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-gray-400"/> Final Invoice</h3>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Invoice Date</div>
                          <div className="text-sm text-gray-300 font-mono">{new Date().toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <span className="text-gray-500 block text-xs mb-1">Admission Date</span>
                          <span className="font-semibold text-white">{bill.admission_date}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <span className="text-gray-500 block text-xs mb-1">Discharge Date</span>
                          <span className="font-semibold text-white">{bill.discharge_date}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <span className="text-gray-500 block text-xs mb-1">Duration</span>
                          <span className="font-semibold text-white">{bill.days_stayed} Days</span>
                        </div>
                      </div>

                      {/* Insurance Selection */}
                      <div className="mb-6 bg-gradient-to-r from-indigo-900/30 to-violet-900/30 border border-indigo-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-5 h-5 text-indigo-400" />
                          <h4 className="font-semibold text-white">Insurance Coverage</h4>
                        </div>
                        <select 
                          value={selectedInsurance}
                          onChange={async (e) => {
                            setSelectedInsurance(e.target.value);
                            if (e.target.value && selectedPatient) {
                              setLoading(true);
                              try {
                                const response = await fetch(`${API_BASE_URL}/api/billing/${selectedPatient.patient_id}/generate`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ insurance_company_id: e.target.value })
                                });
                                const data = await response.json();
                                setBill(data.bill);
                                setInsuranceResult(data.insurance || null);
                              } catch(err) { console.error(err); }
                              setLoading(false);
                            } else {
                              setInsuranceResult(null);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#0f172a]">No Insurance (Self Pay)</option>
                          {insuranceCompanies.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0f172a]">
                              {c.name} — {c.plan_name} ({c.bill_concession_percent}% coverage)
                            </option>
                          ))}
                        </select>
                        
                        {insuranceResult && insuranceResult.is_covered && (
                          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                              <div className="text-green-400 text-xs mb-1">You Save</div>
                              <div className="text-green-300 font-bold text-lg">₹{insuranceResult.savings?.toLocaleString('en-IN')}</div>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center">
                              <div className="text-indigo-400 text-xs mb-1">Coverage</div>
                              <div className="text-indigo-300 font-bold text-lg">{insuranceResult.concession_percent}%</div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                              <div className="text-amber-400 text-xs mb-1">Co-pay</div>
                              <div className="text-amber-300 font-bold text-lg">{insuranceResult.copay_percent}%</div>
                            </div>
                          </div>
                        )}
                        {insuranceResult && !insuranceResult.is_covered && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {insuranceResult.reason}
                          </div>
                        )}
                      </div>

                      <div className="mb-6 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Charges Breakdown
                        </div>
                        <div className="p-4 space-y-3 text-sm">
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Room Charges</span>
                            <span className="font-mono">₹{bill.breakdown.room_charges.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Doctor Charges</span>
                            <span className="font-mono">₹{bill.breakdown.doctor_charges.toLocaleString('en-IN')}</span>
                          </div>
                          {bill.breakdown.nursing_charges && (
                            <div className="flex justify-between items-center text-gray-300">
                              <span>Nursing Charges</span>
                              <span className="font-mono">₹{bill.breakdown.nursing_charges.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Prescription Cost</span>
                            <span className="font-mono">₹{bill.breakdown.prescription_cost.toLocaleString('en-IN')}</span>
                          </div>
                          {bill.breakdown.additional_charges > 0 && (
                            <div className="flex justify-between items-center text-gray-300">
                              <span>Additional Charges</span>
                              <span className="font-mono">₹{bill.breakdown.additional_charges.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          
                          {bill.breakdown.subtotal && (
                            <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-2 text-white font-medium">
                              <span>Subtotal</span>
                              <span className="font-mono">₹{bill.breakdown.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {bill.breakdown.gst_18_percent && (
                            <div className="flex justify-between items-center text-gray-400 text-xs">
                              <span>GST (18%)</span>
                              <span className="font-mono">₹{bill.breakdown.gst_18_percent.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-red-900/40 to-transparent p-4 rounded-xl border-l-4 border-l-red-500 flex justify-between items-center">
                        <span className="font-bold text-gray-300 uppercase tracking-wider text-sm">Total Amount Payable</span>
                        <div className="text-right">
                          {bill.original_total && (
                            <div className="text-gray-500 line-through text-sm font-mono">₹{bill.original_total.toLocaleString('en-IN')}</div>
                          )}
                          <span className="font-bold text-3xl text-white font-mono drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">₹{bill.total_amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <button
                        onClick={() => handleDownloadPDF('summary')}
                        className="bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl hover:bg-white/10 hover:text-white flex flex-col items-center justify-center gap-1 transition-all group"
                      >
                        <Download className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">Summary PDF</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPDF('prescription')}
                        className="bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl hover:bg-white/10 hover:text-white flex flex-col items-center justify-center gap-1 transition-all group"
                      >
                        <Download className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">Prescription PDF</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPDF('bill')}
                        className="bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl hover:bg-white/10 hover:text-white flex flex-col items-center justify-center gap-1 transition-all group"
                      >
                        <Download className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">Bill PDF</span>
                      </button>
                    </div>

                    <button
                      onClick={handleSendToGuardian}
                      disabled={sending}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-green-400/30 transition-all text-lg"
                    >
                      {sending ? (
                        <>
                          <RefreshCw className="w-6 h-6 animate-spin" />
                          Sending Secure Link...
                        </>
                      ) : (
                        <>
                          <Mail className="w-6 h-6" />
                          Send All Documents to Guardian
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3"/> Secure email delivery to: <span className="font-semibold text-gray-400">{selectedPatient.guardian_email || 'Not available'}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-white/10 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                  <DollarSign className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a Patient</h3>
                <p className="text-gray-500 max-w-sm">Select a patient to generate their final AI-calculated hospital bill.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home': return <MainDashboard onNavigate={setCurrentView} onOpenChatbot={() => setChatbotOpen(true)} />;
      case 'doctor': return <DoctorPortal />;
      case 'nurse': return <NursePortal />;
      case 'pharmacy': return <PharmacyPortal />;
      case 'billing': return <BillingPortal />;
      case 'summary': return <SummaryPortal />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'xray': return <XrayDiagnosisPortal />;
      case 'insurance': return <InsurancePortal />;
      default: return <MainDashboard onNavigate={setCurrentView} onOpenChatbot={() => setChatbotOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Navigation Bar */}
      <div className="bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 flex-1 ml-4 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">MediFlow AI</span>
            </div>
            <button
              onClick={() => { setIsAuthenticated(false); setCurrentView('home'); }}
              className="px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-[#0a0e1a]/95 backdrop-blur-2xl shadow-2xl h-full border-r border-white/10 flex flex-col animate-[slideInLeft_0.2s_ease-out]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Navigation</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {[
                { label: 'Home Dashboard', value: 'home', icon: Activity, color: 'text-blue-400' },
                { label: 'Doctor Portal', value: 'doctor', icon: User, color: 'text-blue-400' },
                { label: 'Nurse Portal', value: 'nurse', icon: Activity, color: 'text-green-400' },
                { label: 'Pharmacy Portal', value: 'pharmacy', icon: Pill, color: 'text-amber-400' },
                { label: 'Summary Portal', value: 'summary', icon: FileText, color: 'text-purple-400' },
                { label: 'Billing Portal', value: 'billing', icon: DollarSign, color: 'text-red-400' },
                { label: 'Analytics Portal', value: 'analytics', icon: BarChart3, color: 'text-cyan-400' },
                { label: 'Chest X-Ray AI', value: 'xray', icon: ScanLine }
              ].map(item => {
                const isActive = currentView === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => { setCurrentView(item.value); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-xl mb-2 transition-all ${
                      isActive 
                        ? 'bg-white/10 border-l-4 border-l-blue-500 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] text-white' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                  Dr
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Dr. Sarah Jenkins</div>
                  <div className="text-xs text-gray-400">Chief of Medicine</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-0">
        {renderView()}
      </div>

      {/* Floating Chatbot */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-[50]">
          {chatbotOpen ? (
            <div className="absolute bottom-16 right-0 w-[400px] h-[600px] glass-card bg-[#0a0e1a]/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-[slideInUp_0.3s_ease-out]">
              <div className="p-4 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-b border-white/10 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Brain className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-white tracking-wide">AI Assistant</h3>
                </div>
                <button onClick={() => setChatbotOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                 <ChatBot />
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setChatbotOpen(true)}
              className="w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-110 transition-all text-white border border-emerald-400/30 group"
            >
              <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const App = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;