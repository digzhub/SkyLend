import React, { useMemo } from 'react';
import { DB } from '../types';
import { ShieldAlert, Trash2, Edit, PlusCircle, Server } from 'lucide-react';

interface AuditLogsProps {
  db: DB;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ db }) => {
  const logs = useMemo(() => {
    return [...db.audit].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [db.audit]);

  const getIcon = (action: string) => {
    switch(action) {
      case 'DELETE': return <Trash2 size={16} className="text-red-500"/>;
      case 'UPDATE': return <Edit size={16} className="text-blue-500"/>;
      case 'CREATE': return <PlusCircle size={16} className="text-emerald-500"/>;
      default: return <Server size={16} className="text-slate-500"/>;
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-obsidian-900 text-white p-6 rounded-3xl shadow-obsidian flex items-center gap-4">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
             <ShieldAlert size={32} />
          </div>
          <div>
             <h2 className="text-2xl font-black tracking-tight">System Audit Log</h2>
             <p className="text-obsidian-200 font-medium">Track all security events and critical actions.</p>
          </div>
       </div>

       <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-obsidian-50 text-obsidian-600 text-xs uppercase font-bold tracking-wider">
                   <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Details</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-obsidian-100">
                   {logs.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400">No logs found.</td></tr>
                   ) : logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                         <td className="p-4 text-slate-500 font-mono text-xs">{log.timestamp}</td>
                         <td className="p-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border
                               ${log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                               ${log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                               ${log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                               ${log.action === 'SYSTEM' ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                            `}>
                               {getIcon(log.action)} {log.action}
                            </span>
                         </td>
                         <td className="p-4 font-bold text-slate-700">{log.user}</td>
                         <td className="p-4 text-slate-600">{log.details}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};