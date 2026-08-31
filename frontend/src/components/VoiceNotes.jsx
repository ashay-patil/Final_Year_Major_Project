import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, FileText, Save, Loader, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const VoiceNotes = ({ patientId, onNoteSaved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [structuredNote, setStructuredNote] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef('');

  // Initialize speech recognition ONCE
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      const fullText = (finalTranscript + interimTranscript).trim();
      transcriptRef.current = fullText;
      setTranscript(fullText);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions in your browser settings.');
        isRecordingRef.current = false;
        setIsRecording(false);
      } else if (event.error === 'no-speech') {
        // Don't stop — just keep listening
      } else if (event.error !== 'aborted') {
        setError('Microphone error: ' + event.error + '. Try again.');
      }
    };
    
    recognition.onend = () => {
      // Auto-restart if still supposed to be recording
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Already started, ignore
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch(e) {}
    };
  }, []); // Empty deps — initialize ONCE

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setError('');
    setStructuredNote(null);
    setSaved(false);
    setTranscript('');
    transcriptRef.current = '';
    isRecordingRef.current = true;
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (err) {
      // If already started, stop and restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          try { recognitionRef.current.start(); } catch(e) {}
        }, 100);
      } catch(e) {}
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    // Process after a short delay to capture final results
    setTimeout(() => {
      processAudioText(transcriptRef.current);
    }, 300);
  }, []);

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const processAudioText = async (text) => {
    if (!text || !text.trim()) return;
    setProcessing(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/voice-notes/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text, patient_id: patientId })
      });
      
      if (res.ok) {
        const data = await res.json();
        setStructuredNote(data.soap_format || data.note || mockStructuredData(text));
      } else {
        setStructuredNote(mockStructuredData(text));
      }
    } catch (err) {
      setStructuredNote(mockStructuredData(text));
    } finally {
      setProcessing(false);
    }
  };

  const mockStructuredData = (rawText) => ({
    subjective: rawText || "Patient reports symptoms as dictated.",
    objective: "Vitals and physical exam findings to be documented.",
    assessment: "Clinical assessment based on examination.",
    plan: "Treatment plan to be determined.",
    entities: {
      symptoms: [],
      medications: [],
      vitals: []
    }
  });

  const handleSave = async () => {
    setProcessing(true);
    try {
      await fetch(`${API_BASE_URL}/api/patients/${patientId}/clinical-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: transcript, soap_format: structuredNote })
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        if (onNoteSaved) onNoteSaved();
      }, 2000);
    } catch (error) {
      console.error(error);
      setError('Failed to save note. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-300 font-medium">Voice recognition not supported</p>
        <p className="text-gray-500 text-sm mt-1">Please use Chrome or Edge browser for voice dictation.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0e1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
            <Activity size={20} />
          </div>
          <h2 className="text-lg font-semibold text-white">AI Clinical Dictation</h2>
        </div>
        {isRecording && <span className="text-xs font-medium text-red-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Listening...</span>}
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center py-6">
          <button
            onClick={toggleRecording}
            disabled={processing}
            className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 disabled:opacity-50
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]'}`}
          >
            {isRecording && <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50"></div>}
            {isRecording ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
          </button>
          <p className="mt-3 text-sm text-gray-400">
            {isRecording ? 'Listening... tap to stop & process' : processing ? 'Processing...' : 'Tap to start dictation'}
          </p>
        </div>

        {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}

        {transcript && !structuredNote && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-[80px] mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">{transcript}</p>
            {processing && (
              <div className="flex items-center justify-center gap-2 mt-3 text-blue-400">
                <Loader size={16} className="animate-spin" /> <span className="text-sm">AI is structuring your note...</span>
              </div>
            )}
          </div>
        )}

        {structuredNote && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2"><FileText size={16}/> Raw Transcript</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{transcript}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2"><Activity size={16}/> AI Structured SOAP Note</h3>
              {['subjective','objective','assessment','plan'].map(key => (
                structuredNote[key] && (
                  <div key={key} className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">{key}</h4>
                    <p className="text-sm text-gray-200">{structuredNote[key]}</p>
                  </div>
                )
              ))}
              
              {structuredNote.entities && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {structuredNote.entities.symptoms?.map(s => <span key={'s_'+s} className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs rounded-md">Symptom: {s}</span>)}
                  {structuredNote.entities.medications?.map(m => <span key={'m_'+m} className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs rounded-md">Med: {m}</span>)}
                  {structuredNote.entities.vitals?.map(v => <span key={'v_'+v} className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-md">Vital: {v}</span>)}
                </div>
              )}
            </div>
            
            {patientId && (
              <button 
                onClick={handleSave}
                disabled={processing || saved}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all disabled:opacity-70"
              >
                {saved ? <><CheckCircle2 size={18}/> Saved!</> : 
                 processing ? <><Loader size={18} className="animate-spin"/> Saving...</> : 
                 <><Save size={18}/> Save to Patient Record</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceNotes;
