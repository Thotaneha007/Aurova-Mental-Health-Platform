/**
 * Patient Intake Response Review Form — TRANSACTION FORM
 * Module: Patient Vault & Summary (AC Sanhitha Reddy)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: text, date, select, expand/collapse, data display
 */

import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';

interface PatientIntakeReviewProps {
  onBack: () => void;
}

const PatientIntakeReview: React.FC<PatientIntakeReviewProps> = ({ onBack }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Patient summary
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientSummary, setPatientSummary] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };
  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  // ── DISPLAY ──
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getIntakeReviews();
      setReviews(data);
    } catch { showToast('Failed to load intake reviews.', 'error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  // ── SEARCH ──
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchIntakeReviews({
        q: searchText || undefined,
        from: searchFrom || undefined,
        to: searchTo || undefined
      });
      setReviews(data);
      showToast(`Found ${data.length} intake responses`, 'info');
    } catch { showToast('Search failed', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── DELETE (clear intake data) ──
  const handleDelete = async (consultationId: string) => {
    try {
      await doctorService.deleteIntakeReview(consultationId);
      showToast('Intake data cleared.', 'info');
      setDeleteConfirmId(null);
      fetchReviews();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
  };

  // ── Patient summary ──
  const openPatientSummary = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowSummary(true);
    try {
      const data = await doctorService.getPatientSummary(patientId);
      setPatientSummary(data);
    } catch { showToast('Failed to load patient summary.', 'error'); setPatientSummary(null); }
  };

  const renderResponseValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  // ── PATIENT SUMMARY MODAL ──
  const renderSummary = () => {
    if (!showSummary) return null;
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSummary(false)}>
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold dark:text-white">Patient Summary</h3>
            <button onClick={() => setShowSummary(false)} className="p-2 hover:bg-gray-100 rounded-xl">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {!patientSummary ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="p-4 bg-card-purple rounded-xl border-2 border-black/10">
                <p className="font-bold text-sm dark:text-white">{patientSummary.patient?.displayName || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{patientSummary.patient?.email}</p>
              </div>

              {/* Consultation Timeline */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Consultation Timeline ({patientSummary.consultations?.length || 0})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(patientSummary.consultations || []).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-aura-black/30 rounded-lg border border-black/5">
                      <div className={`w-2 h-2 rounded-full ${c.status === 'completed' ? 'bg-green-500' : c.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-500'}`} />
                      <div className="flex-1">
                        <p className="text-xs font-bold dark:text-white">{new Date(c.scheduledTime).toLocaleDateString()} · {c.sessionType}</p>
                        <p className="text-[9px] text-gray-400 capitalize">{c.status}</p>
                      </div>
                      {c.rating && <span className="text-xs font-bold text-yellow-500">⭐ {c.rating}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood Insights */}
              {patientSummary.insights?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Mood Insights</h4>
                  <div className="flex flex-wrap gap-2">
                    {patientSummary.insights.map((ins: any, i: number) => (
                      <div key={i} className="px-3 py-2 bg-card-blue rounded-xl border border-black/10">
                        <p className="text-[9px] text-gray-400">{new Date(ins.date).toLocaleDateString()}</p>
                        <p className="text-xs font-bold dark:text-white">{ins.mood} {ins.score ? `(${ins.score}/10)` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Journals */}
              {patientSummary.journals?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Recent Journal Entries</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {patientSummary.journals.slice(0, 5).map((j: any) => (
                      <div key={j.id} className="p-3 bg-gray-50 dark:bg-aura-black/30 rounded-lg border border-black/5">
                        <p className="text-[9px] text-gray-400">{new Date(j.date).toLocaleDateString()}</p>
                        <p className="text-xs dark:text-white/80 line-clamp-2">{j.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pt-24 pb-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] ${toastColors[toast.type]} text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
          {toast.msg}
        </div>
      )}
      {renderSummary()}

      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back
      </button>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Patient Intake Response Review</p>
          <h2 className="text-4xl font-display font-bold dark:text-white">Intake <span className="text-primary italic">Reviews.</span></h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">DISPLAY, SEARCH, DELETE — Review patient pre-session intake responses.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1">
            <span className="material-symbols-outlined text-sm">search</span> SEARCH
          </button>
          <button onClick={fetchReviews}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1">
            <span className="material-symbols-outlined text-sm">visibility</span> DISPLAY ALL
          </button>
        </div>

        {showSearch && (
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Patient / Form (Text)</label>
                <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Patient name, form title..."
                  className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
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
              <button onClick={() => { setSearchText(''); setSearchFrom(''); setSearchTo(''); fetchReviews(); }}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest">Clear</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
            <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">assignment</span>
            <p className="text-gray-400 font-bold text-lg">No intake responses found.</p>
            <p className="text-gray-400 text-sm mt-1">Responses appear here after patients submit their intake forms.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{reviews.length} intake responses</p>
            {reviews.map((r: any) => {
              const isExpanded = expandedId === r.consultationId;
              const dt = r.scheduledTime ? new Date(r.scheduledTime) : null;
              const responses = r.responses || {};
              const fieldsList = r.fieldsSnapshot || [];
              return (
                <div key={r.consultationId} className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist-sm hover:shadow-brutalist transition-all overflow-hidden">
                  {/* Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.consultationId)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded-full text-[9px] font-bold uppercase">Submitted</span>
                          <span className="text-[9px] font-bold text-gray-400">{r.sessionType}</span>
                        </div>
                        <p className="font-bold text-sm dark:text-white">{r.patient?.displayName || 'Unknown Patient'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.formTitle} · {dt ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          {r.submittedAt ? ` · Submitted ${new Date(r.submittedAt).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => setExpandedId(isExpanded ? null : r.consultationId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-primary/80 active:translate-y-0.5">
                          <span className="material-symbols-outlined text-xs">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                          {isExpanded ? 'Collapse' : 'DISPLAY'}
                        </button>
                        {r.patient?._id && (
                          <button onClick={() => openPatientSummary(r.patient._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-blue-600 active:translate-y-0.5">
                            <span className="material-symbols-outlined text-xs">person</span> Vault
                          </button>
                        )}
                        {deleteConfirmId === r.consultationId ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDelete(r.consultationId)} className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase shadow-retro">Yes</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1.5 bg-gray-200 font-bold rounded-lg border-2 border-black text-[10px] uppercase">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(r.consultationId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-red-600 active:translate-y-0.5">
                            <span className="material-symbols-outlined text-xs">delete</span> DELETE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Responses */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-black/10 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Basic Info */}
                      {r.basicInfo && (
                        <div className="mb-4 p-3 bg-card-purple rounded-xl border border-black/10">
                          <p className="text-[9px] font-bold uppercase text-gray-400 mb-1">Basic Info</p>
                          <p className="text-xs font-bold dark:text-white">{r.basicInfo.displayName || 'Patient'}</p>
                          {r.basicInfo.email && <p className="text-[10px] text-gray-500">{r.basicInfo.email}</p>}
                          <p className="text-[10px] text-gray-500">{r.basicInfo.isAnonymous ? 'Anonymous' : 'Identified'}</p>
                        </div>
                      )}

                      {/* Response Fields */}
                      {fieldsList.length > 0 ? (
                        <div className="space-y-3">
                          {fieldsList.map((field: any, idx: number) => (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-aura-black/20 rounded-xl border border-black/5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold uppercase text-primary">{field.type}</span>
                                {field.required && <span className="text-[8px] text-red-400 font-bold">Required</span>}
                              </div>
                              <p className="text-xs font-bold text-gray-700 dark:text-white/80 mb-0.5">{field.label}</p>
                              <p className="text-sm dark:text-white font-medium">
                                {renderResponseValue(responses[field.key])}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : Object.keys(responses).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(responses).map(([key, value]) => (
                            <div key={key} className="p-3 bg-gray-50 dark:bg-aura-black/20 rounded-xl border border-black/5">
                              <p className="text-[9px] font-bold uppercase text-gray-400">{key.replace(/_/g, ' ')}</p>
                              <p className="text-sm dark:text-white font-medium">{renderResponseValue(value)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No response data available.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientIntakeReview;
