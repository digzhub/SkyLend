import React, { useState, useMemo } from 'react';
import { DB, PayrollRecord } from '../types';
import { formatMoney, getToday, genId } from '../utils';
import { CheckCircle, Calendar, DollarSign, Printer } from 'lucide-react';

interface PayrollProps {
  db: DB;
  onProcess: (records: PayrollRecord[], user: string) => void;
}

export const Payroll: React.FC<PayrollProps> = ({ db, onProcess }) => {
  const [selectedMonth, setSelectedMonth] = useState(getToday().substring(0, 7));

  // Get eligible employees (exclude Admin)
  const employees = useMemo(() => db.collectors.filter(c => c.name !== 'Admin'), [db.collectors]);

  // Check if payroll already run for this month
  const existingPayroll = useMemo(() => {
    return db.payroll.filter(p => p.month === selectedMonth);
  }, [db.payroll, selectedMonth]);

  const isProcessed = existingPayroll.length > 0;

  // Calculate stats for preview
  const payrollPreview = useMemo(() => {
    return employees.map(emp => {
      // Count present days in selected month
      const attendanceRecs = db.attendance.filter(a => 
        a.empId == emp.id && 
        a.date.startsWith(selectedMonth) && 
        a.status === 'Present'
      );
      
      const daysPresent = attendanceRecs.length;
      const rate = emp.dailyRate || 0;
      const gross = daysPresent * rate;
      const deductions = 0; // Placeholder for future features
      const net = gross - deductions;

      return {
        emp,
        daysPresent,
        gross,
        deductions,
        net
      };
    });
  }, [employees, db.attendance, selectedMonth]);

  const totalPayout = payrollPreview.reduce((sum, p) => sum + p.net, 0);

  const handleProcess = () => {
    if (confirm(`Process payroll for ${selectedMonth}? Total: ${formatMoney(totalPayout)}`)) {
      const records: PayrollRecord[] = payrollPreview.map(p => ({
        id: genId(),
        date: new Date().toLocaleString(),
        month: selectedMonth,
        empId: p.emp.id,
        empName: p.emp.name,
        daysPresent: p.daysPresent,
        dailyRate: p.emp.dailyRate || 0,
        grossPay: p.gross,
        deductions: p.deductions,
        netPay: p.net,
        status: 'Paid'
      }));
      
      onProcess(records, 'Admin');
      alert("Payroll Processed Successfully!");
    }
  };

  return (
    <div className="space-y-8">
       {/* Header & Controls */}
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Payroll System</h2>
            <p className="text-slate-500 font-medium">Calculate and disburse monthly salaries.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
               <Calendar size={18} className="text-slate-400"/>
               <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none"
               />
             </div>
             {isProcessed ? (
               <button onClick={() => window.print()} className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                 <Printer size={18}/> Print Payslips
               </button>
             ) : (
               <button 
                  onClick={handleProcess}
                  disabled={totalPayout === 0}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <DollarSign size={18}/> Process Payout
               </button>
             )}
          </div>
       </div>

       {/* Summary Card */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Employees</div>
           <div className="text-3xl font-black text-slate-800">{employees.length}</div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Days Worked</div>
           <div className="text-3xl font-black text-slate-800">{payrollPreview.reduce((sum, p) => sum + p.daysPresent, 0)}</div>
         </div>
         <div className={`p-6 rounded-2xl border shadow-sm ${isProcessed ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
           <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isProcessed ? 'text-emerald-400' : 'text-blue-400'}`}>
             {isProcessed ? 'Total Paid Out' : 'Estimated Payout'}
           </div>
           <div className={`text-3xl font-black ${isProcessed ? 'text-emerald-700' : 'text-blue-700'}`}>
             {formatMoney(totalPayout)}
           </div>
         </div>
       </div>

       {/* Payroll Table / Slips */}
       <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
         {isProcessed ? (
            // Processed View (History/Slips)
            <div className="divide-y divide-slate-100">
               {existingPayroll.map(rec => (
                 <div key={rec.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 break-inside-avoid">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-xl">
                          {rec.empName.charAt(0)}
                       </div>
                       <div>
                          <div className="font-bold text-lg text-slate-800">{rec.empName}</div>
                          <div className="text-sm text-slate-500">{rec.daysPresent} days worked • {formatMoney(rec.dailyRate)}/day</div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <div className="text-xs font-bold text-slate-400 uppercase">Gross Pay</div>
                          <div className="font-bold text-slate-700">{formatMoney(rec.grossPay)}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-xs font-bold text-slate-400 uppercase">Net Pay</div>
                          <div className="font-black text-xl text-emerald-600">{formatMoney(rec.netPay)}</div>
                       </div>
                       <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                          <CheckCircle size={12}/> Paid
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         ) : (
            // Preview View
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                   <th className="p-4">Employee</th>
                   <th className="p-4">Days Present</th>
                   <th className="p-4">Daily Rate</th>
                   <th className="p-4">Gross</th>
                   <th className="p-4 text-right">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {payrollPreview.map(p => (
                    <tr key={p.emp.id} className="hover:bg-slate-50">
                       <td className="p-4 font-bold text-slate-700">{p.emp.name}</td>
                       <td className="p-4">{p.daysPresent}</td>
                       <td className="p-4">{formatMoney(p.emp.dailyRate || 0)}</td>
                       <td className="p-4 text-slate-500">{formatMoney(p.gross)}</td>
                       <td className="p-4 text-right font-black text-slate-800">{formatMoney(p.net)}</td>
                    </tr>
                 ))}
                 {payrollPreview.length === 0 && (
                   <tr><td colSpan={5} className="p-8 text-center text-slate-400">No employees found.</td></tr>
                 )}
              </tbody>
            </table>
         )}
       </div>
    </div>
  );
};