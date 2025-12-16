import React, { useState, useMemo } from 'react';
import { DB, Loan, CurrentUser } from '../types';
import { formatMoney, isOverdue, getToday, getOverdueDays } from '../utils';
import { Printer } from 'lucide-react';

interface MasterListProps {
  db: DB;
  currentUser: CurrentUser;
}

export const MasterList: React.FC<MasterListProps> = ({ db }) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'PastDue'>('All');
  const [filterCollector, setFilterCollector] = useState('All');

  const collectors = useMemo(() => db.collectors.filter(c => c.name !== 'Admin'), [db.collectors]);
  const areas = useMemo(() => [...new Set(collectors.map(c => c.area).filter(a => a && a !== 'HQ'))], [collectors]);

  // Logic to group loans by collector for printing
  const printableData = useMemo(() => {
    let loansToPrint = db.loans.filter(l => l.status === 'Active' || (l.status === 'Paid' && l.balance > 0));

    if (filterStatus === 'PastDue') {
      loansToPrint = loansToPrint.filter(l => isOverdue(l));
    }

    let targetCollectors = collectors;
    if (filterCollector !== 'All') {
      targetCollectors = collectors.filter(c => c.area === filterCollector);
      loansToPrint = loansToPrint.filter(l => l.area === filterCollector);
    }

    // Group by area
    const loansByArea: Record<string, Loan[]> = {};
    loansToPrint.forEach(l => {
      if (!loansByArea[l.area]) loansByArea[l.area] = [];
      loansByArea[l.area].push(l);
    });

    return targetCollectors.map(c => {
      const cLoans = loansByArea[c.area] || [];
      // Sort: Past due first, then name
      cLoans.sort((a, b) => {
        const odA = isOverdue(a);
        const odB = isOverdue(b);
        if (odA && !odB) return -1;
        if (!odA && odB) return 1;
        return a.name.localeCompare(b.name);
      });
      return { collector: c, loans: cLoans, totalBalance: cLoans.reduce((sum, l) => sum + l.balance, 0) };
    }).filter(group => group.loans.length > 0);

  }, [db.loans, collectors, filterStatus, filterCollector]);

  return (
    <div>
      <div className="no-print space-y-6 mb-8">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 text-white">
           <div>
             <h2 className="text-2xl font-black tracking-tight">Master List Generator</h2>
             <p className="text-slate-300 font-medium">Generate print-ready route sheets for collectors.</p>
           </div>
           <button onClick={() => window.print()} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition shadow-[0_4px_0_#94a3b8] active:translate-y-[2px] active:shadow-none">
             <Printer size={20} /> Print Document
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Status Filter</label>
             <div className="flex gap-3">
               <button onClick={() => setFilterStatus('All')} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${filterStatus === 'All' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>All Active</button>
               <button onClick={() => setFilterStatus('PastDue')} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${filterStatus === 'PastDue' ? 'bg-red-50 border-red-500 text-red-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>Past Due Only</button>
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Collector Filter</label>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               <button onClick={() => setFilterCollector('All')} className={`px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap transition-all ${filterCollector === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}>All</button>
               {areas.map(a => (
                 <button key={a} onClick={() => setFilterCollector(a)} className={`px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap transition-all ${filterCollector === a ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}>{a}</button>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Printable Area */}
      <div className="space-y-8 print:space-y-8">
        {printableData.length === 0 ? (
          <div className="text-center p-12 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl no-print">No data matches your filters.</div>
        ) : printableData.map(group => (
          <div key={group.collector.id} className="bg-white border-2 border-slate-900 p-8 print:border-2 print:border-black print:p-0 print:shadow-none shadow-xl rounded-none break-inside-avoid">
            <div className="border-b-4 border-slate-900 pb-4 mb-6">
               <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-black uppercase tracking-tight">{group.collector.name}</h2>
                  <div className="text-right">
                    <div className="text-xl font-bold uppercase tracking-wider">{group.collector.area}</div>
                    <div className="text-sm font-medium">{getToday()}</div>
                  </div>
               </div>
            </div>
            
            <table className="w-full text-xs md:text-sm text-left border-collapse border border-slate-300">
               <thead>
                 <tr className="bg-slate-200 print:bg-slate-200">
                   <th className="border border-slate-400 p-3 font-bold text-slate-900">Client Name</th>
                   <th className="border border-slate-400 p-3 font-bold text-slate-900">Address / Cell</th>
                   <th className="border border-slate-400 p-3 font-bold text-slate-900 w-24">Daily</th>
                   <th className="border border-slate-400 p-3 font-bold text-slate-900 w-24">Balance</th>
                   <th className="border border-slate-400 p-3 font-bold text-slate-900 w-32">Sig / Status</th>
                 </tr>
               </thead>
               <tbody>
                 {group.loans.map(l => {
                    const od = isOverdue(l);
                    return (
                      <tr key={l.id} className={od ? 'bg-red-50 print:bg-gray-100' : ''}>
                        <td className="border border-slate-300 p-3 font-bold">{l.name}</td>
                        <td className="border border-slate-300 p-3">
                            <div>{l.address}</div>
                            <div className="text-xs">{l.cellNumber}</div>
                        </td>
                        <td className="border border-slate-300 p-3 font-medium">{formatMoney(l.daily)}</td>
                        <td className="border border-slate-300 p-3 font-medium">{formatMoney(l.balance)}</td>
                        <td className={`border border-slate-300 p-3 font-bold ${od ? 'text-red-700' : 'text-slate-400'}`}>
                          {od ? `PAST DUE (${getOverdueDays(l)}d)` : '__________'}
                        </td>
                      </tr>
                    );
                 })}
               </tbody>
               <tfoot>
                 <tr className="bg-slate-100 font-bold">
                   <td colSpan={3} className="border border-slate-300 p-3 text-right uppercase">Total Balance</td>
                   <td className="border border-slate-300 p-3">{formatMoney(group.totalBalance)}</td>
                   <td className="border border-slate-300 p-3"></td>
                 </tr>
               </tfoot>
            </table>
            
            <div className="mt-4 text-xs font-bold text-right uppercase">Total Clients: {group.loans.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
};