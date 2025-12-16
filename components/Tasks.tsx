import React, { useState, useMemo } from 'react';
import { DB, Task, CurrentUser } from '../types';
import { genId, getToday } from '../utils';
import { CheckSquare, Clock, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { useData } from '../hooks/useData';

interface TasksProps {
  db: DB;
  currentUser: CurrentUser;
}

export const Tasks: React.FC<TasksProps> = ({ db, currentUser }) => {
  const { addTask, updateTaskStatus } = useData();
  const [showAdd, setShowAdd] = useState(false);
  
  // Form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignee, setAssignee] = useState(currentUser.id.toString());
  const [dueDate, setDueDate] = useState(getToday());
  const [priority, setPriority] = useState<Task['priority']>('Medium');

  const isAdmin = currentUser.role === 'admin';
  const myTasks = useMemo(() => {
     let tasks = db.tasks || [];
     if (!isAdmin) {
         tasks = tasks.filter(t => t.assignedTo === currentUser.id.toString());
     }
     return tasks.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [db.tasks, currentUser, isAdmin]);

  const handleCreate = () => {
      if(!title) return;
      const newTask: Task = {
          id: genId(),
          title,
          description: desc,
          assignedTo: assignee,
          dueDate,
          status: 'Pending',
          priority
      };
      addTask(newTask);
      setShowAdd(false);
      setTitle(''); setDesc('');
  };

  const getPriorityColor = (p: string) => {
      if(p === 'High') return 'text-red-400 bg-red-900/20 border-red-500/50';
      if(p === 'Medium') return 'text-amber-400 bg-amber-900/20 border-amber-500/50';
      return 'text-emerald-400 bg-emerald-900/20 border-emerald-500/50';
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-display font-bold text-white">Task Command</h2>
                <p className="text-slate-400">Mission control for field operations.</p>
            </div>
            {isAdmin && (
                <button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    <Plus size={18} /> Assign Task
                </button>
            )}
        </div>

        {showAdd && (
            <div className="glass-card p-6 space-y-4 border border-indigo-500/30">
                <div>
                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Mission Title</label>
                    <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full glass-input p-3 rounded-xl" placeholder="e.g. Verify Client Address"/>
                </div>
                <div>
                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Details</label>
                    <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full glass-input p-3 rounded-xl h-20" placeholder="Additional instructions..."/>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Assign To</label>
                        <select value={assignee} onChange={e=>setAssignee(e.target.value)} className="w-full glass-input p-3 rounded-xl">
                            {db.collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Due Date</label>
                        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full glass-input p-3 rounded-xl"/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Priority</label>
                        <select value={priority} onChange={e=>setPriority(e.target.value as any)} className="w-full glass-input p-3 rounded-xl">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                </div>
                <button onClick={handleCreate} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200">Deploy Mission</button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map(task => (
                <div key={task.id} className={`glass-card p-5 border-l-4 transition-all hover:translate-y-[-2px] ${task.status === 'Completed' ? 'opacity-60 border-l-slate-500' : 'border-l-indigo-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(task.priority)}`}>
                            {task.priority} Priority
                        </span>
                        {task.status !== 'Completed' ? (
                            <button onClick={() => updateTaskStatus(task.id, 'Completed')} className="text-slate-400 hover:text-emerald-400">
                                <CheckSquare size={20} />
                            </button>
                        ) : (
                            <CheckCircle2 size={20} className="text-emerald-500" />
                        )}
                    </div>
                    
                    <h3 className={`font-bold text-lg mb-1 ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{task.description || 'No additional details.'}</p>
                    
                    <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-700/50 pt-3">
                        <div className="flex items-center gap-1">
                            <Clock size={12}/> Due: {task.dueDate}
                        </div>
                        {isAdmin && (
                            <div className="font-bold text-slate-400">
                                Agent: {db.collectors.find(c => c.id.toString() === task.assignedTo)?.name || 'Unknown'}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {myTasks.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                    No active missions assigned.
                </div>
            )}
        </div>
    </div>
  );
};