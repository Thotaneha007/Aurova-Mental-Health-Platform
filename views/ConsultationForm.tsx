/**
 * Prerequisite Consultation Form — TRANSACTION FORM
 * Module: Core User Experience (Shaik Abdus Sattar)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: text, textarea, select, radio, checkbox, date, number, range, color, toggle
 * Purpose: Patient fills out before a doctor consultation (medical history, current meds, etc.)
 */

import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

interface ConsultationFormProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const EXISTING_CONDITIONS = ['None', 'Anxiety Disorder', 'Depression', 'PTSD', 'Bipolar', 'OCD', 'ADHD', 'Eating Disorder', 'Insomnia', 'Substance Use', 'Schizophrenia'];
const MEDICATION_TYPES = ['None', 'Antidepressants', 'Anti-anxiety', 'Mood Stabilizers', 'Antipsychotics', 'Sleep Aids', 'Stimulants', 'Herbal/Supplements'];
const THERAPY_HISTORY = ['None', 'CBT', 'DBT', 'Psychoanalysis', 'Group Therapy', 'Art Therapy', 'EMDR', 'Mindfulness-based'];
const SLEEP_QUALITY = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
const EXERCISE_FREQUENCY = ['Never', '1-2 times/week', '3-4 times/week', '5+ times/week', 'Daily'];

interface FormResponses {
  // Personal health
  fullName: string;
  age: number;
  bloodGroup: string;
  emergencyContact: string;
  // Medical history
  existingConditions: string[];
  currentMedications: string[];
  allergies: string;
  previousTherapy: string[];
  // Lifestyle
  sleepQuality: string;
  sleepHours: number;
  exerciseFrequency: string;
  dietType: string;
  substanceUse: boolean;
  substanceDetails: string;
  // Current state
  mainConcern: string;
  symptomDuration: string;
  stressLevel: number;
  suicidalThoughts: string;
  selfHarmHistory: string;
  // Preferences
  preferredApproach: string;
  goalForSession: string;
  // Consent
  infoAccurate: boolean;
  shareWithDoctor: boolean;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [mode, setMode] = useState<'list' | 'insert' | 'edit'>('list');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  const defaultResponses: FormResponses = {
    fullName: '',
    age: 0,
    bloodGroup: '',
    emergencyContact: '',
    existingConditions: [],
    currentMedications: [],
    allergies: '',
    previousTherapy: [],
    sleepQuality: 'Fair',
    sleepHours: 7,
    exerciseFrequency: '1-2 times/week',
    dietType: '',
    substanceUse: false,
    substanceDetails: '',
    mainConcern: '',
    symptomDuration: '',
    stressLevel: 5,
    suicidalThoughts: 'No',
    selfHarmHistory: 'No',
    preferredApproach: '',
    goalForSession: '',
    infoAccurate: false,
    shareWithDoctor: false
  };

