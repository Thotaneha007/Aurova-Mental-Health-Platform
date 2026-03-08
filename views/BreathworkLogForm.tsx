
/**
 * Breathwork Session Log Form — TRANSACTION FORM
 * Module: Wellness Content, Learning & Inspiration (T Neha)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 */

import React, { useState, useEffect } from 'react';
import { BreathworkLog } from '../types';
import { breathworkService } from '../services/wellnessService';

interface BreathworkLogFormProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const PATTERNS = ['Box Breathing (4-4-4-4)', '4-7-8 Breathing', 'Wim Hof Method', 'Diaphragmatic Breathing', 'Alternate Nostril', 'Pursed Lip Breathing', 'Resonant Breathing', 'Custom'];
const STORAGE_KEY = 'aurova_breathwork_logs';

const BreathworkLogForm: React.FC<BreathworkLogFormProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [records, setRecords] = useState<BreathworkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selected, setSelected] = useState<BreathworkLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const blankForm = {
    date: new Date().toISOString().slice(0, 10),
    pattern: PATTERNS[0],
    durationMinutes: 5,
    rounds: 4,
    note: '',
    feltBefore: 5,
    feltAfter: 5
  };
  const [form, setForm] = useState(blankForm);

  // Load from API on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    breathworkService.getAll()
      .then(data => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll('.reveal-bw').forEach((el, i) => setTimeout(() => el.classList.add('active'), i * 60));
    }, 80);
    return () => clearTimeout(t);
  }, [mode]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const handleCreate = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    try {
      const created = await breathworkService.create(form);
      setRecords(prev => [created, ...prev]);
      setForm(blankForm); setMode('list');
      showToast('Breathwork session logged!');
    } catch { showToast('Failed to save. Please try again.'); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      const updated = await breathworkService.update(selected.id, form);
      setRecords(prev => prev.map(r => r.id === selected.id ? updated : r));
      setMode('list'); setSelected(null);
      showToast('Session updated!');
    } catch { showToast('Failed to update. Please try again.'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await breathworkService.remove(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (mode !== 'list') { setMode('list'); setSelected(null); }
      setDeleteConfirmId(null);
      showToast('Session deleted.');
    } catch { showToast('Failed to delete.'); }
  };

  const openEdit = (r: BreathworkLog) => {
    setSelected(r);
    setForm({ date: r.date, pattern: r.pattern, durationMinutes: r.durationMinutes, rounds: r.rounds, note: r.note, feltBefore: r.feltBefore, feltAfter: r.feltAfter });
    setMode('edit');
  };

  const filtered = records.filter(r =>
    searchQuery === '' ||
    r.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMinutes = records.reduce((a, b) => a + b.durationMinutes, 0);
  const avgImprovement = records.length > 0 ? (records.reduce((a, b) => a + (b.feltAfter - b.feltBefore), 0) / records.length).toFixed(1) : '—';

  const ScoreSlider = ({ label, valueKey }: { label: string; valueKey: 'feltBefore' | 'feltAfter' }) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label} <span className="text-primary">({(form as any)[valueKey]}/10)</span></label>
      <input type="range" min={1} max={10} value={(form as any)[valueKey]}
        onChange={e => setForm(p => ({ ...p, [valueKey]: Number(e.target.value) }))}
        className="w-full accent-primary cursor-pointer" />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold"><span>Tense</span><span>Calm</span></div>
    </div>
  );

  const FormFields = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Breathing Pattern</label>
          <select value={form.pattern} onChange={e => setForm(p => ({ ...p, pattern: e.target.value }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
            {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Duration (minutes)</label>
          <input type="number" min={1} max={60} value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Rounds Completed</label>
          <input type="number" min={1} max={50} value={form.rounds} onChange={e => setForm(p => ({ ...p, rounds: Number(e.target.value) }))}
            className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 bg-gray-50 dark:bg-aura-black/30 border-2 border-black/10 rounded-2xl p-6">
        <ScoreSlider label="Calmness Before" valueKey="feltBefore" />
        <ScoreSlider label="Calmness After" valueKey="feltAfter" />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Session Notes</label>
        <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="How did the session feel? Any observations?"
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

      <header className="mb-10 reveal-bw reveal">
        <button onClick={mode !== 'list' ? () => { setMode('list'); setSelected(null); } : onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>{mode !== 'list' ? 'Back to Log' : 'Back'}
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Breathwork Log</p>
        <h1 className="text-5xl md:text-6xl font-display font-bold dark:text-white leading-none">
          Breathwork <span className="text-primary italic">Log.</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Record your breathing sessions, patterns, and how they made you feel.</p>
      </header>

      {mode === 'list' && (
        <div className="space-y-6 reveal-bw reveal">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Sessions', value: records.length, color: 'bg-card-blue', icon: 'air' },
              { label: 'Total Mins', value: totalMinutes, color: 'bg-card-yellow', icon: 'schedule' },
              { label: 'Avg Improvement', value: avgImprovement === '—' ? '—' : `+${avgImprovement}`, color: 'bg-card-purple', icon: 'trending_up' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border-2 border-black rounded-2xl p-4 shadow-retro text-center`}>
                <span className="material-symbols-outlined text-2xl text-black">{s.icon}</span>
                <p className="text-2xl font-display font-bold text-black mt-1">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl text-sm font-medium dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <button onClick={() => { setForm(blankForm); setMode('create'); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-sm">add</span>Log Session
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
              <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">air</span>
              <p className="font-bold dark:text-white text-xl mb-2">No Sessions Logged</p>
              <p className="text-gray-400 font-medium mb-8">Log your first breathwork session to track your practice.</p>
              <button onClick={() => { setForm(blankForm); setMode('create'); }}
                className="px-8 py-4 bg-primary text-white border-2 border-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                Log First Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(entry => (
                <div key={entry.id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-retro overflow-hidden">
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-card-blue border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-black text-xl">air</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm dark:text-white truncate">{entry.pattern}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                        <span>{entry.durationMinutes} min</span>
                        <span>{entry.rounds} rounds</span>
                        <span className="text-green-500 font-bold">+{entry.feltAfter - entry.feltBefore} mood</span>
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
                      <p className="text-xs font-bold text-red-600">Delete this session?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 bg-gray-100 border-2 border-black rounded-lg text-xs font-bold uppercase tracking-widest">Cancel</button>
                        <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 bg-red-500 text-white border-2 border-black rounded-lg text-xs font-bold uppercase tracking-widest">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(mode === 'create' || mode === 'edit') && (
        <div className="reveal-bw reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">air</span>
              <h2 className="font-bold text-lg dark:text-white">{mode === 'create' ? 'Log New Session' : 'Edit Session'}</h2>
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
                  {mode === 'create' ? 'Log Session' : 'Update Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'view' && selected && (
        <div className="reveal-bw reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">air</span>
                <div>
                  <p className="font-bold text-lg dark:text-white">{selected.pattern}</p>
                  <p className="text-xs text-gray-400">{new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-300 ml-2">DISPLAY</span>
              </div>
              <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">Edit</button>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-5">
              {[
                { label: 'Duration', value: `${selected.durationMinutes} minutes`, icon: 'schedule' },
                { label: 'Rounds', value: `${selected.rounds} rounds`, icon: 'repeat' },
                { label: 'Calmness Before', value: `${selected.feltBefore}/10`, icon: 'sentiment_neutral' },
                { label: 'Calmness After', value: `${selected.feltAfter}/10`, icon: 'sentiment_satisfied' },
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
              <div className="md:col-span-2 bg-primary/10 border-2 border-primary/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Mood Improvement</p>
                <p className="text-4xl font-display font-bold text-primary">{selected.feltAfter >= selected.feltBefore ? '+' : ''}{selected.feltAfter - selected.feltBefore}</p>
                <p className="text-xs text-gray-400 font-medium">points on calmness scale</p>
              </div>
              {selected.note && (
                <div className="md:col-span-2 bg-gray-50 dark:bg-aura-black/30 rounded-2xl p-5 border-2 border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Session Notes</p>
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

export default BreathworkLogForm;
