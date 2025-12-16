import React, { useState } from 'react';
import { DB, Asset } from '../types';
import { genId, formatMoney } from '../utils';
import { Box, Plus, Trash2, Edit2, User, Truck, Monitor, AlertCircle, Save, X } from 'lucide-react';
import { useData } from '../hooks/useData';

interface AssetsProps {
  db: DB;
}

export const Assets: React.FC<AssetsProps> = ({ db }) => {
  const { addAsset, updateAsset, deleteAsset } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '', type: 'Vehicle', value: 0, assignedTo: 'Unassigned', status: 'Good', purchaseDate: '', notes: ''
  });

  const handleEdit = (asset: Asset) => {
    setFormData(asset);
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if(!formData.name || !formData.value) return alert("Fill required fields");
    
    const assetPayload: Asset = {
        id: editingId || genId(),
        name: formData.name!,
        type: formData.type as any,
        value: Number(formData.value),
        assignedTo: formData.assignedTo || 'Unassigned',
        status: formData.status as any,
        purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
        notes: formData.notes || ''
    };

    if(editingId) updateAsset(assetPayload);
    else addAsset(assetPayload);

    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Vehicle', value: 0, assignedTo: 'Unassigned', status: 'Good', purchaseDate: '', notes: '' });
  };

  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'Vehicle': return <Truck size={18} />;
          case 'Electronics': return <Monitor size={18} />;
          default: return <Box size={18} />;
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-display font-bold text-slate-900">Asset Manager</h2>
                <p className="text-slate-500">Track company inventory and equipment assignments.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="bg-corporate-blue hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20">
                <Plus size={20} /> Register Asset
            </button>
        </div>

        {showForm && (
            <div className="glass-card p-6 border-l-4 border-l-blue-500 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Update Asset' : 'Register New Asset'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Asset Name / Model</label>
                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full glass-input p-3 rounded-xl" placeholder="Honda Click 125i"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full glass-input p-3 rounded-xl">
                            <option>Vehicle</option>
                            <option>Electronics</option>
                            <option>Furniture</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Value</label>
                        <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} className="w-full glass-input p-3 rounded-xl"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assigned To</label>
                        <select value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} className="w-full glass-input p-3 rounded-xl">
                            <option value="Unassigned">Unassigned</option>
                            {db.collectors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full glass-input p-3 rounded-xl">
                            <option>Good</option>
                            <option>Maintenance</option>
                            <option>Lost</option>
                            <option>Disposed</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Purchase Date</label>
                        <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full glass-input p-3 rounded-xl"/>
                    </div>
                </div>
                <button onClick={handleSave} className="mt-6 w-full bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700">
                    <Save size={18}/> Save Record
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {db.assets.map(asset => (
                <div key={asset.id} className="glass-card p-6 flex flex-col justify-between group hover:border-blue-400 transition-colors">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${asset.type === 'Vehicle' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                {getTypeIcon(asset.type)}
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${asset.status === 'Good' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                {asset.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{asset.name}</h3>
                        <div className="text-sm font-mono text-slate-500 font-bold">{formatMoney(asset.value)}</div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-600">
                            <User size={14}/> 
                            <span className="font-semibold">{asset.assignedTo === 'Unassigned' ? 'Available' : asset.assignedTo}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => handleEdit(asset)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-200">Edit</button>
                        <button onClick={() => { if(confirm("Delete Asset?")) deleteAsset(asset.id) }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};