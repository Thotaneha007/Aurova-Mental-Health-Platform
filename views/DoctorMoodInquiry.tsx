/**
 * Doctor Mood Inquiry — View patient mood assessments
 * Doctors can review submitted mood assessments, add notes, and track patient well-being.
 */

import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface DoctorMoodInquiryProps {
  onBack: () => void;
}

const MOOD_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  very_low: { emoji: '😔', label: 'Very Low', color: 'bg-red-500' },
  low: { emoji: '😞', label: 'Low', color: 'bg-orange-500' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'bg-yellow-500' },
  good: { emoji: '😊', label: 'Good', color: 'bg-lime-500' },
  great: { emoji: '🤩', label: 'Great', color: 'bg-green-500' },
};

const API = `${API_BASE}/api/mood-assessments`;

const DoctorMoodInquiry: React.FC<DoctorMoodInquiryProps> = ({ onBack }) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchAssessments(); }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/doctor`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAssessments(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleMarkReviewed = async (id: string, notes: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorNotes: notes, reviewed: true }),
      });
      if (res.ok) {
        showToast('Assessment reviewed & notes saved.');
        fetchAssessments();
        setSelected(null);
        setDoctorNotes('');
      }
    } catch { showToast('Failed to save review.'); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    return assessments.filter(a => {
      if (filterStatus === 'pending' && a.reviewed) return false;
      if (filterStatus === 'reviewed' && !a.reviewed) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (a.patientId?.displayName || '').toLowerCase();
        const mood = (a.overallMood || '').toLowerCase();
        return name.includes(q) || mood.includes(q);
      }
      return true;
    });
  }, [assessments, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = assessments.length;
    const pending = assessments.filter(a => !a.reviewed).length;
    const reviewed = total - pending;
    const avgMood = total > 0 ? (assessments.reduce((s, a) => s + (a.moodScore || 5), 0) / total).toFixed(1) : '—';
    const highRisk = assessments.filter(a => a.selfHarmThoughts || a.stressLevel >= 8 || a.anxietyLevel >= 8).length;
    return { total, pending, reviewed, avgMood, highRisk };
  }, [assessments]);

  return (
    <div className="pt-24 pb-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
      {toast && (
        <div className="fixed top-6 right-6 z-[200] bg-primary text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4">
          <span className="material-symbols-outlined text-sm">check_circle</span>{toast}
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <button onClick={onBack}
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>Back to Dashboard
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Doctor Module · Patient Mood Inquiry</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold dark:text-white leading-none">
          Patient <span className="text-primary italic">Mood Reviews.</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium text-sm">Review mood assessments submitted by your patients before consultations.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Assessments', value: stats.total, icon: 'assignment', color: 'bg-card-blue' },
          { label: 'Pending Review', value: stats.pending, icon: 'pending_actions', color: 'bg-card-yellow' },
          { label: 'Reviewed', value: stats.reviewed, icon: 'task_alt', color: 'bg-card-green' },
          { label: 'Avg Mood Score', value: stats.avgMood, icon: 'mood', color: 'bg-card-purple' },
          { label: 'High Risk', value: stats.highRisk, icon: 'warning', color: 'bg-red-100' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border-2 border-black rounded-2xl shadow-brutalist-sm p-4`}>
            <span className="material-symbols-outlined text-primary text-lg">{s.icon}</span>
            <p className="text-2xl font-display font-black dark:text-white mt-1">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by patient name or mood..."
            className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl text-sm font-medium dark:bg-card-dark dark:text-white" />
        </div>
        <div className="flex border-2 border-black rounded-xl overflow-hidden">
          {(['all', 'pending', 'reviewed'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all
                ${filterStatus === f ? 'bg-primary text-white' : 'bg-white dark:bg-card-dark dark:text-white hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
          <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">mood</span>
          <p className="font-bold dark:text-white text-xl mb-2">No Mood Assessments</p>
          <p className="text-gray-400 font-medium">
            {filterStatus !== 'all' ? 'No assessments match this filter.' : 'No patients have submitted mood assessments yet.'}
          </p>
        </div>
      )}

      {/* Assessment List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((a, idx) => {
            const mood = MOOD_LABELS[a.overallMood] || MOOD_LABELS.neutral;
            const isHighRisk = a.selfHarmThoughts || a.stressLevel >= 8 || a.anxietyLevel >= 8;
            return (
              <div key={a._id || idx}
                onClick={() => { setSelected(a); setDoctorNotes(a.doctorNotes || ''); }}
                className={`bg-white dark:bg-card-dark border-2 rounded-2xl shadow-retro p-5 flex items-center gap-4 cursor-pointer hover:translate-x-1 transition-all
                  ${isHighRisk ? 'border-red-400' : 'border-black'}`}>

                {/* Mood emoji */}
                <div className={`w-14 h-14 ${mood.color} rounded-2xl border-2 border-black flex items-center justify-center text-2xl flex-shrink-0`}>
                  {mood.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm dark:text-white">{a.patientId?.displayName || 'Unknown Patient'}</span>
                    {isHighRisk && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded-full text-[8px] font-bold uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">warning</span>High Risk
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span className="font-bold capitalize">{mood.label} · {a.moodScore}/10</span>
                    <span>·</span>
                    <span>Stress {a.stressLevel}/10</span>
                    <span>·</span>
                    <span>Anxiety {a.anxietyLevel}/10</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {a.periodStart && a.periodEnd ? `${new Date(a.periodStart).toLocaleDateString()} – ${new Date(a.periodEnd).toLocaleDateString()}` : `Submitted ${new Date(a.createdAt).toLocaleDateString()}`}
                  </p>
                </div>

                {/* Status */}
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border
                    ${a.reviewed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {a.reviewed ? 'Reviewed' : 'Pending'}
                  </span>
                  {a.symptoms?.length > 0 && (
                    <span className="text-[9px] text-gray-400 font-bold">{a.symptoms.length} symptoms</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card-dark border-4 border-black rounded-[3rem] shadow-brutalist w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="p-8 bg-aura-cream border-b-2 border-black flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${(MOOD_LABELS[selected.overallMood] || MOOD_LABELS.neutral).color} rounded-2xl border-2 border-black flex items-center justify-center text-3xl`}>
                  {(MOOD_LABELS[selected.overallMood] || MOOD_LABELS.neutral).emoji}
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-black">{selected.patientId?.displayName || 'Patient'}</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Mood Assessment · {(MOOD_LABELS[selected.overallMood] || MOOD_LABELS.neutral).label} ({selected.moodScore}/10)
                  </p>
                </div>
              </div>
              <button onClick={() => { setSelected(null); setDoctorNotes(''); }}
                className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1">

              {/* Risk Alert */}
              {(selected.selfHarmThoughts || selected.stressLevel >= 8 || selected.anxietyLevel >= 8) && (
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-red-500">warning</span>
                    <p className="font-bold text-red-700">High Risk Indicators Detected</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.selfHarmThoughts && (
                      <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-bold">Self-harm thoughts reported</span>
                    )}
                    {selected.stressLevel >= 8 && (
                      <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-bold">Stress: {selected.stressLevel}/10</span>
                    )}
                    {selected.anxietyLevel >= 8 && (
                      <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-bold">Anxiety: {selected.anxietyLevel}/10</span>
                    )}
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Mood Score', value: `${selected.moodScore}/10`, icon: 'mood', color: 'text-primary' },
                  { label: 'Stress', value: `${selected.stressLevel}/10`, icon: 'psychology', color: 'text-red-500' },
                  { label: 'Anxiety', value: `${selected.anxietyLevel}/10`, icon: 'warning', color: 'text-orange-500' },
                  { label: 'Sleep', value: `${selected.sleepHours}h (Q${selected.sleepQuality}/5)`, icon: 'bedtime', color: 'text-blue-500' },
                ].map(m => (
                  <div key={m.label} className="bg-gray-50 dark:bg-aura-black/20 rounded-xl p-4 text-center border border-black/5">
                    <span className={`material-symbols-outlined text-2xl ${m.color}`}>{m.icon}</span>
                    <p className="text-xl font-black dark:text-white mt-1">{m.value}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Additional info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-aura-black/20 rounded-xl p-4 border border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Appetite</p>
                  <p className="font-bold capitalize dark:text-white">{selected.appetiteChange}</p>
                </div>
                <div className="bg-gray-50 dark:bg-aura-black/20 rounded-xl p-4 border border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Social Interaction</p>
                  <p className="font-bold capitalize dark:text-white">{selected.socialInteraction}</p>
                </div>
                <div className="bg-gray-50 dark:bg-aura-black/20 rounded-xl p-4 border border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Medication</p>
                  <p className="font-bold capitalize dark:text-white">{(selected.medicationAdherence || 'N/A').replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-aura-black/20 rounded-xl p-4 border border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Assessment Period</p>
                  <p className="font-bold dark:text-white text-sm">
                    {selected.periodStart && selected.periodEnd
                      ? `${new Date(selected.periodStart).toLocaleDateString()} – ${new Date(selected.periodEnd).toLocaleDateString()}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Symptoms */}
              {selected.symptoms?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Reported Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.symptoms.map((s: string) => (
                      <span key={s} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coping Strategies */}
              {selected.copingStrategies?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Coping Strategies Used</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.copingStrategies.map((c: string) => (
                      <span key={c} className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-bold">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient Notes */}
              {selected.additionalNotes && (
                <div className="bg-aura-cream dark:bg-aura-black/20 rounded-2xl p-5 border border-black/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Patient's Additional Notes</p>
                  <p className="text-sm dark:text-gray-300 leading-relaxed italic">"{selected.additionalNotes}"</p>
                </div>
              )}

              {/* Doctor Notes & Review */}
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Doctor's Assessment Notes</p>
                <textarea value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)}
                  placeholder="Add your clinical observations, recommendations, or follow-up notes..."
                  rows={4} className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-aura-black dark:text-white resize-none" />
                <button onClick={() => handleMarkReviewed(selected._id, doctorNotes)} disabled={saving}
                  className="w-full py-4 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-[1.02] transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm align-middle mr-2">task_alt</span>
                  {saving ? 'Saving...' : selected.reviewed ? 'Update Review & Notes' : 'Mark as Reviewed & Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMoodInquiry;
