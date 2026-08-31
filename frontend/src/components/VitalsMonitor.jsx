import React, { useState, useEffect } from 'react';
import { X, Heart, Thermometer, Wind, Droplets, AlertTriangle, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

const API_BASE_URL = 'http://localhost:8000';

// Mock data generator for vitals (fallback if API is unreachable)
const generateMockVitals = () => {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hr: 70 + Math.random() * 20 + (i === 12 ? 30 : 0), // Anomaly at i=12
      sys: 110 + Math.random() * 20,
      dia: 70 + Math.random() * 15,
      temp: 98.6 + (Math.random() * 1 - 0.5),
      spo2: 98 - Math.random() * 3 - (i === 8 ? 8 : 0) // Anomaly at i=8
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a]/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-xl text-sm">
        <p className="text-gray-400 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-4 items-center mb-1">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
            <span className="text-white font-semibold">{(entry.value ?? 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const VitalsMonitor = ({ patientId, patientName, isOpen, onClose }) => {
  const [vitals, setVitals] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patientId) {
      const loadData = async () => {
        setLoading(true);
        try {
          // Attempting real API calls, falling back to mock data
          const [vitalsRes, anomaliesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/patients/${patientId}/vitals-history`).catch(() => null),
            fetch(`${API_BASE_URL}/api/patients/${patientId}/vitals-anomalies`).catch(() => null)
          ]);

          if (vitalsRes?.ok && anomaliesRes?.ok) {
            // ---- Map real backend shape -> shape this component renders ----
            const rawVitals = await vitalsRes.json();
            const mappedVitals = rawVitals.map(v => ({
              time: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              hr: v.heart_rate,
              sys: v.bp_systolic,
              dia: v.bp_diastolic,
              temp: v.temperature,
              spo2: v.oxygen_saturation,
            }));
            setVitals(mappedVitals);

            const rawAnomalies = await anomaliesRes.json();
            // Dedupe by vital_type, keeping the most severe occurrence
            // (detect_anomalies checks all 24 hourly readings, so the
            // same vital can trigger multiple times — we only want to
            // show one card per vital type, worst severity wins).
            const bestByType = {};
            for (const a of rawAnomalies) {
              const existing = bestByType[a.vital_type];
              const isWorse = !existing || (a.severity === 'critical' && existing.severity !== 'critical');
              if (isWorse) bestByType[a.vital_type] = a;
            }
            const mappedAnomalies = Object.values(bestByType).map((a, idx) => ({
              id: `${a.vital_type}-${idx}`,
              type: a.vital_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              value: a.value,
              normal: a.normal_range,
              severity: a.severity,
              rec: a.recommendation,
            }));
            setAnomalies(mappedAnomalies);
          } else {
            // Mock Fallback
            setVitals(generateMockVitals());
            setAnomalies([
              { id: 1, type: 'Heart Rate', value: '115 bpm', normal: '60-100 bpm', severity: 'warning', rec: 'Check patient anxiety or pain levels. Review recent medications.' },
              { id: 2, type: 'SpO2', value: '88%', normal: '95-100%', severity: 'critical', rec: 'Apply supplemental oxygen immediately. Notify attending.' }
            ]);
          }
        } catch (e) {
          console.error(e);
          // Even on unexpected error, fall back to mock data so the UI
          // never gets stuck or crashes.
          setVitals(generateMockVitals());
          setAnomalies([]);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  const latest = vitals[vitals.length - 1] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-[90vw] h-[90vh] bg-[#0a0e1a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="text-blue-500" />
              Real-time Vitals Dashboard
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-400">Patient: <span className="text-white font-medium">{patientName}</span></p>
              <div className="h-4 w-px bg-white/20"></div>
              <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleTimeString()}</p>
              {anomalies.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30">
                  <AlertTriangle size={14} />
                  {anomalies.length} Anomalies Detected
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all duration-300">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Heart Rate */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-300 font-medium flex items-center gap-2">
                      <Heart className="text-pink-500" size={18} /> Heart Rate
                    </h3>
                    <span className="text-2xl font-bold text-pink-400">
                      {(latest.hr ?? 0).toFixed(0)} <span className="text-sm font-normal text-gray-500">bpm</span>
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitals}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="hr" name="HR" stroke="#ec4899" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-300 font-medium flex items-center gap-2">
                      <Droplets className="text-blue-500" size={18} /> Blood Pressure
                    </h3>
                    <span className="text-2xl font-bold text-blue-400">
                      {(latest.sys ?? 0).toFixed(0)}/{(latest.dia ?? 0).toFixed(0)} <span className="text-sm font-normal text-gray-500">mmHg</span>
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitals}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="sys" name="Systolic" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-300 font-medium flex items-center gap-2">
                      <Thermometer className="text-amber-500" size={18} /> Temperature
                    </h3>
                    <span className="text-2xl font-bold text-amber-400">
                      {(latest.temp ?? 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">°F</span>
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitals}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="temp" name="Temp" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* SpO2 */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-300 font-medium flex items-center gap-2">
                      <Wind className="text-emerald-500" size={18} /> SpO2
                    </h3>
                    <span className="text-2xl font-bold text-emerald-400">
                      {(latest.spo2 ?? 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">%</span>
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={vitals}>
                        <defs>
                          <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="spo2" name="SpO2" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSpo2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Anomalies Section */}
              {anomalies.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={20} /> Detected Anomalies
                  </h3>
                  <div className="grid gap-4">
                    {anomalies.map((anom) => (
                      <div key={anom.id} className={`p-5 rounded-2xl border backdrop-blur-md flex items-start gap-4 transition-all duration-300 ${anom.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-amber-500/10 border-amber-500/20'}`}>
                        <div className={`p-3 rounded-full ${anom.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-white font-semibold text-lg">{anom.type} Alert</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${anom.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {anom.severity}
                            </span>
                          </div>
                          <div className="flex gap-6 mb-3 text-sm">
                            <p className="text-gray-300">Recorded: <span className="font-bold text-white">{anom.value}</span></p>
                            <p className="text-gray-400">Normal Range: {anom.normal}</p>
                          </div>
                          <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                            <p className="text-sm text-gray-300"><span className="text-blue-400 font-medium">AI Recommendation:</span> {anom.rec}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VitalsMonitor;