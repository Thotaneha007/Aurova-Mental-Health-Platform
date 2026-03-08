/**
 * Doctor Profile Form — MASTER FORM
 * Module: Doctor Management (AC Sanhitha Reddy)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: text, textarea, number, select, radio, url (image), toggle
 */

import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';

interface DoctorProfileFormProps {
  onBack: () => void;
  onNavigate?: (view: any) => void;
}

const SPECIALIZATIONS = ['General Psychiatry', 'Clinical Psychology', 'Counseling', 'Child & Adolescent', 'Addiction Medicine', 'Neuropsychiatry', 'Geriatric Psychiatry', 'Forensic Psychiatry', 'Sleep Medicine', 'Other'];
const EDUCATION_OPTIONS = ['MBBS', 'MD Psychiatry', 'M.Phil Clinical Psychology', 'PhD Psychology', 'DNB Psychiatry', 'DPM', 'MSc Psychology', 'Other'];

const DoctorProfileForm: React.FC<DoctorProfileFormProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'display' | 'insert' | 'edit'>('display');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    specialization: '',
    licenseId: '',
    experienceYears: 0,
    education: '',
    bio: '',
    profileImage: '',
    isVerified: false
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  // ── DISPLAY ──
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getProfile();
      setProfile(data);
      setForm({
        fullName: data.fullName || '',
        specialization: data.specialization || '',
        licenseId: data.licenseId || '',
        experienceYears: data.experienceYears || 0,
        education: data.education || '',
        bio: data.bio || '',
        profileImage: data.profileImage || '',
        isVerified: data.isVerified || false
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProfile(null);
        setMode('insert');
      } else {
        showToast('Failed to load profile', 'error');
      }
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ── INSERT ──
  const handleInsert = async () => {
    if (!form.fullName || !form.specialization || !form.licenseId) {
      showToast('Name, specialization, and license ID are required.', 'error'); return;
    }
    setIsSaving(true);
    try {
      await doctorService.updateProfile(form);
      showToast('Profile created!', 'success');
      setMode('display');
      fetchProfile();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to create.', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await doctorService.updateProfile(form);
      showToast('Profile updated!', 'success');
      setMode('display');
      fetchProfile();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to update.', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── DELETE ──
  const handleDelete = async () => {
    try {
      await doctorService.deleteProfile();
      showToast('Profile deleted.', 'info');
      setProfile(null);
      setDeleteConfirm(false);
      setMode('insert');
      setForm({ fullName: '', specialization: '', licenseId: '', experienceYears: 0, education: '', bio: '', profileImage: '', isVerified: false });
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to delete.', 'error'); }
  };

  // ── FORM RENDER ──
  const renderForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {mode === 'insert' ? 'INSERT · New Doctor Profile' : 'UPDATE · Edit Profile'}
          </p>
          <h2 className="text-3xl font-display font-bold dark:text-white">
            {mode === 'insert' ? 'Create Profile' : 'Edit Profile'}
          </h2>
        </div>
        <button onClick={() => { setMode('display'); fetchProfile(); }}
          className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
      </div>

      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
        <div className="p-8 space-y-8">

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">person</span> Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Full Name (Text) *</label>
                <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Dr. Full Name" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">License ID (Text) *</label>
                <input type="text" value={form.licenseId} onChange={e => setForm(p => ({ ...p, licenseId: e.target.value }))}
                  placeholder="LICENSE-XXXXX" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Profile Image URL (URL)</label>
                <input type="url" value={form.profileImage} onChange={e => setForm(p => ({ ...p, profileImage: e.target.value }))}
                  placeholder="https://..." className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Experience (Number) — Years</label>
                <input type="number" min={0} max={60} value={form.experienceYears || ''} onChange={e => setForm(p => ({ ...p, experienceYears: Number(e.target.value) }))}
                  className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <hr className="border-black/10" />

          {/* Professional */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">stethoscope</span> Professional Details
            </h3>
            {/* Radio: Specialization */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Specialization (Radio) *</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(s => (
                  <label key={s} className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all
                    ${form.specialization === s ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}>
                    <input type="radio" name="spec" value={s} checked={form.specialization === s}
                      onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} className="sr-only" />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            {/* Select: Education */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Education (Dropdown)</label>
              <select value={form.education} onChange={e => setForm(p => ({ ...p, education: e.target.value }))}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary">
                <option value="">— Select —</option>
                {EDUCATION_OPTIONS.map(ed => <option key={ed} value={ed}>{ed}</option>)}
              </select>
            </div>
            {/* Textarea: Bio */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Bio / About (Textarea)</label>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell patients about your practice, philosophy, and approach..."
                rows={4} className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-5 border-t-2 border-black bg-gray-50 dark:bg-aura-black/20 flex flex-wrap gap-3 justify-end">
          {mode === 'insert' && (
            <button onClick={handleInsert} disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1 disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">add_circle</span> {isSaving ? 'Saving...' : 'INSERT Profile'}
            </button>
          )}
          {mode === 'edit' && (
            <>
              <button onClick={handleUpdate} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:translate-y-1 disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">edit</span> {isSaving ? 'Updating...' : 'UPDATE Profile'}
              </button>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-500">Are you sure?</span>
                  <button onClick={handleDelete} className="px-4 py-3 bg-red-600 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest">Yes, Delete</button>
                  <button onClick={() => setDeleteConfirm(false)} className="px-4 py-3 bg-gray-200 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest">No</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:translate-y-1">
                  <span className="material-symbols-outlined text-sm">delete</span> DELETE Profile
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ── DISPLAY VIEW ──
  const renderDisplay = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Master Form · Doctor Profile</p>
        <h2 className="text-4xl font-display font-bold dark:text-white">Doctor <span className="text-primary italic">Profile.</span></h2>
        <p className="text-gray-500 mt-1 font-medium text-sm">INSERT, UPDATE, DELETE, SEARCH, DISPLAY — Full CRUD operations.</p>
      </div>

      {/* CRUD Buttons */}
      <div className="flex flex-wrap gap-3">
        {!profile ? (
          <button onClick={() => setMode('insert')}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1">
            <span className="material-symbols-outlined text-sm">add_circle</span> INSERT
          </button>
        ) : (
          <>
            <button onClick={() => setMode('edit')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:translate-y-1">
              <span className="material-symbols-outlined text-sm">edit</span> UPDATE
            </button>
            <button onClick={fetchProfile}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1">
              <span className="material-symbols-outlined text-sm">refresh</span> DISPLAY
            </button>
          </>
        )}
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
          <div className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-black bg-card-purple flex items-center justify-center overflow-hidden shrink-0">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-primary">person</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-display font-bold dark:text-white">{profile.fullName}</h3>
                  {profile.isVerified && <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded-full text-[9px] font-bold uppercase">Verified</span>}
                </div>
                <p className="text-primary font-bold text-sm">{profile.specialization}</p>
                <p className="text-gray-400 text-xs mt-1">{profile.education} · {profile.experienceYears} yrs experience</p>
              </div>
            </div>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-card-purple rounded-xl border-2 border-black/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">License ID</p>
                <p className="font-bold text-sm dark:text-white">{profile.licenseId}</p>
              </div>
              <div className="p-4 bg-card-blue rounded-xl border-2 border-black/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Rating</p>
                <p className="font-bold text-sm dark:text-white">⭐ {profile.stats?.avgRating?.toFixed(1) || 'N/A'} ({profile.reviews?.length || 0} reviews)</p>
              </div>
            </div>
            {profile.bio && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-aura-black/30 rounded-xl border-2 border-black/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Bio</p>
                <p className="text-sm dark:text-white/80">{profile.bio}</p>
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-card-yellow rounded-xl border-2 border-black/10">
                <p className="text-2xl font-display font-bold text-black">{profile.stats?.meetingsTaken || 0}</p>
                <p className="text-[9px] font-bold uppercase text-gray-500">Consultations</p>
              </div>
              <div className="text-center p-3 bg-card-green rounded-xl border-2 border-black/10">
                <p className="text-2xl font-display font-bold text-black">{profile.stats?.hoursCommitted || 0}</p>
                <p className="text-[9px] font-bold uppercase text-gray-500">Hours</p>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-xl border-2 border-black/10">
                <p className="text-2xl font-display font-bold text-black">{profile.clinicalForms?.length || 0}</p>
                <p className="text-[9px] font-bold uppercase text-gray-500">Forms</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-24 pb-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] ${toastColors[toast.type]} text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
          {toast.msg}
        </div>
      )}
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back
      </button>
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold">Loading profile...</p>
        </div>
      ) : mode === 'display' ? renderDisplay() : renderForm()}
    </div>
  );
};

export default DoctorProfileForm;