  const [formData, setFormData] = useState<FormResponses>(defaultResponses);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── DISPLAY: Load bookings that have form data ──
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
      const data = await bookingService.searchBookings({ q: searchText || undefined });
      setBookings(data);
      showToast(`Found ${data.length} bookings`, 'info');
    } catch { showToast('Search failed', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── INSERT (submit form for a booking) ──
  const handleInsert = async () => {
    if (!selectedBookingId) { showToast('Select a booking first.', 'error'); return; }
    if (!formData.infoAccurate || !formData.shareWithDoctor) { showToast('Please confirm both consent checkboxes.', 'error'); return; }
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsSaving(true);
    try {
      await bookingService.submitForm(selectedBookingId, formData as any);
      showToast('Prerequisite form submitted!', 'success');
      setFormData(defaultResponses);
      setSelectedBookingId(null);
      setMode('list');
      fetchBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit form.', 'error');
    } finally { setIsSaving(false); }
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    if (!selectedBookingId) return;
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsSaving(true);
    try {
      await bookingService.submitForm(selectedBookingId, formData as any);
      showToast('Form updated!', 'success');
      setFormData(defaultResponses);
      setSelectedBookingId(null);
      setMode('list');
      fetchBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update.', 'error');
    } finally { setIsSaving(false); }
  };

  // ── DELETE (clear form) ──
  const handleDelete = async (bookingId: string) => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    try {
      await bookingService.clearForm(bookingId);
      showToast('Form data cleared.', 'info');
      setDeleteConfirmId(null);
      fetchBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to clear form.', 'error');
    }
  };

  const openInsertMode = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setFormData(defaultResponses);
    setMode('insert');
  };

  const openEditMode = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    try {
      const form = await bookingService.getForm(bookingId);
      if (form?.responses) {
        setFormData({ ...defaultResponses, ...form.responses });
      }
    } catch { /* keep defaults */ }
    setMode('edit');
  };

  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  // ── FORM RENDER ──
  const renderForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {mode === 'insert' ? 'INSERT · New Prerequisite Form' : 'UPDATE · Edit Prerequisite Form'}
          </p>
          <h2 className="text-3xl font-display font-bold dark:text-white">
            {mode === 'insert' ? 'Pre-Consultation Intake' : 'Edit Intake Form'}
          </h2>
        </div>
        <button onClick={() => { setFormData(defaultResponses); setMode('list'); }} className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
      </div>

      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
        <div className="p-8 space-y-8">

          {/* ── Section 1: Personal Health ── */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">badge</span> Section 1: Personal Health Info
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              {/* Text input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Full Name (Text) *</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your full name" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
              {/* Number input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Age (Number Input)</label>
                <input type="number" min={1} max={120} value={formData.age || ''} onChange={e => setFormData(p => ({ ...p, age: Number(e.target.value) }))}
                  placeholder="e.g. 25" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
              {/* Select */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Blood Group (Dropdown)</label>
                <select value={formData.bloodGroup} onChange={e => setFormData(p => ({ ...p, bloodGroup: e.target.value }))}
                  className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
                  <option value="">— Select —</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              {/* Tel input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Emergency Contact (Phone)</label>
                <input type="tel" value={formData.emergencyContact} onChange={e => setFormData(p => ({ ...p, emergencyContact: e.target.value }))}
                  placeholder="+91 xxxxxxxxxx" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <hr className="border-black/10" />

          {/* ── Section 2: Medical History ── */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">medical_information</span> Section 2: Medical History
            </h3>
            {/* Checkbox group: Existing conditions */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Existing Conditions (Checkboxes)</label>
              <div className="flex flex-wrap gap-2">
                {EXISTING_CONDITIONS.map(c => {
                  const checked = formData.existingConditions.includes(c);
                  return (
                    <label key={c} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                      ${checked ? 'bg-card-purple border-black shadow-retro text-black' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        setFormData(p => ({
                          ...p, existingConditions: checked ? p.existingConditions.filter(x => x !== c) : [...p.existingConditions, c]
                        }));
                      }} className="w-3.5 h-3.5 accent-primary rounded" />
                      {c}
                    </label>
                  );
                })}
              </div>
            </div>
            {/* Checkbox group: Current meds */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Current Medications (Checkboxes)</label>
              <div className="flex flex-wrap gap-2">
                {MEDICATION_TYPES.map(m => {
                  const checked = formData.currentMedications.includes(m);
                  return (
                    <label key={m} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                      ${checked ? 'bg-secondary border-black shadow-retro text-black' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        setFormData(p => ({
                          ...p, currentMedications: checked ? p.currentMedications.filter(x => x !== m) : [...p.currentMedications, m]
                        }));
                      }} className="w-3.5 h-3.5 accent-primary rounded" />
                      {m}
                    </label>
                  );
                })}
              </div>
            </div>
            {/* Text: allergies */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Allergies (Text)</label>
              <input type="text" value={formData.allergies} onChange={e => setFormData(p => ({ ...p, allergies: e.target.value }))}
                placeholder="Any allergies to medication, food, etc." className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
            {/* Checkbox group: therapy history */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Previous Therapy Types (Checkboxes)</label>
              <div className="flex flex-wrap gap-2">
                {THERAPY_HISTORY.map(t => {
                  const checked = formData.previousTherapy.includes(t);
                  return (
                    <label key={t} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                      ${checked ? 'bg-card-blue border-black shadow-retro text-black' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        setFormData(p => ({
                          ...p, previousTherapy: checked ? p.previousTherapy.filter(x => x !== t) : [...p.previousTherapy, t]
                        }));
                      }} className="w-3.5 h-3.5 accent-primary rounded" />
                      {t}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <hr className="border-black/10" />

          {/* ── Section 3: Lifestyle ── */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">self_improvement</span> Section 3: Lifestyle
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              {/* Radio: Sleep quality */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Sleep Quality (Radio)</label>
                <div className="flex flex-wrap gap-2">
                  {SLEEP_QUALITY.map(q => (
                    <label key={q} className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                      ${formData.sleepQuality === q ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                      <input type="radio" name="sleepQuality" value={q} checked={formData.sleepQuality === q}
                        onChange={e => setFormData(p => ({ ...p, sleepQuality: e.target.value }))} className="sr-only" />
                      {q}
                    </label>
                  ))}
                </div>
              </div>
              {/* Range: Sleep hours */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Sleep Hours/Night (Range): {formData.sleepHours}h</label>
                <input type="range" min={1} max={14} value={formData.sleepHours}
                  onChange={e => setFormData(p => ({ ...p, sleepHours: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-1">
                  <span>1h</span><span>7h</span><span>14h</span>
                </div>
              </div>
              {/* Radio: Exercise frequency */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Exercise Frequency (Radio)</label>
                <div className="flex flex-wrap gap-2">
                  {EXERCISE_FREQUENCY.map(q => (
                    <label key={q} className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                      ${formData.exerciseFrequency === q ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                      <input type="radio" name="exerciseFreq" value={q} checked={formData.exerciseFrequency === q}
                        onChange={e => setFormData(p => ({ ...p, exerciseFrequency: e.target.value }))} className="sr-only" />
                      {q}
                    </label>
                  ))}
                </div>
              </div>
              {/* Select: Diet type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Diet Type (Dropdown)</label>
                <select value={formData.dietType} onChange={e => setFormData(p => ({ ...p, dietType: e.target.value }))}
                  className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
                  <option value="">— Select —</option>
                  {['Regular', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean', 'Other'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {/* Toggle: Substance use */}
            <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 dark:bg-aura-black/30 rounded-xl border-2 border-black/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-400">local_bar</span>
                <div>
                  <p className="font-bold text-sm dark:text-white">Substance Use (Toggle)</p>
                  <p className="text-xs text-gray-400">Currently using alcohol, tobacco, or other substances?</p>
                </div>
              </div>
              <button onClick={() => setFormData(p => ({ ...p, substanceUse: !p.substanceUse }))}
                className={`relative w-14 h-7 rounded-full border-2 border-black transition-all ${formData.substanceUse ? 'bg-red-500' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-black shadow transition-all ${formData.substanceUse ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'}`} />
              </button>
            </div>
            {formData.substanceUse && (
              <div className="mt-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Substance Details (Text)</label>
                <input type="text" value={formData.substanceDetails} onChange={e => setFormData(p => ({ ...p, substanceDetails: e.target.value }))}
                  placeholder="Type, frequency, quantity..." className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
            )}
          </div>

          <hr className="border-black/10" />

          {/* ── Section 4: Current Emotional State ── */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">psychology</span> Section 4: Current Emotional State
            </h3>
            {/* Textarea: main concern */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Main Concern (Textarea) *</label>
              <textarea value={formData.mainConcern} onChange={e => setFormData(p => ({ ...p, mainConcern: e.target.value }))}
                placeholder="Describe what brought you here today..." rows={4}
                className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              {/* Select: Symptom duration */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">How Long (Dropdown)</label>
                <select value={formData.symptomDuration} onChange={e => setFormData(p => ({ ...p, symptomDuration: e.target.value }))}
                  className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
                  <option value="">— Select —</option>
                  {['Less than 1 week', '1-4 weeks', '1-3 months', '3-6 months', '6-12 months', 'Over 1 year'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {/* Range: Stress level */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Stress Level (Range): {formData.stressLevel}/10</label>
                <input type="range" min={1} max={10} value={formData.stressLevel}
                  onChange={e => setFormData(p => ({ ...p, stressLevel: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-1"><span>Low</span><span>Moderate</span><span>High</span></div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {/* Radio: Suicidal thoughts */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Thoughts of Self-harm (Radio)</label>
                <div className="flex gap-2">
                  {['No', 'In the past', 'Currently'].map(v => (
                    <label key={v} className={`px-4 py-2 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                      ${formData.suicidalThoughts === v ? (v === 'Currently' ? 'bg-red-500 text-white border-black shadow-retro' : 'bg-primary text-white border-black shadow-retro') : 'bg-white dark:bg-aura-black dark:text-white border-black/20'}`}>
                      <input type="radio" name="suicidalThoughts" value={v} checked={formData.suicidalThoughts === v}
                        onChange={e => setFormData(p => ({ ...p, suicidalThoughts: e.target.value }))} className="sr-only" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              {/* Radio: Self-harm history */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Self-Harm History (Radio)</label>
                <div className="flex gap-2">
                  {['No', 'In the past', 'Currently'].map(v => (
                    <label key={v} className={`px-4 py-2 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                      ${formData.selfHarmHistory === v ? (v === 'Currently' ? 'bg-red-500 text-white border-black shadow-retro' : 'bg-primary text-white border-black shadow-retro') : 'bg-white dark:bg-aura-black dark:text-white border-black/20'}`}>
                      <input type="radio" name="selfHarmHistory" value={v} checked={formData.selfHarmHistory === v}
                        onChange={e => setFormData(p => ({ ...p, selfHarmHistory: e.target.value }))} className="sr-only" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-black/10" />

          {/* ── Section 5: Session Preferences ── */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">tune</span> Section 5: Session Preferences
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Preferred Approach (Dropdown)</label>
                <select value={formData.preferredApproach} onChange={e => setFormData(p => ({ ...p, preferredApproach: e.target.value }))}
                  className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
                  <option value="">— No preference —</option>
                  {['Talk Therapy', 'CBT', 'Mindfulness-based', 'Solution-focused', 'Psychodynamic', 'Art/Creative Therapy'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Goal for This Session (Text)</label>
                <input type="text" value={formData.goalForSession} onChange={e => setFormData(p => ({ ...p, goalForSession: e.target.value }))}
                  placeholder="What do you hope to achieve?" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <hr className="border-black/10" />

          {/* ── Section 6: Consent ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified_user</span> Consent
            </h3>
            <label className="flex items-start gap-3 p-4 bg-card-yellow border-2 border-black rounded-xl cursor-pointer">
              <input type="checkbox" checked={formData.infoAccurate} onChange={e => setFormData(p => ({ ...p, infoAccurate: e.target.checked }))}
                className="w-5 h-5 accent-primary rounded mt-0.5" />
              <div>
                <p className="font-bold text-sm text-black">I confirm the information above is accurate (Checkbox) *</p>
                <p className="text-xs text-black/60 mt-0.5">To the best of my knowledge, all responses are truthful and complete.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 bg-card-blue border-2 border-black rounded-xl cursor-pointer">
              <input type="checkbox" checked={formData.shareWithDoctor} onChange={e => setFormData(p => ({ ...p, shareWithDoctor: e.target.checked }))}
                className="w-5 h-5 accent-primary rounded mt-0.5" />
              <div>
                <p className="font-bold text-sm text-black">I consent to share this with my doctor (Checkbox) *</p>
                <p className="text-xs text-black/60 mt-0.5">This data will only be shared with your assigned consultation doctor.</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── CRUD Action Bar ── */}
        <div className="px-8 py-5 border-t-2 border-black bg-gray-50 dark:bg-aura-black/20 flex flex-wrap gap-3 justify-end">
          {mode === 'insert' && (
            <button onClick={handleInsert} disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1 disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {isSaving ? 'Submitting...' : 'INSERT Form'}
            </button>
          )}
          {mode === 'edit' && (
            <>
              <button onClick={handleUpdate} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:translate-y-1 disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">edit</span>
                {isSaving ? 'Updating...' : 'UPDATE Form'}
              </button>
              <button onClick={() => { if (selectedBookingId) handleDelete(selectedBookingId); setMode('list'); }}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:translate-y-1">
                <span className="material-symbols-outlined text-sm">delete</span> DELETE Form
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
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Prerequisite Consultation</p>
        <h2 className="text-4xl font-display font-bold dark:text-white">Pre-<span className="text-primary italic">Consultation.</span></h2>
        <p className="text-gray-500 mt-1 font-medium text-sm">INSERT, UPDATE, DELETE, SEARCH, DISPLAY — All operations available per booking.</p>
      </div>

      {/* CRUD Buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">search</span> SEARCH
        </button>
        <button onClick={fetchBookings}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">visibility</span> DISPLAY ALL
        </button>
      </div>

      {showSearch && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Search (Text)</label>
              <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search by notes, reason..."
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <button onClick={handleSearch}
              className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest">Go</button>
            <button onClick={() => { setSearchText(''); fetchBookings(); }}
              className="px-4 py-2 bg-gray-100 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest">Clear</button>
          </div>
        </div>
      )}

      {/* Bookings with form actions */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold text-sm">Loading...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
          <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">description</span>
          <p className="text-gray-400 font-bold text-lg">No bookings found.</p>
          <p className="text-gray-400 text-sm">Book a consultation first from the Booking Management page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{bookings.length} bookings</p>
          {bookings.map((b: any) => {
            const formStatus = b.clinicalFormData?.status || 'not-required';
            const schedDate = b.scheduledTime ? new Date(b.scheduledTime) : null;
            return (
              <div key={b._id} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist-sm hover:shadow-brutalist transition-all p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border
                        ${b.status === 'upcoming' ? 'bg-blue-100 border-blue-400 text-blue-800' :
                          b.status === 'completed' ? 'bg-green-100 border-green-400 text-green-800' :
                          'bg-gray-100 border-gray-300 text-gray-700'}`}>{b.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border
                        ${formStatus === 'submitted' ? 'bg-green-100 border-green-300 text-green-700' :
                          formStatus === 'pending' ? 'bg-orange-100 border-orange-300 text-orange-700' :
                          'bg-gray-100 border-gray-300 text-gray-600'}`}>
                        Form: {formStatus}
                      </span>
                    </div>
                    <p className="font-bold text-sm dark:text-white">
                      {schedDate ? schedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                      {' · '}
                      {schedDate ? schedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                      {' · '}
                      {b.sessionType}
                    </p>
                    {b.doctorProfileId?.fullName && (
                      <p className="text-xs text-gray-500 mt-1">Dr. {b.doctorProfileId.fullName}</p>
                    )}
                  </div>

                  {/* Form CRUD */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {formStatus !== 'submitted' && b.status !== 'cancelled' && (
                      <button onClick={() => openInsertMode(b._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-green-600 transition-all active:translate-y-0.5">
                        <span className="material-symbols-outlined text-xs">add_circle</span> INSERT Form
                      </button>
                    )}
                    {formStatus === 'submitted' && (
                      <button onClick={() => openEditMode(b._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-blue-600 transition-all active:translate-y-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> UPDATE Form
                      </button>
                    )}
                    {formStatus === 'submitted' && (
                      deleteConfirmId === b._id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(b._id)} className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase shadow-retro">Yes</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1.5 bg-gray-200 font-bold rounded-lg border-2 border-black text-[10px] uppercase">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(b._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-red-600 transition-all active:translate-y-0.5">
                          <span className="material-symbols-outlined text-xs">delete</span> DELETE Form
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
          <span className="material-symbols-outlined text-sm">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          {toast.msg}
        </div>
      )}
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors active:translate-y-0.5">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back
      </button>
      {mode === 'list' ? renderList() : renderForm()}
    </div>
  );
};

export default ConsultationForm;
