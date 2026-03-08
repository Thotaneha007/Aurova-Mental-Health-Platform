
/**
 * Wellness Routine Progress Form — TRANSACTION FORM
 * Module: Wellness Content, Learning & Inspiration (T Neha)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 */

import React, { useState, useEffect } from 'react';
import { RoutineProgress } from '../types';
import { routineService } from '../services/wellnessService';

interface RoutineProgressFormProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const ROUTINE_OPTIONS = [
  'Morning Aura Rise', 'Sleepy Soul Flow', 'Desk Release Yoga', 'Anxiety Relief Flow',
  'Box Breathing', '4-7-8 Breathing', 'Wim Hof Method', 'Resonant Breathing',
  'Morning Meditation', 'Evening Wind-Down', 'Focus Session', 'Custom Routine'
];
const STORAGE_KEY = 'aurova_routine_progress';

const RoutineProgressForm: React.FC<RoutineProgressFormProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [records, setRecords] = useState<RoutineProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selected, setSelected] = useState<RoutineProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const blankForm = {
    date: new Date().toISOString().slice(0, 10),
    routineTitle: ROUTINE_OPTIONS[0],
    completedSteps: 0,
    totalSteps: 5,
    note: '',
    durationMinutes: 15
  };
  const [form, setForm] = useState(blankForm);

  // Load from API on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    routineService.getAll()
      .then(data => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll('.reveal-rp').forEach((el, i) => setTimeout(() => el.classList.add('active'), i * 60));
    }, 80);
    return () => clearTimeout(t);
  }, [mode]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const handleCreate = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    if (form.completedSteps > form.totalSteps) { showToast('Completed steps cannot exceed total steps.'); return; }
    try {
      const created = await routineService.create(form);
      setRecords(prev => [created, ...prev]);
      setForm(blankForm); setMode('list');
      showToast('Routine progress saved!');
    } catch { showToast('Failed to save. Please try again.'); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      const updated = await routineService.update(selected.id, form);
      setRecords(prev => prev.map(r => r.id === selected.id ? updated : r));
      setMode('list'); setSelected(null);
      showToast('Progress updated!');
    } catch { showToast('Failed to update. Please try again.'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await routineService.remove(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (mode !== 'list') { setMode('list'); setSelected(null); }
      setDeleteConfirmId(null);
      showToast('Entry deleted.');
    } catch { showToast('Failed to delete.'); }
  };

  const openEdit = (r: RoutineProgress) => {
    setSelected(r);
    setForm({ date: r.date, routineTitle: r.routineTitle, completedSteps: r.completedSteps, totalSteps: r.totalSteps, note: r.note, durationMinutes: r.durationMinutes });
    setMode('edit');
  };

  const filtered = records.filter(r =>
    searchQuery === '' ||
    r.routineTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSessions = records.length;
  const completedFully = records.filter(r => r.completedSteps === r.totalSteps).length;
  const completionRate = totalSessions > 0 ? Math.round((completedFully / totalSessions) * 100) : 0;

  // Streak calc
  const sortedDates = [...new Set(records.map(r => r.date))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let check = today;
  for (const d of sortedDates) {
    if (d === check) { streak++; const dt = new Date(check); dt.setDate(dt.getDate() - 1); check = dt.toISOString().slice(0, 10); }
    else break;
  }

  const ProgressBar = ({ completed, total }: { completed: number; total: number }) => {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const color = pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-primary' : 'bg-orange-400';
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 border-2 border-black/10 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  const FormFields = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Duration (minutes)</label>
          <input type="number" min={1} max={120} value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Routine</label>
        <select value={form.routineTitle} onChange={e => setForm(p => ({ ...p, routineTitle: e.target.value }))}
          className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
          {ROUTINE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Completed Steps</label>
          <input type="number" min={0} max={form.totalSteps} value={form.completedSteps}
            onChange={e => setForm(p => ({ ...p, completedSteps: Math.min(Number(e.target.value), p.totalSteps) }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Steps</label>
          <input type="number" min={1} max={20} value={form.totalSteps} onChange={e => setForm(p => ({ ...p, totalSteps: Number(e.target.value) }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Live progress preview */}
      <div className="bg-gray-50 dark:bg-aura-black/30 border-2 border-black/10 rounded-2xl p-4">
        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
          <span>Completion Preview</span>
          <span>{form.totalSteps > 0 ? Math.round((form.completedSteps / form.totalSteps) * 100) : 0}%</span>
        </div>
        <ProgressBar completed={form.completedSteps} total={form.totalSteps} />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Notes</label>
        <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="How was the session? What did you notice?"
          rows={3} className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none" />
      </div>
    </div>
  );

  return (
    <div className="pt-24 pb-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {toast && (
        <div className="fixed top-6 right-6 z-[200] bg-primary text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4">
          <span className="material-symbols-outlined text-sm">check_circle</span>{toast}
        </div>
      )}

      <header className="mb-10 reveal-rp reveal">
        <button onClick={mode !== 'list' ? () => { setMode('list'); setSelected(null); } : onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>{mode !== 'list' ? 'Back to Log' : 'Back'}
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Routine Progress</p>
        <h1 className="text-5xl md:text-6xl font-display font-bold dark:text-white leading-none">
          Routine <span className="text-primary italic">Progress.</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Track your wellness routine completions and build consistent habits.</p>
      </header>

      {mode === 'list' && (
        <div className="space-y-6 reveal-rp reveal">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Sessions', value: totalSessions, color: 'bg-card-yellow', icon: 'fitness_center' },
              { label: 'Completed', value: completedFully, color: 'bg-card-blue', icon: 'task_alt' },
              { label: 'Rate', value: `${completionRate}%`, color: 'bg-card-purple', icon: 'percent' },
              { label: 'Day Streak', value: streak, color: 'bg-card-yellow', icon: 'local_fire_department' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border-2 border-black rounded-2xl p-4 shadow-retro text-center`}>
                <span className="material-symbols-outlined text-xl text-black">{s.icon}</span>
                <p className="text-2xl font-display font-bold text-black mt-0.5">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-black/60">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search routines..."
                className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl text-sm font-medium dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <button onClick={() => { setForm(blankForm); setMode('create'); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-sm">add</span>Log Progress
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
              <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">fitness_center</span>
              <p className="font-bold dark:text-white text-xl mb-2">No Routine Entries</p>
              <p className="text-gray-400 font-medium mb-8">Start logging your wellness routine sessions to build momentum.</p>
              <button onClick={() => { setForm(blankForm); setMode('create'); }}
                className="px-8 py-4 bg-primary text-white border-2 border-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                Log First Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(entry => {
                const pct = entry.totalSteps > 0 ? Math.round((entry.completedSteps / entry.totalSteps) * 100) : 0;
                return (
                  <div key={entry.id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-retro overflow-hidden">
                    <div className="p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 ${pct === 100 ? 'bg-green-100' : 'bg-card-yellow'}`}>
                        <span className="material-symbols-outlined text-black text-xl">{pct === 100 ? 'task_alt' : 'fitness_center'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-bold text-sm dark:text-white truncate">{entry.routineTitle}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pct === 100 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'}`}>
                            {pct}%
                          </span>
                        </div>
                        <ProgressBar completed={entry.completedSteps} total={entry.totalSteps} />
                        <div className="flex gap-3 text-xs text-gray-400 mt-1">
                          <span>{entry.completedSteps}/{entry.totalSteps} steps</span>
                          <span>{entry.durationMinutes} min</span>
                          <span className="ml-auto">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setSelected(entry); setMode('view'); }} className="w-8 h-8 bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all">
                          <span className="material-symbols-outlined text-xs">visibility</span>
                        </button>
                        <button onClick={() => openEdit(entry)} className="w-8 h-8 bg-primary/10 border-2 border-primary/30 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-all">
                          <span className="material-symbols-outlined text-xs text-primary">edit</span>
                        </button>
                        <button onClick={() => setDeleteConfirmId(entry.id)} className="w-8 h-8 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all">
                          <span className="material-symbols-outlined text-xs text-red-500">delete</span>
                        </button>
                      </div>
                    </div>
                    {deleteConfirmId === entry.id && (
                      <div className="px-5 pb-3 pt-3 bg-red-50 dark:bg-red-950/20 border-t border-red-200 flex items-center justify-between gap-4">
                        <p className="text-xs font-bold text-red-600">Delete this routine entry?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 bg-gray-100 border-2 border-black rounded-lg text-xs font-bold uppercase tracking-widest">Cancel</button>
                          <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 bg-red-500 text-white border-2 border-black rounded-lg text-xs font-bold uppercase tracking-widest">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(mode === 'create' || mode === 'edit') && (
        <div className="reveal-rp reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">fitness_center</span>
              <h2 className="font-bold text-lg dark:text-white">{mode === 'create' ? 'Log Routine Progress' : 'Edit Entry'}</h2>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${mode === 'create' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                {mode === 'create' ? 'INSERT' : 'UPDATE'}
              </span>
            </div>
            <div className="p-8">
              <FormFields />
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setMode('list'); setSelected(null); }} className="px-6 py-3 bg-gray-100 border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={mode === 'create' ? handleCreate : handleUpdate}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                  <span className="material-symbols-outlined text-sm">save</span>
                  {mode === 'create' ? 'Save Progress' : 'Update Progress'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'view' && selected && (
        <div className="reveal-rp reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center ${selected.completedSteps === selected.totalSteps ? 'bg-green-100' : 'bg-card-yellow'}`}>
                  <span className="material-symbols-outlined text-black text-xl">{selected.completedSteps === selected.totalSteps ? 'task_alt' : 'fitness_center'}</span>
                </div>
                <div>
                  <p className="font-bold text-lg dark:text-white">{selected.routineTitle}</p>
                  <p className="text-xs text-gray-400">{new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-300 ml-2">DISPLAY</span>
              </div>
              <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">Edit</button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-400 uppercase tracking-widest">Completion</span>
                  <span className="text-primary">{selected.completedSteps}/{selected.totalSteps} steps · {Math.round((selected.completedSteps / selected.totalSteps) * 100)}%</span>
                </div>
                <ProgressBar completed={selected.completedSteps} total={selected.totalSteps} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Duration', value: `${selected.durationMinutes} minutes`, icon: 'schedule' },
                  { label: 'Steps Done', value: `${selected.completedSteps} of ${selected.totalSteps}`, icon: 'checklist' },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 dark:bg-aura-black/30 rounded-2xl p-4 border-2 border-black/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-base">{f.icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{f.label}</p>
                      <p className="font-bold dark:text-white">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selected.note && (
                <div className="bg-gray-50 dark:bg-aura-black/30 rounded-2xl p-5 border-2 border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Notes</p>
                  <p className="text-sm font-medium dark:text-gray-300 leading-relaxed">{selected.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineProgressForm;
