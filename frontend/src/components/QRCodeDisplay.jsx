import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, Download, Loader2, X, Maximize2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const QRCodeDisplay = ({ patientId, patientName, compact = false }) => {
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (patientId) fetchQR();
  }, [patientId]);

  const fetchQR = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/qrcode`);
      const data = await response.json();
      setQrData(data.qr_base64);
    } catch (err) {
      console.error('Failed to fetch QR code', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (e) => {
    if (e) e.stopPropagation();
    if (!qrData) return;
    const a = document.createElement('a');
    a.href = qrData;
    a.download = `patient-${patientId}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Full-screen QR popup — rendered via Portal to escape any stacking context
  const QRPopup = () => createPortal(
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={() => setShowPopup(false)}
    >
      <div 
        className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => setShowPopup(false)} 
          className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <QrCode className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Patient QR Code</h3>
          </div>
          <p className="text-gray-400 text-sm">{patientName || patientId}</p>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            {qrData ? (
              <img src={qrData} alt="Patient QR" className="w-64 h-64 object-contain" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-gray-400">No QR</div>
            )}
          </div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-gray-400 text-xs font-mono bg-black/30 inline-block px-3 py-1 rounded-md">ID: {patientId}</p>
          <p className="text-gray-500 text-xs mt-2">Scan with phone camera to view patient details</p>
        </div>
        
        <button 
          onClick={handleDownload} 
          disabled={!qrData} 
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Download QR Code
        </button>
      </div>
    </div>,
    document.body
  );

  if (compact) {
    return (
      <>
        <div 
          className="relative group cursor-pointer inline-block" 
          title={`Click to enlarge QR for ${patientName || patientId}`} 
          onClick={(e) => { e.stopPropagation(); if (qrData) setShowPopup(true); }}
        >
          {loading ? (
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : qrData ? (
            <div className="bg-white p-1.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20 transition-all duration-200 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:scale-105 relative">
              <img src={qrData} alt="QR" className="w-[68px] h-[68px] object-contain rounded-lg" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200">
                <Maximize2 className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-500">
              <QrCode className="w-6 h-6" />
            </div>
          )}
        </div>
        {showPopup && <QRPopup />}
      </>
    );
  }

  return (
    <>
      <div 
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center w-full max-w-sm mx-auto cursor-pointer hover:border-white/20 transition-all" 
        onClick={() => qrData && setShowPopup(true)}
      >
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white text-lg">Patient QR Code</h3>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.1)]">
          {loading ? (
            <div className="w-48 h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : qrData ? (
            <img src={qrData} alt="QR" className="w-48 h-48 object-contain rounded-lg" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-gray-400">No QR Code</div>
          )}
        </div>
        <div className="mt-4 text-center">
          <div className="text-gray-400 text-sm font-mono bg-black/20 px-3 py-1 rounded-md border border-white/5">ID: {patientId}</div>
          <p className="text-gray-500 text-xs mt-2">Click to enlarge • Scan to view details</p>
        </div>
        <button 
          onClick={handleDownload} 
          disabled={loading || !qrData} 
          className="mt-4 w-full bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-400 border border-blue-500/30 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Download QR
        </button>
      </div>
      {showPopup && <QRPopup />}
    </>
  );
};

export default QRCodeDisplay;
