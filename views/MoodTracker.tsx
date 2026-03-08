
/**
 * Mood Tracking Form — TRANSACTION FORM
 * Module: Wellness Content, Learning & Inspiration (T Neha)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 */

import React, { useState, useEffect } from 'react';
import { MoodEntry } from '../types';
import { moodService } from '../services/wellnessService';

interface MoodTrackerProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const EMOTION_TAGS = ['Happy', 'Calm', 'Anxious', 'Sad', 'Angry', 'Grateful', 'Excited', 'Tired', 'Hopeful', 'Overwhelmed', 'Peaceful', 'Lonely'];
const TRIGGER_TAGS = ['Work', 'Family', 'Health', 'Sleep', 'Social', 'News', 'Finance', 'Exercise', 'Weather', 'Food'];
const STORAGE_KEY = 'aurova_mood_entries';

const SCORE_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: 'Very Low', color: 'bg-red-500', emoji: '😔' },
  2: { label: 'Low', color: 'bg-red-400', emoji: '😞' },
  3: { label: 'Below Avg', color: 'bg-orange-500', emoji: '😕' },
  4: { label: 'Fair', color: 'bg-orange-400', emoji: '😐' },
  5: { label: 'Okay', color: 'bg-yellow-500', emoji: '🙂' },
  6: { label: 'Good', color: 'bg-yellow-400', emoji: '😊' },
  7: { label: 'Pretty Good', color: 'bg-lime-500', emoji: '😄' },
  8: { label: 'Great', color: 'bg-green-500', emoji: '😁' },
  9: { label: 'Excellent', color: 'bg-green-400', emoji: '🤩' },
  10: { label: 'Amazing', color: 'bg-emerald-500', emoji: '🥳' },
};

