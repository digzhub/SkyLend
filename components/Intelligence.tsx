import React, { useMemo } from 'react';
import { DB } from '../types';
import { formatMoney } from '../utils';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface IntelligenceProps {
  db: DB;
}

export const Intelligence: React.FC<IntelligenceProps> = ({ db }) => {
  const analysis = useMemo(() => {
    const totalCollected = db.ledger.filter(t => t.type === 'Collection').reduce((sum, t) => sum + t.amt, 0);
    const totalDisbursed = db.ledger.filter(t => t.type === 'Disbursement').reduce((sum, t) => sum + Math.abs(t.amt), 0);
    const totalExpenses = db.ledger.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Math.abs(t.amt), 0);
    const totalDividends = db.ledger.filter(t => t.type === 'Dividend').reduce((sum, t) => sum + Math.abs(t.amt), 0);
    const netProfit = totalCollected - totalDisbursed - totalExpenses - totalDividends;
    
    // Outstanding Portfolio
    const portfolio = db.loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.balance, 0);

    return { totalCollected, totalDisbursed, totalExpenses, totalDividends, netProfit, portfolio };
  }, [db.ledger, db.loans]);

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h2 className="text-3xl font-display font-bold text-white">Intelligence Hub</h2>
            <p className="text-slate-400">Advanced financial analytics and profit tracking.</p>
        </div>

        {/* Profit & Loss Card */}
        <div className="glass-card p-8 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-cyan-500"/> Profit & Loss Statement
            </h3>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/20">
                    <span className="font-bold text-emerald-400">Total Revenue (Collections)</span>
                    <span className="font-mono text-xl font-bold text-white">{formatMoney(analysis.totalCollected)}</span>
                </div>
                
                <div className="pl-8 space-y-2 border-l-2 border-slate-700 ml-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Cost of Lending (Disbursements)</span>
                        <span className="text-red-400 font-mono">({formatMoney(analysis.totalDisbursed)})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Operating Expenses</span>
                        <span className="text-red-400 font-mono">({formatMoney(analysis.totalExpenses)})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Investor Dividends</span>
                        <span className="text-red-400 font-mono">({formatMoney(analysis.totalDividends)})</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-lg text-white">Net Realized Profit</span>
                    <span className={`font-mono text-2xl font-black ${analysis.netProfit >= 0 ? 'text-cyan-400' : 'text-red-500'}`}>
                        {formatMoney(analysis.netProfit)}
                    </span>
                </div>
            </div>
        </div>

        {/* Portfolio Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Unrealized Portfolio Value</div>
                <div className="text-3xl font-black text-white mb-1">{formatMoney(analysis.portfolio)}</div>
                <div className="text-xs text-slate-500">Total outstanding balance in market</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4">
                    <div className="bg-indigo-500 h-full rounded-full w-full animate-pulse-slow"></div>
                </div>
            </div>
            
            <div className="glass-card p-6 flex items-center justify-between">
                <div>
                   <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">ROI Efficiency</div>
                   <div className="text-3xl font-black text-emerald-400">
                      {((analysis.netProfit / (analysis.totalDisbursed || 1)) * 100).toFixed(1)}%
                   </div>
                   <div className="text-xs text-slate-500">Return on Disbursed Capital</div>
                </div>
                <TrendingUp size={48} className="text-emerald-500/20" />
            </div>
        </div>
    </div>
  );
};