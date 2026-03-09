/**
 * Patient Mood Assessment Form — Submit to Doctor
 * A structured mood questionnaire patients complete before/between consultations
 * so their doctor can review emotional patterns and well-being.
 */

import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface PatientMoodFormProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const MOOD_OPTIONS = [
  { value: 'very_low', label: 'Very Low', emoji: '😔', color: 'bg-red-500' },
  { value: 'low', label: 'Low', emoji: '😞', color: 'bg-orange-500' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-yellow-500' },
  { value: 'good', label: 'Good', emoji: '😊', color: 'bg-lime-500' },
  { value: 'great', label: 'Great', emoji: '🤩', color: 'bg-green-500' },
];

const SYMPTOM_TAGS = ['Anxiety', 'Sadness', 'Irritability', 'Mood Swings', 'Lack of Motivation', 'Racing Thoughts', 'Panic Attacks', 'Fatigue', 'Restlessness', 'Numbness', 'Hopelessness', 'Difficulty Concentrating'];
const COPING_TAGS = ['Exercise', 'Meditation', 'Talking to Friends', 'Journaling', 'Deep Breathing', 'Nature Walk', 'Music', 'Reading', 'Professional Help', 'None'];

const API = `${API_BASE}/api/mood-assessments`;

const PatientMoodForm: React.FC<PatientMoodFormProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [step, setStep] = useState(1);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [view, setView] = useState<'form' | 'history' | 'detail'>('form');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [overallMood, setOverallMood] = useState('');
  const [moodScore, setMoodScore] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [appetiteChange, setAppetiteChange] = useState('normal');
  const [stressLevel, setStressLevel] = useState(5);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [copingStrategies, setCopingStrategies] = useState<string[]>([]);
  const [socialInteraction, setSocialInteraction] = useState('moderate');
  const [selfHarmThoughts, setSelfHarmThoughts] = useState(false);
  const [medicationAdherence, setMedicationAdherence] = useState('not_applicable');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };
  const toggle = (list: string[], v: string) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];

  useEffect(() => {
    if (isLoggedIn) fetchHistory();
  }, [isLoggedIn]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSubmissions(await res.json());
    } catch { /* silent */ }
  };

  const resetForm = () => {
    setStep(1); setOverallMood(''); setMoodScore(5); setSleepQuality(3); setSleepHours(7);
    setAppetiteChange('normal'); setStressLevel(5); setAnxietyLevel(5); setSymptoms([]);
    setCopingStrategies([]); setSocialInteraction('moderate'); setSelfHarmThoughts(false);
    setMedicationAdherence('not_applicable'); setAdditionalNotes(''); setPeriodStart(''); setPeriodEnd('');
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    if (!overallMood) { showToast('Please select your overall mood.'); return; }
    if (!periodStart || !periodEnd) { showToast('Please specify the assessment period.'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        overallMood, moodScore, sleepQuality, sleepHours, appetiteChange,
        stressLevel, anxietyLevel, symptoms, copingStrategies,
        socialInteraction, selfHarmThoughts, medicationAdherence,
        additionalNotes, periodStart, periodEnd,
      };
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast('Mood assessment submitted to your doctor!');
        resetForm();
        fetchHistory();
        setView('history');
      } else {
        showToast('Failed to submit. Please try again.');
      }
    } catch {
      showToast('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const totalSteps = 4;

  return (
    <div className="pt-24 pb-32 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {toast && (
        <div className="fixed top-6 right-6 z-[200] bg-primary text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4">
          <span className="material-symbols-outlined text-sm">check_circle</span>{toast}
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <button onClick={view !== 'form' ? () => setView('form') : onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>{view !== 'form' ? 'Back to Form' : 'Back'}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Patient Mood Assessment</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold dark:text-white leading-none">
              Share Your <span className="text-primary italic">Mood.</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium text-sm">Complete this form so your doctor can understand how you've been feeling.</p>
          </div>
          <button onClick={() => setView(view === 'history' ? 'form' : 'history')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card-dark border-2 border-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-sm">{view === 'history' ? 'edit_note' : 'history'}</span>
            {view === 'history' ? 'New Form' : 'History'}
          </button>
        </div>
      </header>

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
              <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">assignment</span>
              <p className="font-bold dark:text-white text-xl mb-2">No Assessments Yet</p>
              <p className="text-gray-400 font-medium mb-6">Submit your first mood assessment for your doctor to review.</p>
              <button onClick={() => setView('form')} className="px-6 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro">
                Start Assessment
              </button>
            </div>
          ) : submissions.map((sub, idx) => (
            <div key={sub._id || idx} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-retro p-5 flex items-center gap-4 hover:translate-x-1 transition-all cursor-pointer"
              onClick={() => { setSelectedSubmission(sub); setView('detail'); }}>
              <div className="text-3xl">{MOOD_OPTIONS.find(m => m.value === sub.overallMood)?.emoji || '😐'}</div>
              <div className="flex-1">
                <p className="font-bold text-sm dark:text-white capitalize">{sub.overallMood?.replace('_', ' ')} · Score {sub.moodScore}/10</p>
                <p className="text-[10px] text-gray-400 font-bold">
                  {sub.periodStart && sub.periodEnd ? `${new Date(sub.periodStart).toLocaleDateString()} – ${new Date(sub.periodEnd).toLocaleDateString()}` : new Date(sub.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${sub.reviewed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                  {sub.reviewed ? 'Reviewed' : 'Pending'}
                </span>
                <span className="material-symbols-outlined text-gray-300 text-sm">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DETAIL VIEW ── */}
      {view === 'detail' && selectedSubmission && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
          <div className="px-8 py-5 border-b-2 border-black bg-aura-cream flex items-center gap-3">
            <span className="text-3xl">{MOOD_OPTIONS.find(m => m.value === selectedSubmission.overallMood)?.emoji || '😐'}</span>
            <div>
              <p className="font-bold dark:text-black capitalize">{selectedSubmission.overallMood?.replace('_', ' ')} · {selectedSubmission.moodScore}/10</p>
              <p className="text-[10px] text-gray-500 font-bold">Submitted {new Date(selectedSubmission.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="p-8 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Sleep', value: `${selectedSubmission.sleepHours}h · Q${selectedSubmission.sleepQuality}/5`, icon: 'bedtime' },
                { label: 'Stress', value: `${selectedSubmission.stressLevel}/10`, icon: 'psychology' },
                { label: 'Anxiety', value: `${selectedSubmission.anxietyLevel}/10`, icon: 'warning' },
                { label: 'Appetite', value: selectedSubmission.appetiteChange, icon: 'restaurant' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 dark:bg-aura-black/20 rounded-xl p-3 text-center">
                  <span className="material-symbols-outlined text-primary text-sm">{s.icon}</span>
                  <p className="font-bold text-sm dark:text-white capitalize">{s.value}</p>
                  <p className="text-[8px] uppercase font-bold text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            {selectedSubmission.symptoms?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Symptoms</p>
                <div className="flex flex-wrap gap-1.5">{selectedSubmission.symptoms.map((s: string) => <span key={s} className="bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1 text-[10px] font-bold">{s}</span>)}</div>
              </div>
            )}
            {selectedSubmission.copingStrategies?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Coping Strategies</p>
                <div className="flex flex-wrap gap-1.5">{selectedSubmission.copingStrategies.map((s: string) => <span key={s} className="bg-green-50 text-green-600 border border-green-200 rounded-full px-3 py-1 text-[10px] font-bold">{s}</span>)}</div>
              </div>
            )}
            {selectedSubmission.additionalNotes && (
              <div className="bg-gray-50 dark:bg-aura-black/20 rounded-xl p-4 border border-black/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Additional Notes</p>
                <p className="text-sm dark:text-gray-300">{selectedSubmission.additionalNotes}</p>
              </div>
            )}
            {selectedSubmission.doctorNotes && (
              <div className="bg-primary/5 rounded-xl p-4 border-2 border-primary/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Doctor's Notes</p>
                <p className="text-sm dark:text-gray-300">{selectedSubmission.doctorNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FORM VIEW ── */}
      {view === 'form' && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
          {/* Progress */}
          <div className="px-8 py-4 border-b-2 border-black/10 flex items-center gap-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <React.Fragment key={i}>
                <button onClick={() => setStep(i + 1)}
                  className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-bold text-sm transition-all
                    ${step === i + 1 ? 'bg-primary text-white shadow-retro scale-110' : step > i + 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {step > i + 1 ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
                </button>
                {i < totalSteps - 1 && <div className={`flex-1 h-1 rounded-full ${step > i + 1 ? 'bg-green-300' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="p-8 space-y-6">

            {/* ── STEP 1: Overall Mood ── */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-display font-bold dark:text-white mb-1">How have you been feeling?</h3>
                  <p className="text-xs text-gray-400">Select your overall mood during this period.</p>
                </div>

                {/* Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Period From</label>
                    <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                      className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Period To</label>
                    <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                      className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white" />
                  </div>
                </div>

                {/* Mood Selection */}
                <div className="grid grid-cols-5 gap-3">
                  {MOOD_OPTIONS.map(m => (
                    <button key={m.value} onClick={() => setOverallMood(m.value)}
                      className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-black transition-all
                        ${overallMood === m.value ? `${m.color} text-white shadow-brutalist scale-105` : 'bg-white dark:bg-aura-black hover:bg-gray-50'}`}>
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Mood Score */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Mood Score (1–10)</label>
                  <div className="bg-gray-50 dark:bg-aura-black/30 border-2 border-black rounded-2xl p-5 text-center">
                    <p className="text-4xl font-display font-black text-primary mb-3">{moodScore}</p>
                    <input type="range" min={1} max={10} value={moodScore} onChange={e => setMoodScore(Number(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1"><span>Very Low</span><span>Excellent</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Physical Well-being ── */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-display font-bold dark:text-white mb-1">Physical Well-being</h3>
                  <p className="text-xs text-gray-400">Help your doctor understand your physical health patterns.</p>
                </div>

                {/* Sleep */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Sleep Quality (1–5)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} onClick={() => setSleepQuality(v)}
                          className={`flex-1 py-3 rounded-xl border-2 border-black font-bold text-sm transition-all
                            ${sleepQuality === v ? 'bg-primary text-white shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold mt-1"><span>Very Poor</span><span>Excellent</span></div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Average Sleep Hours</label>
                    <input type="number" min={0} max={24} value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))}
                      className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-bold dark:bg-aura-black dark:text-white" />
                  </div>
                </div>

                {/* Appetite */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Appetite Changes</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'decreased', label: 'Decreased', icon: 'trending_down' },
                      { value: 'normal', label: 'Normal', icon: 'trending_flat' },
                      { value: 'increased', label: 'Increased', icon: 'trending_up' },
                    ].map(o => (
                      <button key={o.value} onClick={() => setAppetiteChange(o.value)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-black transition-all
                          ${appetiteChange === o.value ? 'bg-secondary text-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white'}`}>
                        <span className="material-symbols-outlined">{o.icon}</span>
                        <span className="text-[9px] font-bold uppercase">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stress & Anxiety */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Stress Level (1–10)</label>
                    <input type="range" min={1} max={10} value={stressLevel} onChange={e => setStressLevel(Number(e.target.value))}
                      className="w-full accent-red-500" />
                    <div className="flex justify-between text-[10px] mt-1"><span className="text-green-500 font-bold">Low</span><span className="text-3xl font-display font-black text-center text-red-500">{stressLevel}</span><span className="text-red-500 font-bold">High</span></div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Anxiety Level (1–10)</label>
                    <input type="range" min={1} max={10} value={anxietyLevel} onChange={e => setAnxietyLevel(Number(e.target.value))}
                      className="w-full accent-orange-500" />
                    <div className="flex justify-between text-[10px] mt-1"><span className="text-green-500 font-bold">Low</span><span className="text-3xl font-display font-black text-center text-orange-500">{anxietyLevel}</span><span className="text-orange-500 font-bold">High</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Symptoms & Coping ── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-display font-bold dark:text-white mb-1">Symptoms & Coping</h3>
                  <p className="text-xs text-gray-400">Select any symptoms you've experienced and strategies you've used.</p>
                </div>

                {/* Symptoms */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">Symptoms Experienced</label>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOM_TAGS.map(s => (
                      <button key={s} onClick={() => setSymptoms(prev => toggle(prev, s))}
                        className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-bold uppercase tracking-widest transition-all
                          ${symptoms.includes(s) ? 'bg-red-400 text-white shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white hover:bg-gray-50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coping Strategies */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">Coping Strategies Used</label>
                  <div className="flex flex-wrap gap-2">
                    {COPING_TAGS.map(c => (
                      <button key={c} onClick={() => setCopingStrategies(prev => toggle(prev, c))}
                        className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-bold uppercase tracking-widest transition-all
                          ${copingStrategies.includes(c) ? 'bg-green-500 text-white shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white hover:bg-gray-50'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Social Interaction */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Social Interaction Level</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: 'isolated', label: 'Isolated', icon: 'person_off' },
                      { value: 'minimal', label: 'Minimal', icon: 'person' },
                      { value: 'moderate', label: 'Moderate', icon: 'group' },
                      { value: 'active', label: 'Active', icon: 'groups' },
                    ].map(o => (
                      <button key={o.value} onClick={() => setSocialInteraction(o.value)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 border-black transition-all
                          ${socialInteraction === o.value ? 'bg-primary text-white shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white'}`}>
                        <span className="material-symbols-outlined text-lg">{o.icon}</span>
                        <span className="text-[8px] font-bold uppercase">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Additional Details ── */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-display font-bold dark:text-white mb-1">Final Details</h3>
                  <p className="text-xs text-gray-400">Any additional information for your doctor.</p>
                </div>

                {/* Self-harm thoughts */}
                <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-red-700 dark:text-red-400">Have you had thoughts of self-harm?</p>
                      <p className="text-[10px] text-red-500/70 mt-0.5">This information is confidential and helps your doctor provide better care.</p>
                    </div>
                    <button onClick={() => setSelfHarmThoughts(!selfHarmThoughts)}
                      className={`w-14 h-8 border-2 border-black rounded-full relative transition-colors ${selfHarmThoughts ? 'bg-red-500' : 'bg-gray-200'}`}>
                      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white border border-black transition-all ${selfHarmThoughts ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  {selfHarmThoughts && (
                    <div className="mt-3 p-3 bg-red-100 rounded-xl border border-red-300">
                      <p className="text-xs text-red-700 font-bold">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">call</span>
                        If you're in crisis, please call 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.
                      </p>
                    </div>
                  )}
                </div>

                {/* Medication */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Medication Adherence</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'not_applicable', label: 'N/A' },
                      { value: 'consistent', label: 'Consistent' },
                      { value: 'missed_some', label: 'Missed Some' },
                      { value: 'stopped', label: 'Stopped' },
                    ].map(o => (
                      <button key={o.value} onClick={() => setMedicationAdherence(o.value)}
                        className={`py-3 rounded-xl border-2 border-black text-xs font-bold uppercase transition-all
                          ${medicationAdherence === o.value ? 'bg-secondary text-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Additional Notes for Doctor</label>
                  <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder="Share anything else your doctor should know about how you've been feeling..."
                    rows={4} className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-aura-black dark:text-white resize-none" />
                </div>

                {/* Summary Preview */}
                <div className="bg-aura-cream dark:bg-aura-black/20 border-2 border-black rounded-2xl p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Assessment Summary</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-3 border border-black/10">
                      <span className="text-2xl">{MOOD_OPTIONS.find(m => m.value === overallMood)?.emoji || '—'}</span>
                      <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Mood</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl p-3 border border-black/10">
                      <p className="text-xl font-black text-primary">{moodScore}/10</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Score</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl p-3 border border-black/10">
                      <p className="text-xl font-black text-red-500">{stressLevel}/10</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Stress</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl p-3 border border-black/10">
                      <p className="text-xl font-black text-orange-500">{anxietyLevel}/10</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Anxiety</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t-2 border-black/5">
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-6 py-3 bg-gray-100 border-2 border-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
                  Previous
                </button>
              ) : <div />}
              {step < totalSteps ? (
                <button onClick={() => setStep(s => s + 1)}
                  className="px-6 py-3 bg-primary text-white border-2 border-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-retro hover:scale-105 transition-all">
                  Next Step
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white border-2 border-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-retro hover:scale-105 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">send</span>
                  {loading ? 'Submitting...' : 'Submit to Doctor'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMoodForm;
