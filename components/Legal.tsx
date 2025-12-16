import React from 'react';
import { Scale, FileText, Download } from 'lucide-react';

export const Legal: React.FC = () => {
  const templates = [
      { id: 1, title: 'Standard Loan Agreement', desc: 'Default template for unsecured loans.' },
      { id: 2, title: 'Chattel Mortgage', desc: 'For loans secured by movable property.' },
      { id: 3, title: 'Waiver of Rights', desc: 'Standard waiver form.' },
      { id: 4, title: 'Demand Letter (First Notice)', desc: 'For past due accounts > 30 days.' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">Legal Hub</h2>
            <p className="text-slate-500">Document templates and compliance resources.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(t => (
                <div key={t.id} className="glass-card p-6 flex items-start gap-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="p-4 bg-slate-100 text-slate-600 rounded-xl">
                        <FileText size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800">{t.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{t.desc}</p>
                        <button className="text-blue-600 text-xs font-bold uppercase flex items-center gap-1 hover:underline">
                            <Download size={14}/> Download Template
                        </button>
                    </div>
                </div>
            ))}
        </div>

        <div className="glass-card p-8 bg-slate-50 border-dashed border-2 border-slate-300 flex flex-col items-center justify-center text-center">
            <Scale size={48} className="text-slate-300 mb-4"/>
            <h3 className="font-bold text-slate-600">Compliance Repository</h3>
            <p className="text-sm text-slate-400 max-w-md">
                Upload scanned copies of business permits, DTI registration, and other regulatory documents here for safe keeping.
            </p>
            <button className="mt-4 px-6 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
                Upload Document
            </button>
        </div>
    </div>
  );
};