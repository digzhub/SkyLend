import React from 'react';
import { formatMoney, getToday } from '../utils';

interface LoanContractProps {
  data: any;
}

export const LoanContract: React.FC<LoanContractProps> = ({ data }) => {
  return (
    <div id="contract-area" className="p-10 bg-white text-black font-serif text-sm leading-relaxed max-w-2xl mx-auto h-full overflow-y-auto relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] text-6xl font-black uppercase rotate-45 pointer-events-none whitespace-nowrap">
         SkyLend V2.0 Official
      </div>

      <div className="text-center mb-8 border-b-2 border-black pb-4 relative z-10">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">Loan Agreement</h1>
        <p className="italic text-slate-600">Promissory Note & Disclosure Statement</p>
      </div>

      <div className="space-y-6 relative z-10">
        <section>
          <p className="mb-4">
            This LOAN AGREEMENT is made and executed on <span className="font-bold">{getToday()}</span>, by and between:
          </p>
          <div className="pl-6 border-l-4 border-slate-200">
            <p><span className="font-bold">LENDER:</span> SkyLend Enterprise</p>
            <p><span className="font-bold">BORROWER:</span> {data.name}</p>
            <p><span className="font-bold">ADDRESS:</span> {data.address || 'N/A'}</p>
            <p><span className="font-bold">CONTACT:</span> {data.cellNumber || 'N/A'}</p>
          </div>
        </section>

        <section>
          <h3 className="font-bold uppercase text-xs tracking-wider border-b border-slate-300 mb-2">1. Loan Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Principal Loan Amount:</div>
            <div className="font-bold text-right">{formatMoney(data.principal)}</div>
            
            <div>Interest Amount:</div>
            <div className="font-bold text-right">{formatMoney(data.interest)}</div>

            {data.serviceFee > 0 && (
                <>
                <div>Less: Service Fee:</div>
                <div className="font-bold text-right text-red-600">({formatMoney(data.serviceFee)})</div>
                </>
            )}
            
            {data.deliveryCharge > 0 && (
                <>
                <div>Less: Delivery Charge:</div>
                <div className="font-bold text-right text-red-600">({formatMoney(data.deliveryCharge)})</div>
                </>
            )}

            {data.oldBalance > 0 && (
                <>
                <div>Less: Previous Balance:</div>
                <div className="font-bold text-right text-red-600">({formatMoney(data.oldBalance)})</div>
                </>
            )}

            <div className="font-bold border-t border-slate-300 pt-1 mt-1">Net Proceeds Received:</div>
            <div className="font-bold border-t border-slate-300 pt-1 mt-1 text-right">{formatMoney(data.netProceeds)}</div>
          </div>
        </section>

        <section>
          <h3 className="font-bold uppercase text-xs tracking-wider border-b border-slate-300 mb-2">2. Repayment Schedule</h3>
          <p>
            The Borrower agrees to pay the Lender the Total Amount Payable of <span className="font-bold">{formatMoney(data.total)}</span> within <span className="font-bold">{data.term} days</span>.
          </p>
          <p className="mt-2">
            Payments shall be made daily in the amount of <span className="font-bold text-lg">{formatMoney(data.daily)}</span> starting tomorrow until the obligation is fully settled.
          </p>
        </section>

        <section>
          <h3 className="font-bold uppercase text-xs tracking-wider border-b border-slate-300 mb-2">3. Security & Collateral</h3>
          <p className="mb-2">
              This loan is secured by the following collateral provided by the Borrower:
          </p>
          <div className="p-3 bg-slate-100 font-bold border border-slate-300 rounded text-center uppercase">
              {data.collateral || "UNSECURED LOAN"}
          </div>
          <p className="mt-2 text-xs italic text-slate-500">
              The Lender reserves the right to seize the collateral in the event of default beyond 30 days.
          </p>
        </section>

        <section>
          <h3 className="font-bold uppercase text-xs tracking-wider border-b border-slate-300 mb-2">4. Terms & Conditions</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs text-justify">
            <li><strong>Default:</strong> Failure to pay the daily amount may result in additional penalties of 5% per week on the outstanding balance.</li>
            <li><strong>Jurisdiction:</strong> Any legal action arising from this agreement shall be settled in the courts of the local municipality.</li>
            <li><strong>Waiver:</strong> The Borrower waives presentment, demand, protest, and notice of dishonor.</li>
            <li><strong>Acceptance:</strong> By signing below, the Borrower acknowledges receipt of the Net Proceeds and agrees to all terms herein.</li>
          </ul>
        </section>

        <div className="grid grid-cols-2 gap-12 pt-12 mt-8">
           <div className="text-center">
             <div className="border-t border-black pt-2 font-bold uppercase">{data.name}</div>
             <div className="text-xs text-slate-500">Borrower's Signature</div>
           </div>
           <div className="text-center">
             <div className="border-t border-black pt-2 font-bold uppercase">SkyLend Authorized</div>
             <div className="text-xs text-slate-500">Lender's Signature</div>
           </div>
        </div>
        
        <div className="text-[10px] text-center text-slate-400 mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
          <span>Generated via SkyLend V2.0 Stratosphere System</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};