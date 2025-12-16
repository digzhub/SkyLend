import React, { useMemo } from 'react';
import { DB } from '../types';
import { formatMoney, isOverdue, getOverdueDays } from '../utils';
import { AlertTriangle, Phone, MapPin } from 'lucide-react';

interface PastDueProps {
  db: DB;
}

export const PastDue: React.FC<PastDueProps> = ({ db }) => {
  const overdueLoans = useMemo(() => {
    return db.loans
      .filter(l => l.status === 'Active' && isOverdue(l))
      .sort((a, b) => getOverdueDays(b) - getOverdueDays(a));
  }, [db.loans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-red-600 text-white p-6 rounded-3xl shadow-lg shadow-red-600/20">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
           <AlertTriangle size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Past Due Accounts</h2>
          <p className="font-medium text-red-100">Total overdue clients: {overdueLoans.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {overdueLoans.map(loan => {
          const daysLate = getOverdueDays(loan);
          return (
            <div key={loan.id} className="group bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(220,38,38,0.15)] hover:border-red-100 transition-all duration-300">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-red-700 transition-colors">{loan.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                      <MapPin size={10} /> {loan.area}
                    </div>
                  </div>
                  <div className="text-center bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                     <div className="text-2xl font-black text-red-600 leading-none">{daysLate}</div>
                     <div className="text-[10px] font-bold text-red-400 uppercase">Days Late</div>
                  </div>
               </div>

               <div className="space-y-3 mb-6">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Daily Amount</span>
                   <span className="font-bold text-slate-700">{formatMoney(loan.daily)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Remaining Balance</span>
                   <span className="font-bold text-red-600">{formatMoney(loan.balance)}</span>
                 </div>
                 {loan.cellNumber && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <Phone size={12}/> {loan.cellNumber}
                    </div>
                 )}
                 {loan.address && (
                    <div className="text-xs text-slate-500 px-2 truncate">
                      {loan.address}
                    </div>
                 )}
               </div>

               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                 <div 
                    className="bg-red-500 h-full rounded-full" 
                    style={{ width: `${Math.min(100, (loan.balance / loan.total) * 100)}%` }}
                 ></div>
               </div>
               <div className="text-right text-[10px] font-bold text-slate-400 mt-1">
                 {Math.round((loan.balance / loan.total) * 100)}% Unpaid
               </div>
            </div>
          );
        })}
        
        {overdueLoans.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Excellent Work!</h3>
            <p className="text-slate-500">There are no overdue accounts at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};