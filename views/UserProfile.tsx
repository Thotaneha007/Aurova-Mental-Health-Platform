
/**
 * User Profile & Consent Form — MASTER FORM
 * Module: Core User Experience (Shaik Abdus Sattar)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 */

import React, { useState, useEffect } from 'react';
import { AppView, JournalEntry } from '../types';
import { profileService } from '../services/profileService';

interface UserProfileFormProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
  userProfile: any;
  journals: JournalEntry[];
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  gender: string;
  pronouns: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bio: string;
}

interface ConsentSettings {
  dataStorage: boolean;
  aiAnalysis: boolean;
  communityVisible: boolean;
  emailNotifications: boolean;
  crisisAlerts: boolean;
  dataExport: boolean;
}

const GENDER_OPTIONS = ['Prefer not to say', 'Male', 'Female', 'Non-binary', 'Genderqueer', 'Transgender', 'Other'];
const PRONOUN_OPTIONS = ['they/them', 'she/her', 'he/him', 'ze/zir', 'prefer not to say'];

const STORAGE_KEY = 'aurova_user_profile_data';
const CONSENT_KEY = 'aurova_user_consent';

const UserProfile: React.FC<UserProfileFormProps> = ({
  onBack,
  onNavigate,
  isLoggedIn,
  onAuthRequired,
  userProfile,
  journals
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'consent' | 'activity' | 'danger'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const defaultProfile: ProfileData = {
    firstName: userProfile?.displayName?.split(' ')[0] || userProfile?.name?.split(' ')[0] || '',
    lastName: userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
    email: userProfile?.email || '',
    dob: '',
    gender: 'Prefer not to say',
    pronouns: 'prefer not to say',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bio: ''
  };

  const defaultConsent: ConsentSettings = {
    dataStorage: true,
    aiAnalysis: true,
    communityVisible: false,
    emailNotifications: true,
    crisisAlerts: true,
    dataExport: true
  };

  const [profileData, setProfileData] = useState<ProfileData>(defaultProfile);
  const [editBuffer, setEditBuffer] = useState<ProfileData>(defaultProfile);
  const [consent, setConsent] = useState<ConsentSettings>(defaultConsent);

  // Load from API on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    profileService.getProfile().then(res => {
      if (res?.profile) {
        const p = res.profile;
        const loaded: ProfileData = {
          firstName: p.firstName || defaultProfile.firstName,
          lastName:  p.lastName  || defaultProfile.lastName,
          email:     userProfile?.email || '',
          dob:       p.dob       || '',
          gender:    p.gender    || 'Prefer not to say',
          pronouns:  p.pronouns  || 'prefer not to say',
          phone:     p.phone     || '',
          emergencyContactName:  p.emergencyContactName  || '',
          emergencyContactPhone: p.emergencyContactPhone || '',
          bio:       p.bio       || ''
        };
        setProfileData(loaded);
        setEditBuffer(loaded);
        if (p.consent) setConsent(p.consent);
      }
    }).catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal-profile').forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 60);
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [activeSection]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── INSERT / UPDATE ──────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    try {
      const { email, ...fieldsToSave } = editBuffer;
      const res = await profileService.updateProfile(fieldsToSave);
      const p = res.profile;
      const loaded: ProfileData = {
        firstName: p.firstName || '', lastName: p.lastName || '',
        email: userProfile?.email || '',
        dob: p.dob || '', gender: p.gender || 'Prefer not to say',
        pronouns: p.pronouns || 'prefer not to say', phone: p.phone || '',
        emergencyContactName: p.emergencyContactName || '',
        emergencyContactPhone: p.emergencyContactPhone || '', bio: p.bio || ''
      };
      setProfileData(loaded);
      setIsEditing(false);
      showToast('Profile saved successfully!', 'success');
    } catch { showToast('Failed to save profile. Please try again.', 'error'); }
  };

  // ── UPDATE CONSENT ───────────────────────────────────────────────
  const handleConsentToggle = async (key: keyof ConsentSettings) => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    try {
      await profileService.updateConsent(updated);
      showToast(`Preference updated.`, 'info');
    } catch {
      setConsent(consent); // revert on failure
      showToast('Failed to update preference.', 'error');
    }
  };

  // ── DELETE ───────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== 'delete my account') {
      showToast('Please type the confirmation phrase exactly.', 'error');
      return;
    }
    try {
      await profileService.deleteAccount();
      showToast('Account deleted successfully. You will be logged out.', 'info');
      setTimeout(() => {
        if ((window as any).handleLogout) (window as any).handleLogout();
      }, 1800);
    } catch { showToast('Failed to delete account. Please try again.', 'error'); }
  };

  // ── SEARCH journals for activity tab ────────────────────────────
  const filteredJournals = journals.filter(j =>
    j.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.mood.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections = [
    { key: 'profile', label: 'Profile', icon: 'person' },
    { key: 'consent', label: 'Consent & Privacy', icon: 'policy' },
    { key: 'activity', label: 'Activity History', icon: 'history' },
    { key: 'danger', label: 'Account', icon: 'settings' },
  ] as const;

  const toastColors: Record<string, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-primary'
  };

  return (
    <div className="pt-24 pb-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] ${toastColors[toast.type]} text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4`}>
          <span className="material-symbols-outlined text-sm">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="mb-10 reveal-profile reveal">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Master Form · User Profile</p>
            <h1 className="text-5xl md:text-6xl font-display font-bold dark:text-white leading-none">
              Your <span className="text-primary italic">Identity.</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Manage your profile, consents, and account settings.</p>
          </div>
          {/* Profile badge */}
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-3xl shadow-brutalist px-6 py-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary border-2 border-black flex items-center justify-center text-white text-2xl font-bold shadow-brutalist-sm">
              {(profileData.firstName || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold dark:text-white">{profileData.firstName || 'User'} {profileData.lastName}</p>
              <p className="text-xs text-gray-400 font-medium">{profileData.email || userProfile?.email || '—'}</p>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {userProfile?.role || 'user'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 reveal-profile reveal">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => { setActiveSection(s.key); setIsEditing(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-black font-bold text-xs uppercase tracking-widest transition-all shadow-retro
              ${activeSection === s.key ? 'bg-primary text-white' : 'bg-white dark:bg-card-dark dark:text-white hover:bg-gray-50'}`}
          >
            <span className="material-symbols-outlined text-sm">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE SECTION ─────────────────────────────── */}
      {activeSection === 'profile' && (
        <div className="reveal-profile reveal">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b-2 border-black">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person</span>
                <h2 className="font-bold text-lg dark:text-white">Personal Information</h2>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-300">
                  {isEditing ? 'Editing' : 'Displaying'}
                </span>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => { setEditBuffer(profileData); setIsEditing(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-100 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro hover:scale-105 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">save</span> Save
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 grid md:grid-cols-2 gap-6">
              {isEditing ? (
                <>
                  {/* Editable form fields */}
                  {[
                    { label: 'First Name', key: 'firstName', type: 'text', placeholder: 'Your first name' },
                    { label: 'Last Name', key: 'lastName', type: 'text', placeholder: 'Your last name' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                    { label: 'Date of Birth', key: 'dob', type: 'date', placeholder: '' },
                    { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 xxxxxxxxxx' },
                    { label: 'Emergency Contact Name', key: 'emergencyContactName', type: 'text', placeholder: 'Full name' },
                    { label: 'Emergency Contact Phone', key: 'emergencyContactPhone', type: 'tel', placeholder: '+91 xxxxxxxxxx' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={(editBuffer as any)[f.key]}
                        placeholder={f.placeholder}
                        onChange={e => setEditBuffer(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  ))}

                  {/* Gender select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Gender</label>
                    <select
                      value={editBuffer.gender}
                      onChange={e => setEditBuffer(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
                    >
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Pronouns select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pronouns</label>
                    <select
                      value={editBuffer.pronouns}
                      onChange={e => setEditBuffer(prev => ({ ...prev, pronouns: e.target.value }))}
                      className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
                    >
                      {PRONOUN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Bio / About Me</label>
                    <textarea
                      value={editBuffer.bio}
                      placeholder="A little about you and your wellness journey..."
                      rows={3}
                      onChange={e => setEditBuffer(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                </>
              ) : (
                /* DISPLAY mode */
                <>
                  {[
                    { label: 'First Name', value: profileData.firstName || '—' },
                    { label: 'Last Name', value: profileData.lastName || '—' },
                    { label: 'Email', value: profileData.email || userProfile?.email || '—' },
                    { label: 'Date of Birth', value: profileData.dob || '—' },
                    { label: 'Gender', value: profileData.gender },
                    { label: 'Pronouns', value: profileData.pronouns },
                    { label: 'Phone', value: profileData.phone || '—' },
                    { label: 'Emergency Contact', value: profileData.emergencyContactName || '—' },
                    { label: 'Emergency Phone', value: profileData.emergencyContactPhone || '—' },
                  ].map(f => (
                    <div key={f.label} className="bg-gray-50 dark:bg-aura-black/50 rounded-xl p-4 border border-black/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{f.label}</p>
                      <p className="font-bold dark:text-white text-sm">{f.value}</p>
                    </div>
                  ))}
                  {profileData.bio && (
                    <div className="md:col-span-2 bg-gray-50 dark:bg-aura-black/50 rounded-xl p-4 border border-black/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Bio</p>
                      <p className="font-medium dark:text-gray-300 text-sm leading-relaxed">{profileData.bio}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONSENT SECTION ─────────────────────────────── */}
      {activeSection === 'consent' && (
        <div className="reveal-profile reveal space-y-4">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">policy</span>
              <h2 className="font-bold text-lg dark:text-white">Consent & Privacy Settings</h2>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-300">UPDATE</span>
            </div>
            <div className="p-8 space-y-4">
              {([
                { key: 'dataStorage', label: 'Secure Data Storage', desc: 'Allow Aurova to store your journal entries and profile data securely on our servers.', icon: 'database' },
                { key: 'aiAnalysis', label: 'AI Mood Analysis', desc: 'Allow our AI to analyze your journal and chat entries for emotional insights.', icon: 'psychology' },
                { key: 'communityVisible', label: 'Community Visibility', desc: 'Show your profile badge in the Community space for peer support.', icon: 'groups' },
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive wellness reminders and appointment updates via email.', icon: 'mail' },
                { key: 'crisisAlerts', label: 'Crisis Safety Alerts', desc: 'Enable safety response behavior when high-risk emotional content is detected.', icon: 'crisis_alert' },
                { key: 'dataExport', label: 'Data Export Rights', desc: 'Allow downloading a copy of your personal data at any time (GDPR compliance).', icon: 'download' },
              ] as Array<{ key: keyof ConsentSettings; label: string; desc: string; icon: string }>).map(item => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 p-5 rounded-2xl border-2 border-black/5 bg-gray-50 dark:bg-aura-black/30 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white">{item.label}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => handleConsentToggle(item.key)}
                    className={`relative flex-shrink-0 w-14 h-7 rounded-full border-2 border-black transition-all ${consent[item.key] ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-black shadow transition-all ${consent[item.key] ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY HISTORY (SEARCH + DISPLAY) ─────────── */}
      {activeSection === 'activity' && (
        <div className="reveal-profile reveal space-y-6">
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">history</span>
                <h2 className="font-bold text-lg dark:text-white">Activity History</h2>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-300">SEARCH · DISPLAY</span>
              </div>
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search journals by mood or content..."
                  className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="p-8">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Entries', value: journals.length, icon: 'edit_note', color: 'bg-card-yellow' },
                  { label: 'Moods Logged', value: [...new Set(journals.map(j => j.mood))].length, icon: 'mood', color: 'bg-card-blue' },
                  { label: 'Search Results', value: filteredJournals.length, icon: 'manage_search', color: 'bg-card-purple' },
                ].map(s => (
                  <div key={s.label} className={`${s.color} border-2 border-black rounded-2xl p-4 shadow-retro text-center`}>
                    <span className="material-symbols-outlined text-2xl text-black">{s.icon}</span>
                    <p className="text-3xl font-display font-bold text-black mt-1">{s.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Journal list */}
              {filteredJournals.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-gray-200 mb-4 block">search_off</span>
                  <p className="text-gray-400 font-medium">No entries match your search.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJournals.slice(0, 10).map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-4 p-4 rounded-2xl border-2 border-black/5 bg-gray-50 dark:bg-aura-black/30 hover:border-primary/20 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-base">edit_note</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-widest text-primary">{entry.mood}</span>
                          <span className="text-xs text-gray-400">· {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate">{entry.content.slice(0, 120)}{entry.content.length > 120 ? '...' : ''}</p>
                      </div>
                    </div>
                  ))}
                  {filteredJournals.length > 10 && (
                    <p className="text-center text-xs text-gray-400 font-bold pt-2">
                      Showing 10 of {filteredJournals.length} entries. Go to Journal to see all.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DANGER ZONE (DELETE) ─────────────────────────── */}
      {activeSection === 'danger' && (
        <div className="reveal-profile reveal space-y-6">
          {/* Account info */}
          <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-black flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">settings</span>
              <h2 className="font-bold text-lg dark:text-white">Account Settings</h2>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-aura-black/30 border-2 border-black/10 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Account Type</p>
                <p className="font-bold dark:text-white capitalize">{userProfile?.role || 'Standard'} Account</p>
              </div>
              <div className="bg-gray-50 dark:bg-aura-black/30 border-2 border-black/10 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">User ID</p>
                <p className="font-bold dark:text-white text-xs break-all">{userProfile?.id || '—'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-aura-black/30 border-2 border-black/10 rounded-2xl p-5 md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Member Since</p>
                <p className="font-bold dark:text-white">March 2026</p>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white dark:bg-card-dark border-2 border-red-500 rounded-[2rem] shadow-brutalist overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-red-500 flex items-center gap-3 bg-red-50 dark:bg-red-950/20">
              <span className="material-symbols-outlined text-red-500">warning</span>
              <h2 className="font-bold text-lg text-red-600">Danger Zone</h2>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-300">DELETE</span>
            </div>
            <div className="p-8">
              <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 rounded-2xl p-6">
                <h3 className="font-bold text-red-700 mb-2">Delete Account</h3>
                <p className="text-sm text-red-600/80 mb-6 leading-relaxed">
                  This will permanently delete your profile, journals, and all associated data. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-500 text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:bg-red-600 transition-all"
                  >
                    Request Account Deletion
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-red-700">
                      Type <span className="bg-red-100 px-2 py-0.5 rounded border border-red-300 font-mono">delete my account</span> to confirm:
                    </p>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={e => setDeleteInput(e.target.value)}
                      placeholder="delete my account"
                      className="w-full border-2 border-red-400 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-red-600 bg-white dark:bg-aura-black dark:text-white"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                        className="px-5 py-2.5 bg-gray-100 border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-5 py-2.5 bg-red-500 text-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-retro hover:bg-red-600 transition-all"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
