import React from 'react';
import { CurrentUser, Tab } from '../types';
import { 
  LayoutDashboard, 
  Banknote, 
  FileText, 
  AlertTriangle, 
  BookOpen, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu,
  Printer,
  CalendarCheck,
  ShieldCheck,
  Search,
  Bell,
  Briefcase,
  ShieldAlert,
  BarChart4,
  Cloud,
  WifiOff,
  Building,
  Box,
  Scale,
  Users,
  Trophy
} from 'lucide-react';
import { getToday } from '../utils';
import { useData } from '../hooks/useData';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: CurrentUser;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  activeTab, 
  onTabChange, 
  onLogout 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isCloud, firebaseError } = useData();

  const NavButton = ({ tab, icon: Icon, label, adminOnly = false }: any) => {
    if (adminOnly && currentUser.role !== 'admin') return null;
    
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => {
          onTabChange(tab);
          setMobileMenuOpen(false);
        }}
        className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-sm font-medium transition-all duration-200
          ${isActive 
            ? 'bg-corporate-blue text-white shadow-md' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
      >
        <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden font-sans bg-slate-50 text-slate-900">
      
      {/* Mobile Header */}
      <div className="md:hidden shrink-0 w-full p-4 flex items-center justify-between bg-white border-b border-slate-200 z-30">
         <div className="font-display font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
           <div className="w-8 h-8 bg-corporate-blue rounded-lg flex items-center justify-center text-white shadow-lg">
             <Building size={20}/>
           </div>
           SkyLend Pro
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-slate-100 rounded-lg text-slate-600">
          <Menu size={20}/>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full w-72 bg-white sidebar-panel z-40 transform transition-transform duration-300 ease-out flex flex-col shadow-xl md:shadow-none
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Sidebar Header */}
        <div className="p-6 shrink-0 border-b border-slate-100">
          <div className="font-display font-black text-2xl text-slate-900 tracking-tight flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-corporate-blue rounded-xl flex items-center justify-center shadow-md text-white">
              <Building size={24} />
            </div>
            SkyLend
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-14">Professional v3.0</div>
        </div>

        {/* User Profile */}
        <div className="p-4 mx-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
             <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-white shadow-sm">
               {currentUser.name.charAt(0)}
             </div>
             <div>
               <div className="font-bold text-slate-800 text-sm">{currentUser.name}</div>
               <div className="text-xs text-slate-500 flex items-center gap-1">
                 {currentUser.role === 'admin' ? <ShieldCheck size={12} className="text-corporate-blue"/> : null}
                 {currentUser.area}
               </div>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar pb-20">
          <div className="text-[11px] font-bold text-slate-400 uppercase px-4 py-2 mt-2 tracking-widest">Operations</div>
          <NavButton tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavButton tab="collect" icon={Banknote} label="Collections" />
          <NavButton tab="tasks" icon={FileText} label="Tasks" />
          
          {currentUser.role === 'admin' && (
            <>
              <div className="text-[11px] font-bold text-slate-400 uppercase px-4 py-2 mt-4 tracking-widest">Management</div>
              <NavButton tab="loans" icon={FileText} label="Loan Portfolio" adminOnly />
              <NavButton tab="ranking" icon={Trophy} label="Leaderboard" adminOnly />
              <NavButton tab="investors" icon={BarChart4} label="Investors" adminOnly />
              <NavButton tab="assets" icon={Box} label="Asset Manager" adminOnly />
              
              <div className="text-[11px] font-bold text-slate-400 uppercase px-4 py-2 mt-4 tracking-widest">Human Resources</div>
              <NavButton tab="attendance" icon={CalendarCheck} label="Attendance" adminOnly />
              <NavButton tab="payroll" icon={Briefcase} label="Payroll" adminOnly />

              <div className="text-[11px] font-bold text-slate-400 uppercase px-4 py-2 mt-4 tracking-widest">Risk & Finance</div>
              <NavButton tab="ledger" icon={BookOpen} label="General Ledger" adminOnly />
              <NavButton tab="pastdue" icon={AlertTriangle} label="Past Due" adminOnly />
              <NavButton tab="legal" icon={Scale} label="Legal Hub" adminOnly />
              <NavButton tab="intelligence" icon={BarChart4} label="Analytics" adminOnly />

              <div className="text-[11px] font-bold text-slate-400 uppercase px-4 py-2 mt-4 tracking-widest">System</div>
              <NavButton tab="reports" icon={Printer} label="Reports" adminOnly />
              <NavButton tab="masterlist" icon={Printer} label="Route Sheets" adminOnly />
              <NavButton tab="audit" icon={ShieldAlert} label="Audit Logs" adminOnly />
              <NavButton tab="settings" icon={SettingsIcon} label="Settings" adminOnly />
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50" onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}>
        
        {/* Top Header */}
        <header className="h-16 shrink-0 px-8 flex items-center justify-between z-10 hidden md:flex bg-white border-b border-slate-200 shadow-sm">
           {/* Search */}
           <div className="flex items-center gap-3 w-96 bg-slate-100 rounded-lg px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
             <Search size={18} className="text-slate-400" />
             <input type="text" placeholder="Global Search (Clients, Assets, Loans)..." className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:text-slate-400" />
           </div>

           <div className="flex items-center gap-6">
             <div className="text-right hidden lg:block">
               <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{getToday()}</div>
               <div className="text-xs font-bold flex items-center justify-end gap-1">
                 {isCloud ? (
                     <>
                        <Cloud size={12} className="text-emerald-500" />
                        <span className="text-emerald-600">Online & Syncing</span>
                     </>
                 ) : (
                     <>
                        <WifiOff size={12} className="text-slate-400" />
                        <span className="text-slate-500">Local Mode</span>
                     </>
                 )}
               </div>
             </div>
             <div className="h-8 w-px bg-slate-200"></div>
             <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-full">
               <Bell size={20} />
               {firebaseError && (
                 <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
               )}
             </button>
           </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth relative z-10 custom-scrollbar">
           <div className="max-w-7xl mx-auto pb-20">
             {firebaseError && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-bold shadow-sm">
                 <ShieldAlert size={20} />
                 {firebaseError}
               </div>
             )}
             {children}
           </div>
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};