
import React from 'react';
import { AppView, UserRole } from '../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isLoggedIn: boolean;
  userRole?: UserRole;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, isLoggedIn, userRole }) => {
  const isActive = (view: AppView) => currentView === view;

  const linkClasses = (view: AppView) => {
    const active = isActive(view);
    return `text-xs font-bold uppercase tracking-widest transition-all relative py-2 ${active
        ? 'text-black dark:text-white'
        : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white'
      }`;
  };

  const activeIndicator = (view: AppView) => isActive(view) && (
    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-left-1 duration-300"></span>
  );

  return (
    <nav className="fixed w-full z-[60] bg-aura-cream/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate(AppView.LANDING)}
          >
            <div className="bg-primary text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-black">
              <span className="material-symbols-outlined text-lg font-bold">spa</span>
            </div>
            <span className="text-2xl font-display font-bold text-black dark:text-white tracking-tight group-hover:text-primary transition-colors">aura</span>
          </div>

          <div className="hidden md:flex space-x-10 items-center">
            {isLoggedIn ? (
              userRole === 'doctor' ? (
                <>
                  <button onClick={() => onNavigate(AppView.DOCTOR_DASHBOARD)} className={linkClasses(AppView.DOCTOR_DASHBOARD)}>
                    Panel {activeIndicator(AppView.DOCTOR_DASHBOARD)}
                  </button>
                  <button onClick={() => onNavigate(AppView.COMMUNITY)} className={linkClasses(AppView.COMMUNITY)}>
                    Circle Support {activeIndicator(AppView.COMMUNITY)}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onNavigate(AppView.DASHBOARD)} className={linkClasses(AppView.DASHBOARD)}>
                    Home {activeIndicator(AppView.DASHBOARD)}
                  </button>
                  <button onClick={() => onNavigate(AppView.COMMUNITY)} className={linkClasses(AppView.COMMUNITY)}>
                    Circle Support {activeIndicator(AppView.COMMUNITY)}
                  </button>
                  <button onClick={() => onNavigate(AppView.EXPERTS)} className={linkClasses(AppView.EXPERTS)}>
                    Experts {activeIndicator(AppView.EXPERTS)}
                  </button>
                  <button onClick={() => onNavigate(AppView.REPORTS)} className={linkClasses(AppView.REPORTS)}>
                    Reports {activeIndicator(AppView.REPORTS)}
                  </button>
                  <button onClick={() => onNavigate(AppView.USER_PROFILE)} className={linkClasses(AppView.USER_PROFILE)}>
                    Profile {activeIndicator(AppView.USER_PROFILE)}
                  </button>
                </>
              )
            ) : (
              <>
                <button onClick={() => onNavigate(AppView.COMMUNITY)} className={linkClasses(AppView.COMMUNITY)}>
                  Circle Support {activeIndicator(AppView.COMMUNITY)}
                </button>
                <button onClick={() => onNavigate(AppView.EXPERTS)} className={linkClasses(AppView.EXPERTS)}>
                  Experts {activeIndicator(AppView.EXPERTS)}
                </button>
                <button onClick={() => onNavigate(AppView.DASHBOARD)} className={linkClasses(AppView.DASHBOARD)}>
                  Dashboard {activeIndicator(AppView.DASHBOARD)}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => document.documentElement.classList.toggle('dark')}
            >
              <span className="material-icons-outlined dark:hidden">dark_mode</span>
              <span className="material-icons-outlined hidden dark:block">light_mode</span>
            </button>

            <div className="flex items-center gap-2">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => onNavigate(AppView.LOGIN)}
                    className={`hidden md:block px-6 py-2 rounded-lg border-2 border-black font-bold text-sm transition-all ${isActive(AppView.LOGIN) ? 'bg-black text-white' : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onNavigate(AppView.SIGNUP)}
                    className="bg-primary text-white px-6 py-2 rounded-lg border-2 border-black font-bold shadow-retro hover:shadow-retro-hover hover:-translate-y-0.5 transition-all duration-200 text-sm"
                  >
                    Join now
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate(userRole === 'doctor' ? AppView.DOCTOR_DASHBOARD : AppView.DASHBOARD)}
                    className="bg-primary text-white px-6 py-2 rounded-lg border-2 border-black font-bold shadow-retro hover:shadow-retro-hover hover:-translate-y-0.5 transition-all duration-200 text-sm"
                  >
                    {userRole === 'doctor' ? 'Panel' : 'My Space'}
                  </button>
                  <button
                    onClick={() => (window as any).handleLogout?.()}
                    className="p-2 rounded-lg border-2 border-black font-bold text-sm bg-white dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shadow-retro hover:shadow-retro-hover"
                    title="Logout"
                  >
                    <span className="material-icons-outlined">logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
