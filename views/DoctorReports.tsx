/**
 * Doctor Reports & Analytics — REPORTS VIEW
 * Module: Reports & Analytics (AC Sanhitha Reddy)
 * Operations: DISPLAY · SEARCH
 * Input types: select, date picker, data visualisation cards, progress bars
 */

import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';

interface DoctorReportsProps {
  onBack: () => void;
}

interface AnalyticsData {
  totalConsultations: number;
  statusBreakdown: Record<string, number>;
  sessionTypeBreakdown: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
  slotUtilization: { total: number; booked: number; available: number };
  formCompletionRate: number;
  avgRating: number;
  totalPatients: number;
  formsCreated: number;
}

const BAR_COLORS = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-amber-500'];
const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500', upcoming: 'bg-blue-500', cancelled: 'bg-red-400', 'in-session': 'bg-yellow-500', 'no-show': 'bg-gray-400'
};

const DoctorReports: React.FC<DoctorReportsProps> = ({ onBack }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [period, setPeriod] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };
  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  const fetchAnalytics = async (params?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const d = await doctorService.getAnalytics(params);
      setData(d);
    } catch { showToast('Failed to load analytics.', 'error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (p === 'all') { fetchAnalytics(); return; }
    const now = new Date();
    let from = new Date();
    if (p === '7d') from.setDate(now.getDate() - 7);
    else if (p === '30d') from.setDate(now.getDate() - 30);
    else if (p === '90d') from.setDate(now.getDate() - 90);
    else if (p === '1y') from.setFullYear(now.getFullYear() - 1);
    fetchAnalytics({ from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] });
  };

  const handleCustomSearch = () => {
    fetchAnalytics({ ...(searchFrom && { from: searchFrom }), ...(searchTo && { to: searchTo }) });
    showToast('Filtered analytics loaded.', 'info');
  };

  const pct = (v: number, total: number) => total > 0 ? Math.round((v / total) * 100) : 0;

  // Monthly Trend
  const maxMonthly = data ? Math.max(...(data.monthlyTrend || []).map(m => m.count), 1) : 1;

  return (
    <div className="pt-24 pb-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] ${toastColors[toast.type]} text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
          {toast.msg}
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back
      </button>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Reports · Doctor Analytics</p>
          <h2 className="text-4xl font-display font-bold dark:text-white">Analytics <span className="text-primary italic">Dashboard.</span></h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">DISPLAY, SEARCH — Analyze performance, slot utilization, and patient trends.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Period Select */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Period (Select)</label>
            <select value={period} onChange={e => handlePeriodChange(e.target.value)}
              className="border-2 border-black rounded-xl px-3 py-2 text-sm font-bold bg-white dark:bg-card-dark dark:text-white focus:outline-none focus:border-primary shadow-retro">
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          <button onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 active:translate-y-1">
            <span className="material-symbols-outlined text-sm">search</span> SEARCH
          </button>
          <button onClick={() => fetchAnalytics()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 active:translate-y-1">
            <span className="material-symbols-outlined text-sm">refresh</span> DISPLAY ALL
          </button>
        </div>

        {showSearch && (
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid sm:grid-cols-3 gap-3 items-end">
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
              <button onClick={handleCustomSearch}
                className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest">Filter</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        ) : !data ? (
          <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
            <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">analytics</span>
            <p className="text-gray-400 font-bold text-lg">No data available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Consultations', value: data.totalConsultations, icon: 'calendar_month', color: 'bg-card-purple' },
                { label: 'Total Patients', value: data.totalPatients, icon: 'group', color: 'bg-card-blue' },
                { label: 'Avg Rating', value: data.avgRating?.toFixed(1) || '—', icon: 'star', color: 'bg-card-green' },
                { label: 'Forms Created', value: data.formsCreated, icon: 'description', color: 'bg-card-orange' },
              ].map((kpi, idx) => (
                <div key={idx} className={`${kpi.color} border-2 border-black rounded-2xl shadow-brutalist-sm p-5`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-lg">{kpi.icon}</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{kpi.label}</p>
                  </div>
                  <p className="text-3xl font-display font-black dark:text-white">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* ── Status Breakdown ── */}
            <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Consultation Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(data.statusBreakdown || {}).map(([status, count]) => {
                  const total = data.totalConsultations || 1;
                  const percentage = pct(count as number, total);
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold capitalize dark:text-white">{status}</span>
                        <span className="text-xs font-bold text-gray-500">{count as number} ({percentage}%)</span>
                      </div>
                      <div className="h-4 bg-gray-100 dark:bg-aura-black/40 rounded-full border border-black/10 overflow-hidden">
                        <div className={`h-full ${STATUS_COLORS[status] || 'bg-primary'} rounded-full transition-all duration-700`}
                          style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Session Types + Slot Utilization ── */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Session Types */}
              <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Session Type Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(data.sessionTypeBreakdown || {}).map(([type, count], idx) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-md ${BAR_COLORS[idx % BAR_COLORS.length]} border border-black/20`} />
                      <span className="text-xs font-bold capitalize flex-1 dark:text-white">{type}</span>
                      <span className="text-sm font-black dark:text-white">{count as number}</span>
                    </div>
                  ))}
                  {Object.keys(data.sessionTypeBreakdown || {}).length === 0 && (
                    <p className="text-xs text-gray-400 italic">No session data.</p>
                  )}
                </div>
              </div>

              {/* Slot Utilization */}
              <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Slot Utilization</h3>
                {data.slotUtilization ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative w-36 h-36">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-primary, #6B4EFF)" strokeWidth="2.5"
                            strokeDasharray={`${pct(data.slotUtilization.booked, data.slotUtilization.total)} 100`}
                            strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black dark:text-white">{pct(data.slotUtilization.booked, data.slotUtilization.total)}%</span>
                          <span className="text-[8px] uppercase font-bold text-gray-400">Booked</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-gray-50 dark:bg-aura-black/20 rounded-xl">
                        <p className="text-lg font-black dark:text-white">{data.slotUtilization.total}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Total</p>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-lg font-black text-green-600">{data.slotUtilization.booked}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Booked</p>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-lg font-black text-blue-600">{data.slotUtilization.available}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Available</p>
                      </div>
                    </div>
                  </div>
                ) : <p className="text-xs text-gray-400 italic">No slot data.</p>}
              </div>
            </div>

            {/* ── Monthly Trend ── */}
            {data.monthlyTrend && data.monthlyTrend.length > 0 && (
              <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Monthly Trend</h3>
                <div className="flex items-end gap-2 h-44 overflow-x-auto pb-2">
                  {data.monthlyTrend.map((m, idx) => {
                    const h = Math.max(8, (m.count / maxMonthly) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 min-w-[40px]">
                        <span className="text-[9px] font-bold dark:text-white">{m.count}</span>
                        <div className={`w-8 ${BAR_COLORS[idx % BAR_COLORS.length]} rounded-t-lg border-2 border-black/20 transition-all duration-700`}
                          style={{ height: `${h}%` }} />
                        <span className="text-[8px] font-bold text-gray-400 whitespace-nowrap">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Form Completion Rate ── */}
            <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Form Completion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 dark:bg-aura-black/40 rounded-full border border-black/10 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${data.formCompletionRate || 0}%` }} />
                  </div>
                </div>
                <span className="text-2xl font-black dark:text-white">{data.formCompletionRate || 0}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Percentage of consultations where patients completed intake forms.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReports;
