import React, { useState, useMemo } from 'react';
import { DB, Investor } from '../types';
import { formatMoney, getToday, genId } from '../utils';
import { BriefcaseBusiness, TrendingUp, Plus, DollarSign, PieChart } from 'lucide-react';
import { useData } from '../hooks/useData';

interface InvestorsProps {
  db: DB;
}

export const Investors: React.FC<InvestorsProps> = ({ db }) => {
  const { addInvestor, payDividend } = useData();
  const [showAdd, setShowAdd] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [divRate, setDivRate] = useState('5');

  const investors = db.investors || [];

  const handleAdd = () => {
      const capital = parseFloat(amount);
      if(!name || !capital) return alert("Please fill details");
      
      const newInv: Investor = {
          id: genId(),
          name,
          capitalInvested: capital,
          dateJoined: getToday(),
          dividendRate: parseFloat(divRate),
          totalPayouts: 0
      };
      
      addInvestor(newInv);
      setShowAdd(false);
      setName(''); setAmount('');
  };

  const handlePay = (inv: Investor) => {
      const payout = inv.capitalInvested * (inv.dividendRate / 100);
      if(confirm(`Process dividend payout of ${formatMoney(payout)} to ${inv.name}?`)) {
          payDividend(inv.id, payout);
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-display font-bold text-white">Investor Portal</h2>
                <p className="text-slate-400">Manage capital injection and dividend distribution.</p>
            </div>
            <button onClick={() => setShowAdd(!showAdd)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                <Plus size={20} /> New Investor
            </button>
        </div>

        {showAdd && (
            <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in border border-cyan-500/30">
                <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Investor Name</label>
                    <input value={name} onChange={e=>setName(e.target.value)} className="w-full glass-input p-3 rounded-xl" placeholder="John Doe"/>
                </div>
                <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Capital Amount</label>
                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full glass-input p-3 rounded-xl" placeholder="0.00"/>
                </div>
                <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Dividend Rate (%)</label>
                    <input type="number" value={divRate} onChange={e=>setDivRate(e.target.value)} className="w-full glass-input p-3 rounded-xl" placeholder="5"/>
                </div>
                <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl">Confirm Investment</button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investors.map(inv => (
                <div key={inv.id} className="glass-card p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-20 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xl border border-slate-700">
                                    {inv.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{inv.name}</h3>
                                    <p className="text-xs text-slate-400">Since {inv.dateJoined}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Dividend Rate</div>
                                <div className="text-xl font-mono font-bold text-white">{inv.dividendRate}%</div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-sm text-slate-400 flex items-center gap-2"><BriefcaseBusiness size={14}/> Capital</span>
                                <span className="font-mono font-bold text-white">{formatMoney(inv.capitalInvested)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-sm text-slate-400 flex items-center gap-2"><TrendingUp size={14}/> Total Paid</span>
                                <span className="font-mono font-bold text-emerald-400">{formatMoney(inv.totalPayouts)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handlePay(inv)}
                            className="w-full bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-600 hover:border-emerald-500"
                        >
                            <DollarSign size={16}/> Process Dividend Payout
                        </button>
                    </div>
                </div>
            ))}
            
            {investors.length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-slate-700 rounded-2xl text-slate-500">
                    No investors found. Add capital sources to begin tracking.
                </div>
            )}
        </div>
    </div>
  );
};