import React, { useState, useMemo } from 'react';
import { DB, Transaction } from '../types';
import { formatMoney, getToday, genId } from '../utils';
import { ArrowUpRight, ArrowDownLeft, Filter, Calendar, Plus, Tag } from 'lucide-react';
import { useData } from '../hooks/useData';

interface LedgerProps {
  db: DB;
}

export const Ledger: React.FC<LedgerProps> = ({ db }) => {
  const { addLedger } = useData();
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('');
  
  // Quick Add Expense State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmt, setExpAmt] = useState('');
  const [expCategory, setExpCategory] = useState('Operational');

  const filteredTx = useMemo(() => {
    let txs = [...db.ledger];
    if (typeFilter !== 'All') {
      txs = txs.filter(t => t.type === typeFilter);
    }
    if (monthFilter) {
      txs = txs.filter(t => t.simpleDate.startsWith(monthFilter));
    }
    return txs; 
  }, [db.ledger, typeFilter, monthFilter]);

  const totals = useMemo(() => {
    return filteredTx.reduce((acc, curr) => {
      if (curr.amt > 0) acc.in += curr.amt;
      else acc.out += Math.abs(curr.amt);
      return acc;
    }, { in: 0, out: 0 });
  }, [filteredTx]);

  const handleAddExpense = () => {
     const amt = parseFloat(expAmt);
     if (!expDesc || !amt || amt <= 0) return alert("Invalid expense details");
     
     addLedger('Expense', expDesc, -amt, 'Admin', getToday(), expCategory);
     setExpDesc('');
     setExpAmt('');
     setShowAddExpense(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Summary Cards */}
         <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-platinum-200 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Inflow</p>
               <h3 className="text-2xl font-black text-emerald-600">{formatMoney(totals.in)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
               <ArrowDownLeft size={24} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-platinum-200 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Outflow</p>
               <h3 className="text-2xl font-black text-red-600">{formatMoney(totals.out)}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
               <ArrowUpRight size={24} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-platinum-200 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Net Flow</p>
               <h3 className={`text-2xl font-black ${totals.in - totals.out >= 0 ? 'text-zinc-800' : 'text-orange-600'}`}>
                 {formatMoney(totals.in - totals.out)}
               </h3>
            </div>
            <div className="p-3 bg-zinc-100 text-zinc-600 rounded-xl">
               <span className="font-bold text-xl">=</span>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[600px]">
        {/* Filters */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex flex-wrap gap-4 items-center justify-between">
           <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg text-zinc-800">Transaction History</h3>
              <button 
                 onClick={() => setShowAddExpense(!showAddExpense)}
                 className="text-xs font-bold bg-zinc-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-zinc-700 transition"
              >
                 <Plus size={14} /> Add Expense
              </button>
           </div>
           
           <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-2 py-1 shadow-sm">
                 <Filter size={14} className="text-zinc-400"/>
                 <select 
                   value={typeFilter}
                   onChange={(e) => setTypeFilter(e.target.value)}
                   className="text-sm font-medium text-zinc-600 bg-transparent outline-none"
                 >
                   <option value="All">All Types</option>
                   <option value="Collection">Collections</option>
                   <option value="Disbursement">Disbursements</option>
                   <option value="Expense">Expenses</option>
                   <option value="Capital">Capital</option>
                   <option value="Payroll">Payroll</option>
                 </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-2 py-1 shadow-sm">
                 <Calendar size={14} className="text-zinc-400"/>
                 <input 
                   type="month"
                   value={monthFilter}
                   onChange={(e) => setMonthFilter(e.target.value)}
                   className="text-sm font-medium text-zinc-600 bg-transparent outline-none"
                 />
              </div>
           </div>
        </div>

        {/* Quick Add Expense Form */}
        {showAddExpense && (
           <div className="p-4 bg-zinc-100 border-b border-zinc-200 flex flex-wrap gap-3 items-end animate-fade-in">
              <div className="flex-1 min-w-[200px]">
                 <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Description</label>
                 <input value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full glass-input px-3 py-2 text-sm" placeholder="Office Rent..."/>
              </div>
              <div className="w-32">
                 <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Amount</label>
                 <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} className="w-full glass-input px-3 py-2 text-sm" placeholder="0.00"/>
              </div>
              <div className="w-40">
                 <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Category</label>
                 <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className="w-full glass-input px-3 py-2 text-sm">
                    <option value="Operational">Operational</option>
                    <option value="Fuel">Fuel / Transport</option>
                    <option value="Meals">Meals</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                 </select>
              </div>
              <button onClick={handleAddExpense} className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-red-500 shadow-sm">
                 Record
              </button>
           </div>
        )}

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-100 text-zinc-500 font-bold text-xs uppercase sticky top-0 z-10">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Description</th>
                <th className="p-4">Category</th>
                <th className="p-4">User</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTx.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-zinc-400">No transactions found.</td></tr>
              ) : filteredTx.map(t => (
                <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-4 whitespace-nowrap text-zinc-600">
                    <div className="font-bold text-zinc-700">{t.simpleDate}</div>
                    <div className="text-xs text-zinc-400">{t.date.split(',')[1]}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border
                      ${t.type === 'Collection' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                      ${t.type === 'Disbursement' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                      ${t.type === 'Expense' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                      ${t.type === 'Capital' ? 'bg-purple-50 text-purple-700 border-purple-100' : ''}
                      ${t.type === 'Payroll' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                    `}>
                      {t.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-zinc-700 max-w-xs truncate" title={t.desc}>{t.desc}</td>
                  <td className="p-4">
                     {t.category ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md w-fit">
                           <Tag size={10}/> {t.category}
                        </span>
                     ) : <span className="text-zinc-300">-</span>}
                  </td>
                  <td className="p-4 text-zinc-500">{t.user}</td>
                  <td className={`p-4 text-right font-black ${t.amt > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.amt > 0 ? '+' : ''}{formatMoney(t.amt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};