import React, { useState, useMemo } from 'react';
import { DB, Attendance } from '../types';
import { getToday } from '../utils';
import { Calendar, UserCheck, UserX, Coffee } from 'lucide-react';

interface AttendanceTrackerProps {
  db: DB;
  onMark: (date: string, empId: string | number, status: Attendance['status']) => void;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ db, onMark }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());

  const collectors = useMemo(() => db.collectors.filter(c => c.name !== 'Admin'), [db.collectors]);

  const getStatus = (empId: string | number) => {
    const record = db.attendance.find(a => a.date === selectedDate && a.empId == empId);
    return record ? record.status : null;
  };

  const stats = useMemo(() => {
    const records = db.attendance.filter(a => a.date === selectedDate);
    const present = records.filter(a => a.status === 'Present').length;
    const absent = records.filter(a => a.status === 'Absent').length;
    const rest = records.filter(a => a.status === 'Rest Day').length;
    const pending = collectors.length - (present + absent + rest);
    return { present, absent, rest, pending };
  }, [db.attendance, selectedDate, collectors.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Attendance Tracker</h2>
          <p className="text-sm font-medium text-slate-500">Manage daily team presence.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 shadow-inner">
          <Calendar size={18} className="text-slate-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-[0_4px_20px_rgb(16,185,129,0.1)] flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><UserCheck size={24}/></div>
          <div>
             <div className="text-3xl font-black text-slate-800">{stats.present}</div>
             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Present</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-[0_4px_20px_rgb(239,68,68,0.1)] flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><UserX size={24}/></div>
          <div>
             <div className="text-3xl font-black text-slate-800">{stats.absent}</div>
             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Absent</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-[0_4px_20px_rgb(245,158,11,0.1)] flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Coffee size={24}/></div>
          <div>
             <div className="text-3xl font-black text-slate-800">{stats.rest}</div>
             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rest Day</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.05)] flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-3 bg-slate-100 text-slate-400 rounded-xl font-black text-lg w-12 h-12 flex items-center justify-center">?</div>
          <div>
             <div className="text-3xl font-black text-slate-800">{stats.pending}</div>
             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="p-5 font-bold">Collector</th>
              <th className="p-5 font-bold">Area</th>
              <th className="p-5 font-bold text-center">Status Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {collectors.map(c => {
              const status = getStatus(c.id);
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-5 font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 shadow-sm">
                      {c.name.charAt(0)}
                    </div>
                    {c.name}
                  </td>
                  <td className="p-5 text-slate-500 font-medium">{c.area}</td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onMark(selectedDate, c.id, 'Present')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95
                          ${status === 'Present' 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 scale-105' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => onMark(selectedDate, c.id, 'Absent')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95
                          ${status === 'Absent' 
                            ? 'bg-red-600 text-white border-red-600 shadow-red-200 scale-105' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600'}`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => onMark(selectedDate, c.id, 'Rest Day')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95
                          ${status === 'Rest Day' 
                            ? 'bg-amber-500 text-white border-amber-500 shadow-amber-200 scale-105' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600'}`}
                      >
                        Rest Day
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};