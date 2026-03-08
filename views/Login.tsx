import React, { useState } from 'react';
import { AppView } from '../types';
import { authService } from '../services/auth';

interface LoginProps {
  onNavigate: (view: AppView) => void;
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate, onLogin }) => {
  const [authType, setAuthType] = useState<'standard' | 'incognito' | 'specialist'>('standard');
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = authType === 'incognito'
        ? `${formData.identifier.replace(/\s+/g, '').toLowerCase()}@anonymous.aura`
        : formData.identifier;

      const data = await authService.login(email, formData.password);
      onLogin({ ...data.user });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const DEMO_ACCOUNTS = [
    { label: 'Doctor', type: 'specialist' as const, email: 'demo.doctor@aura.com', password: 'Demo@1234', color: 'bg-blue-600', icon: 'stethoscope', desc: 'Dr. Sanhitha' },
    { label: 'Patient', type: 'standard' as const, email: 'demo.patient@aura.com', password: 'Demo@1234', color: 'bg-primary', icon: 'person', desc: '25-day history' },
    { label: 'Anonymous', type: 'incognito' as const, email: 'shadowdemo@anonymous.aura', password: 'Demo@1234', color: 'bg-black', icon: 'sentiment_calm', desc: 'Incognito' },
  ];

  const ALL_ACCOUNTS = [
    { num: 1, email: 'demo.patient@aura.com', name: 'Demo Patient', role: 'Patient', color: 'bg-primary' },
    { num: 2, email: 'demo.doctor@aura.com', name: 'Dr. Sanhitha', role: 'Doctor', color: 'bg-blue-600' },
    { num: 3, email: 'shadowdemo@anonymous.aura', name: 'Shadow', role: 'Anon', color: 'bg-black' },
    { num: 4, email: 'patient1@aura.com', name: 'Sattar Sheikh', role: 'Patient', color: 'bg-green-600' },
    { num: 5, email: 'patient2@aura.com', name: 'Zara Mirza', role: 'Patient', color: 'bg-pink-500' },
    { num: 6, email: 'patient3@aura.com', name: 'Dev Sharma', role: 'Patient', color: 'bg-amber-600' },
    { num: 7, email: 'doctor1@aura.com', name: 'Dr. Sanhitha R.', role: 'Doctor', color: 'bg-indigo-600' },
    { num: 8, email: 'doctor2@aura.com', name: 'Dr. Arjun S.', role: 'Doctor', color: 'bg-cyan-600' },
  ];

  const handleQuickLogin = async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.login(email, 'Demo@1234');
      onLogin({ ...data.user });
    } catch {
      try {
        const isDoc = email.includes('doctor');
        const isAnon = email.includes('anonymous');
        await authService.signup(email, 'Demo@1234', email.split('@')[0], isDoc ? 'doctor' : isAnon ? 'anonymous' : 'user');
        const data = await authService.login(email, 'Demo@1234');
        onLogin({ ...data.user });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Login failed. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[number]) => {
    setError(null);
    setLoading(true);
    setAuthType(account.type);
    setFormData({ identifier: account.email, password: account.password });
    try {
      // Try login first
      const data = await authService.login(account.email, account.password);
      onLogin({ ...data.user });
    } catch {
      // Account doesn't exist yet — auto-register then login
      try {
        const roleMap = { specialist: 'doctor', standard: 'user', incognito: 'anonymous' } as const;
        const nameMap = { specialist: 'Dr. Demo', standard: 'Demo Patient', incognito: 'Shadow Demo' } as const;
        await authService.signup(account.email, account.password, nameMap[account.type], roleMap[account.type]);
        const data = await authService.login(account.email, account.password);
        onLogin({ ...data.user });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Could not create demo account. Check server connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { signInWithGoogle } = await import('../services/firebaseClient');
      const idToken = await signInWithGoogle();
      const roleMap = { standard: 'user', specialist: 'doctor', incognito: 'anonymous' };
      const data = await authService.googleAuth(idToken, roleMap[authType]);
      onLogin({ ...data.user });
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-4 flex flex-col items-center min-h-screen">
      <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-4 tracking-tight text-center">
        Welcome <span className="text-primary italic">Back.</span>
      </h1>
      <p className="text-gray-500 mb-12 font-medium">Continue your journey where you left off.</p>

      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Identity Selector */}
        <div className="flex flex-wrap bg-white dark:bg-aura-black border-2 border-black rounded-2xl p-1 shadow-retro">
          <button
            type="button"
            onClick={() => setAuthType('standard')}
            className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${authType === 'standard' ? 'bg-primary text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => setAuthType('incognito')}
            className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${authType === 'incognito' ? 'bg-black text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            Anonymous
          </button>
          <button
            type="button"
            onClick={() => setAuthType('specialist')}
            className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${authType === 'specialist' ? 'bg-blue-600 text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            Doctor
          </button>
        </div>

        {/* Google Quick Login (Not for Doctors) */}
        {authType !== 'specialist' && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 py-4 bg-white dark:bg-card-dark border-2 border-black rounded-xl font-bold shadow-retro hover:translate-y-[-2px] transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span>Login with Google</span>
          </button>
        )}

        {/* ── Quick Demo Login ── */}
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-3xl p-5 shadow-retro">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">bolt</span> Quick Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.label}
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin(acc)}
                className={`${acc.color} text-white flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 border-black shadow-retro hover:translate-y-[-2px] active:translate-y-0 transition-all text-center disabled:opacity-50`}
              >
                <span className="material-symbols-outlined text-xl">{acc.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{acc.label}</span>
                <span className="text-[8px] opacity-75 font-medium leading-tight">{acc.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
            Demo accounts are pre-seeded for evaluation. Credentials auto-fill and sign you in.
          </p>
          <div className="mt-4 pt-4 border-t border-black/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-2">All Seeded Accounts — 1 Click</p>
            <div className="grid grid-cols-4 gap-1.5">
              {ALL_ACCOUNTS.map(acc => (
                <button
                  key={acc.num}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc.email)}
                  className={`${acc.color} text-white rounded-xl py-2 px-1 text-center border border-black/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50`}
                >
                  <span className="text-lg font-black block leading-none">{acc.num}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider opacity-80 block mt-0.5 truncate">{acc.name.split(' ')[0]}</span>
                  <span className="text-[6px] font-bold uppercase tracking-widest opacity-50 block">{acc.role}</span>
                </button>
              ))}
            </div>
            <p className="text-[8px] text-gray-300 mt-2 text-center">Password for all: Demo@1234</p>
          </div>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="h-0.5 flex-grow bg-black/10 dark:bg-white/10"></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">OR USE CREDENTIALS</span>
          <div className="h-0.5 flex-grow bg-black/10 dark:bg-white/10"></div>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-3xl p-8 md:p-10 shadow-retro">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                {authType === 'standard' ? 'Email or Username' : authType === 'specialist' ? 'Doctor ID / Email' : 'Secret Nickname'}
              </label>
              <input
                type="text"
                required
                value={formData.identifier}
                onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                placeholder={authType === 'standard' ? 'your@email.com' : authType === 'specialist' ? 'dr.name@clinic.com' : 'Your_Shadow_ID'}
                className="w-full h-14 px-5 rounded-xl border-2 border-black focus:ring-0 focus:border-primary bg-white dark:bg-aura-black text-black dark:text-white transition-colors shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full h-14 px-5 rounded-xl border-2 border-black focus:ring-0 focus:border-primary bg-white dark:bg-aura-black text-black dark:text-white transition-colors shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => onNavigate(AppView.FORGOT_PASSWORD)} className="text-sm font-bold text-gray-400 hover:text-primary transition-colors">
                Forgot password?
              </button>
            </div>

            <div className="mt-4 pt-6 border-t border-gray-100 flex flex-col items-center gap-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 font-bold rounded-xl border-2 border-black shadow-retro hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${authType === 'standard' ? 'bg-primary text-white' : authType === 'specialist' ? 'bg-blue-600 text-white shadow-retro' : 'bg-black text-white'}`}
              >
                <span>{loading ? 'Processing...' : (authType === 'standard' ? 'Sign In' : authType === 'specialist' ? 'Doctor Dashboard Login' : 'Unlock Identity')}</span>
                {!loading && <span className="material-symbols-outlined">{authType === 'standard' ? 'login' : authType === 'specialist' ? 'clinical_notes' : 'key'}</span>}
                {loading && <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>}
              </button>
              <div className="text-gray-500 font-medium text-center">
                {authType === 'specialist' ? "Not a doctor yet? " : "Don't have an account? "}
                <button type="button" onClick={() => onNavigate(AppView.SIGNUP)} className="text-primary font-bold hover:underline">
                  {authType === 'specialist' ? "Register here" : "Join Now"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
