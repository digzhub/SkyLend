import React, { useState } from 'react';
import { DB, Loan } from '../types';
import { formatMoney, getToday } from '../utils';
import { X, RefreshCw, Calculator, ArrowRight, Printer, Receipt, ScrollText, Table2, Lock } from 'lucide-react';
import { LoanContract } from './LoanContract';

interface ReportsProps {
  db: DB;
  onCreate: (loan: any, user: string) => void;
  onRefinance?: (oldLoanId: string, newPrincipal: number, newTerm: number, sFee: number, dCharge: number, user: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ db, onCreate, onRefinance }) => {
  const [subTab, setSubTab] = useState<'general' | 'collateral'>('general');
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  // Refinance Form State
  const [newPrincipal, setNewPrincipal] = useState<string>('');
  const [newTerm, setNewTerm] = useState<string>('60');
  const [serviceFee, setServiceFee] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');

  // Invoice/Contract Modal State
  const [showInvoice, setShowInvoice] = useState(false);
  const [docView, setDocView] = useState<'invoice' | 'contract'>('invoice');
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const loans = [...db.loans].sort((a,b) => a.name.localeCompare(b.name));
  
  const totals = loans.reduce((acc, curr) => {
    acc.loaned += curr.total;
    acc.paid += (curr.total - curr.balance);
    acc.bal += curr.balance;
    return acc;
  }, { loaned: 0, paid: 0, bal: 0 });

  const openRenewModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setNewPrincipal(loan.principal.toString());
    setNewTerm(loan.term.toString());
    setServiceFee('');
    setDeliveryCharge('');
    setRenewModalOpen(true);
  };

  const handleRefinance = () => {
    if (!selectedLoan || !onRefinance) return;
    const principal = parseFloat(newPrincipal);
    const sFee = parseFloat(serviceFee) || 0;
    const dCharge = parseFloat(deliveryCharge) || 0;

    if (!principal || principal <= 0) {
      alert("Invalid Principal Amount");
      return;
    }

    if (principal < selectedLoan.balance) {
      if (!confirm("New principal is less than outstanding balance. Are you sure? Client will need to pay difference.")) return;
    }

    onRefinance(selectedLoan.id, principal, parseInt(newTerm), sFee, dCharge, "Admin");
    
    // Calculate for Invoice
    const termInt = parseInt(newTerm);
    const rate = termInt === 40 ? 0.10 : (termInt === 30 ? 0.05 : 0.20);
    const interest = principal * rate;
    const total = principal + interest;
    const daily = Math.ceil(total / termInt);
    const netCash = principal - selectedLoan.balance - sFee - dCharge;

    setInvoiceData({
        name: selectedLoan.name,
        address: selectedLoan.address,
        cellNumber: selectedLoan.cellNumber,
        principal,
        interest,
        term: termInt,
        total,
        daily,
        serviceFee: sFee,
        deliveryCharge: dCharge,
        oldBalance: selectedLoan.balance,
        netProceeds: netCash,
        collateral: selectedLoan.collateral
    });

    setRenewModalOpen(false);
    setDocView('invoice');
    setShowInvoice(true);
  };

  // Calculations for Preview in Modal
  const previewPrincipal = parseFloat(newPrincipal) || 0;
  const previewTerm = parseInt(newTerm);
  const previewSF = parseFloat(serviceFee) || 0;
  const previewDC = parseFloat(deliveryCharge) || 0;
  
  const previewRate = previewTerm === 40 ? 0.10 : (previewTerm === 30 ? 0.05 : 0.20);
  const previewTotal = previewPrincipal + (previewPrincipal * previewRate);
  const previewDaily = Math.ceil(previewTotal / previewTerm);
  const netCash = selectedLoan ? previewPrincipal - selectedLoan.balance - previewSF - previewDC : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sub Navigation */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
          <button 
            onClick={() => setSubTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'general' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <Table2 size={16}/> General Report
          </button>
          <button 
            onClick={() => setSubTab('collateral')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'collateral' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
              <Lock size={16}/> Collateral Registry
          </button>
      </div>

      {subTab === 'general' && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="glass-card p-6 text-white shadow-lg">
           <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Receivable</div>
           <div className="text-3xl font-black">{formatMoney(totals.loaned)}</div>
         </div>
         <div className="glass-card p-6 text-white shadow-lg border-emerald-500/30">
           <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Collected</div>
           <div className="text-3xl font-black">{formatMoney(totals.paid)}</div>
         </div>
         <div className="glass-card p-6 text-white shadow-lg border-red-500/30">
           <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Outstanding Bal</div>
           <div className="text-3xl font-black">{formatMoney(totals.bal)}</div>
         </div>
      </div>

      <div className="glass-card overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/5 bg-slate-900/30">
           <h2 className="text-lg font-black text-white">Client Portfolio Report</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
               <tr>
                 <th className="p-4">Client</th>
                 <th className="p-4">Total Loaned</th>
                 <th className="p-4">Total Paid</th>
                 <th className="p-4">Balance</th>
                 <th className="p-4">Status</th>
                 <th className="p-4">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {loans.map(l => {
                 const paid = l.total - l.balance;
                 return (
                   <tr key={l.id} className="hover:bg-white/5 transition-colors">
                     <td className="p-4">
                       <div className="font-bold text-white">{l.name}</div>
                       <div className="text-xs text-slate-500 font-semibold">{l.area}</div>
                     </td>
                     <td className="p-4 font-medium text-slate-300">{formatMoney(l.total)}</td>
                     <td className="p-4 text-emerald-400 font-bold">{formatMoney(paid)}</td>
                     <td className="p-4 text-red-400 font-bold">{formatMoney(l.balance)}</td>
                     <td className="p-4">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${l.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                         {l.status}
                       </span>
                     </td>
                     <td className="p-4">
                       {(l.status === 'Paid' || (l.status === 'Active' && l.balance < l.total)) && (
                         <button onClick={() => openRenewModal(l)} className="text-xs bg-cyan-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-cyan-500 transition shadow-sm active:scale-95 flex items-center gap-1">
                           <RefreshCw size={12}/> Renew
                         </button>
                       )}
                     </td>
                   </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {subTab === 'collateral' && (
         <div className="glass-card overflow-hidden">
             <div className="p-6 border-b border-white/5 bg-slate-900/30">
                <h2 className="text-lg font-black text-white">Collateral Registry</h2>
                <p className="text-xs text-slate-400">Track assets secured against loans.</p>
             </div>
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                   <tr>
                     <th className="p-4">Client</th>
                     <th className="p-4">Item Description</th>
                     <th className="p-4">Loan Status</th>
                     <th className="p-4 text-right">Secured Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loans.filter(l => l.collateral && l.collateral !== 'Unsecured').map(l => (
                        <tr key={l.id} className="hover:bg-white/5">
                            <td className="p-4 font-bold text-white">{l.name}</td>
                            <td className="p-4 text-cyan-400 font-mono">{l.collateral}</td>
                            <td className="p-4">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${l.status === 'Active' ? 'border-red-500 text-red-400' : 'border-emerald-500 text-emerald-400'}`}>
                                   {l.status === 'Active' ? 'Held' : 'Released'}
                               </span>
                            </td>
                            <td className="p-4 text-right text-slate-300 font-bold">{formatMoney(l.principal)}</td>
                        </tr>
                    ))}
                    {loans.filter(l => l.collateral && l.collateral !== 'Unsecured').length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">No collateralized loans found.</td></tr>
                    )}
                </tbody>
             </table>
         </div>
      )}

      {/* Refinance Modal */}
      {renewModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="glass-card w-full max-w-md animate-fade-in border border-white/20">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-white">Refinance Loan</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase">{selectedLoan.name}</p>
                 </div>
                 <button onClick={() => setRenewModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X size={20}/></button>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Stats */}
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                       <div className="text-[10px] font-bold text-red-400 uppercase">Old Balance Deduct</div>
                       <div className="text-lg font-black text-white">{formatMoney(selectedLoan.balance)}</div>
                    </div>
                    <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                       <div className="text-[10px] font-bold text-emerald-400 uppercase">Net Cash Release</div>
                       <div className="text-lg font-black text-white">{formatMoney(netCash)}</div>
                    </div>
                 </div>

                 {/* Inputs */}
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">New Principal</label>
                            <input 
                                type="number" 
                                value={newPrincipal} 
                                onChange={e => setNewPrincipal(e.target.value)} 
                                className="w-full glass-input p-3 font-bold text-white outline-none rounded-xl"
                            />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">New Term</label>
                           <select 
                              value={newTerm} 
                              onChange={e => setNewTerm(e.target.value)} 
                              className="w-full glass-input p-3 font-bold text-white outline-none rounded-xl"
                           >
                              <option value="60">60 Days (20%)</option>
                              <option value="40">40 Days (10%)</option>
                              <option value="30">30 Days (5%)</option>
                           </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Service Fee</label>
                            <input 
                                type="number" 
                                value={serviceFee} 
                                onChange={e => setServiceFee(e.target.value)} 
                                className="w-full glass-input p-3 font-bold text-red-300 outline-none rounded-xl"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Delivery</label>
                            <input 
                                type="number" 
                                value={deliveryCharge} 
                                onChange={e => setDeliveryCharge(e.target.value)} 
                                className="w-full glass-input p-3 font-bold text-red-300 outline-none rounded-xl"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                 </div>
                 
                 {/* New Terms Preview */}
                 <div className="bg-slate-900 text-slate-300 rounded-xl p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                       <span>New Total Payable</span>
                       <span className="font-bold text-white">{formatMoney(previewTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>New Daily</span>
                       <span className="font-bold text-white">{formatMoney(previewDaily)}</span>
                    </div>
                 </div>

                 <button onClick={handleRefinance} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-emerald-500">
                    <RefreshCw size={18}/> Process Refinance
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Invoice/Contract Modal for Renewal */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className="bg-white text-black rounded-lg w-full max-w-lg shadow-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:rounded-none flex flex-col max-h-[90vh]">
              <div className="bg-slate-800 p-4 flex justify-between items-center print:hidden shrink-0">
                 <div className="flex gap-2">
                    <button 
                       onClick={() => setDocView('invoice')} 
                       className={`px-3 py-1 rounded text-xs font-bold transition ${docView === 'invoice' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                       <Receipt size={14} className="inline mr-1"/> Invoice
                    </button>
                    <button 
                       onClick={() => setDocView('contract')} 
                       className={`px-3 py-1 rounded text-xs font-bold transition ${docView === 'contract' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                       <ScrollText size={14} className="inline mr-1"/> Contract
                    </button>
                 </div>
                 <button onClick={() => setShowInvoice(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {docView === 'invoice' ? (
                   <div className="p-8" id="invoice-area">
                      <div className="text-center mb-6">
                         <h1 className="text-2xl font-black uppercase tracking-widest">SkyLend V2.0</h1>
                         <p className="text-xs font-bold text-slate-500">Stratosphere Enterprise</p>
                         <p className="text-xs text-slate-500 mt-1">{getToday()}</p>
                      </div>

                      <div className="mb-6 pb-6 border-b-2 border-slate-100">
                         <div className="text-xs font-bold text-slate-400 uppercase">Borrower (Renewal)</div>
                         <div className="text-xl font-bold">{invoiceData.name}</div>
                         <div className="text-sm text-slate-600">{invoiceData.address}</div>
                         <div className="text-sm text-slate-600">{invoiceData.cellNumber}</div>
                      </div>

                      <table className="w-full text-sm mb-6">
                         <tbody>
                            <tr>
                               <td className="py-1 text-slate-500">New Principal</td>
                               <td className="py-1 text-right font-bold">{formatMoney(invoiceData.principal)}</td>
                            </tr>
                            <tr>
                               <td className="py-1 text-slate-500">Interest</td>
                               <td className="py-1 text-right font-bold">{formatMoney(invoiceData.interest)}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                               <td className="py-1 text-slate-500 pb-2">Term</td>
                               <td className="py-1 text-right font-bold pb-2">{invoiceData.term} Days</td>
                            </tr>
                            <tr>
                               <td className="py-2 font-bold">Total Payable</td>
                               <td className="py-2 text-right font-black text-lg">{formatMoney(invoiceData.total)}</td>
                            </tr>
                            <tr>
                               <td className="py-1 text-slate-500">Daily Payment</td>
                               <td className="py-1 text-right font-bold">{formatMoney(invoiceData.daily)}</td>
                            </tr>
                         </tbody>
                      </table>

                      <div className="bg-slate-50 p-4 rounded-xl mb-6">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-2">Deductions</div>
                         <div className="flex justify-between text-sm mb-1 text-slate-500">
                             <span>Previous Balance</span>
                             <span className="font-bold text-red-600">-{formatMoney(invoiceData.oldBalance)}</span>
                         </div>
                         <div className="flex justify-between text-sm mb-1 text-slate-500">
                            <span>Service Fee</span>
                            <span className="font-bold text-red-600">-{formatMoney(invoiceData.serviceFee || 0)}</span>
                         </div>
                         <div className="flex justify-between text-sm mb-2 border-b border-slate-200 pb-2 text-slate-500">
                            <span>Delivery Charge</span>
                            <span className="font-bold text-red-600">-{formatMoney(invoiceData.deliveryCharge || 0)}</span>
                         </div>
                         <div className="flex justify-between items-center pt-1">
                            <span className="font-black text-lg uppercase">Net Proceeds</span>
                            <span className="font-black text-2xl text-emerald-600">{formatMoney(invoiceData.netProceeds)}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 mt-12 pt-4">
                         <div className="text-center">
                            <div className="border-t border-slate-400 pt-2 text-xs font-bold uppercase text-slate-500">Authorized Signature</div>
                         </div>
                         <div className="text-center">
                            <div className="border-t border-slate-400 pt-2 text-xs font-bold uppercase text-slate-500">Borrower Signature</div>
                         </div>
                      </div>
                   </div>
                ) : (
                   <LoanContract data={invoiceData} />
                )}
              </div>

              <div className="bg-slate-50 p-4 flex gap-3 print:hidden border-t border-slate-200 shrink-0">
                 <button onClick={() => window.print()} className="flex-1 bg-zinc-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800">
                    <Printer size={18}/> Print {docView === 'invoice' ? 'Invoice' : 'Contract'}
                 </button>
                 <button onClick={() => setShowInvoice(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl">
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};