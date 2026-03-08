
/**
 * Wellness Preference & Profile Form — MASTER FORM
 * Module: Wellness Content, Learning & Inspiration (T Neha)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 */

import React, { useState, useEffect } from 'react';
import { AppView, WellnessPreference } from '../types';
import { wellnessPreferenceService } from '../services/wellnessService';

interface WellnessPreferenceFormProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const ACTIVITY_OPTIONS = ['Yoga', 'Breathwork', 'Meditation', 'Book Library', 'Soul Feed', 'Journaling', 'Walking', 'Stretching'];
const GOAL_OPTIONS = ['Reduce Anxiety', 'Better Sleep', 'Build Resilience', 'Manage Stress', 'Improve Focus', 'Emotional Balance', 'Self-Discovery', 'Physical Wellness'];
const DURATION_OPTIONS: WellnessPreference['sessionDuration'][] = ['5min', '10min', '20min', '30min+'];
const STORAGE_KEY = 'aurova_wellness_preferences';

const WellnessPreferenceForm: React.FC<WellnessPreferenceFormProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [records, setRecords] = useState<WellnessPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selected, setSelected] = useState<WellnessPreference | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const blankForm: Omit<WellnessPreference, 'id' | 'createdAt'> = {
    goals: [],
    preferredActivities: [],
    sessionDuration: '10min',
    reminderEnabled: false,
    reminderTime: '08:00',
    notes: '',
    updatedAt: undefined
  };
  const [form, setForm] = useState(blankForm);

  // Load from API on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    wellnessPreferenceService.getAll()
      .then(data => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal-wp').forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 60);
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [mode, records.length]);



  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleTag = (list: string[], item: string): string[] =>
    list.includes(item) ? list.filter(x => x !== item) : [...list, item];

  // INSERT
  const handleCreate = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    if (form.goals.length === 0 || form.preferredActivities.length === 0) {
      showToast('Please select at least one goal and one activity.'); return;
    }
    try {
      const created = await wellnessPreferenceService.create(form as any);
      setRecords(prev => [created, ...prev]);
      setForm(blankForm);
      setMode('list');
      showToast('Wellness preferences saved!');
    } catch { showToast('Failed to save. Please try again.'); }
  };

  // UPDATE
  const handleUpdate = async () => {
    if (!selected) return;
    try {
      const updated = await wellnessPreferenceService.update(selected.id, form as any);
      setRecords(prev => prev.map(r => r.id === selected.id ? updated : r));
      setMode('list');
      setSelected(null);
      showToast('Preferences updated!');
    } catch { showToast('Failed to update. Please try again.'); }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      await wellnessPreferenceService.remove(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (mode === 'view' || mode === 'edit') { setMode('list'); setSelected(null); }
      setDeleteConfirmId(null);
      showToast('Entry deleted.');
    } catch { showToast('Failed to delete. Please try again.'); }
  };

  // Open edit
  const openEdit = (record: WellnessPreference) => {
    setSelected(record);
    setForm({
      goals: record.goals,
      preferredActivities: record.preferredActivities,
      sessionDuration: record.sessionDuration,
      reminderEnabled: record.reminderEnabled,
      reminderTime: record.reminderTime,
      notes: record.notes,
      updatedAt: undefined
    });
    setMode('edit');
  };

  // SEARCH
  const filtered = records.filter(r =>
    searchQuery === '' ||
    r.goals.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.preferredActivities.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FormFields = () => (
    <div className="space-y-6">
      {/* Goals */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Wellness Goals</label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, goals: toggleTag(prev.goals, g) }))}
              className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-bold uppercase tracking-widest transition-all
                ${form.goals.includes(g) ? 'bg-primary text-white shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white hover:bg-gray-100'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Preferred Activities</label>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_OPTIONS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, preferredActivities: toggleTag(prev.preferredActivities, a) }))}
              className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-bold uppercase tracking-widest transition-all
                ${form.preferredActivities.includes(a) ? 'bg-secondary text-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white hover:bg-gray-100'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Session Duration */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Preferred Session Duration</label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, sessionDuration: d }))}
              className={`px-5 py-2.5 rounded-xl border-2 border-black text-xs font-bold uppercase tracking-widest transition-all
                ${form.sessionDuration === d ? 'bg-black text-white shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white hover:bg-gray-100'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder */}
      <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-aura-black/30 rounded-2xl border-2 border-black/10">
        <button
          type="button"
          onClick={() => setForm(prev => ({ ...prev, reminderEnabled: !prev.reminderEnabled }))}
          className={`relative w-14 h-7 rounded-full border-2 border-black transition-all flex-shrink-0 ${form.reminderEnabled ? 'bg-primary' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-black shadow transition-all ${form.reminderEnabled ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'}`} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold dark:text-white">Daily Wellness Reminder</p>
          <p className="text-xs text-gray-400">Get a daily nudge to complete your wellness routine.</p>
        </div>
        {form.reminderEnabled && (
          <input
            type="time"
            value={form.reminderTime}
            onChange={e => setForm(prev => ({ ...prev, reminderTime: e.target.value }))}
            className="border-2 border-black rounded-xl px-3 py-2 text-sm font-bold dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
          />
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Personal Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any personal notes about your wellness journey..."
          rows={3}
          className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none"
        />
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
      <header className="mb-10 reveal-wp reveal">
        <button onClick={mode !== 'list' ? () => { setMode('list'); setSelected(null); } : onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {mode !== 'list' ? 'Back to List' : 'Back'}
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Master Form · Wellness Profile</p>
        <h1 className="text-5xl md:text-6xl font-display font-bold dark:text-white leading-none">
          Wellness <span className="text-primary italic">Preferences.</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Define your wellness goals, activities, and routines.</p>
      </header>

      {/* ── LIST MODE ── */}
      {mode === 'list' && (
        <div className="space-y-6 reveal-wp reveal">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search preferences..."
                className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl text-sm font-medium dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => { setForm(blankForm); setMode('create'); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span> New Preference
            </button>
          </div>

          {/* Record list */}
          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
              <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">psychology_alt</span>
              <p className="font-bold dark:text-white text-xl mb-2">No Preferences Yet</p>
              <p className="text-gray-400 font-medium mb-8">Add your first wellness profile to get personalized suggestions.</p>
              <button
                onClick={() => { setForm(blankForm); setMode('create'); }}
                className="px-8 py-4 bg-primary text-white border-2 border-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all"
              >
                Create Profile
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(record => (
                <div key={record.id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist overflow-hidden">
                  <div className="p-6 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {record.goals.slice(0, 3).map(g => (
                          <span key={g} className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">{g}</span>
                        ))}
                        {record.goals.length > 3 && <span className="text-[10px] text-gray-400 font-bold">+{record.goals.length - 3}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {record.preferredActivities.map(a => (
                          <span key={a} className="bg-secondary/20 text-black dark:text-white border border-secondary/30 rounded-full px-3 py-0.5 text-[10px] font-bold">{a}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span> {record.sessionDuration}
                        </span>
                        {record.reminderEnabled && (
                          <span className="flex items-center gap-1 text-primary">
                            <span className="material-symbols-outlined text-xs">notifications</span> {record.reminderTime}
                          </span>
                        )}
                        <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelected(record); setMode('view'); }}
                        className="w-9 h-9 bg-gray-100 border-2 border-black rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button onClick={() => openEdit(record)}
                        className="w-9 h-9 bg-primary/10 border-2 border-primary/30 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-all">
                        <span className="material-symbols-outlined text-sm text-primary">edit</span>
                      </button>
                      <button onClick={() => setDeleteConfirmId(record.id)}
                        className="w-9 h-9 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all">
                        <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                      </button>
                    </div>
                  </div>
                  {/* Delete confirm */}
                  {deleteConfirmId === record.id && (
                    <div className="px-6 pb-4 bg-red-50 dark:bg-red-950/20 border-t-2 border-red-200 flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-red-600">Delete this preference entry?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 bg-gray-100 border-2 border-black rounded-lg text-xs font-bold uppercase tracking-widest">Cancel</button>
                        <button onClick={() => handleDelete(record.id)} className="px-3 py-1.5 bg-red-500 text-white border-2 border-black rounded-lg text-xs font-bold uppercase tracking-widest">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE MODE ── */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="reveal-wp reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">psychology_alt</span>
                <h2 className="font-bold text-lg dark:text-white">{mode === 'create' ? 'New Wellness Profile' : 'Edit Preferences'}</h2>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${mode === 'create' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                  {mode === 'create' ? 'INSERT' : 'UPDATE'}
                </span>
              </div>
            </div>
            <div className="p-8">
              <FormFields />
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setMode('list'); setSelected(null); }}
                  className="px-6 py-3 bg-gray-100 border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={mode === 'create' ? handleCreate : handleUpdate}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  {mode === 'create' ? 'Save Profile' : 'Update Preferences'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW / DISPLAY MODE ── */}
      {mode === 'view' && selected && (
        <div className="reveal-wp reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <h2 className="font-bold text-lg dark:text-white">Wellness Profile — Detail View</h2>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-300">DISPLAY</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selected)}
                  className="px-4 py-2 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                  Edit
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Wellness Goals</p>
                <div className="flex flex-wrap gap-2">
                  {selected.goals.map(g => <span key={g} className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-bold">{g}</span>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Activities</p>
                <div className="flex flex-wrap gap-2">
                  {selected.preferredActivities.map(a => <span key={a} className="bg-secondary/20 border border-secondary/30 rounded-full px-3 py-1 text-xs font-bold dark:text-white">{a}</span>)}
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Session Duration', value: selected.sessionDuration, icon: 'schedule' },
                  { label: 'Daily Reminder', value: selected.reminderEnabled ? `Enabled at ${selected.reminderTime}` : 'Disabled', icon: 'notifications' },
                  { label: 'Created', value: new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: 'calendar_today' },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 dark:bg-aura-black/30 rounded-2xl p-4 border-2 border-black/5">
                    <span className="material-symbols-outlined text-primary text-sm block mb-1">{f.icon}</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{f.label}</p>
                    <p className="font-bold text-sm dark:text-white mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div className="bg-gray-50 dark:bg-aura-black/30 rounded-2xl p-5 border-2 border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Personal Notes</p>
                  <p className="text-sm font-medium dark:text-gray-300 leading-relaxed">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessPreferenceForm;
