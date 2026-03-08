/**
 * Booking Form — TRANSACTION FORM
 * Module: Core User Experience (Shaik Abdus Sattar)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: text, select, radio, date, time, textarea, number, range, checkbox, toggle
 */

import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';

interface BookingManagementProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const SESSION_TYPES: Array<'Video' | 'Voice' | 'Chat'> = ['Video', 'Voice', 'Chat'];
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];
const STATUS_OPTIONS = ['upcoming', 'completed', 'cancelled', 'no-show'];
const DURATION_OPTIONS = [15, 30, 45, 60, 90];

const SYMPTOM_OPTIONS = ['Anxiety', 'Depression', 'Insomnia', 'Stress', 'Grief', 'Anger Issues', 'Relationship Problems', 'Self-esteem', 'Panic Attacks', 'Burnout'];

interface BookingFormData {
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  sessionType: 'Video' | 'Voice' | 'Chat';
  reason: string;
  symptoms: string[];
  urgencyLevel: string;
  notes: string;
  agreeToTerms: boolean;
  reminderEnabled: boolean;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [mode, setMode] = useState<'list' | 'insert' | 'edit'>('list');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<BookingFormData>({
    doctorId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 30,
    sessionType: 'Video',
    reason: '',
    symptoms: [],
    urgencyLevel: 'Medium',
    notes: '',
    agreeToTerms: false,
    reminderEnabled: true
  });

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  const [searchText, setSearchText] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── DISPLAY ──
  const fetchBookings = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchBookings();
  }, [isLoggedIn]);

  // ── SEARCH ──
  const handleSearch = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsLoading(true);
    try {
      const data = await bookingService.searchBookings({
        status: searchStatus || undefined,
        from: searchDateFrom || undefined,
        to: searchDateTo || undefined,
        type: searchType || undefined,
        q: searchText || undefined
      });
      setBookings(data);
      showToast(`Found ${data.length} bookings`, 'info');
    } catch (err) {
      showToast('Search failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchStatus('');
    setSearchType('');
    setSearchDateFrom('');
    setSearchDateTo('');
    setSearchText('');
    fetchBookings();
  };

  // ── INSERT ──
  const handleInsert = async () => {
    if (!formData.scheduledDate || !formData.scheduledTime) {
      showToast('Date and time are required.', 'error');
      return;
    }
    if (!formData.agreeToTerms) {
      showToast('Please agree to the consultation terms.', 'error');
      return;
    }
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsSaving(true);
    try {
      await bookingService.createBooking({
        doctorId: formData.doctorId || 'general',
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        duration: formData.duration,
        sessionType: formData.sessionType,
        reason: formData.reason,
        symptoms: formData.symptoms.join(', '),
        urgencyLevel: formData.urgencyLevel,
        notes: formData.notes
      });
      showToast('Booking created successfully!', 'success');
      resetForm();
      setMode('list');
      fetchBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create booking.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    if (!selectedBooking?._id) return;
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsSaving(true);
    try {
      await bookingService.updateBooking(selectedBooking._id, {
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        sessionType: formData.sessionType,
        duration: formData.duration,
        notes: formData.notes,
        reason: formData.reason,
        symptoms: formData.symptoms.join(', '),
        urgencyLevel: formData.urgencyLevel
      });
      showToast('Booking updated!', 'success');
      resetForm();
      setMode('list');
      fetchBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── DELETE (cancel) ──
  const handleDelete = async (id: string) => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    try {
      await bookingService.cancelBooking(id);
      showToast('Booking cancelled.', 'info');
      setDeleteConfirmId(null);
      fetchBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      doctorId: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 30,
      sessionType: 'Video',
      reason: '',
      symptoms: [],
      urgencyLevel: 'Medium',
      notes: '',
      agreeToTerms: false,
      reminderEnabled: true
    });
    setSelectedBooking(null);
  };

  const openEditMode = (booking: any) => {
    setSelectedBooking(booking);
    const schedTime = booking.scheduledTime ? new Date(booking.scheduledTime) : null;
    setFormData({
      doctorId: booking.doctorId?._id || booking.doctorId || '',
      scheduledDate: schedTime ? schedTime.toISOString().split('T')[0] : '',
      scheduledTime: schedTime ? schedTime.toTimeString().slice(0, 5) : '',
      duration: booking.duration || 30,
      sessionType: booking.sessionType || 'Video',
      reason: booking.clinicalFormData?.basicInfo?.reason || '',
      symptoms: (booking.clinicalFormData?.basicInfo?.symptoms || '').split(', ').filter(Boolean),
      urgencyLevel: booking.clinicalFormData?.basicInfo?.urgencyLevel || 'Medium',
      notes: booking.notes || '',
      agreeToTerms: true,
      reminderEnabled: true
    });
    setMode('edit');
  };

  const openInsertMode = () => {
    resetForm();
    setMode('insert');
  };

  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'completed': return 'bg-green-100 border-green-400 text-green-800';
      case 'cancelled': return 'bg-red-100 border-red-400 text-red-800';
      case 'no-show': return 'bg-gray-100 border-gray-400 text-gray-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  // ── FORM VIEW ──
  const renderForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {mode === 'insert' ? 'INSERT · New Booking' : 'UPDATE · Edit Booking'}
          </p>
          <h2 className="text-3xl font-display font-bold dark:text-white">
            {mode === 'insert' ? 'Book Consultation' : 'Edit Booking'}
          </h2>
        </div>
        <button onClick={() => { resetForm(); setMode('list'); }} className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
          Cancel
        </button>
      </div>

      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
        <div className="p-8 space-y-6">

          <div className="grid md:grid-cols-2 gap-6">
            {/* ── Date Picker ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                <span className="material-symbols-outlined text-sm align-middle mr-1">calendar_month</span>
                Appointment Date (Date Picker) *
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={e => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>

            {/* ── Time Picker ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                <span className="material-symbols-outlined text-sm align-middle mr-1">schedule</span>
                Appointment Time (Time Picker) *
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={e => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* ── Radio Group: Session Type ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              <span className="material-symbols-outlined text-sm align-middle mr-1">radio_button_checked</span>
              Session Type (Radio Buttons) *
            </label>
            <div className="flex flex-wrap gap-3">
              {SESSION_TYPES.map(type => {
                const icons: Record<string, string> = { Video: 'videocam', Voice: 'call', Chat: 'chat' };
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 cursor-pointer transition-all font-bold text-sm
                      ${formData.sessionType === type ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}
                  >
                    <input
                      type="radio"
                      name="sessionType"
                      value={type}
                      checked={formData.sessionType === type}
                      onChange={e => setFormData(prev => ({ ...prev, sessionType: e.target.value as any }))}
                      className="sr-only"
                    />
                    <span className="material-symbols-outlined text-sm">{icons[type]}</span>
                    {type}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ── Select: Duration ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                <span className="material-symbols-outlined text-sm align-middle mr-1">timer</span>
                Duration (Dropdown)
              </label>
              <select
                value={formData.duration}
                onChange={e => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              >
                {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>

            {/* ── Select: Urgency Level ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                <span className="material-symbols-outlined text-sm align-middle mr-1">priority_high</span>
                Urgency Level (Dropdown)
              </label>
              <select
                value={formData.urgencyLevel}
                onChange={e => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              >
                {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* ── Text Input: Reason ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              <span className="material-symbols-outlined text-sm align-middle mr-1">help_outline</span>
              Reason for Visit (Text Input)
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Anxiety management, Follow-up session..."
              className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* ── Checkbox Group: Symptoms ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              <span className="material-symbols-outlined text-sm align-middle mr-1">checklist</span>
              Symptoms (Checkboxes) — select all that apply
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {SYMPTOM_OPTIONS.map(symptom => {
                const checked = formData.symptoms.includes(symptom);
                return (
                  <label
                    key={symptom}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold
                      ${checked ? 'bg-secondary border-black shadow-retro text-black' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          symptoms: checked ? prev.symptoms.filter(s => s !== symptom) : [...prev.symptoms, symptom]
                        }));
                      }}
                      className="w-3.5 h-3.5 accent-primary rounded"
                    />
                    {symptom}
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Textarea: Notes ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              <span className="material-symbols-outlined text-sm align-middle mr-1">notes</span>
              Additional Notes (Textarea)
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information for the doctor..."
              rows={3}
              className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* ── Doctor ID (text input) ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              <span className="material-symbols-outlined text-sm align-middle mr-1">person_search</span>
              Doctor ID (Text — from Experts page)
            </label>
            <input
              type="text"
              value={formData.doctorId}
              onChange={e => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
              placeholder="Paste doctor ID or leave blank for general"
              className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* ── Toggle: Reminder ── */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-aura-black/30 rounded-xl border-2 border-black/10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <div>
                <p className="font-bold text-sm dark:text-white">Email Reminder (Toggle)</p>
                <p className="text-xs text-gray-400">Get reminded 1 hour before your session</p>
              </div>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, reminderEnabled: !prev.reminderEnabled }))}
              className={`relative w-14 h-7 rounded-full border-2 border-black transition-all ${formData.reminderEnabled ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-black shadow transition-all ${formData.reminderEnabled ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* ── Checkbox: Agree ── */}
          <label className="flex items-start gap-3 p-4 bg-card-yellow border-2 border-black rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={e => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
              className="w-5 h-5 accent-primary rounded mt-0.5"
            />
            <div>
              <p className="font-bold text-sm text-black">I agree to the consultation terms (Checkbox) *</p>
              <p className="text-xs text-black/60 mt-0.5">I understand this is a mental wellness consultation and not emergency medical care. I agree to provide honest information for the best possible support.</p>
            </div>
          </label>
        </div>

        {/* ── CRUD Action Bar ── */}
        <div className="px-8 py-5 border-t-2 border-black bg-gray-50 dark:bg-aura-black/20 flex flex-wrap gap-3 justify-end">
          {mode === 'insert' && (
            <button
              onClick={handleInsert}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {isSaving ? 'Saving...' : 'INSERT Booking'}
            </button>
          )}
          {mode === 'edit' && (
            <>
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:translate-y-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {isSaving ? 'Updating...' : 'UPDATE Booking'}
              </button>
              <button
                onClick={() => { handleDelete(selectedBooking._id); setMode('list'); }}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:translate-y-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                DELETE (Cancel)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ── LIST VIEW ──
  const renderList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Booking Management</p>
          <h2 className="text-4xl font-display font-bold dark:text-white">Your <span className="text-primary italic">Bookings.</span></h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">INSERT, UPDATE, DELETE, SEARCH, DISPLAY — All operations available.</p>
        </div>
      </div>

      {/* CRUD Operation Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={openInsertMode}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span> INSERT
        </button>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1"
        >
          <span className="material-symbols-outlined text-sm">search</span> SEARCH
        </button>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1"
        >
          <span className="material-symbols-outlined text-sm">visibility</span> DISPLAY ALL
        </button>
      </div>

      {/* ── SEARCH Panel ── */}
      {showSearch && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-yellow-500">manage_search</span>
            <h3 className="font-bold text-sm dark:text-white uppercase tracking-widest">Search Bookings</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status (Select)</label>
              <select
                value={searchStatus}
                onChange={e => setSearchStatus(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Session Type (Select)</label>
              <select
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              >
                <option value="">All types</option>
                {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Keyword (Text)</label>
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search notes/reason..."
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={searchDateFrom}
                onChange={e => setSearchDateFrom(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={searchDateTo}
                onChange={e => setSearchDateTo(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1"
              >
                <span className="material-symbols-outlined text-sm">search</span> Go
              </button>
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bookings List ── */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold text-sm">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
          <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">calendar_month</span>
          <p className="text-gray-400 font-bold text-lg">No bookings yet.</p>
          <p className="text-gray-400 text-sm mb-6">Click INSERT to book your first consultation.</p>
          <button onClick={openInsertMode} className="px-6 py-3 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro">
            Book Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{bookings.length} bookings found</p>
          {bookings.map((booking: any) => {
            const schedDate = booking.scheduledTime ? new Date(booking.scheduledTime) : null;
            return (
              <div key={booking._id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist-sm hover:shadow-brutalist transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                          {booking.sessionType}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {booking.duration || 30} min
                        </span>
                      </div>
                      <p className="font-bold text-sm dark:text-white mb-1">
                        {schedDate ? schedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        {' · '}
                        {schedDate ? schedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                      {booking.doctorProfileId?.fullName && (
                        <p className="text-xs text-gray-500">Dr. {booking.doctorProfileId.fullName} — {booking.doctorProfileId.specialization}</p>
                      )}
                      {booking.clinicalFormData?.basicInfo?.reason && (
                        <p className="text-xs text-gray-500 mt-1">Reason: {booking.clinicalFormData.basicInfo.reason}</p>
                      )}
                      {booking.clinicalFormData?.status && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border
                          ${booking.clinicalFormData.status === 'submitted' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-orange-100 border-orange-300 text-orange-700'}`}>
                          Form: {booking.clinicalFormData.status}
                        </span>
                      )}
                    </div>

                    {/* Per-booking CRUD */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => openEditMode(booking)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-blue-600 transition-all active:translate-y-0.5"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span> UPDATE
                        </button>
                      )}
                      {booking.status !== 'completed' && booking.status !== 'cancelled' ? (
                        deleteConfirmId === booking._id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDelete(booking._id)} className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase shadow-retro">Yes</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1.5 bg-gray-200 font-bold rounded-lg border-2 border-black text-[10px] uppercase">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(booking._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-red-600 transition-all active:translate-y-0.5"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span> DELETE
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase text-center">{booking.status}</span>
                      )}
                    </div>
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
          <span className="material-symbols-outlined text-sm">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          {toast.msg}
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors active:translate-y-0.5">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back to Space
      </button>

      {mode === 'list' ? renderList() : renderForm()}
    </div>
  );
};

export default BookingManagement;
