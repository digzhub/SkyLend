import React, { useState } from 'react';
import { useData } from './hooks/useData';
import { CurrentUser, Tab } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Collection } from './components/Collection';
import { Loans } from './components/Loans';
import { Reports } from './components/Reports';
import { MasterList } from './components/MasterList';
import { AttendanceTracker } from './components/AttendanceTracker';
import { PastDue } from './components/PastDue';
import { Ledger } from './components/Ledger';
import { Settings } from './components/Settings';
import { Payroll } from './components/Payroll';
import { AuditLogs } from './components/AuditLogs';
import { Investors } from './components/Investors';
import { Tasks } from './components/Tasks';
import { Intelligence } from './components/Intelligence';
import { Assets } from './components/Assets';
import { Legal } from './components/Legal';
import { Ranking } from './components/Ranking';
import { getToday } from './utils';
import { ShieldCheck, ArrowRight, Building } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    db, 
    processPayment, 
    createLoan,
    refinanceLoan,
    deleteLoan, 
    markAttendance,
    processPayroll,
    updateCollector,
    deleteCollector,
    addCapital,
    hardReset,
    importData,
    isInitialized
  } = useData();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Shared Filter State
  const [dashboardDate, setDashboardDate] = useState(getToday().substring(0, 7));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.collectors.find(c => c.id.toString() === loginId);
    if (user && user.pass === loginPass) {
      setCurrentUser({
        ...user,
        role: user.name === 'Admin' ? 'admin' : 'collector'
      });
      setLoginError('');
      setActiveTab('dashboard');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginId('');
    setLoginPass('');
    setActiveTab('dashboard');
  };

  if (!isInitialized) return <div className="flex h-screen items-center justify-center text-slate-600 font-bold bg-slate-50">Loading System...</div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden bg-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-white"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        
        <div className="bg-white rounded-[2rem] w-full max-w-md p-12 relative z-10 border border-slate-200 shadow-xl">
           
           <div className="text-center mb-10">
             <div className="inline-flex items-center justify-center w-20 h-20 bg-corporate-blue rounded-2xl shadow-lg shadow-blue-500/30 mb-6">
                 <Building size={40} className="text-white" />
             </div>
             
             <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-2">SkyLend</h1>
             <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Professional v3.0</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Identity</label>
               <div className="relative group">
                 <select 
                   className="w-full glass-input rounded-xl p-4 font-bold text-slate-800 outline-none appearance-none cursor-pointer"
                   value={loginId}
                   onChange={(e) => setLoginId(e.target.value)}
                   required
                 >
                   <option value="" disabled>Select Profile</option>
                   {db.collectors.map(c => (
                     <option key={c.id} value={c.id}>{c.name} — {c.area}</option>
                   ))}
                 </select>
               </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Access Key</label>
               <input 
                 type="password" 
                 className="w-full glass-input rounded-xl p-4 font-bold text-slate-800 outline-none tracking-widest"
                 placeholder="••••••••"
                 value={loginPass}
                 onChange={(e) => setLoginPass(e.target.value)}
                 required
               />
             </div>

             {loginError && (
               <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
                 <ShieldCheck size={16}/> {loginError}
               </div>
             )}

             <button type="submit" className="w-full bg-corporate-blue text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all hover:bg-blue-600 text-sm flex items-center justify-center gap-2 group mt-6 uppercase tracking-wider">
               Authenticate <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
             </button>
           </form>
           
           <div className="mt-8 text-center">
             <p className="text-[10px] text-slate-400 font-medium">Enterprise Edition • Secure Access</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentUser={currentUser} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <Dashboard 
          db={db} 
          currentUser={currentUser} 
          filterDate={dashboardDate}
          onFilterChange={setDashboardDate}
        />
      )}
      
      {activeTab === 'collect' && (
        <Collection 
          db={db} 
          currentUser={currentUser}
          onPay={processPayment}
        />
      )}

      {activeTab === 'loans' && currentUser.role === 'admin' && (
        <Loans 
          db={db}
          currentUser={currentUser}
          onCreate={createLoan}
          onDelete={deleteLoan}
        />
      )}

      {activeTab === 'pastdue' && currentUser.role === 'admin' && (
        <PastDue db={db} />
      )}

      {activeTab === 'reports' && currentUser.role === 'admin' && (
        <Reports 
           db={db}
           onCreate={createLoan}
           onRefinance={refinanceLoan}
        />
      )}

      {activeTab === 'payroll' && currentUser.role === 'admin' && (
        <Payroll 
           db={db}
           onProcess={processPayroll}
        />
      )}

      {activeTab === 'ledger' && currentUser.role === 'admin' && (
        <Ledger db={db} />
      )}

      {activeTab === 'audit' && currentUser.role === 'admin' && (
        <AuditLogs db={db} />
      )}

      {activeTab === 'masterlist' && currentUser.role === 'admin' && (
        <MasterList 
          db={db} 
          currentUser={currentUser} 
        />
      )}
      
      {activeTab === 'attendance' && currentUser.role === 'admin' && (
        <AttendanceTracker
          db={db}
          onMark={markAttendance}
        />
      )}

      {activeTab === 'settings' && currentUser.role === 'admin' && (
        <Settings 
          db={db}
          onUpdateCollector={updateCollector}
          onDeleteCollector={deleteCollector}
          onAddCapital={addCapital}
          onHardReset={hardReset}
          onImport={importData}
        />
      )}

      {/* V3.0 New Tabs */}
      {activeTab === 'investors' && currentUser.role === 'admin' && (
        <Investors db={db} />
      )}

      {activeTab === 'tasks' && (
        <Tasks db={db} currentUser={currentUser} />
      )}

      {activeTab === 'intelligence' && currentUser.role === 'admin' && (
        <Intelligence db={db} />
      )}

      {activeTab === 'assets' && currentUser.role === 'admin' && (
        <Assets db={db} />
      )}

      {activeTab === 'legal' && currentUser.role === 'admin' && (
        <Legal />
      )}
      
      {activeTab === 'ranking' && currentUser.role === 'admin' && (
        <Ranking db={db} />
      )}

    </Layout>
  );
};