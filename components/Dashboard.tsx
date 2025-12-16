import React, { useMemo } from 'react';
import { DB, CurrentUser } from '../types';
import { formatMoney, getToday, isOverdue } from '../utils';
import { TrendingUp, Users, AlertCircle, Wallet, ArrowUpRight, ArrowDownRight, Activity, Zap, PieChart, Crown, Target, UserX } from 'lucide-react';

interface DashboardProps {
  db: DB;
  currentUser: CurrentUser;
  onFilterChange: (date: string) => void;
  filterDate: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ db, currentUser, onFilterChange, filterDate }) => {
  const isAdmin = currentUser.role === 'admin';

  const stats = useMemo(() => {
    let totalIn = 0, totalOut = 0, income = 0;
    
    // Calculate Ledger Stats
    const txSource = isAdmin ? db.ledger : db.ledger.filter(t => t.user === currentUser.name);
    txSource.forEach(t => {
      if (t.amt > 0) totalIn += t.amt;
      if (t.amt < 0) totalOut += Math.abs(t.amt);
      if (t.type === 'Collection' && t.simpleDate.startsWith(filterDate)) income += t.amt;
    });

    const activeLoans = isAdmin 
      ? db.loans.filter(l => l.status === 'Active') 
      : db.loans.filter(l => l.status === 'Active' && l.area === currentUser.area);

    const pastDueCount = activeLoans.filter(l => isOverdue(l)).length;
    const portfolioValue = activeLoans.reduce((sum, l) => sum + l.balance, 0);
    const totalClients = isAdmin ? db.loans.length : db.loans.filter(l => l.area === currentUser.area).length; 
    const systemLiquidity = totalIn - totalOut;
    const chartData = [35, 45, 20, 60, 45, 80, 55, 70, 40, 90, 65, 85];
    
    // Daily Performance for Collector
    let dailyCollected = 0;
    let absentCount = 0;
    if (!isAdmin) {
        dailyCollected = db.ledger
          .filter(t => t.user === currentUser.name && t.type === 'Collection' && t.simpleDate === getToday())
          .reduce((sum, t) => sum + t.amt, 0);
        
        // Calculate Absents: Active Loans in area that have NOT paid today
        activeLoans.forEach(l => {
             const hasPaid = db.ledger.some(t => t.type === 'Collection' && t.simpleDate === getToday() && t.desc.includes(l.name));
             if (!hasPaid) absentCount++;
        });
    }

    return { totalIn, totalOut, income, pastDueCount, portfolioValue, activeCount: activeLoans.length, totalClients, systemLiquidity, chartData, dailyCollected, absentCount };
  }, [db, currentUser, filterDate, isAdmin]);

  const recentActivity = useMemo(() => {
    let txs = [...db.ledger];
    if (!isAdmin) txs = txs.filter(t => t.user === currentUser.name);
    return txs.slice(0, 5);
  }, [db.ledger, isAdmin, currentUser]);

  return (
    <div className="space-y-8 animate-fade-in perspective-container pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
             <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Executive Overview</p>
           </div>
           <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
             Dashboard
           </h2>
        </div>
        <div className="bg-white px-2 py-1 rounded-xl flex items-center gap-3 border border-slate-200 shadow-sm">
           <span className="pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Period</span>
           <input 
             type="month" 
             value={filterDate} 
             onChange={(e) => onFilterChange(e.target.value)}
             className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-700 outline-none focus:border-blue-500 px-3 py-2 cursor-pointer transition-colors"
           />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* System Liquidity / Revenue - Large Card */}
        <div className="md:col-span-2 glass-card p-8 relative overflow-hidden group card-3d">
           <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                      {isAdmin ? 'System Liquidity' : 'Total Collected'}
                    </div>
                    <div className="font-bold text-slate-800 text-sm">Real-time Funds</div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="flex items-center justify-end gap-1 text-emerald-600 text-sm font-bold">
                     <TrendingUp size={16}/> +12.5%
                   </div>
                   <div className="text-[10px] text-slate-400">vs last period</div>
                </div>
              </div>

              <div className="text-5xl font-display font-bold text-slate-900 tracking-tight mb-6">
                {formatMoney(isAdmin ? stats.systemLiquidity : stats.totalIn)}
              </div>

              {/* CSS Velocity Chart */}
              <div className="mt-6">
                 <div className="flex justify-between items-end h-16 gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {stats.chartData.map((height, i) => (
                      <div key={i} className="w-full bg-slate-100 rounded-t-sm relative group/bar">
                        <div 
                          className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500 ease-out group-hover/bar:bg-blue-600"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Collector Quota Widget (Visible only to Collectors) */}
        {!isAdmin && (
             <div className="md:col-span-2 grid grid-cols-2 gap-6">
                 <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-emerald-500">
                     <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-400 text-xs uppercase tracking-wider">Daily Quota Target</div>
                        <Target size={18} className="text-emerald-500"/>
                     </div>
                     <div className="text-2xl font-black text-slate-800">{formatMoney(stats.dailyCollected)} <span className="text-sm text-slate-400 font-medium">/ {formatMoney(currentUser.quota || 0)}</span></div>
                     <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{width: `${Math.min(100, (stats.dailyCollected / (currentUser.quota || 1)) * 100)}%`}}></div>
                     </div>
                 </div>
                 
                 <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-red-500">
                     <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-400 text-xs uppercase tracking-wider">Absent Payments</div>
                        <UserX size={18} className="text-red-500"/>
                     </div>
                     <div className="text-2xl font-black text-slate-800">{stats.absentCount}</div>
                     <div className="text-xs text-red-500 font-bold">Uncollected Accounts Today</div>
                 </div>
             </div>
        )}

        {/* Monthly Income */}
        <div className="glass-card p-6 flex flex-col justify-between card-3d hover:border-emerald-300 transition-colors">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                   <Zap size={24} />
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                  Active
                </span>
             </div>
             <div>
                <div className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-1">Monthly Income</div>
                <div className="text-3xl font-display font-bold text-slate-800">{formatMoney(stats.income)}</div>
             </div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-3/4"></div>
             </div>
        </div>

        {/* Active Portfolio */}
        <div className="glass-card p-6 flex flex-col justify-between card-3d hover:border-indigo-300 transition-colors">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                   <PieChart size={24} />
                </div>
             </div>
             <div>
                <div className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-1">Portfolio Value</div>
                <div className="text-3xl font-display font-bold text-slate-800">{formatMoney(stats.portfolioValue)}</div>
             </div>
             <div className="flex items-center gap-2 mt-4 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">
               <Users size={14}/> {stats.activeCount} Contracts
             </div>
        </div>

        {/* Risk Monitor */}
        <div className={`glass-card p-6 flex items-center justify-between border-l-4 card-3d ${stats.pastDueCount > 0 ? 'border-l-red-500 bg-red-50/50' : 'border-l-emerald-500'}`}>
          <div>
             <div className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-1">Risk Monitor</div>
             <div className="text-2xl font-display font-bold text-slate-800">{stats.pastDueCount} Accounts</div>
             <div className={`text-xs font-bold ${stats.pastDueCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
               {stats.pastDueCount > 0 ? 'Action Required' : 'Optimal Performance'}
             </div>
          </div>
          <div className={`p-4 rounded-full border ${stats.pastDueCount > 0 ? 'bg-red-100 text-red-500 border-red-200' : 'bg-emerald-100 text-emerald-500 border-emerald-200'}`}>
             <AlertCircle size={24} />
          </div>
        </div>

        {/* Client Base */}
        <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-blue-500 card-3d">
          <div>
             <div className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-1">Total Database</div>
             <div className="text-2xl font-display font-bold text-slate-800">{stats.totalClients}</div>
             <div className="text-xs font-bold text-blue-600">Indexed Records</div>
          </div>
          <div className="p-4 rounded-full bg-blue-100 text-blue-500 border border-blue-200">
             <Crown size={24} />
          </div>
        </div>

        {/* Live Ledger Feed */}
        <div className={`${isAdmin ? 'md:col-span-2' : 'md:col-span-4'} glass-card p-6`}>
           <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Activity size={18} className="text-blue-500"/> 
               Live Feed
             </h3>
             <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] font-mono text-blue-600 uppercase">Real-time</span>
           </div>
           
           <div className="space-y-4">
             {recentActivity.map(t => (
               <div key={t.id} className="flex items-center justify-between group p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-default border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm
                       ${t.amt > 0 ? 'bg-emerald-500' : 'bg-slate-500'}
                     `}>
                       {t.amt > 0 ? <ArrowDownRight size={18}/> : <ArrowUpRight size={18}/>}
                     </div>
                     <div>
                       <div className="font-bold text-slate-700 text-sm">{t.desc}</div>
                       <div className="text-xs text-slate-400 font-mono">{t.date.split(',')[0]} • {t.user}</div>
                     </div>
                  </div>
                  <div className={`font-mono font-bold ${t.amt > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {t.amt > 0 ? '+' : ''}{formatMoney(t.amt)}
                  </div>
               </div>
             ))}
             {recentActivity.length === 0 && <div className="text-center text-slate-400 py-4 text-sm font-mono">System Idle. No data.</div>}
           </div>
        </div>

      </div>
    </div>
  );
};