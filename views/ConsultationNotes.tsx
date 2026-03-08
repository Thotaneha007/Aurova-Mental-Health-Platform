/**
 * Consultation Notes Form — TRANSACTION FORM
 * Module: Consultation Management (AC Sanhitha Reddy)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: textarea, select, radio, text, date, toggle, range
 */

import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';

interface ConsultationNotesProps {
  onBack: () => void;
}

const STATUS_OPTIONS = ['upcoming', 'in-session', 'completed', 'cancelled', 'no-show'];
const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-100 border-blue-400 text-blue-800',
  'in-session': 'bg-yellow-100 border-yellow-400 text-yellow-800',
  completed: 'bg-green-100 border-green-400 text-green-800',
  cancelled: 'bg-red-100 border-red-400 text-red-800',
  'no-show': 'bg-gray-100 border-gray-400 text-gray-800',
};

const ConsultationNotes: React.FC<ConsultationNotesProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Selected consultation
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };
  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  // ── DISPLAY ──
  const fetchConsultations = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getConsultations();
      setConsultations(data);
    } catch { showToast('Failed to load.', 'error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchConsultations(); }, []);

  // ── SEARCH ──
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchConsultations({
        q: searchText || undefined,
        status: searchStatus || undefined,
        from: searchFrom || undefined,
        to: searchTo || undefined
      });
      setConsultations(data);
      showToast(`Found ${data.length} consultations`, 'info');
    } catch { showToast('Search failed', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── INSERT / UPDATE notes ──
  const openEditMode = async (id: string) => {
    try {
      const data = await doctorService.getConsultation(id);
      setSelectedConsultation(data);
      setSelectedId(id);
      setNotes(data.notes || '');
      setNewStatus(data.status || 'upcoming');
      setMode('edit');
    } catch { showToast('Failed to load consultation.', 'error'); }
  };

  const handleSaveNotes = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    try {
      await doctorService.updateConsultationNotes(selectedId, notes);
      if (newStatus !== selectedConsultation?.status) {
        await doctorService.updateConsultationStatus(selectedId, newStatus);
      }
      showToast(selectedConsultation?.notes ? 'Notes updated!' : 'Notes added!', 'success');
      setMode('list');
      setSelectedId(null);
      fetchConsultations();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to save.', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── DELETE notes ──
  const handleDeleteNotes = async (id: string) => {
    try {
      await doctorService.deleteConsultationNotes(id);
      showToast('Notes cleared.', 'info');
      setDeleteConfirmId(null);
      fetchConsultations();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
  };

  // ── EDIT FORM ──
  const renderEditForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {selectedConsultation?.notes ? 'UPDATE · Edit Notes' : 'INSERT · Add Notes'}
          </p>
          <h2 className="text-3xl font-display font-bold dark:text-white">Consultation Notes</h2>
        </div>
        <button onClick={() => { setMode('list'); setSelectedId(null); }}
          className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest">Cancel</button>
      </div>

      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
        <div className="p-8 space-y-6">
          {/* Consultation Info */}
          {selectedConsultation && (
            <div className="p-4 bg-card-purple rounded-xl border-2 border-black/10">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_COLORS[selectedConsultation.status] || ''}`}>
                  {selectedConsultation.status}
                </span>
                <span className="text-xs font-bold text-gray-500">{selectedConsultation.sessionType}</span>
              </div>
              <p className="font-bold text-sm dark:text-white">
                Patient: {selectedConsultation.patientId?.displayName || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedConsultation.scheduledTime ? new Date(selectedConsultation.scheduledTime).toLocaleString() : '—'}
              </p>
              {selectedConsultation.clinicalFormData?.status === 'submitted' && (
                <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> Intake form submitted
                </p>
              )}
            </div>
          )}

          {/* Status Radio */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Status (Radio)</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                <label key={s} className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all capitalize
                  ${newStatus === s ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                  <input type="radio" name="status" value={s} checked={newStatus === s}
                    onChange={e => setNewStatus(e.target.value)} className="sr-only" />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Session Notes (Textarea) *</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Document the session: key discussion points, observations, patient state, treatment plan, homework assigned..."
              rows={10} className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none" />
            <p className="text-[9px] text-gray-400 mt-1">{notes.length} characters</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-5 border-t-2 border-black bg-gray-50 dark:bg-aura-black/20 flex flex-wrap gap-3 justify-end">
          <button onClick={handleSaveNotes} disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-3 ${selectedConsultation?.notes ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest transition-all active:translate-y-1 disabled:opacity-50`}>
            <span className="material-symbols-outlined text-sm">{selectedConsultation?.notes ? 'edit' : 'add_circle'}</span>
            {isSaving ? 'Saving...' : selectedConsultation?.notes ? 'UPDATE Notes' : 'INSERT Notes'}
          </button>
          {selectedConsultation?.notes && (
            <button onClick={() => { handleDeleteNotes(selectedId!); setMode('list'); }}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:translate-y-1">
              <span className="material-symbols-outlined text-sm">delete</span> DELETE Notes
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── LIST VIEW ──
  const renderList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Consultation Notes</p>
        <h2 className="text-4xl font-display font-bold dark:text-white">Session <span className="text-primary italic">Notes.</span></h2>
        <p className="text-gray-500 mt-1 font-medium text-sm">INSERT, UPDATE, DELETE, SEARCH, DISPLAY — Manage session documentation.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">search</span> SEARCH
        </button>
        <button onClick={fetchConsultations}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">visibility</span> DISPLAY ALL
        </button>
      </div>

      {showSearch && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Keyword (Text)</label>
              <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Patient, notes..."
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status (Dropdown)</label>
              <select value={searchStatus} onChange={e => setSearchStatus(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white">
                <option value="">All</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">From (Date)</label>
              <input type="date" value={searchFrom} onChange={e => setSearchFrom(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">To (Date)</label>
              <input type="date" value={searchTo} onChange={e => setSearchTo(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSearch} className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest">Go</button>
            <button onClick={() => { setSearchText(''); setSearchStatus(''); setSearchFrom(''); setSearchTo(''); fetchConsultations(); }}
              className="px-4 py-2 bg-gray-100 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest">Clear</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      ) : consultations.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
          <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">note_alt</span>
          <p className="text-gray-400 font-bold text-lg">No consultations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{consultations.length} consultations</p>
          {consultations.map((c: any) => {
            const dt = c.scheduledTime ? new Date(c.scheduledTime) : null;
            const hasNotes = !!c.notes;
            return (
              <div key={c._id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist-sm hover:shadow-brutalist transition-all p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{c.sessionType}</span>
                      {hasNotes && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded-full text-[9px] font-bold uppercase flex items-center gap-0.5">
                          <span className="material-symbols-outlined" style={{ fontSize: '9px' }}>description</span> Has Notes
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm dark:text-white">
                      {c.patientId?.displayName || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dt ? dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                      {dt ? ` · ${dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      {c.duration ? ` · ${c.duration}min` : ''}
                    </p>
                    {hasNotes && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => openEditMode(c._id)}
                      className={`flex items-center gap-1 px-3 py-1.5 ${hasNotes ? 'bg-blue-500' : 'bg-green-500'} text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:brightness-110 active:translate-y-0.5`}>
                      <span className="material-symbols-outlined text-xs">{hasNotes ? 'edit' : 'add_circle'}</span>
                      {hasNotes ? 'UPDATE' : 'INSERT'}
                    </button>
                    {hasNotes && (
                      deleteConfirmId === c._id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDeleteNotes(c._id)} className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase shadow-retro">Yes</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1.5 bg-gray-200 font-bold rounded-lg border-2 border-black text-[10px] uppercase">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(c._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-red-600 active:translate-y-0.5">
                          <span className="material-symbols-outlined text-xs">delete</span> DELETE
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-24 pb-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] ${toastColors[toast.type]} text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
          {toast.msg}
        </div>
      )}
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back
      </button>
      {mode === 'list' ? renderList() : renderEditForm()}
    </div>
  );
};

export default ConsultationNotes;
