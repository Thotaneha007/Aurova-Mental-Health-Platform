
import React, { useState, useEffect, useMemo } from 'react';
import { authService } from './services/auth';
import { journalService } from './services/journalService';
import { AppView, JournalEntry, Message, UserProfile, UserRole } from './types';
import Landing from './views/Landing';
import Dashboard from './views/Dashboard';
import DoctorDashboard from './views/DoctorDashboard';
import Journal from './views/Journal';
import Chat from './views/Chat';
import Reports from './views/Reports';
import Community from './views/Community';
import Experts from './views/Experts';
import WellnessHub from './views/WellnessHub';
import SoulFeed from './views/SoulFeed';
import Login from './views/Login';
import Signup from './views/Signup';
import ForgotPassword from './views/ForgotPassword';
import CheckEmail from './views/CheckEmail';
import ResetPassword from './views/ResetPassword';
import Navbar from './components/Navbar';
import UserProfileView from './views/UserProfile';
import BookingManagement from './views/BookingManagement';
import ConsultationForm from './views/ConsultationForm';
import WellnessPreferenceForm from './views/WellnessPreferenceForm';
import MoodTracker from './views/MoodTracker';
import BreathworkLogForm from './views/BreathworkLogForm';
import RoutineProgressForm from './views/RoutineProgressForm';
import SoulFeedInteractForm from './views/SoulFeedInteractForm';
import DoctorProfileForm from './views/DoctorProfileForm';
import ClinicalFormTemplate from './views/ClinicalFormTemplate';
import ConsultationNotes from './views/ConsultationNotes';
import AvailabilitySlots from './views/AvailabilitySlots';
import PatientIntakeReview from './views/PatientIntakeReview';
import DoctorReports from './views/DoctorReports';
import MoodForm from './views/MoodForm';
import BookingPage from './views/BookingPage';
import PatientMoodForm from './views/PatientMoodForm';
import DoctorMoodInquiry from './views/DoctorMoodInquiry';

