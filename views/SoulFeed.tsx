
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';

interface LegendStory {
  id: string;
  name: string;
  title: string;
  image: string;
  struggle: string;
  breakthrough: string;
  legacy: string;
  quote: string;
  likes: string;
}

interface SoulFeedProps {
  onBack: () => void;
  onNavigate?: (view: AppView) => void;
}

const SoulFeed: React.FC<SoulFeedProps> = ({ onBack, onNavigate }) => {
  const [likedStories, setLikedStories] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal-feed').forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 150);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const stories: LegendStory[] = [
    {
      id: 's1',
      name: "Abraham Lincoln",
      title: "16th US President",
      image: 'https://images.unsplash.com/photo-1585038891151-0c3002b0c517?auto=format&fit=crop&q=80&w=800',
      struggle: "Battled lifelong clinical depression. He often felt his life was a failure and struggled with suicidal ideation during his hardest years.",
      breakthrough: "He found purpose in service. He realized that his deep empathy—born from his own pain—made him a uniquely compassionate leader capable of healing a divided nation.",
      legacy: "Abolished slavery and preserved the Union while maintaining a quiet, inner strength that defined modern leadership.",
      quote: "I am now the most miserable man living. If what I feel were equally distributed to the whole human family, there would not be one cheerful face on the earth.",
      likes: '42k'
    },
    {
      id: 's2',
      name: "Michael Phelps",
      title: "23-time Olympic Gold Medalist",
      image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80&w=800',
      struggle: "Despite being the greatest swimmer in history, he faced severe depression and ADHD. After the 2012 Olympics, he contemplated suicide.",
      breakthrough: "He checked himself into a treatment center and started talking openly. He realized that 'vulnerability is a superpower' and that asking for help was harder than winning gold.",
      legacy: "Now a global advocate for athlete mental health, teaching millions that it's okay not to be okay.",
      quote: "I’m a 23-gold medalist, but I’m human. I want people to understand that it's okay to struggle. You’re not alone.",
      likes: '89k'
    },
    {
      id: 's3',
      name: "Nikola Tesla",
      title: "The Father of Electricity",
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
      struggle: "Lived with severe OCD, germaphobia, and hallucinations. He was often isolated and penniless, despite being a genius who changed the world.",
      breakthrough: "He channeled his intense visualizations into inventions. While his mind could be a prison, he turned it into a laboratory that could simulate entire machines.",
      legacy: "Invented the AC motor, wireless communication concepts, and dozens of patents that power our modern world today.",
      quote: "The mind is sharper and keener in seclusion and uninterrupted solitude. No big laboratory is needed in which to think.",
      likes: '35k'
    },
    {
      id: 's4',
      name: "Marie Curie",
      title: "Nobel Prize in Physics & Chemistry",
      image: 'https://images.unsplash.com/photo-1532187863486-abf9d39d99c5?auto=format&fit=crop&q=80&w=800',
      struggle: "Suffered deep depression after the tragic loss of her husband Pierre. She faced immense sexism and physical exhaustion from years of manual labor.",
      breakthrough: "Grief became her fuel for discovery. She plunged into her work, using science as a way to honor the legacy they built together.",
      legacy: "The first person to win two Nobel Prizes in different scientific fields and a pioneer of radioactivity.",
      quote: "Life is not easy for any of us. But what of that? We must have perseverance and above all confidence in ourselves.",
      likes: '28k'
    }
  ];

  const toggleLike = (id: string) => {
    setLikedStories(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="pt-24 pb-40 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen">
      <header className="mb-16 reveal-feed reveal">
        <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Dashboard
        </button>
        <div className="max-w-3xl">
          <h1 className="text-6xl md:text-8xl font-display font-bold dark:text-white leading-none">Legends of <span className="text-primary italic">Resilience.</span></h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mt-6 leading-relaxed italic border-l-4 border-primary pl-6">
            Explore the untold journeys of history's greatest minds. See how the legends of science, leadership, and sport conquered their inner shadows to change the world.
          </p>
        </div>
      </header>

      <div className="space-y-24">
        {stories.map((story, i) => {
          const isLiked = likedStories.includes(story.id);
          return (
            <div 
              key={story.id} 
              className="reveal-feed reveal bg-white dark:bg-card-dark border-4 border-black rounded-[3rem] overflow-hidden shadow-brutalist hover:shadow-brutalist-hover transition-all group"
            >
              <div className="grid lg:grid-cols-2">
                {/* Visual Side */}
                <div className="relative aspect-video lg:aspect-auto bg-black overflow-hidden border-b-4 lg:border-b-0 lg:border-r-4 border-black">
                   <img src={story.image} alt={story.name} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                   
                   <div className="absolute bottom-10 left-10 right-10">
                      <h2 className="text-5xl md:text-7xl font-display font-bold text-white leading-none mb-2">{story.name}</h2>
                      <p className="text-primary font-bold uppercase tracking-[0.2em] text-sm italic">{story.title}</p>
                   </div>
                   
                   <button className="absolute top-8 right-8 w-16 h-16 bg-white border-2 border-black rounded-3xl flex items-center justify-center shadow-brutalist-sm hover:scale-110 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-black text-3xl font-black">play_circle</span>
                   </button>
                </div>

                {/* Narrative Side */}
                <div className="p-10 lg:p-16 flex flex-col justify-center">
                  <div className="space-y-8">
                    {/* Quote */}
                    <div className="relative pb-8 mb-8 border-b-2 border-dashed border-black/10">
                       <span className="material-symbols-outlined absolute -top-4 -left-6 text-5xl text-primary opacity-20">format_quote</span>
                       <p className="text-2xl font-display font-bold italic leading-relaxed dark:text-gray-100">
                         "{story.quote}"
                       </p>
                    </div>

                    {/* Story Sections */}
                    <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-3 flex items-center gap-2">
                           <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center">
                             <span className="material-symbols-outlined text-[10px]">dark_mode</span>
                           </span> 
                           The Shadow
                         </h4>
                         <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{story.struggle}</p>
                      </div>

                      <div>
                         <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary mb-3 flex items-center gap-2">
                           <span className="w-4 h-4 rounded bg-secondary/10 flex items-center justify-center">
                             <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                           </span> 
                           The Breakthrough
                         </h4>
                         <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{story.breakthrough}</p>
                      </div>

                      <div>
                         <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-500 mb-3 flex items-center gap-2">
                           <span className="w-4 h-4 rounded bg-blue-500/10 flex items-center justify-center">
                             <span className="material-symbols-outlined text-[10px]">military_tech</span>
                           </span> 
                           The Legacy
                         </h4>
                         <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{story.legacy}</p>
                      </div>
                    </div>

                    {/* Interactions */}
                    <div className="pt-10 flex items-center justify-between border-t border-black/5 mt-auto">
                       <div className="flex gap-4">
                          <button 
                            onClick={() => toggleLike(story.id)}
                            className={`flex items-center gap-3 px-6 py-3 border-2 border-black rounded-2xl font-bold transition-all ${isLiked ? 'bg-primary text-white shadow-retro' : 'bg-white hover:bg-aura-cream'}`}
                          >
                             <span className="material-symbols-outlined text-sm font-bold">{isLiked ? 'favorite' : 'volunteer_activism'}</span>
                             <span className="text-xs uppercase tracking-widest">{story.likes} Inspired</span>
                          </button>
                          <button className="w-12 h-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-brutalist-sm hover:bg-gray-100 transition-all">
                             <span className="material-symbols-outlined text-sm">ios_share</span>
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-24 py-20 text-center bg-aura-black rounded-[4rem] border-4 border-black relative overflow-hidden">
         <div className="relative z-10">
            <span className="material-symbols-outlined text-7xl text-primary mb-6 animate-pulse">auto_awesome</span>
            <h4 className="text-4xl font-display font-bold text-white italic mb-4 leading-tight">Every legend has a <span className="text-primary not-italic">shadow.</span></h4>
            <p className="text-gray-400 max-w-xl mx-auto font-medium px-6">
              Our collection grows as we discover more stories of resilience. If there is an icon who inspires you, let us know.
            </p>
            <button
               onClick={() => onNavigate ? onNavigate(AppView.SOULFEED_INTERACT) : undefined}
               className="mt-10 px-12 py-5 bg-white text-black border-2 border-black rounded-2xl font-bold uppercase text-xs tracking-[0.2em] shadow-retro hover:scale-105 transition-all">
               Suggest a Soul
            </button>
         </div>
         {/* Decorative background icons */}
         <span className="absolute -bottom-10 -right-10 material-symbols-outlined text-[15rem] text-white/5 pointer-events-none rotate-12">history_edu</span>
         <span className="absolute -top-10 -left-10 material-symbols-outlined text-[12rem] text-white/5 pointer-events-none -rotate-12">school</span>
      </div>
    </div>
  );
};

export default SoulFeed;
