import React, { useState, useMemo } from 'react';
import { DB, CurrentUser, Loan } from '../types';
import { formatMoney, exportTableToCSV, calculateCreditScore, getToday } from '../utils';
import { Plus, Trash2, Download, CreditCard, User, MapPin, Smartphone, ShieldCheck, Calculator, ArrowRight, LayoutGrid, List, Printer, X, Receipt, ScrollText, Lock, FileText } from 'lucide-react';
import { LoanContract } from './LoanContract';

interface LoansProps {
  db: DB;
  currentUser: CurrentUser;
  onCreate: (loan: any, user: string) => void;
  onDelete: (id: string) => void;
}

export const Loans: React.FC<LoansProps> = ({ db, currentUser, onCreate, onDelete }) => {
  const [activeView, setActiveView] = useState<'portfolio' | 'architect'>('portfolio');
  const [areaFilter, setAreaFilter] = useState('All');
  
  // Architect Form State
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [amt, setAmt] = useState('');
  const [term, setTerm] = useState('60');
  const [address, setAddress] = useState('');
  const [cell, setCell] = useState('');
  const [collateral, setCollateral] = useState(''); // New V2.0
  const [notes, setNotes] = useState(''); // New V2.0
  
  // New Deductions
  const [serviceFee, setServiceFee] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');

  // Invoice/Contract Modal State
  const [showInvoice, setShowInvoice] = useState(false);
  const [docView, setDocView] = useState<'invoice' | 'contract'>('invoice');
  const [lastLoan, setLastLoan] = useState<any>(null);

  const areas = useMemo(() => [...new Set(db.collectors.map(c => c.area).filter(a => a && a !== 'HQ'))], [db.collectors]);

  const activeLoans = useMemo(() => {
    let loans = db.loans.filter(l => l.status === 'Active');
    if (areaFilter !== 'All') {
      loans = loans.filter(l => l.area === areaFilter);
    }
    return loans;
  }, [db.loans, areaFilter]);

  // Calculations for Architect
  const principal = parseFloat(amt) || 0;
  const sFee = parseFloat(serviceFee) || 0;
  const dCharge = parseFloat(deliveryCharge) || 0;
  
  const termInt = parseInt(term);
  const rate = termInt === 40 ? 0.10 : (termInt === 30 ? 0.05 : 0.20);
  const interest = principal * rate;
  const total = principal + interest;
  const daily = Math.ceil(total / termInt);
  const profitMargin = ((interest / principal) * 100).toFixed(1);
  const netProceeds = principal - sFee - dCharge;

  const handleCreate = () => {
    if (!name || !area || !principal) return alert('Please fill required fields');
    
    const newLoanData = {
      name, area, principal, term: termInt, address, cellNumber: cell,
      serviceFee: sFee, deliveryCharge: dCharge,
      collateral: collateral || 'Unsecured',
      notes
    };

    onCreate(newLoanData, currentUser.name);
    
    // Prepare for Invoice
    setLastLoan({
       ...newLoanData,
       date: getToday(),
       interest,
       total,
       daily,
       netProceeds
    });

    // Reset Form
    setName(''); setAmt(''); setAddress(''); setCell(''); setServiceFee(''); setDeliveryCharge(''); setCollateral(''); setNotes('');
    
    setDocView('invoice');
    setShowInvoice(true);
  };

  const handleExport = () => {
    const data = activeLoans.map(l => [
      l.name, l.area, l.cellNumber || '', l.address || '', 
      l.principal, l.total, l.daily, l.balance, l.term, l.collateral || ''
    ]);
    const headers = ['Client', 'Area', 'Cell', 'Address', 'Principal', 'Total', 'Daily', 'Balance', 'Term', 'Collateral'];
    exportTableToCSV(data, `active_loans_${areaFilter}.csv`, headers);
  };

  return (
    <div className="space-y-6 animate-fade-in perspective-container">
      
      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-700/50 pb-4">
        <button 
          onClick={() => setActiveView('portfolio')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300
            ${activeView === 'portfolio' 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 shadow-neon' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <LayoutGrid size={18} /> Active Portfolio
        </button>
        <button 
           onClick={() => setActiveView('architect')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300
             ${activeView === 'architect' 
               ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/50 shadow-neon' 
               : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Calculator size={18} /> Loan Architect
        </button>
      </div>

      {activeView === 'architect' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Input Form */}
           <div className="glass-card p-8 card-3d">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                    <Plus size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">New Application</h2>
                    <p className="text-xs text-slate-400 font-mono uppercase">V2.0 Extended Profile</p>
                 </div>
              </div>

              <div className="space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Client Identity</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                       <input value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 glass-input rounded-xl p-4 text-sm font-bold outline-none" placeholder="Full Name" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-500 uppercase ml-1">Area</label>
                       <select value={area} onChange={e => setArea(e.target.value)} className="w-full glass-input rounded-xl p-4 text-sm font-bold outline-none appearance-none cursor-pointer">
                          <option value="" disabled>Select Zone</option>
                          {areas.map(a => <option key={a} value={a}>{a}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-500 uppercase ml-1">Principal</label>
                       <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                          <input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="w-full pl-12 glass-input rounded-xl p-4 text-sm font-bold outline-none" placeholder="0.00" />
                       </div>
                    </div>
                 </div>

                 {/* V2.0 Extra Fields */}
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Collateral Item</label>
                    <div className="relative">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                       <input value={collateral} onChange={e => setCollateral(e.target.value)} className="w-full pl-12 glass-input rounded-xl p-4 text-sm font-bold outline-none" placeholder="e.g. Motorcycle OR/CR, TV" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-500 uppercase ml-1">Service Fee</label>
                       <input type="number" value={serviceFee} onChange={e => setServiceFee(e.target.value)} className="w-full glass-input rounded-xl p-4 text-sm font-bold outline-none text-red-300" placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-500 uppercase ml-1">Delivery Charge</label>
                       <input type="number" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="w-full glass-input rounded-xl p-4 text-sm font-bold outline-none text-red-300" placeholder="0.00" />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase ml-1">Duration & Rate</label>
                   <select value={term} onChange={e => setTerm(e.target.value)} className="w-full glass-input rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                      <option value="60">60 Days (20% Interest)</option>
                      <option value="40">40 Days (10% Interest)</option>
                      <option value="30">30 Days (5% Interest)</option>
                   </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                       <input value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-12 glass-input rounded-xl p-4 text-sm font-bold outline-none" placeholder="Address" />
                    </div>
                    <div className="relative">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                       <input value={cell} onChange={e => setCell(e.target.value)} className="w-full pl-12 glass-input rounded-xl p-4 text-sm font-bold outline-none" placeholder="Mobile #" />
                    </div>
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Internal Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full glass-input rounded-xl p-4 text-sm font-bold outline-none h-20" placeholder="Remarks..." />
                 </div>

                 <button onClick={handleCreate} className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10">
                    <ShieldCheck size={20}/> Approve & Disburse Funds
                 </button>
              </div>
           </div>

           {/* Simulation Preview */}
           <div className="glass-card p-8 border border-slate-700/50 bg-slate-900/40 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
               
               <div className="flex items-center gap-3 mb-8 relative z-10">
                  <div className="p-3 bg-slate-800 text-slate-400 rounded-xl">
                     <Calculator size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-white">Term Simulator</h2>
                     <p className="text-xs text-slate-400 font-mono uppercase">Real-time Projection</p>
                  </div>
               </div>

               <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">Gross Profit</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">+{formatMoney(interest)}</div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">{profitMargin}% Margin</div>
                     </div>
                     <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">Daily Collection</div>
                        <div className="text-2xl font-mono font-bold text-cyan-400">{formatMoney(daily)}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1">For {term} Days</div>
                     </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 font-medium text-sm">Principal</span>
                        <span className="text-white font-mono font-bold">{formatMoney(principal)}</span>
                     </div>
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-red-400 font-medium text-sm">Less: Service Fee</span>
                         <span className="text-red-400 font-mono font-bold">-{formatMoney(sFee)}</span>
                     </div>
                     <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                         <span className="text-red-400 font-medium text-sm">Less: Delivery</span>
                         <span className="text-red-400 font-mono font-bold">-{formatMoney(dCharge)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold text-lg">Net Proceeds</span>
                        <span className="text-emerald-400 font-mono font-bold text-2xl text-glow-blue">{formatMoney(netProceeds)}</span>
                     </div>
                  </div>
               </div>
           </div>
        </div>
      )}

      {activeView === 'portfolio' && (
         <div className="glass-card flex flex-col h-full overflow-hidden">
             <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/30">
                <div>
                  <h2 className="text-xl font-bold text-white">Active Portfolio</h2>
                  <p className="text-xs text-slate-400 font-mono">{activeLoans.length} Active Contracts</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={handleExport} className="flex items-center gap-2 text-xs font-bold bg-slate-800 text-white border border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-700 transition">
                      <Download size={16} /> Export Data
                   </button>
                </div>
             </div>
             
             <div className="p-4 border-b border-slate-700/50 overflow-x-auto flex gap-2">
                <button onClick={() => setAreaFilter('All')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${areaFilter === 'All' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}>All Zones</button>
                {areas.map(a => (
                  <button key={a} onClick={() => setAreaFilter(a)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${areaFilter === a ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}>{a}</button>
                ))}
             </div>

             <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                   <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase font-bold tracking-wider font-mono">
                      <tr>
                         <th className="p-4">Client Entity</th>
                         <th className="p-4">AI Risk Score</th>
                         <th className="p-4">Collateral</th>
                         <th className="p-4">Contract Terms</th>
                         <th className="p-4">Outstanding</th>
                         <th className="p-4 text-right">Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/50">
                      {activeLoans.map(l => {
                         const credit = calculateCreditScore(l, db.ledger);
                         return (
                           <tr key={l.id} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4">
                                 <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{l.name}</div>
                                 <div className="text-xs text-slate-500 font-mono">{l.area}</div>
                              </td>
                              <td className="p-4">
                                 <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${credit.score >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : credit.score >= 70 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                    <ShieldCheck size={12} /> {credit.score} {credit.label}
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="flex items-center gap-2 text-slate-400 text-xs">
                                     <Lock size={12} /> {l.collateral || 'None'}
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="font-bold text-slate-300 font-mono">{formatMoney(l.daily)}/day</div>
                                 <div className="text-xs text-slate-500 font-bold">{l.term} days remaining</div>
                              </td>
                              <td className="p-4 font-black text-white font-mono tracking-tight">{formatMoney(l.balance)}</td>
                              <td className="p-4 text-right">
                                 <button onClick={() => { if(confirm("Terminate this contract permanently?")) onDelete(l.id) }} className="text-slate-600 hover:text-red-400 p-2 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                 </button>
                              </td>
                           </tr>
                         );
                      })}
                      {activeLoans.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-600 font-mono text-xs uppercase tracking-widest">No active contracts found in this sector.</td></tr>}
                   </tbody>
                </table>
             </div>
         </div>
      )}

      {/* Unified Document Modal */}
      {showInvoice && lastLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className="bg-white text-black rounded-lg w-full max-w-lg shadow-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:rounded-none flex flex-col max-h-[90vh]">
              {/* Screen Header - Hidden on Print */}
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

              {/* Document Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {docView === 'invoice' ? (
                   <div className="p-8" id="invoice-area">
                      <div className="text-center mb-6">
                         <h1 className="text-2xl font-black uppercase tracking-widest">SkyLend V2.0</h1>
                         <p className="text-xs font-bold text-slate-500">Stratosphere Enterprise</p>
                         <p className="text-xs text-slate-500 mt-1">{getToday()}</p>
                      </div>

                      <div className="mb-6 pb-6 border-b-2 border-slate-100">
                         <div className="text-xs font-bold text-slate-400 uppercase">Borrower</div>
                         <div className="text-xl font-bold">{lastLoan.name}</div>
                         <div className="text-sm text-slate-600">{lastLoan.address}</div>
                         <div className="text-sm text-slate-600">{lastLoan.cellNumber}</div>
                      </div>

                      <table className="w-full text-sm mb-6">
                         <tbody>
                            <tr>
                               <td className="py-1 text-slate-500">Principal Amount</td>
                               <td className="py-1 text-right font-bold">{formatMoney(lastLoan.principal)}</td>
                            </tr>
                            <tr>
                               <td className="py-1 text-slate-500">Interest</td>
                               <td className="py-1 text-right font-bold">{formatMoney(lastLoan.interest)}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                               <td className="py-1 text-slate-500 pb-2">Term</td>
                               <td className="py-1 text-right font-bold pb-2">{lastLoan.term} Days</td>
                            </tr>
                            <tr>
                               <td className="py-2 font-bold">Total Payable</td>
                               <td className="py-2 text-right font-black text-lg">{formatMoney(lastLoan.total)}</td>
                            </tr>
                            <tr>
                               <td className="py-1 text-slate-500">Daily Payment</td>
                               <td className="py-1 text-right font-bold">{formatMoney(lastLoan.daily)}</td>
                            </tr>
                         </tbody>
                      </table>

                      <div className="bg-slate-50 p-4 rounded-xl mb-6">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-2">Deductions</div>
                         <div className="flex justify-between text-sm mb-1">
                            <span>Service Fee</span>
                            <span className="font-bold text-red-600">-{formatMoney(lastLoan.serviceFee || 0)}</span>
                         </div>
                         <div className="flex justify-between text-sm mb-2 border-b border-slate-200 pb-2">
                            <span>Delivery Charge</span>
                            <span className="font-bold text-red-600">-{formatMoney(lastLoan.deliveryCharge || 0)}</span>
                         </div>
                         <div className="flex justify-between items-center pt-1">
                            <span className="font-black text-lg uppercase">Net Proceeds</span>
                            <span className="font-black text-2xl text-emerald-600">{formatMoney(lastLoan.netProceeds)}</span>
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
                   <LoanContract data={lastLoan} />
                )}
              </div>

              {/* Screen Footer - Hidden on Print */}
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