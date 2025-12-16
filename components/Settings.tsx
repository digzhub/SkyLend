import React, { useState } from 'react';
import { DB, Collector, FirebaseConfig, GoogleSheetsConfig } from '../types';
import { UserPlus, Trash2, Edit2, ShieldAlert, Save, X, Database, Download, Upload, Coins, Cloud, CloudOff, Wifi, Monitor, Copy, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { genId, formatMoney } from '../utils';
import { useData } from '../hooks/useData';

interface SettingsProps {
  db: DB;
  onUpdateCollector: (c: Collector) => void;
  onDeleteCollector: (id: number | string) => void;
  onHardReset: () => void;
  onImport: (json: string) => void;
  onAddCapital?: (amt: number, user: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ db, onUpdateCollector, onDeleteCollector, onHardReset, onImport, onAddCapital }) => {
  const { isCloud, saveFirebaseConfig, saveGoogleSheetsConfig, disconnectCloud, uploadLocalToCloud } = useData();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Collector>({ id: '', name: '', area: '', pass: '', dailyRate: 0, quota: 0 });
  const [capitalAmt, setCapitalAmt] = useState('');

  // Firebase Config State
  const [fbConfig, setFbConfig] = useState('');
  // Google Sheets Config State
  const [gsConfig, setGsConfig] = useState({ sheetId: '', apiKey: '' });

  const handleEdit = (c: Collector) => {
    setFormData({ ...c, quota: c.quota || 0 });
    setIsEditing(true);
  };

  const handleAdd = () => {
    setFormData({ id: genId(), name: '', area: '', pass: '1234', dailyRate: 0, quota: 0 });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.area || !formData.pass) return alert("Fill all fields");
    onUpdateCollector(formData);
    setIsEditing(false);
  };

  const handleAddCapital = () => {
    const amt = parseFloat(capitalAmt);
    if (!amt || amt <= 0) return alert("Invalid amount");
    if (onAddCapital) {
      onAddCapital(amt, "Admin");
      setCapitalAmt('');
      alert(`Successfully added ${formatMoney(amt)} to system capital.`);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `skylend_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        onImport(evt.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleConnectCloud = () => {
      try {
          const config: FirebaseConfig = JSON.parse(fbConfig);
          if(!config.apiKey || !config.projectId) throw new Error("Invalid Config");
          saveFirebaseConfig!(config);
      } catch(e) {
          alert("Invalid JSON or missing fields. Please provide a valid Firebase Configuration object.");
      }
  };

  const handleSaveSheets = () => {
      if(!gsConfig.sheetId) return alert("Sheet ID Required");
      saveGoogleSheetsConfig!(gsConfig);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Team Management */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-display font-bold text-slate-800">Team Management</h2>
           <button onClick={handleAdd} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-800/20 active:scale-95 transition-all hover:bg-slate-700">
             <UserPlus size={18}/> Add Collector
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {db.collectors.map(c => (
             <div key={c.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between group hover:border-zinc-300 transition-colors">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-lg
                     ${c.name === 'Admin' ? 'bg-amber-500' : 'bg-zinc-800'}
                   `}>
                     {c.name.charAt(0)}
                   </div>
                   <div>
                     <div className="font-bold text-slate-800 text-lg">{c.name}</div>
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.area}</div>
                   </div>
                 </div>
                 
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => handleEdit(c)} 
                     className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                     title="Edit User"
                   >
                     <Edit2 size={18}/>
                   </button>
                   {c.name !== 'Admin' && (
                     <button 
                       onClick={() => {if(confirm("Delete user?")) onDeleteCollector(c.id)}} 
                       className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                       title="Delete User"
                     >
                       <Trash2 size={18}/>
                     </button>
                   )}
                 </div>
               </div>
               <div className="bg-slate-50/50 p-3 rounded-xl text-xs text-slate-500 flex justify-between items-center border border-slate-100">
                 <div className="flex flex-col">
                    <span className="font-semibold">Rate: {formatMoney(c.dailyRate || 0)}/day</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Quota: {formatMoney(c.quota || 0)}</span>
                 </div>
                 <span className="font-mono text-slate-400 opacity-60">ID: {String(c.id).substring(0,6)}</span>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* System Actions & Edit Form */}
      <div className="space-y-6">
        
        {/* NEW: HQ Desktop Access Card */}
        <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/20 to-slate-900/40 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
           <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2 relative z-10">
             <Monitor className="text-indigo-400" size={20} /> HQ Desktop Link
           </h3>
           <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 relative z-10">
             Open the Admin Command Center on a larger screen for better visibility.
           </p>
           <div className="flex gap-2 relative z-10">
              <input 
                readOnly 
                value={window.location.href} 
                className="flex-1 glass-input rounded-xl p-3 text-xs font-mono text-slate-300 outline-none border border-white/10 bg-black/20"
              />
              <button 
                onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("HQ Link Copied!");
                }} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition shadow-lg"
                title="Copy Link"
              >
                <Copy size={18}/>
              </button>
              <button 
                onClick={() => window.open(window.location.href, '_blank')} 
                className="bg-white text-indigo-900 font-bold p-3 rounded-xl transition hover:bg-slate-200"
                title="Open in New Window"
              >
                <ExternalLink size={18}/>
              </button>
           </div>
        </div>

        {isEditing && (
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden animate-fade-in z-20 shadow-xl border-zinc-300">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-400 to-zinc-600"></div>
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-800">{String(formData.id).length > 10 ? 'Add New' : 'Edit'} User</h3>
               <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Name</label>
                 <input 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})} 
                   className={`w-full glass-input rounded-xl p-3 text-sm font-bold text-slate-700 outline-none ${formData.name === 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                   placeholder="John Doe" 
                   disabled={formData.name === 'Admin'} // Protect Admin Name
                 />
                 {formData.name === 'Admin' && <p className="text-[10px] text-amber-500 mt-1">System Identity Locked</p>}
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assigned Area</label>
                 <input 
                    value={formData.area} 
                    onChange={e => setFormData({...formData, area: e.target.value})} 
                    className={`w-full glass-input rounded-xl p-3 text-sm font-bold text-slate-700 outline-none ${formData.name === 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    placeholder="Route 1" 
                    disabled={formData.name === 'Admin'} // Protect Admin Area
                 />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Password</label>
                   <input 
                     value={formData.pass} 
                     onChange={e => setFormData({...formData, pass: e.target.value})} 
                     className="w-full glass-input rounded-xl p-3 text-sm font-bold text-slate-700 outline-none bg-yellow-50/50 focus:bg-white transition-colors" 
                     placeholder="Key" 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Salary Rate</label>
                   <input 
                     type="number" 
                     value={formData.dailyRate} 
                     onChange={e => setFormData({...formData, dailyRate: parseFloat(e.target.value)})} 
                     className="w-full glass-input rounded-xl p-3 text-sm font-bold text-slate-700 outline-none" 
                     placeholder="0.00" 
                   />
                 </div>
               </div>
               
               <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Daily Quota Target</label>
                   <input 
                     type="number" 
                     value={formData.quota} 
                     onChange={e => setFormData({...formData, quota: parseFloat(e.target.value)})} 
                     className="w-full glass-input rounded-xl p-3 text-sm font-bold text-emerald-600 outline-none bg-emerald-50 focus:bg-white" 
                     placeholder="0.00" 
                   />
               </div>
               
               <button onClick={handleSave} className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-xl font-bold shadow-lg shadow-zinc-900/30 active:scale-95 transition-all">
                 <Save size={18}/> Save Changes
               </button>
             </div>
          </div>
        )}

        {/* Cloud Connection Panel */}
        <div className={`glass-card p-6 rounded-3xl border-2 ${isCloud ? 'border-emerald-500/50' : 'border-slate-200'}`}>
           <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
             <Cloud className={isCloud ? 'text-emerald-500' : 'text-slate-400'} size={20} /> 
             {isCloud ? 'Cloud Connected' : 'Cloud Database Connection'}
           </h3>
           
           {isCloud ? (
               <div className="space-y-4">
                   <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-medium border border-emerald-100 flex items-center gap-2">
                       <Wifi size={16}/> System is online and syncing.
                   </div>
                   <button onClick={uploadLocalToCloud} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition shadow-sm flex items-center justify-center gap-2">
                       <Upload size={18}/> Migrate Local Data to Cloud
                   </button>
                   <button onClick={disconnectCloud} className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition border border-slate-200 flex items-center justify-center gap-2">
                       <CloudOff size={18}/> Disconnect
                   </button>
               </div>
           ) : (
               <div className="space-y-3">
                   <p className="text-xs text-slate-500">Paste your Firebase Config object here to enable multi-user online sync.</p>
                   <textarea 
                     value={fbConfig}
                     onChange={e => setFbConfig(e.target.value)}
                     className="w-full h-32 glass-input rounded-xl p-3 text-xs font-mono text-slate-700 outline-none border border-slate-200"
                     placeholder='{"apiKey": "...", "authDomain": "...", "projectId": "..."}'
                   />
                   <button onClick={handleConnectCloud} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition shadow-lg flex items-center justify-center gap-2">
                       <Wifi size={18}/> Connect Database
                   </button>
               </div>
           )}
        </div>
        
        {/* Google Sheets Integration (Simulation) */}
        <div className="glass-card p-6 rounded-3xl">
           <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
             <FileSpreadsheet className="text-green-600" size={20} /> Google Sheets Integration
           </h3>
           <p className="text-xs text-slate-500 mb-3">
               Connect to an external Google Sheet to use as a database backup or mirror. (Requires API setup).
           </p>
           <div className="space-y-3">
               <input 
                 value={gsConfig.sheetId}
                 onChange={e => setGsConfig({...gsConfig, sheetId: e.target.value})}
                 className="w-full glass-input rounded-xl p-3 text-xs text-slate-700 outline-none border border-slate-200"
                 placeholder="Spreadsheet ID"
               />
               <input 
                 value={gsConfig.apiKey}
                 onChange={e => setGsConfig({...gsConfig, apiKey: e.target.value})}
                 className="w-full glass-input rounded-xl p-3 text-xs text-slate-700 outline-none border border-slate-200"
                 placeholder="API Key"
               />
               <button onClick={handleSaveSheets} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-lg flex items-center justify-center gap-2">
                   <Save size={18}/> Save Sheet Config
               </button>
           </div>
        </div>

        {/* Capital Management */}
        <div className="glass-card p-6 rounded-3xl">
           <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
             <Coins className="text-amber-500" size={20} /> Capital Management
           </h3>
           <div className="flex gap-2">
              <input 
                type="number" 
                value={capitalAmt}
                onChange={e => setCapitalAmt(e.target.value)}
                placeholder="Amount"
                className="w-full glass-input rounded-xl p-3 text-sm font-bold text-slate-700 outline-none"
              />
              <button onClick={handleAddCapital} className="bg-amber-500 text-white font-bold px-4 rounded-xl hover:bg-amber-600 transition shadow-sm">
                Add
              </button>
           </div>
        </div>

        {/* Data Management */}
        <div className="glass-card p-6 rounded-3xl">
           <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
             <Database className="text-zinc-500" size={20} /> Data Management
           </h3>
           <div className="space-y-3">
             <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                <Download size={18} /> Backup Database (JSON)
             </button>
             {!isCloud && (
                <div className="relative">
                    <input 
                    type="file" 
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                    <Upload size={18} /> Restore Database
                    </button>
                </div>
             )}
           </div>
        </div>

        <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 backdrop-blur-sm">
           <div className="flex items-center gap-3 text-red-700 font-bold mb-2">
             <ShieldAlert /> Danger Zone
           </div>
           <button onClick={onHardReset} className="w-full py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-colors">
             Factory Reset System
           </button>
        </div>
      </div>
    </div>
  );
};