const BackgroundAtmosphere: React.FC = () => {
  const elements = useMemo(() => {
    const stars = Array.from({ length: 30 }).map((_, i) => ({
      id: `star-${i}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${3 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      size: `${1 + Math.random() * 3}px`
    }));

    const sparkles = Array.from({ length: 15 }).map((_, i) => ({
      id: `sparkle-${i}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${5 + Math.random() * 5}s`,
      delay: `${Math.random() * 10}s`,
      size: `${15 + Math.random() * 25}px`
    }));

    const bubbles = Array.from({ length: 10 }).map((_, i) => ({
      id: `bubble-${i}`,
      left: `${Math.random() * 100}%`,
      duration: `${15 + Math.random() * 15}s`,
      delay: `${Math.random() * 20}s`,
      size: `${40 + Math.random() * 100}px`
    }));

    return { stars, sparkles, bubbles };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
      {elements.stars.map((s) => (
        <div
          key={s.id}
          className="absolute bg-primary rounded-full anim-twinkle opacity-30"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            '--dur': s.duration,
            animationDelay: s.delay
          } as any}
        />
      ))}
      {elements.sparkles.map((sp) => (
        <span
          key={sp.id}
          className="absolute material-symbols-outlined text-secondary anim-sparkle select-none"
          style={{
            left: sp.left,
            top: sp.top,
            fontSize: sp.size,
            '--dur': sp.duration,
            animationDelay: sp.delay
          } as any}
        >
          auto_awesome
        </span>
      ))}
      {elements.bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute border-2 border-primary/10 rounded-full anim-bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            '--dur': b.duration,
            animationDelay: b.delay
          } as any}
        />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const fetchJournals = async () => {
    try {
      const data = await journalService.getEntries();
      const formatted = data.map((entry: any) => ({
        id: entry._id,
        date: entry.createdAt,
        content: entry.content,
        mood: entry.aiAnalysis?.mood || 'Neutral',
        analysis: entry.aiAnalysis ? JSON.stringify(entry.aiAnalysis) : undefined
      }));
      setJournals(formatted);
    } catch (err) {
      console.error("Failed to fetch journals:", err);
    }
  };

  useEffect(() => {
    // Check auth state
    const user = authService.getCurrentUser();
    const token = authService.getToken();
    if (user && token) {
      setIsLoggedIn(true);
      setUserProfile(user);
      fetchJournals();

      // Redirect based on role if currently at landing or auth views
      if (currentView === AppView.LANDING || isAuthView) {
        const isDoc = user.role === 'doctor';
        setCurrentView(isDoc ? AppView.DOCTOR_DASHBOARD : AppView.DASHBOARD);
      }
    }
  }, []);

  const saveJournal = (entry: JournalEntry) => {
    setJournals(prev => [entry, ...prev]);
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  const handleLogin = (user: any) => {
    setIsLoggedIn(true);
    setUserProfile(user);
    if (user.role !== 'doctor') {
      fetchJournals();
    }
    const isDoc = user.role === 'doctor';
    setCurrentView(isDoc ? AppView.DOCTOR_DASHBOARD : AppView.DASHBOARD);
  };

  const handleSignup = (user: any) => {
    setIsLoggedIn(true);
    setUserProfile(user);
    if (user.role !== 'doctor') {
      setJournals([]); // New user, empty journals
    }
    const isDoc = user.role === 'doctor';
    setCurrentView(isDoc ? AppView.DOCTOR_DASHBOARD : AppView.DASHBOARD);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUserProfile(null);
    setJournals([]);
    setCurrentView(AppView.LANDING);
  };

  useEffect(() => {
    (window as any).handleLogout = handleLogout;
    return () => {
      delete (window as any).handleLogout;
    };
  }, []);

  const isAuthView = [AppView.LOGIN, AppView.SIGNUP, AppView.FORGOT_PASSWORD, AppView.CHECK_EMAIL, AppView.RESET_PASSWORD].includes(currentView);
  const isProtectedView = [
    AppView.DASHBOARD,
    AppView.DOCTOR_DASHBOARD,
    AppView.JOURNAL,
    AppView.CHAT,
    AppView.REPORTS,
    AppView.COMMUNITY,
    AppView.EXPERTS,
    AppView.RESOURCES,
    AppView.SOUL_FEED,
    AppView.USER_PROFILE,
    AppView.JOURNAL_CRUD,
    AppView.BOOKING_MANAGEMENT,
    AppView.CONSULTATION_FORM,
    AppView.WELLNESS_PREFERENCE,
    AppView.MOOD_TRACKER,
    AppView.BREATHWORK_LOG,
    AppView.ROUTINE_PROGRESS,
    AppView.SOULFEED_INTERACT,
    AppView.DOCTOR_PROFILE_FORM,
    AppView.CLINICAL_FORM_TEMPLATE,
    AppView.CONSULTATION_NOTES,
    AppView.AVAILABILITY_SLOTS,
    AppView.PATIENT_INTAKE_REVIEW,
    AppView.DOCTOR_REPORTS,
    AppView.MOOD_MANAGEMENT,
    AppView.BOOKING_PAGE
  ].includes(currentView);

  const renderView = () => {
    switch (currentView) {
      case AppView.LANDING:
        return <Landing
          onStart={() => handleNavigate(AppView.SIGNUP)}
          onNavigate={handleNavigate}
        />;
      case AppView.DASHBOARD:
        if (userProfile?.role === 'doctor') {
          return <DoctorDashboard name={userProfile?.displayName || userProfile?.name || "Doctor"} onNavigate={handleNavigate} />;
        }
        return <Dashboard
          journals={journals}
          onNavigate={handleNavigate}
          isLoggedIn={isLoggedIn}
        />;
      case AppView.DOCTOR_DASHBOARD:
        if (userProfile?.role !== 'doctor') {
          return <Landing onStart={() => handleNavigate(AppView.SIGNUP)} onNavigate={handleNavigate} />;
        }
        return <DoctorDashboard name={userProfile?.displayName || userProfile?.name || "Doctor"} onNavigate={handleNavigate} />;
      case AppView.JOURNAL:
      case AppView.JOURNAL_CRUD:
        return <Journal onSave={saveJournal} onBack={() => handleNavigate(AppView.DASHBOARD)} isLoggedIn={isLoggedIn} onAuthRequired={() => handleNavigate(AppView.SIGNUP)} />;
      case AppView.CHAT:
        return <Chat history={chatHistory} setHistory={setChatHistory} onBack={() => handleNavigate(AppView.DASHBOARD)} isLoggedIn={isLoggedIn} onAuthRequired={() => handleNavigate(AppView.SIGNUP)} />;
      case AppView.REPORTS:
        return <Reports journals={journals} onBack={() => handleNavigate(AppView.DASHBOARD)} isLoggedIn={isLoggedIn} onAuthRequired={() => handleNavigate(AppView.SIGNUP)} />;
      case AppView.COMMUNITY:
        return <Community
          userRole={userProfile?.role}
          onBack={() => handleNavigate(userProfile?.role === 'doctor' ? AppView.DOCTOR_DASHBOARD : AppView.DASHBOARD)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.EXPERTS:
        return <Experts onBack={() => handleNavigate(AppView.DASHBOARD)} isLoggedIn={isLoggedIn} onAuthRequired={() => handleNavigate(AppView.SIGNUP)} />;
      case AppView.RESOURCES:
        return <WellnessHub onBack={() => handleNavigate(AppView.DASHBOARD)} isLoggedIn={isLoggedIn} onNavigate={handleNavigate} />;
      case AppView.SOUL_FEED:
        return <SoulFeed onBack={() => handleNavigate(AppView.DASHBOARD)} onNavigate={handleNavigate} />;
      case AppView.USER_PROFILE:
        return <UserProfileView
          onBack={() => handleNavigate(AppView.DASHBOARD)}
          onNavigate={handleNavigate}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
          userProfile={userProfile}
          journals={journals}
        />;
      case AppView.WELLNESS_PREFERENCE:
        return <WellnessPreferenceForm
          onBack={() => handleNavigate(AppView.RESOURCES)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.MOOD_TRACKER:
        return <MoodTracker
          onBack={() => handleNavigate(AppView.RESOURCES)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.BREATHWORK_LOG:
        return <BreathworkLogForm
          onBack={() => handleNavigate(AppView.RESOURCES)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.ROUTINE_PROGRESS:
        return <RoutineProgressForm
          onBack={() => handleNavigate(AppView.RESOURCES)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.SOULFEED_INTERACT:
        return <SoulFeedInteractForm
          onBack={() => handleNavigate(AppView.SOUL_FEED)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.BOOKING_MANAGEMENT:
        return <BookingManagement
          onBack={() => handleNavigate(AppView.EXPERTS)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.CONSULTATION_FORM:
        return <ConsultationForm
          onBack={() => handleNavigate(AppView.BOOKING_MANAGEMENT)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.DOCTOR_PROFILE_FORM:
        return <DoctorProfileForm onBack={() => handleNavigate(AppView.DOCTOR_DASHBOARD)} />;
      case AppView.CLINICAL_FORM_TEMPLATE:
        return <ClinicalFormTemplate onBack={() => handleNavigate(AppView.DOCTOR_DASHBOARD)} />;
      case AppView.CONSULTATION_NOTES:
        return <ConsultationNotes onBack={() => handleNavigate(AppView.DOCTOR_DASHBOARD)} />;
      case AppView.AVAILABILITY_SLOTS:
        return <AvailabilitySlots onBack={() => handleNavigate(AppView.DOCTOR_DASHBOARD)} />;
      case AppView.PATIENT_INTAKE_REVIEW:
        return <PatientIntakeReview onBack={() => handleNavigate(AppView.DOCTOR_DASHBOARD)} />;
      case AppView.DOCTOR_REPORTS:
        return <DoctorReports onBack={() => handleNavigate(AppView.DOCTOR_DASHBOARD)} />;
      case AppView.MOOD_MANAGEMENT:
        return <MoodForm />;
      case AppView.PATIENT_MOOD_FORM:
        return <PatientMoodForm
          onBack={() => handleNavigate(AppView.DASHBOARD)}
          isLoggedIn={isLoggedIn}
          onAuthRequired={() => handleNavigate(AppView.SIGNUP)}
        />;
      case AppView.DOCTOR_MOOD_INQUIRY:
        return <DoctorMoodInquiry onBack={() => handleNavigate(AppView.DOCTOR_DASHBOARD)} />;
      case AppView.BOOKING_PAGE:
        return <BookingPage />;
      case AppView.LOGIN:
        return <Login onNavigate={handleNavigate} onLogin={handleLogin} />;
      case AppView.SIGNUP:
        return <Signup onNavigate={handleNavigate} onSignup={handleLogin} />;
      case AppView.FORGOT_PASSWORD:
        return <ForgotPassword onNavigate={handleNavigate} />;
      case AppView.CHECK_EMAIL:
        return <CheckEmail onNavigate={handleNavigate} />;
      case AppView.RESET_PASSWORD:
        return <ResetPassword onNavigate={handleNavigate} />;
      default:
        return <Landing
          onStart={() => handleNavigate(AppView.SIGNUP)}
          onNavigate={handleNavigate}
        />;
    }
  };

  const navIconClass = (view: AppView) => `p-3 rounded-xl transition-all flex items-center justify-center ${currentView === view ? 'text-primary scale-110' : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`;

  const hideAtmosphere = [AppView.CHAT, AppView.EXPERTS, AppView.COMMUNITY].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col relative">
      {!hideAtmosphere && <BackgroundAtmosphere />}
      <Navbar currentView={currentView} onNavigate={handleNavigate} isLoggedIn={isLoggedIn} userRole={userProfile?.role} />

      <main className="flex-grow relative z-10 pt-20">
        {renderView()}

        {!isLoggedIn && isProtectedView && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
            <div className="bg-primary text-white px-6 py-2 rounded-full border-2 border-black font-bold shadow-retro flex items-center gap-2 pointer-events-auto">
              <span className="material-symbols-outlined text-sm">info</span>
              Sample View: Sign up for a Standard or Anonymous account to save data!
            </div>
          </div>
        )}
      </main>

      {isLoggedIn && !isAuthView && currentView !== AppView.LANDING && currentView !== AppView.CHAT && userProfile?.role !== 'doctor' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-lg">
          <div className="bg-black border-4 border-black p-1.5 rounded-[2.5rem] shadow-brutalist flex items-stretch gap-1.5 h-20 overflow-hidden">
            {/* Standard Tools Group */}
            <div className="bg-white dark:bg-card-dark flex-grow rounded-[2rem] flex items-center justify-around px-2 border-2 border-black/10">
              <button onClick={() => handleNavigate(AppView.JOURNAL)} title="Journal" className={navIconClass(AppView.JOURNAL)}>
                <span className="material-icons-outlined text-xl">edit_note</span>
              </button>
              <button onClick={() => handleNavigate(AppView.CHAT)} title="Chat" className={navIconClass(AppView.CHAT)}>
                <span className="material-icons-outlined text-xl">forum</span>
              </button>
              <button onClick={() => handleNavigate(AppView.DASHBOARD)} title="Home" className={navIconClass(AppView.DASHBOARD)}>
                <span className="material-icons-outlined text-xl">grid_view</span>
              </button>
              <button onClick={() => handleNavigate(AppView.SOUL_FEED)} title="Soul Feed" className={navIconClass(AppView.SOUL_FEED)}>
                <span className="material-symbols-outlined text-xl font-bold">play_circle</span>
              </button>
              <button onClick={() => handleNavigate(AppView.COMMUNITY)} title="Community" className={navIconClass(AppView.COMMUNITY)}>
                <span className="material-icons-outlined text-xl">groups</span>
              </button>
              <button onClick={() => handleNavigate(AppView.USER_PROFILE)} title="My Profile" className={navIconClass(AppView.USER_PROFILE)}>
                <span className="material-symbols-outlined text-xl">manage_accounts</span>
              </button>
              <button onClick={() => handleNavigate(AppView.MOOD_MANAGEMENT)} title="Mood Manager" className={navIconClass(AppView.MOOD_MANAGEMENT)}>
                <span className="material-icons-outlined text-xl">mood</span>
              </button>
              <button onClick={() => handleNavigate(AppView.PATIENT_MOOD_FORM)} title="Mood Assessment" className={navIconClass(AppView.PATIENT_MOOD_FORM)}>
                <span className="material-symbols-outlined text-xl">monitor_heart</span>
              </button>
              <button onClick={() => handleNavigate(AppView.BOOKING_PAGE)} title="Book Consultation" className={navIconClass(AppView.BOOKING_PAGE)}>
                <span className="material-icons-outlined text-xl">calendar_month</span>
              </button>
            </div>

            {/* Specialist Highlight Block */}
            <button
              onClick={() => handleNavigate(AppView.EXPERTS)}
              title="Aurova Specialists"
              className={`flex-[0.6] min-w-[90px] bg-primary text-white rounded-[1.8rem] border-2 border-black flex items-center justify-center gap-2 shadow-brutalist-sm hover:translate-y-[-2px] transition-all group overflow-hidden ${currentView === AppView.EXPERTS ? 'brightness-110' : ''}`}
            >
              <span className="material-symbols-outlined text-2xl font-black group-hover:rotate-12 transition-transform">stethoscope</span>
              <div className="h-6 w-[2px] bg-white/30 rounded-full mx-1"></div>
              <span className="material-symbols-outlined text-lg">menu</span>
            </button>

            {/* Extra Utility Block */}
            <button
              onClick={() => handleNavigate(AppView.RESOURCES)}
              title="Wellness Hub"
              className={`w-14 rounded-[1.8rem] bg-white dark:bg-card-dark border-2 border-black flex items-center justify-center hover:bg-gray-100 transition-all ${currentView === AppView.RESOURCES ? 'text-primary' : 'text-black dark:text-white'}`}
            >
              <span className="material-symbols-outlined text-xl">psychology_alt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
