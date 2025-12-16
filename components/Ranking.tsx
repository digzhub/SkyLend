import React, { useState, useMemo } from 'react';
import { DB } from '../types';
import { formatMoney, getToday } from '../utils';
import { Trophy, Calendar, TrendingUp, AlertOctagon, Target } from 'lucide-react';

interface RankingProps {
  db: DB;
}

export const Ranking: React.FC<RankingProps> = ({ db }) => {
  // Periods: Bi-monthly blocks
  const periods = [
      { label: 'Jan - Feb', months: ['01', '02'] },
      { label: 'Mar - Apr', months: ['03', '04'] },
      { label: 'May - Jun', months: ['05', '06'] },
      { label: 'Jul - Aug', months: ['07', '08'] },
      { label: 'Sep - Oct', months: ['09', '10'] },
      { label: 'Nov - Dec', months: ['11', '12'] },
  ];
  
  const currentMonthStr = new Date().toISOString().split('-')[1]; // "01" etc
  const defaultPeriodIndex = periods.findIndex(p => p.months.includes(currentMonthStr));
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(defaultPeriodIndex !== -1 ? defaultPeriodIndex : 0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const collectors = useMemo(() => db.collectors.filter(c => c.name !== 'Admin'), [db.collectors]);

  const rankings = useMemo(() => {
    const selectedMonths = periods[selectedPeriodIdx].months;
    
    return collectors.map(c => {
        // Total collected in period
        const totalCollected = db.ledger
            .filter(t => {
                const txDate = t.simpleDate; // YYYY-MM-DD
                const txYear = txDate.split('-')[0];
                const txMonth = txDate.split('-')[1];
                return t.type === 'Collection' && t.user === c.name && txYear === selectedYear && selectedMonths.includes(txMonth);
            })
            .reduce((sum, t) => sum + t.amt, 0);

        // Daily stats
        const activeLoans = db.loans.filter(l => l.status === 'Active' && l.area === c.area);
        const collectedToday = db.ledger
            .filter(t => t.type === 'Collection' && t.user === c.name && t.simpleDate === getToday())
            .reduce((sum, t) => sum + t.amt, 0);

        // Calculate Missed / Absent Payments for Today
        // Logic: Iterate Active Loans. If a payment was made today for that loan name, it's paid. Else absent.
        // Note: This is an approximation based on desc.
        let absentCount = 0;
        let presentCount = 0;
        activeLoans.forEach(l => {
             const hasPaid = db.ledger.some(t => t.type === 'Collection' && t.simpleDate === getToday() && t.desc.includes(l.name));
             if(hasPaid) presentCount++;
             else absentCount++;
        });
        
        return {
            ...c,
            totalCollected,
            collectedToday,
            absentCount,
            presentCount,
            quota: c.quota || 0
        };
    }).sort((a,b) => b.totalCollected - a.totalCollected);

  }, [collectors, db.ledger, db.loans, selectedPeriodIdx, selectedYear, periods]);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
                <h2 className="text-3xl font-display font-bold text-slate-900">Leaderboard</h2>
                <p className="text-slate-500">Bi-Monthly Performance Ranking</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <Calendar className="text-slate-400 ml-2" size={18}/>
                <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 outline-none"
                >
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                </select>
                <div className="w-px h-6 bg-slate-200"></div>
                <select 
                    value={selectedPeriodIdx} 
                    onChange={e => setSelectedPeriodIdx(parseInt(e.target.value))}
                    className="bg-transparent font-bold text-slate-700 outline-none pr-2"
                >
                    {periods.map((p, idx) => (
                        <option key={idx} value={idx}>{p.label}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {rankings.map((r, idx) => (
                <div key={r.id} className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
                    {/* Rank Badge */}
                    <div className={`
                        flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg
                        ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-amber-500/30' : 
                          idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/30' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-orange-400/30' :
                          'bg-slate-100 text-slate-400'}
                    `}>
                        {idx === 0 ? <Trophy size={24}/> : `#${idx + 1}`}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-800">{r.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{r.area}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto">
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total {periods[selectedPeriodIdx].label}</div>
                            <div className="text-xl font-black text-corporate-blue">{formatMoney(r.totalCollected)}</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-center gap-1">Daily Quota <Target size={10}/></div>
                            <div className="text-lg font-bold text-slate-700">{formatMoney(r.quota)}</div>
                        </div>

                        <div className="text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-center gap-1">Today's In <TrendingUp size={10}/></div>
                            <div className={`text-lg font-bold ${r.collectedToday >= r.quota ? 'text-emerald-500' : 'text-slate-700'}`}>
                                {formatMoney(r.collectedToday)}
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-center gap-1">Absents <AlertOctagon size={10}/></div>
                            <div className={`text-lg font-black ${r.absentCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {r.absentCount}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};