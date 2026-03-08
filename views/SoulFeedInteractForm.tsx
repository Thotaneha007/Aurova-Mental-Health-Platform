
/**
 * SoulFeed Interaction Form — TRANSACTION FORM
 * Module: Wellness Content, Learning & Inspiration (T Neha)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 */

import React, { useState, useEffect } from 'react';
import { SoulFeedSuggestion } from '../types';
import { soulFeedService } from '../services/wellnessService';

interface SoulFeedInteractFormProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const CATEGORY_OPTIONS = ['Science & Innovation', 'Leadership & Politics', 'Sports & Athletics', 'Arts & Literature', 'Activism & Social Change', 'Business & Entrepreneurship', 'Philosophy & Spirituality', 'Other'];
const STORAGE_KEY = 'aurova_soulfeed_suggestions';

const STATUS_COLORS: Record<SoulFeedSuggestion['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300'
};

const SoulFeedInteractForm: React.FC<SoulFeedInteractFormProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [records, setRecords] = useState<SoulFeedSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selected, setSelected] = useState<SoulFeedSuggestion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | SoulFeedSuggestion['status']>('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const blankForm = { name: '', knownFor: '', struggle: '', whyInspires: '' };
  const [form, setForm] = useState(blankForm);

  // Load from API on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    soulFeedService.getAll()
      .then(data => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll('.reveal-sf').forEach((el, i) => setTimeout(() => el.classList.add('active'), i * 60));
    }, 80);
    return () => clearTimeout(t);
  }, [mode]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const validate = () => {
    if (!form.name.trim()) { showToast('Name is required.'); return false; }
    if (!form.knownFor.trim()) { showToast('Known For field is required.'); return false; }
    if (!form.struggle.trim()) { showToast('Struggle description is required.'); return false; }
    if (!form.whyInspires.trim()) { showToast('Why they inspire you is required.'); return false; }
    return true;
  };

  const handleCreate = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    if (!validate()) return;
    try {
      const created = await soulFeedService.create(form);
      setRecords(prev => [created, ...prev]);
      setForm(blankForm); setMode('list');
      showToast('Suggestion submitted! Our team will review it shortly.');
    } catch { showToast('Failed to submit. Please try again.'); }
  };

  const handleUpdate = async () => {
    if (!selected || !validate()) return;
    try {
      const updated = await soulFeedService.update(selected.id, form);
      setRecords(prev => prev.map(r => r.id === selected.id ? updated : r));
      setMode('list'); setSelected(null);
      showToast('Suggestion updated!');
    } catch { showToast('Failed to update. Please try again.'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await soulFeedService.remove(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (mode !== 'list') { setMode('list'); setSelected(null); }
      setDeleteConfirmId(null);
      showToast('Suggestion deleted.');
    } catch { showToast('Failed to delete.'); }
  };

  const openEdit = (r: SoulFeedSuggestion) => {
    setSelected(r);
    setForm({ name: r.name, knownFor: r.knownFor, struggle: r.struggle, whyInspires: r.whyInspires });
    setMode('edit');
  };

  const filtered = records.filter(r =>
    (filterStatus === '' || r.status === filterStatus) &&
    (searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.knownFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.struggle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const FormFields = () => (
    <div className="space-y-6">
      <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
          <h3 className="font-bold dark:text-white">Suggest a Soul of Resilience</h3>
        </div>
        <p className="text-sm text-gray-500 font-medium">Know a historical figure or public figure who overcame mental health struggles to achieve greatness? Help us feature their story.</p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name <span className="text-red-400">*</span></label>
        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Vincent van Gogh"
          className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Known For / Title <span className="text-red-400">*</span></label>
        <input type="text" value={form.knownFor} onChange={e => setForm(p => ({ ...p, knownFor: e.target.value }))}
          placeholder="e.g. Post-Impressionist Painter, Nobel Laureate"
          className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Their Mental Health Struggle <span className="text-red-400">*</span></label>
        <textarea value={form.struggle} onChange={e => setForm(p => ({ ...p, struggle: e.target.value }))}
          placeholder="Describe the mental health challenge or personal struggle they faced..."
          rows={4} className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none" />
        <p className="text-xs text-gray-400 mt-1 font-medium">{form.struggle.length}/500 characters</p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Why They Inspire You <span className="text-red-400">*</span></label>
        <textarea value={form.whyInspires} onChange={e => setForm(p => ({ ...p, whyInspires: e.target.value }))}
          placeholder="What did they achieve despite everything? Why should others know their story?"
          rows={4} className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none" />
        <p className="text-xs text-gray-400 mt-1 font-medium">{form.whyInspires.length}/500 characters</p>
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

      <header className="mb-10 reveal-sf reveal">
        <button onClick={mode !== 'list' ? () => { setMode('list'); setSelected(null); } : onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>{mode !== 'list' ? 'Back to Submissions' : 'Back'}
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · SoulFeed Interaction</p>
        <h1 className="text-5xl md:text-6xl font-display font-bold dark:text-white leading-none">
          Suggest a <span className="text-primary italic">Soul.</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Submit inspirational figures for our SoulFeed and manage your submissions.</p>
      </header>

      {mode === 'list' && (
        <div className="space-y-6 reveal-sf reveal">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: records.length, color: 'bg-card-yellow', icon: 'history_edu' },
              { label: 'Pending', value: records.filter(r => r.status === 'pending').length, color: 'bg-card-blue', icon: 'pending' },
              { label: 'Approved', value: records.filter(r => r.status === 'approved').length, color: 'bg-card-purple', icon: 'verified' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border-2 border-black rounded-2xl p-4 shadow-retro text-center`}>
                <span className="material-symbols-outlined text-2xl text-black">{s.icon}</span>
                <p className="text-2xl font-display font-bold text-black mt-0.5">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search suggestions..."
                className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl text-sm font-medium dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
              className="border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={() => { setForm(blankForm); setMode('create'); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-sm">add</span>Suggest a Soul
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
              <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">history_edu</span>
              <p className="font-bold dark:text-white text-xl mb-2">No Suggestions Yet</p>
              <p className="text-gray-400 font-medium mb-8">Nominate a soul whose story deserves to be told on Aurova.</p>
              <button onClick={() => { setForm(blankForm); setMode('create'); }}
                className="px-8 py-4 bg-primary text-white border-2 border-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                Submit First Suggestion
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(entry => (
                <div key={entry.id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-retro overflow-hidden">
                  <div className="p-5 flex items-start gap-4">
                    <div className="w-12 h-12 bg-aura-black rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 text-white text-xl font-display font-bold">
                      {entry.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                        <p className="font-bold dark:text-white">{entry.name}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLORS[entry.status]}`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-xs text-primary font-bold mb-1">{entry.knownFor}</p>
                      <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">{entry.struggle}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(entry.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setSelected(entry); setMode('view'); }} className="w-8 h-8 bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all">
                        <span className="material-symbols-outlined text-xs">visibility</span>
                      </button>
                      {entry.status === 'pending' && (
                        <button onClick={() => openEdit(entry)} className="w-8 h-8 bg-primary/10 border-2 border-primary/30 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-all">
                          <span className="material-symbols-outlined text-xs text-primary">edit</span>
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirmId(entry.id)} className="w-8 h-8 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all">
                        <span className="material-symbols-outlined text-xs text-red-500">delete</span>
                      </button>
                    </div>
                  </div>
                  {deleteConfirmId === entry.id && (
                    <div className="px-5 pb-3 pt-3 bg-red-50 dark:bg-red-950/20 border-t border-red-200 flex items-center justify-between gap-4">
                      <p className="text-xs font-bold text-red-600">Delete this suggestion?</p>
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
        <div className="reveal-sf reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              <h2 className="font-bold text-lg dark:text-white">{mode === 'create' ? 'New Soul Suggestion' : 'Edit Suggestion'}</h2>
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
                  <span className="material-symbols-outlined text-sm">send</span>
                  {mode === 'create' ? 'Submit Suggestion' : 'Update Suggestion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'view' && selected && (
        <div className="reveal-sf reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-aura-black rounded-xl border-2 border-black flex items-center justify-center text-white text-xl font-display font-bold flex-shrink-0">
                  {selected.name[0]}
                </div>
                <div>
                  <p className="font-bold text-lg dark:text-white">{selected.name}</p>
                  <p className="text-xs text-primary font-bold">{selected.knownFor}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLORS[selected.status]} ml-2`}>
                  {selected.status}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-300">DISPLAY</span>
              </div>
              {selected.status === 'pending' && (
                <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all">Edit</button>
              )}
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-gray-50 dark:bg-aura-black/30 rounded-2xl p-5 border-2 border-black/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">dark_mode</span>Their Struggle
                </p>
                <p className="text-sm font-medium dark:text-gray-300 leading-relaxed">{selected.struggle}</p>
              </div>
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">auto_awesome</span>Why They Inspire
                </p>
                <p className="text-sm font-medium dark:text-gray-300 leading-relaxed">{selected.whyInspires}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>Submitted: {new Date(selected.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className={`font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>Review: {selected.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoulFeedInteractForm;