const MoodTracker: React.FC<MoodTrackerProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [records, setRecords] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selected, setSelected] = useState<MoodEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmotion, setFilterEmotion] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const blankForm = { score: 5, emotions: [] as string[], note: '', triggers: [] as string[], date: new Date().toISOString().slice(0, 10) };
  const [form, setForm] = useState(blankForm);

  // Load from API on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    moodService.getAll()
      .then(data => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll('.reveal-mood').forEach((el, i) => setTimeout(() => el.classList.add('active'), i * 60));
    }, 80);
    return () => clearTimeout(t);
  }, [mode]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const toggle = (list: string[], v: string) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];

  // INSERT
  const handleCreate = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    if (form.emotions.length === 0) { showToast('Select at least one emotion.'); return; }
    try {
      const created = await moodService.create(form);
      setRecords(prev => [created, ...prev]);
      setForm(blankForm);
      setMode('list');
      showToast('Mood logged!');
    } catch { showToast('Failed to save. Please try again.'); }
  };

  // UPDATE
  const handleUpdate = async () => {
    if (!selected) return;
    try {
      const updated = await moodService.update(selected.id, form);
      setRecords(prev => prev.map(r => r.id === selected.id ? updated : r));
      setMode('list'); setSelected(null);
      showToast('Mood entry updated!');
    } catch { showToast('Failed to update. Please try again.'); }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      await moodService.remove(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (mode !== 'list') { setMode('list'); setSelected(null); }
      setDeleteConfirmId(null);
      showToast('Entry deleted.');
    } catch { showToast('Failed to delete.'); }
  };

  const openEdit = (r: MoodEntry) => { setSelected(r); setForm({ score: r.score, emotions: r.emotions, note: r.note, triggers: r.triggers, date: r.date }); setMode('edit'); };

  // SEARCH + FILTER
  const filtered = records.filter(r =>
    (filterEmotion === '' || r.emotions.includes(filterEmotion)) &&
    (searchQuery === '' || r.note.toLowerCase().includes(searchQuery.toLowerCase()) || r.emotions.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const avgScore = records.length > 0 ? (records.reduce((a, b) => a + b.score, 0) / records.length).toFixed(1) : '—';

  const topEmotion = (() => {
    if (records.length === 0) return '—';
    const freq: Record<string, number> = {};
    records.flatMap(r => r.emotions).forEach(e => { freq[e] = (freq[e] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : '—';
  })();

  const MoodFormFields = () => (
    <div className="space-y-6">
      {/* Date */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Date</label>
        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
          className="border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
      </div>

      {/* Score slider */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Mood Score</label>
        <div className="bg-gray-50 dark:bg-aura-black/30 border-2 border-black rounded-2xl p-6 text-center">
          <div className="text-6xl mb-2">{SCORE_LABELS[form.score].emoji}</div>
          <p className={`inline-block px-4 py-1 rounded-full text-white text-sm font-bold mb-4 ${SCORE_LABELS[form.score].color}`}>
            {form.score}/10 · {SCORE_LABELS[form.score].label}
          </p>
          <input
            type="range" min={1} max={10} value={form.score}
            onChange={e => setForm(p => ({ ...p, score: Number(e.target.value) }))}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
            <span>Very Low</span><span>Amazing</span>
          </div>
        </div>
      </div>

      {/* Emotions */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">How are you feeling?</label>
        <div className="flex flex-wrap gap-2">
          {EMOTION_TAGS.map(e => (
            <button key={e} type="button" onClick={() => setForm(p => ({ ...p, emotions: toggle(p.emotions, e) }))}
              className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-bold uppercase tracking-widest transition-all
                ${form.emotions.includes(e) ? 'bg-primary text-white shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white hover:bg-gray-100'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Triggers */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Triggers (optional)</label>
        <div className="flex flex-wrap gap-2">
          {TRIGGER_TAGS.map(t => (
            <button key={t} type="button" onClick={() => setForm(p => ({ ...p, triggers: toggle(p.triggers, t) }))}
              className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-bold uppercase tracking-widest transition-all
                ${form.triggers.includes(t) ? 'bg-secondary text-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white hover:bg-gray-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Reflection Note (optional)</label>
        <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="What's on your mind today?"
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

      {/* Header */}
      <header className="mb-10 reveal-mood reveal">
        <button onClick={mode !== 'list' ? () => { setMode('list'); setSelected(null); } : onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>{mode !== 'list' ? 'Back to Log' : 'Back'}
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Mood Tracking</p>
        <h1 className="text-5xl md:text-6xl font-display font-bold dark:text-white leading-none">
          Mood <span className="text-primary italic">Log.</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Track how you feel each day to understand your emotional patterns.</p>
      </header>

      {/* ── LIST ── */}
      {mode === 'list' && (
        <div className="space-y-6 reveal-mood reveal">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Entries', value: records.length, color: 'bg-card-yellow', icon: 'mood' },
              { label: 'Avg Score', value: avgScore, color: 'bg-card-blue', icon: 'equalizer' },
              { label: 'Top Emotion', value: topEmotion, color: 'bg-card-purple', icon: 'favorite' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border-2 border-black rounded-2xl p-4 shadow-retro text-center`}>
                <span className="material-symbols-outlined text-2xl text-black">{s.icon}</span>
                <p className="text-2xl font-display font-bold text-black mt-1">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters & actions */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by note or emotion..."
                className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl text-sm font-medium dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <select value={filterEmotion} onChange={e => setFilterEmotion(e.target.value)}
              className="border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary">
              <option value="">All Emotions</option>
              {EMOTION_TAGS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <button onClick={() => { setForm(blankForm); setMode('create'); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-sm">add</span>Log Mood
            </button>
          </div>

          {/* Entries */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
              <span className="text-6xl block mb-4">😊</span>
              <p className="font-bold dark:text-white text-xl mb-2">No Mood Entries Yet</p>
              <p className="text-gray-400 font-medium mb-8">Log your first mood check-in to start tracking emotional patterns.</p>
              <button onClick={() => { setForm(blankForm); setMode('create'); }}
                className="px-8 py-4 bg-primary text-white border-2 border-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                Log First Mood
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(entry => {
                const info = SCORE_LABELS[entry.score];
                return (
                  <div key={entry.id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-retro overflow-hidden">
                    <div className="p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 ${info.color} rounded-xl border-2 border-black flex items-center justify-center text-2xl flex-shrink-0`}>{info.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm dark:text-white">{info.label}</span>
                          <span className="text-xs text-gray-400 font-bold">{entry.score}/10</span>
                          <span className="text-xs text-gray-400 ml-auto">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {entry.emotions.map(e => <span key={e} className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">{e}</span>)}
                        </div>
                        {entry.note && <p className="text-xs text-gray-400 mt-1 truncate">{entry.note}</p>}
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
                      <div className="px-5 pb-3 bg-red-50 dark:bg-red-950/20 border-t border-red-200 flex items-center justify-between gap-4 pt-3">
                        <p className="text-xs font-bold text-red-600">Delete this mood entry?</p>
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

      {/* ── CREATE / EDIT ── */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="reveal-mood reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">mood</span>
              <h2 className="font-bold text-lg dark:text-white">{mode === 'create' ? 'Log Mood Check-In' : 'Edit Entry'}</h2>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${mode === 'create' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                {mode === 'create' ? 'INSERT' : 'UPDATE'}
              </span>
            </div>
            <div className="p-8">
              <MoodFormFields />
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setMode('list'); setSelected(null); }} className="px-6 py-3 bg-gray-100 border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={mode === 'create' ? handleCreate : handleUpdate}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                  <span className="material-symbols-outlined text-sm">save</span>
                  {mode === 'create' ? 'Save Mood' : 'Update Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW ── */}
      {mode === 'view' && selected && (
        <div className="reveal-mood reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{SCORE_LABELS[selected.score].emoji}</span>
                <div>
                  <p className="font-bold text-lg dark:text-white">{SCORE_LABELS[selected.score].label} · {selected.score}/10</p>
                  <p className="text-xs text-gray-400">{new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-300 ml-2">DISPLAY</span>
              </div>
              <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">Edit</button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Emotions</p>
                <div className="flex flex-wrap gap-2">{selected.emotions.map(e => <span key={e} className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-bold">{e}</span>)}</div>
              </div>
              {selected.triggers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Triggers</p>
                  <div className="flex flex-wrap gap-2">{selected.triggers.map(t => <span key={t} className="bg-secondary/20 border border-secondary/30 rounded-full px-3 py-1 text-xs font-bold dark:text-white">{t}</span>)}</div>
                </div>
              )}
              {selected.note && (
                <div className="bg-gray-50 dark:bg-aura-black/30 rounded-2xl p-5 border-2 border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Reflection Note</p>
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

export default MoodTracker;
