import React, { useState, useMemo } from 'react';
import { DB, CurrentUser } from '../types';
import { formatMoney, getToday, isOverdue, getOverdueDays, calculateCreditScore } from '../utils';
import { Search, Calendar, MapPin, AlertCircle, ShieldCheck, Check, Target, UserX, TrendingUp } from 'lucide-react';

interface CollectionProps {
  db: DB;
  currentUser: CurrentUser;
  onPay: (id: string, amt: number, user: string, date: string) => void;
}

interface PaymentRowProps {
  loan: any;
  compact?: boolean;
  isPaid: boolean;
  dateFilter: string;
  currentUser: CurrentUser;
  onPay: (id: string, amt: number, user: string, date: string) => void;
  creditScore: { score: number, label: string, color: string };
}

const PaymentRow: React.FC<PaymentRowProps> = ({ loan, compact = false, isPaid, dateFilter, currentUser, onPay, creditScore }) => {
  const [amt, setAmt] = useState(loan.daily);
  const isOD = isOverdue(loan);
  const isToday = dateFilter === getToday();

  return (
    <div className={`
      relative overflow-hidden rounded-xl mb-3 transition-all duration-300 border
      ${isPaid 
        ? 'bg-slate-900/50 border-slate-800 opacity-60' 
        : 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/50 hover:shadow-neon-blue'}
      ${isOD && !isPaid ? 'border-l-4 border-l-red-500' : ''}
    `}>
      <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
        {/* Info Section */}
        <div className="flex-1 w-full text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
             <h3 className={`font-bold text-lg ${isPaid ? 'text-slate-500' : 'text-white'}`}>{loan.name}</h3>
             {!compact && (
                <div title={`Credit Score: ${creditScore.score}`} className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${creditScore.score >= 90 ? 'bg-emerald-500 text-emerald-500' : (creditScore.score >= 70 ? 'bg-blue-500 text-blue-500' : 'bg-red-500 text-red-500')}`}></div>
             )}
             {isOD && <span className="bg-red-900/50 border border-red-500/50 text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">{getOverdueDays(loan)}d Late</span>}
             {isPaid && <span className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={10}/> Paid</span>}
          </div>
          {!compact && (
            <div className="text-xs text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-1 font-mono">
              <MapPin size={12}/> {loan.area}
            </div>
          )}
        </div>

        {/* Numbers Section */}
        <div className="flex items-center gap-6 w-full sm:w-auto justify-around sm:justify-end bg-slate-900/50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
          <div className="text-center sm:text-right">
             <div className="text-[10px] uppercase font-bold text-slate-500">Daily</div>
             <div className="font-bold text-slate-200 font-mono">{formatMoney(loan.daily)}</div>
          </div>
          {!compact && (
            <div className="text-center sm:text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500">Balance</div>
              <div className="font-bold text-cyan-400 font-mono">{formatMoney(loan.balance)}</div>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="number" 
            value={amt} 
            onChange={e => setAmt(parseFloat(e.target.value))}
            className="w-full sm:w-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-cyan-500 outline-none text-center"
            disabled={isPaid && isToday}
          />
          <button
            onClick={() => {
              const payAmt = compact ? loan.daily : amt;
              if (dateFilter !== getToday() && !confirm(`Record payment for ${dateFilter}?`)) return;
              onPay(loan.id, payAmt, currentUser.name, dateFilter);
            }}
            disabled={isPaid && isToday}
            className={`
              w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-bold text-white transition-all
              ${isPaid && isToday 
                ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg hover:shadow-emerald-500/30 active:scale-95'}
            `}
          >
            {isPaid && isToday ? 'Done' : 'Pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Collection: React.FC<CollectionProps> = ({ db, currentUser, onPay }) => {
  const [dateFilter, setDateFilter] = useState(getToday());
  const [areaFilter, setAreaFilter] = useState(currentUser.role === 'admin' ? 'All' : currentUser.area);
  const [search, setSearch] = useState('');

  const isAdmin = currentUser.role === 'admin';
  const areas = useMemo(() => [...new Set(db.collectors.map(c => c.area).filter(a => a && a !== 'HQ'))], [db.collectors]);

  const filteredLoans = useMemo(() => {
    let loans = db.loans.filter(l => l.status === 'Active');
    
    if (areaFilter !== 'All') {
      loans = loans.filter(l => l.area === areaFilter);
    }

    if (search) {
      loans = loans.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
    }

    return loans;
  }, [db.loans, areaFilter, search]);

  const pastDueLoans = useMemo(() => {
    if (isAdmin) return []; // Admin handles past due in separate tab
    return filteredLoans.filter(l => isOverdue(l)).sort((a,b) => getOverdueDays(b) - getOverdueDays(a));
  }, [filteredLoans, isAdmin]);

  const dailyStats = useMemo(() => {
      if(isAdmin && areaFilter === 'All') return null;

      const targetArea = isAdmin ? areaFilter : currentUser.area;
      const targetUser = isAdmin ? db.collectors.find(c => c.area === targetArea)?.name : currentUser.name;
      const targetQuota = isAdmin ? db.collectors.find(c => c.area === targetArea)?.quota || 0 : currentUser.quota || 0;

      const collected = db.ledger
        .filter(t => t.type === 'Collection' && t.simpleDate === dateFilter && (isAdmin ? t.desc : t.user) === (isAdmin ? undefined : targetUser)) 
        // Note: filtering by user for specific collector stats is safer, but ledger stores 'user' as name.
        // For admin viewing a zone, we sum up collection for that zone.
        // Simplified: Filter ledger by current user view context.
        .filter(t => {
            if(isAdmin) {
                 // For admin, we need to match transactions to the loans in the filtered list
                 // This is tricky without strict linking. We will use the displayed loans.
                 return filteredLoans.some(l => t.desc.includes(l.name));
            } else {
                 return t.user === currentUser.name;
            }
        })
        .reduce((sum, t) => sum + t.amt, 0);
      
      let absent = 0;
      filteredLoans.forEach(l => {
          const paid = db.ledger.some(t => t.type === 'Collection' && t.simpleDate === dateFilter && t.desc.includes(l.name));
          if(!paid) absent++;
      });

      return { collected, quota: targetQuota, absent };

  }, [db.ledger, filteredLoans, dateFilter, isAdmin, areaFilter, currentUser]);

  const hasPaidToday = (loanName: string) => {
    return db.ledger.some(t => t.desc.includes(loanName) && t.type === 'Collection' && t.simpleDate === dateFilter);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full perspective-container">
      <div className="lg:col-span-2 flex flex-col h-full">
        {/* Controls */}
        <div className="glass-card p-6 mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h2 className="text-xl font-bold text-white tracking-tight">Daily Collection</h2>
               <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
                 <Calendar size={18} className="text-cyan-400"/>
                 <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold text-white outline-none"
                 />
               </div>
            </div>

            {/* Daily Stats Header */}
            {dailyStats && (
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-700/50">
                    <div className="text-center border-r border-slate-700/50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1"><Target size={10}/> Quota</div>
                        <div className="font-mono font-bold text-white">{formatMoney(dailyStats.quota)}</div>
                    </div>
                    <div className="text-center border-r border-slate-700/50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1"><TrendingUp size={10}/> Collected</div>
                        <div className={`font-mono font-bold ${dailyStats.collected >= dailyStats.quota ? 'text-emerald-400' : 'text-slate-200'}`}>{formatMoney(dailyStats.collected)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1"><UserX size={10}/> Missed</div>
                        <div className={`font-mono font-bold ${dailyStats.absent > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{dailyStats.absent}</div>
                    </div>
                </div>
            )}
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {isAdmin && (
                 <>
                  <button 
                    onClick={() => setAreaFilter('All')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all
                    ${areaFilter === 'All' 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-neon-blue' 
                      : 'bg-transparent text-slate-400 border border-slate-700 hover:bg-slate-800'}`}
                  >
                    All Zones
                  </button>
                  {areas.map(area => (
                    <button 
                      key={area}
                      onClick={() => setAreaFilter(area)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all
                      ${areaFilter === area 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-neon-blue' 
                        : 'bg-transparent text-slate-400 border border-slate-700 hover:bg-slate-800'}`}
                    >
                      {area}
                    </button>
                  ))}
                 </>
               )}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Search database..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm font-medium focus:border-cyan-500 outline-none transition text-white"
              />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20">
            {filteredLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <Search size={48} className="mb-2 opacity-50"/>
                <p className="font-medium font-mono">No entities found.</p>
              </div>
            ) : (
              filteredLoans.map(loan => (
                <PaymentRow 
                  key={loan.id} 
                  loan={loan} 
                  isPaid={hasPaidToday(loan.name)} 
                  dateFilter={dateFilter}
                  currentUser={currentUser}
                  onPay={onPay}
                  creditScore={calculateCreditScore(loan, db.ledger)}
                />
              ))
            )}
        </div>
      </div>

      {!isAdmin && (
        <div className="lg:col-span-1">
          <div className="bg-red-900/10 rounded-2xl border border-red-900/30 h-full flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="p-4 border-b border-red-900/30 bg-red-900/20 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500 animate-pulse"/> 
              <span className="font-bold text-red-400">Critical Priority</span>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3 pb-20">
               {pastDueLoans.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 font-medium font-mono text-sm">All clear. Sector optimal.</div>
               ) : pastDueLoans.map(loan => (
                <PaymentRow 
                  key={loan.id} 
                  loan={loan} 
                  compact 
                  isPaid={hasPaidToday(loan.name)}
                  dateFilter={dateFilter}
                  currentUser={currentUser}
                  onPay={onPay}
                  creditScore={calculateCreditScore(loan, db.ledger)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};