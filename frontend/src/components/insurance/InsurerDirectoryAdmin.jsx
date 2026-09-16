import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Shield, Activity, X } from 'lucide-react';
import apiService from '../../services/api';

const InsurerDirectoryAdmin = () => {
  const [insurers, setInsurers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'PRIVATE', tied_up: false, channel: 'HCX' });

  const fetchDirectory = () => {
    setLoading(true);
    apiService.insuranceGetDirectory()
      .then(data => setInsurers(data.insurers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const handleSave = async () => {
    try {
      await apiService.insuranceAddInsurer(formData);
      setShowForm(false);
      fetchDirectory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          Insurer Directory
        </h2>
        <button 
          onClick={() => { setFormData({ name: '', type: 'PRIVATE', tied_up: false, channel: 'HCX' }); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Insurer
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-xs uppercase bg-[#0a0e1a] text-gray-400">
            <tr>
              <th className="px-6 py-3 rounded-tl-xl">Insurer Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Network Status</th>
              <th className="px-6 py-3">Integration Channel</th>
              <th className="px-6 py-3 rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
            ) : insurers.map((insurer, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{insurer.name}</td>
                <td className="px-6 py-4">{insurer.type}</td>
                <td className="px-6 py-4">
                  {insurer.tied_up ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">Tied Up</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">Not Tied Up</span>
                  )}
                </td>
                <td className="px-6 py-4">{insurer.channel}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => { setFormData(insurer); setShowForm(true); }}
                    className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">{formData.id ? 'Edit Insurer' : 'Add Insurer'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Integration Channel</label>
                <select value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})} className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="HCX">HCX</option>
                  <option value="PORTAL">Portal</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="tiedup" checked={formData.tied_up} onChange={e => setFormData({...formData, tied_up: e.target.checked})} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="tiedup" className="text-sm text-gray-300">Tied-up Network Hospital</label>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurerDirectoryAdmin;
