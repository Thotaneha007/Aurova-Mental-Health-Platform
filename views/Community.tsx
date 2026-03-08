
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole } from '../types';

interface CommunityProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
  userRole?: UserRole;
}

interface Circle {
  id: number;
  name: string;
  tag: string;
  members: number;
  membersDisplay: string;
  color: string;
  icon: string;
  desc: string;
  dailyFocus: string;
}

const Community: React.FC<CommunityProps> = ({ onBack, isLoggedIn, onAuthRequired, userRole }) => {
  const [joinedCircleIds, setJoinedCircleIds] = useState<number[]>([]);
  const [activeCircleId, setActiveCircleId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sortBy, setSortBy] = useState<'members' | 'name' | 'default'>('default');
  const [likedMessages, setLikedMessages] = useState<number[]>([]);

  // Initial reveal animations
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal-comm').forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 100);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [activeCircleId, sortBy]);

  const circles: Circle[] = [
    { id: 1, name: 'Anxiety Warriors', tag: 'Fear & Panic', members: 4200, membersDisplay: '4.2k', color: 'bg-aura-cream', icon: 'cyclone', desc: 'A shield against the storm. Share grounding techniques and find calm in the collective.', dailyFocus: 'Techniques for tackling 3 AM panic.' },
    { id: 2, name: 'Healing From Heartbreak', tag: 'Relationships', members: 8900, membersDisplay: '8.9k', color: 'bg-primary', icon: 'heart_broken', desc: 'Moving from loss to love. A safe harbor for those rediscovering their worth after an ending.', dailyFocus: 'Finding "me" after "we".' },
    { id: 3, name: 'Burnout Recovery', tag: 'Work & Life', members: 5600, membersDisplay: '5.6k', color: 'bg-card-purple', icon: 'battery_0_bar', desc: 'Recharging the soul. Professionals and students battling chronic exhaustion and finding boundaries.', dailyFocus: 'The power of saying "No" today.' },
    { id: 4, name: 'Morning Motivation', tag: 'Depression', members: 3100, membersDisplay: '3.1k', color: 'bg-secondary', icon: 'light_mode', desc: 'Just getting out of bed is a victory. Celebrate the small wins that others might miss.', dailyFocus: 'What one small thing did you do for yourself?' },
    { id: 6, name: 'Shadow Seeker Hub', tag: 'Anonymous Therapy', members: 2400, membersDisplay: '2.4k', color: 'bg-card-blue', icon: 'visibility_off', desc: 'Total anonymity for those not ready to be seen. Healing in the silence of shared understanding.', dailyFocus: 'Open floor: What are you carrying?' }
  ];

  const sortedCircles = useMemo(() => {
    let result = [...circles];
    if (sortBy === 'members') {
      result.sort((a, b) => b.members - a.members);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [sortBy]);

  const handleJoinOrEnter = (circleId: number) => {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }
    
    if (!joinedCircleIds.includes(circleId)) {
      setJoinedCircleIds(prev => [...prev, circleId]);
    }
    setActiveCircleId(circleId);
  };

  const activeCircle = useMemo(() => circles.find(c => c.id === activeCircleId), [activeCircleId]);
  const joinedCircles = useMemo(() => circles.filter(c => joinedCircleIds.includes(c.id)), [joinedCircleIds]);

  // Mock messages for chat
  const mockMessages = [
    { id: 1, user: 'Brave_Soul_4', role: 'user', text: 'Struggled to leave the house today, but I managed to walk to the porch. Small wins.', time: '10:24 AM' },
    { id: 2, user: 'Dr. Sharma', role: 'doctor', text: 'That is a huge victory, Brave_Soul_4. Consistency matters more than distance.', time: '10:30 AM' },
    { id: 3, user: 'Quiet_River', role: 'user', text: 'Anyone else feel that weight in their chest on Sunday nights?', time: '10:32 AM' },
    { id: 4, user: 'TENA AI', role: 'ai', text: 'You are experiencing "Sunday Scaries", Quiet_River. Try a 5-minute grounding flow in the Soul Hub.', time: '10:33 AM' },
  ];

  const toggleLike = (id: number) => {
    setLikedMessages(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (activeCircleId && activeCircle) {
    return (
      <div className="pt-24 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex gap-8">
        {/* Sidebar for Ongoing Support */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-card-dark border-2 border-black rounded-[3rem] p-6 shadow-brutalist reveal-comm reveal-left overflow-hidden">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 px-2">Your Circles</h3>
          <div className="space-y-4 overflow-y-auto no-scrollbar">
            {joinedCircles.map(c => (
              <button 
                key={c.id} 
                onClick={() => setActiveCircleId(c.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${activeCircleId === c.id ? 'bg-primary border-black shadow-retro translate-x-1' : 'bg-transparent border-transparent hover:border-black/10'}`}
              >
                <div className={`w-10 h-10 rounded-xl border border-black flex items-center justify-center shrink-0 ${c.color} group-hover:rotate-12 transition-transform`}>
                   <span className="material-symbols-outlined text-black text-sm">{c.icon}</span>
                </div>
                <div className="text-left overflow-hidden">
                  <p className={`font-bold text-sm truncate ${activeCircleId === c.id ? 'text-white' : 'text-black dark:text-white'}`}>{c.name}</p>
                  <p className={`text-[8px] uppercase font-bold ${activeCircleId === c.id ? 'text-white/70' : 'text-gray-400'}`}>12+ New Shares</p>
                </div>
              </button>
            ))}
            <button 
              onClick={() => setActiveCircleId(null)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary transition-all text-gray-400 hover:text-primary mt-4"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span className="text-xs font-bold uppercase">Find More</span>
            </button>
          </div>
        </aside>

        {/* Main Chat Interface */}
        <main className="flex-grow flex flex-col bg-white dark:bg-card-dark border-2 border-black rounded-[4rem] shadow-brutalist overflow-hidden reveal-comm reveal">
          {/* Header */}
          <div className={`p-8 border-b-2 border-black flex items-center justify-between ${activeCircle.color}`}>
            <div className="flex items-center gap-6">
              <button onClick={() => setActiveCircleId(null)} className="lg:hidden w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-brutalist-sm">
                <span className="material-symbols-outlined text-black">arrow_back</span>
              </button>
              <div className="w-16 h-16 bg-white border-2 border-black rounded-3xl flex items-center justify-center shadow-brutalist-sm rotate-3">
                 <span className="material-symbols-outlined text-3xl text-black">{activeCircle.icon}</span>
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold text-black">{activeCircle.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">{activeCircle.membersDisplay} Healing Together</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex flex-col items-end">
               <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl border border-black/5">
                  <span className="material-symbols-outlined text-xs">tips_and_updates</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">Daily Focus: {activeCircle.dailyFocus}</span>
               </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-grow overflow-y-auto p-8 space-y-10 no-scrollbar bg-aura-cream/30 dark:bg-black/20">
            <div className="text-center py-6">
               <div className="inline-flex items-center gap-2 bg-aura-black text-white px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.3em] border-2 border-primary animate-pulse">
                  <span className="material-symbols-outlined text-[12px]">shield</span>
                  Safe Anonymous Sanctuary
               </div>
            </div>
            
            {mockMessages.map((m, i) => {
              const isDoctor = m.role === 'doctor';
              const isAI = m.role === 'ai';
              const isLiked = likedMessages.includes(m.id);

              return (
                <div key={m.id} className={`reveal-comm reveal-left flex flex-col gap-2 ${isDoctor ? 'items-center lg:items-start' : ''}`} style={{ transitionDelay: `${i * 100}ms` }}>
                   <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${isDoctor ? 'text-blue-600' : isAI ? 'text-primary' : 'text-gray-400'}`}>
                        {m.user} {isDoctor && '(Verified Moderator)'} {isAI && '(Digital Guardian)'}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold">{m.time}</span>
                   </div>
                   <div className={`relative bg-white dark:bg-white/5 border-2 border-black p-6 rounded-[2.5rem] shadow-brutalist-sm max-w-2xl group ${isDoctor ? 'border-blue-500' : isAI ? 'border-primary' : ''}`}>
                      <p className={`text-sm dark:text-gray-200 leading-relaxed font-medium ${isAI ? 'italic' : ''}`}>
                        {m.text}
                      </p>
                      
                      {/* Interaction Bar */}
                      <div className="absolute -bottom-4 right-6 flex gap-2">
                        <button 
                          onClick={() => toggleLike(m.id)}
                          className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center transition-all ${isLiked ? 'bg-primary text-white scale-110 rotate-12 shadow-retro' : 'bg-white hover:bg-gray-100'}`}
                        >
                           <span className="material-symbols-outlined text-sm font-bold">{isLiked ? 'favorite' : 'volunteer_activism'}</span>
                        </button>
                        {userRole === 'doctor' && !isDoctor && (
                          <button className="w-10 h-10 rounded-xl border-2 border-black bg-blue-500 text-white flex items-center justify-center shadow-brutalist-sm hover:translate-y-[-2px] transition-all">
                             <span className="material-symbols-outlined text-sm font-bold">verified</span>
                          </button>
                        )}
                      </div>
                   </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-8 border-t-2 border-black bg-white dark:bg-card-dark">
            <div className="relative group">
              <input 
                type="text" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={userRole === 'doctor' ? "Share professional guidance..." : "Speak your heart, anonymously..."}
                className="w-full h-16 bg-aura-cream dark:bg-white/5 border-2 border-black rounded-2xl px-6 pr-20 font-medium text-black dark:text-white focus:ring-0 focus:border-primary transition-all shadow-brutalist-sm"
              />
              <button 
                disabled={!messageInput.trim()}
                className="absolute right-2 top-2 h-12 w-12 bg-primary text-white border-2 border-black rounded-xl flex items-center justify-center shadow-retro disabled:opacity-50 disabled:grayscale transition-all active:translate-y-1"
              >
                <span className="material-symbols-outlined font-bold">send</span>
              </button>
            </div>
            <div className="flex justify-between mt-3 px-2">
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">End-to-end encrypted sanctuary</p>
               {userRole === 'doctor' && (
                 <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Moderator View Active</span>
               )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <header className="mb-8 reveal-comm reveal">
        <button onClick={onBack} className="flex items-center gap-2 mb-5 text-sm font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors active:translate-y-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold dark:text-white leading-tight">Circle <span className="text-primary italic">Support.</span></h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed hidden md:block">
              Anonymous spaces for shared healing.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sort</span>
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as any)}
               className="h-10 px-4 bg-white dark:bg-white/5 border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest focus:ring-0 focus:border-primary transition-all cursor-pointer shadow-brutalist-sm"
             >
               <option value="default">Relevance</option>
               <option value="members">Active Now</option>
               <option value="name">A-Z</option>
             </select>
          </div>
        </div>
      </header>

      {/* Circle Support Discovery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {sortedCircles.map((circle, i) => {
          const isJoined = joinedCircleIds.includes(circle.id);
          return (
            <div 
              key={circle.id} 
              className="reveal-comm reveal bg-white dark:bg-card-dark border-2 border-black rounded-[3.5rem] p-10 shadow-brutalist hover:shadow-brutalist-hover hover:-translate-y-2 transition-all cursor-pointer flex flex-col group relative overflow-hidden" 
              style={{ transitionDelay: `${i * 100}ms` }}
              onClick={() => handleJoinOrEnter(circle.id)}
            >
              <div className={`w-16 h-16 ${circle.color} border-2 border-black rounded-3xl flex items-center justify-center mb-8 shadow-brutalist-sm group-hover:rotate-12 transition-transform`}>
                <span className="material-symbols-outlined text-black text-3xl">{circle.icon}</span>
              </div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-3xl font-display font-bold group-hover:text-primary transition-colors">{circle.name}</h3>
                {isJoined && (
                  <span className="bg-primary text-white text-[9px] font-bold uppercase px-3 py-1 rounded-full border border-black shadow-brutalist-sm animate-pulse">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">{circle.tag}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-10 flex-grow leading-relaxed italic">
                "{circle.desc}"
              </p>
              <div className="flex items-center justify-between mt-auto pt-8 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight">
                  <span className="material-symbols-outlined text-sm text-primary animate-pulse">volunteer_activism</span>
                  {circle.membersDisplay} Sharing
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleJoinOrEnter(circle.id); }}
                  className={`px-8 py-4 ${isJoined ? 'bg-black text-white shadow-retro' : 'bg-primary text-white shadow-brutalist-sm'} text-xs font-bold rounded-2xl border-2 border-black hover:translate-y-[-2px] active:translate-y-1 transition-all uppercase tracking-widest`}
                >
                  {isJoined ? 'Enter Space' : 'Join Circle'}
                </button>
              </div>
              
              <span className="absolute -bottom-10 -right-10 material-symbols-outlined text-[10rem] text-black/5 group-hover:rotate-12 transition-transform pointer-events-none">
                {circle.icon}
              </span>
            </div>
          );
        })}

        {/* Suggestion Card */}
        <div className="reveal-comm reveal bg-aura-cream dark:bg-white/5 border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all [transition-delay:600ms]">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border-2 border-black/5 shadow-brutalist-sm">
            <span className="material-symbols-outlined text-primary text-4xl">add_circle_outline</span>
          </div>
          <h4 className="font-display text-3xl font-bold mb-4 dark:text-white">Need a Niche?</h4>
          <p className="text-xs text-gray-500 mb-10 font-medium leading-relaxed">Is there a specific struggle you need a space for?<br/>Request a new anonymous circle.</p>
          <button className="px-10 py-4 border-2 border-black bg-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-brutalist-sm active:translate-y-1">Request Topic</button>
        </div>
      </div>
    </div>
  );
};

export default Community;
