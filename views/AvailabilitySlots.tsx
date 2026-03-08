/**
 * Availability & Slot Control Form — TRANSACTION FORM
 * Module: Availability & Slot Management (AC Sanhitha Reddy)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: date, time, select, radio, number, toggle, calendar grid
 */

import React, { useState, useEffect, useMemo } from 'react';
import { doctorService } from '../services/doctorService';

interface AvailabilitySlotsProps {
  onBack: () => void;
}

const SESSION_TYPES = ['Video', 'Voice', 'Chat'];
const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90];
const SLOT_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 border-green-400 text-green-800',
  booked: 'bg-blue-100 border-blue-400 text-blue-800',
  'in-progress': 'bg-yellow-100 border-yellow-400 text-yellow-800',
  completed: 'bg-purple-100 border-purple-400 text-purple-800',
  off: 'bg-gray-200 border-gray-400 text-gray-600',
};

const AvailabilitySlots: React.FC<AvailabilitySlotsProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'list' | 'insert' | 'edit'>('list');
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Current date context
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [viewMonth, setViewMonth] = useState(new Date());

  // Form fields
  const [editSlotId, setEditSlotId] = useState<string | null>(null);
  const [form, setForm] = useState({
    startTime: '09:00',
    endTime: '09:30',
    duration: 30,
    sessionType: 'Video',
    status: 'available'
  });

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchSession, setSearchSession] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };
  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  // ── DISPLAY ──
  const fetchSlots = async (date?: string) => {
    const d = date || selectedDate;
    setIsLoading(true);
    try {
      const data = await doctorService.getSlotsByDate(d);
      setSlots(data);
      setSearchResults(null);
    } catch { setSlots([]); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSlots(); }, [selectedDate]);

  // ── SEARCH ──
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchSlots({
        from: searchFrom || undefined,
        to: searchTo || undefined,
        status: searchStatus || undefined,
        sessionType: searchSession || undefined
      });
      setSearchResults(data);
      showToast(`Found ${data.length} slots`, 'info');
    } catch { showToast('Search failed', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── INSERT ──
  const handleInsert = async () => {
    if (!form.startTime || !form.endTime) {
      showToast('Start and end time required.', 'error'); return;
    }
    setIsSaving(true);
    try {
      await doctorService.createSlot({
        date: selectedDate,
        startTime: form.startTime,
        endTime: form.endTime,
        duration: form.duration,
        sessionType: form.sessionType
      });
      showToast('Slot created!', 'success');
      resetForm();
      setMode('list');
      fetchSlots();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to create slot.', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    if (!editSlotId) return;
    setIsSaving(true);
    try {
      await doctorService.updateSlot(selectedDate, editSlotId, {
        startTime: form.startTime,
        endTime: form.endTime,
        duration: form.duration,
        sessionType: form.sessionType,
        status: form.status
      });
      showToast('Slot updated!', 'success');
      resetForm();
      setMode('list');
      fetchSlots();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to update.', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── DELETE ──
  const handleDelete = async (slotId: string) => {
    try {
      await doctorService.deleteSlot(selectedDate, slotId);
      showToast('Slot deleted.', 'info');
      setDeleteConfirmId(null);
      fetchSlots();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to delete.', 'error'); }
  };

  // ── CANCEL (set to off) ──
  const handleCancel = async (slotId: string) => {
    try {
      await doctorService.cancelSlot(selectedDate, slotId);
      showToast('Slot cancelled (set to off).', 'info');
      fetchSlots();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
  };

  const resetForm = () => {
    setEditSlotId(null);
    setForm({ startTime: '09:00', endTime: '09:30', duration: 30, sessionType: 'Video', status: 'available' });
  };

  const openEditMode = (slot: any) => {
    setEditSlotId(slot._id);
    setForm({
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '09:30',
      duration: slot.duration || 30,
      sessionType: slot.sessionType || 'Video',
      status: slot.status || 'available'
    });
    setMode('edit');
  };

  // ── CALENDAR ──
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [viewMonth]);

  const formatDateStr = (day: number) => {
    const m = String(viewMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewMonth.getFullYear()}-${m}-${d}`;
  };

  // ── FORM RENDER ──
  const renderSlotForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {mode === 'insert' ? 'INSERT · New Slot' : 'UPDATE · Edit Slot'}
          </p>
          <h2 className="text-3xl font-display font-bold dark:text-white">
            {mode === 'insert' ? 'Create Availability Slot' : 'Edit Slot'} — {selectedDate}
          </h2>
        </div>
        <button onClick={() => { resetForm(); setMode('list'); }}
          className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest">Cancel</button>
      </div>

      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Time pickers */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Start Time (Time Picker) *</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">End Time (Time Picker) *</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Duration Select */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Duration (Dropdown)</label>
            <select value={form.duration} onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
              className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>

          {/* Session Type Radio */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Session Type (Radio)</label>
            <div className="flex gap-3">
              {SESSION_TYPES.map(t => (
                <label key={t} className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 cursor-pointer text-sm font-bold transition-all
                  ${form.sessionType === t ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                  <input type="radio" name="sessionType" value={t} checked={form.sessionType === t}
                    onChange={e => setForm(p => ({ ...p, sessionType: e.target.value }))} className="sr-only" />
                  <span className="material-symbols-outlined text-base">
                    {t === 'Video' ? 'videocam' : t === 'Voice' ? 'mic' : 'chat'}
                  </span>
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* Status Radio (edit only) */}
          {mode === 'edit' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Status (Radio)</label>
              <div className="flex flex-wrap gap-2">
                {['available', 'off', 'completed'].map(s => (
                  <label key={s} className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all capitalize
                    ${form.status === s ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20'}`}>
                    <input type="radio" name="slotStatus" value={s} checked={form.status === s}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="sr-only" />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t-2 border-black bg-gray-50 dark:bg-aura-black/20 flex flex-wrap gap-3 justify-end">
          {mode === 'insert' && (
            <button onClick={handleInsert} disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1 disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">add_circle</span> {isSaving ? 'Creating...' : 'INSERT Slot'}
            </button>
          )}
          {mode === 'edit' && (
            <button onClick={handleUpdate} disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:translate-y-1 disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">edit</span> {isSaving ? 'Updating...' : 'UPDATE Slot'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── LIST VIEW ──
  const displaySlots = searchResults !== null ? searchResults : slots;

  const renderList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Availability & Slot Control</p>
        <h2 className="text-4xl font-display font-bold dark:text-white">Schedule <span className="text-primary italic">Slots.</span></h2>
        <p className="text-gray-500 mt-1 font-medium text-sm">INSERT, UPDATE, DELETE, SEARCH, DISPLAY — Manage your availability.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => { resetForm(); setMode('insert'); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">add_circle</span> INSERT
        </button>
        <button onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">search</span> SEARCH
        </button>
        <button onClick={() => fetchSlots()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">visibility</span> DISPLAY
        </button>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">From Date</label>
              <input type="date" value={searchFrom} onChange={e => setSearchFrom(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">To Date</label>
              <input type="date" value={searchTo} onChange={e => setSearchTo(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status (Dropdown)</label>
              <select value={searchStatus} onChange={e => setSearchStatus(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white">
                <option value="">All</option>
                {['available', 'booked', 'in-progress', 'completed', 'off'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Session Type</label>
              <select value={searchSession} onChange={e => setSearchSession(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white">
                <option value="">All</option>
                {SESSION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSearch} className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest">Go</button>
            <button onClick={() => { setSearchFrom(''); setSearchTo(''); setSearchStatus(''); setSearchSession(''); setSearchResults(null); fetchSlots(); }}
              className="px-4 py-2 bg-gray-100 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest">Clear</button>
          </div>
        </div>
      )}

      {/* Calendar Mini */}
      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
          <h3 className="font-bold text-sm dark:text-white">
            {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-[9px] font-bold text-gray-400 uppercase py-1">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateStr = formatDateStr(day);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            return (
              <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all
                  ${isSelected ? 'bg-primary text-white shadow-retro border-2 border-black' : isToday ? 'bg-primary/10 text-primary border border-primary/30' : 'hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white'}`}>
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Header */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-bold dark:text-white">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <span className="px-2 py-0.5 bg-card-purple rounded-full text-[9px] font-bold border border-black/10">
          {displaySlots.length} slots
        </span>
      </div>

      {/* Slot Cards */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      ) : displaySlots.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
          <span className="material-symbols-outlined text-5xl text-gray-200 mb-3">event_busy</span>
          <p className="text-gray-400 font-bold">No slots for this date.</p>
          <button onClick={() => { resetForm(); setMode('insert'); }}
            className="mt-3 px-4 py-2 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest">
            + Add Slot
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displaySlots.map((slot: any) => (
            <div key={slot._id} className="bg-white dark:bg-card-dark border-2 border-black rounded-xl shadow-brutalist-sm hover:shadow-brutalist transition-all p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${SLOT_STATUS_COLORS[slot.status] || ''}`}>
                  {slot.status}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                    {slot.sessionType === 'Video' ? 'videocam' : slot.sessionType === 'Voice' ? 'mic' : 'chat'}
                  </span>
                  {slot.sessionType}
                </span>
              </div>
              <p className="font-bold text-lg dark:text-white">{slot.startTime} — {slot.endTime}</p>
              <p className="text-xs text-gray-500">{slot.duration || 30} min</p>
              {slot.date && <p className="text-[9px] text-gray-400 mt-1">{slot.date}</p>}

              <div className="flex gap-2 mt-3">
                <button onClick={() => openEditMode(slot)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 text-white font-bold rounded-lg border-2 border-black text-[9px] uppercase shadow-retro hover:bg-blue-600 active:translate-y-0.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>edit</span> UPDATE
                </button>
                {slot.status === 'available' && (
                  <button onClick={() => handleCancel(slot._id)}
                    className="px-2 py-1.5 bg-orange-400 text-white font-bold rounded-lg border-2 border-black text-[9px] uppercase shadow-retro hover:bg-orange-500 active:translate-y-0.5">
                    Off
                  </button>
                )}
                {deleteConfirmId === slot._id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(slot._id)} className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg border-2 border-black text-[9px] uppercase shadow-retro">Yes</button>
                    <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1.5 bg-gray-200 font-bold rounded-lg border-2 border-black text-[9px]">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirmId(slot._id)}
                    className="px-2 py-1.5 bg-red-500 text-white font-bold rounded-lg border-2 border-black text-[9px] uppercase shadow-retro hover:bg-red-600 active:translate-y-0.5">
                    <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
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
      {mode === 'list' ? renderList() : renderSlotForm()}
    </div>
  );
};

export default AvailabilitySlots;
