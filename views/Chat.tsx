import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { sarvamService } from '../services/sarvamService';
import { Message } from '../types';

interface Session {
  _id: string;
  lastMessage: string;
  lastAt: string;
  count: number;
}

interface ChatProps {
  history: Message[];
  setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'ta-IN', label: 'தமிழ்' },
];

const VOICE_SPEAKERS: Record<string, { id: string; label: string }[]> = {
  'en-IN': [{ id: 'diya', label: 'Diya ♀' }, { id: 'shubh', label: 'Shubh ♂' }],
  'hi-IN': [{ id: 'meera', label: 'Meera ♀' }, { id: 'shubh', label: 'Shubh ♂' }],
  'te-IN': [{ id: 'pavithra', label: 'Pavithra ♀' }, { id: 'neel', label: 'Neel ♂' }],
  'ta-IN': [{ id: 'maitreyi', label: 'Maitreyi ♀' }, { id: 'arvind', label: 'Arvind ♂' }],
};

const SUGGESTED_PROMPTS = [
  "I've been feeling anxious lately\u2026",
  "Help me reflect on my day",
  "I need to talk about something heavy",
  "Teach me a quick breathing exercise",
];

const RISK_BADGE: Record<string, { label: string; color: string }> = {
  safe: { label: 'Safe', color: 'bg-green-100 text-green-700' },
  emotional_distress: { label: 'Distress', color: 'bg-yellow-100 text-yellow-700' },
  self_harm_risk: { label: 'Self-Harm Risk', color: 'bg-red-100 text-red-700' },
  suicide_risk: { label: 'Crisis', color: 'bg-red-200 text-red-800 font-bold' },
};

const PROVIDER_ICON: Record<string, string> = {
  groq: '\u26a1',
  gemini: '\u2728',
  fallback: '\u{1f4ac}',
  safety: '\u{1f6e1}',
};

const Chat: React.FC<ChatProps> = ({ history, setHistory, onBack, isLoggedIn, onAuthRequired }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}`);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoTTS, setAutoTTS] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [voiceSpeaker, setVoiceSpeaker] = useState('diya');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceLangRef = useRef(voiceLang);
  useEffect(() => { voiceLangRef.current = voiceLang; }, [voiceLang]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [history, isTyping, scrollToBottom]);

  const loadSessions = useCallback(async () => {
    if (!isLoggedIn) return;
    setSessionsLoading(true);
    try {
      const data = await chatService.getSessions();
      setSessions(data as unknown as Session[]);
    } catch { } finally {
      setSessionsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const data = await chatService.getHistory(sessionId);
        if (data && data.length > 0) {
          setHistory(data.map((m: any) => ({
            id: m._id, role: m.role, text: m.content,
            timestamp: new Date(m.createdAt), riskLevel: m.riskLevel,
          })));
        } else {
          setHistory([]);
        }
      } catch { setHistory([]); }
    })();
  }, [isLoggedIn, sessionId, setHistory]);

  const handleLangChange = (lang: string) => {
    setVoiceLang(lang);
    setVoiceSpeaker(VOICE_SPEAKERS[lang][0].id);
  };

  const speakText = useCallback(async (msgId: string, text: string) => {
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    if (speakingMsgId === msgId) { setSpeakingMsgId(null); return; }
    try {
      setSpeakingMsgId(msgId);
      const audio = await sarvamService.speak(text, voiceLang, voiceSpeaker);
      currentAudioRef.current = audio;
      audio.onended = () => { setSpeakingMsgId(null); currentAudioRef.current = null; };
      audio.play();
    } catch { setSpeakingMsgId(null); }
  }, [speakingMsgId, voiceLang, voiceSpeaker]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const msg = (overrideText ?? input).trim();
    if (!msg || isTyping) return;
    if (!isLoggedIn) { onAuthRequired(); return; }

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: msg, timestamp: new Date() };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const data = await chatService.sendMessage(msg, sessionId, undefined, voiceLang);
      const botMsg: Message = {
        id: `m-${Date.now()}`, role: 'model', text: data.response,
        timestamp: new Date(), riskLevel: data.riskLevel, provider: data.provider,
        retrievedCount: data.retrievedCount, isCrisis: data.isCrisis,
      };
      setHistory(prev => [...prev, botMsg]);
      if (data.isCrisis) setShowCrisisAlert(true);
      if (autoTTS) speakText(botMsg.id, botMsg.text);
      loadSessions();
    } catch (err: any) {
      const errText = err.response?.data?.message || err.message || 'Failed to reach Aurova.';
      setHistory(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'model',
        text: `\u26a0\ufe0f ${errText} Please try again.`, timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [input, isTyping, isLoggedIn, onAuthRequired, setHistory, sessionId, autoTTS, speakText, loadSessions, voiceLang]);

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const transcript = await sarvamService.transcribeAudio(blob, voiceLangRef.current);
          if (transcript) setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        } catch { }
        setIsRecording(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch { alert('Microphone access denied or not available.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  const openSession = (sid: string) => {
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setSpeakingMsgId(null); setShowCrisisAlert(false); setSessionId(sid); setSidebarOpen(false);
  };

  const fmtTime = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const diff = (Date.now() - date.getTime()) / 86400000;
    if (diff < 1) return 'Today';
    if (diff < 2) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 flex bg-aura-cream dark:bg-gray-950 overflow-hidden" style={{ paddingTop: '64px' }}>
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-card-dark border-r-2 border-black flex flex-col transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:flex md:w-64 md:shrink-0 md:h-full
      `} style={{ paddingTop: sidebarOpen ? '0' : undefined }}>
        <div className="p-4 border-b-2 border-black flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg border border-black flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
          </div>
          <span className="font-display text-lg">Sessions</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden p-1 rounded-lg hover:bg-gray-100">
            <span className="material-icons-outlined text-sm">close</span>
          </button>
        </div>
        <div className="p-3 shrink-0">
          <button onClick={() => openSession(`session-${Date.now()}`)}
            className="w-full flex items-center gap-2 p-3 bg-primary text-white border-2 border-black rounded-xl shadow-brutalist-sm hover:translate-y-0.5 hover:shadow-none transition-all font-bold text-sm">
            <span className="material-icons-outlined text-sm">add</span>
            New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {sessionsLoading && <div className="text-center py-8 text-gray-400 text-sm">Loading&hellip;</div>}
          {!sessionsLoading && sessions.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs italic">No past sessions yet.<br />Start a conversation!</div>
          )}
          {sessions.map(s => (
            <button key={s._id} onClick={() => openSession(s._id)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all hover:border-primary group
                ${sessionId === s._id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-gray-50'}`}>
              <p className="text-xs font-medium line-clamp-2 text-gray-800 group-hover:text-black leading-tight">
                {s.lastMessage || 'Session'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-gray-400">{fmtDate(s.lastAt)}</span>
                <span className="text-[10px] text-gray-300">\u00b7</span>
                <span className="text-[10px] text-gray-400">{s.count} msgs</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-card-dark border-b-2 border-black shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="material-icons-outlined text-sm">menu</span>
          </button>
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="material-icons-outlined text-sm">arrow_back</span>
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl border-2 border-black flex items-center justify-center shadow-brutalist-sm">
              <span className="material-symbols-outlined text-white text-base">auto_awesome</span>
            </div>
            <div>
              <h1 className="font-display text-lg leading-none">Aurova</h1>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                {isTyping ? '\u25cf Thinking\u2026' : 'AI Companion \u00b7 Always here'}
              </p>
            </div>
          </div>
          {/* Voice language + speaker selectors */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={voiceLang}
              onChange={e => handleLangChange(e.target.value)}
              title="Voice language"
              className="h-8 px-2 bg-aura-cream border-2 border-black rounded-lg text-[10px] font-bold tracking-wide focus:outline-none focus:border-primary cursor-pointer"
            >
              {VOICE_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <select
              value={voiceSpeaker}
              onChange={e => setVoiceSpeaker(e.target.value)}
              title="Voice speaker"
              className="h-8 px-2 bg-aura-cream border-2 border-black rounded-lg text-[10px] font-bold focus:outline-none focus:border-primary cursor-pointer"
            >
              {(VOICE_SPEAKERS[voiceLang] || VOICE_SPEAKERS['en-IN']).map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setAutoTTS(v => !v)} title={autoTTS ? 'Disable auto read-aloud' : 'Enable auto read-aloud'}
            className={`p-2 rounded-xl border-2 border-black transition-all shadow-brutalist-sm ${autoTTS ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined text-sm">{autoTTS ? 'volume_up' : 'volume_off'}</span>
          </button>
        </header>

        {/* Crisis alert */}
        {showCrisisAlert && (
          <div className="mx-4 mt-4 bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-brutalist shrink-0">
            <div className="flex gap-4">
              <div className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
                <span className="material-icons-outlined text-xl">emergency</span>
              </div>
              <div className="flex-1">
                <h4 className="text-red-700 font-display text-lg mb-1">You are not alone.</h4>
                <p className="text-red-900/80 text-sm italic mb-3 leading-relaxed">
                  "It takes immense courage to share these feelings. Help is available right now."
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <a href="tel:919152987821" className="flex items-center gap-2 p-2.5 bg-white border-2 border-black rounded-xl transition-all text-sm font-bold no-underline text-black hover:shadow-brutalist-sm">
                    <span className="material-icons-outlined text-red-500 text-base">phone</span>
                    iCALL: +91-9152987821
                  </a>
                  <a href="tel:18005990019" className="flex items-center gap-2 p-2.5 bg-white border-2 border-black rounded-xl transition-all text-sm font-bold no-underline text-black hover:shadow-brutalist-sm">
                    <span className="material-icons-outlined text-blue-500 text-base">phone</span>
                    KIRAN: 1800-599-0019
                  </a>
                </div>
                <button onClick={() => setShowCrisisAlert(false)}
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 underline underline-offset-4">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 no-scrollbar">
          {history.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full pb-8 text-center select-none">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center border-2 border-black mb-5 shadow-brutalist">
                <span className="material-symbols-outlined text-4xl text-white">auto_awesome</span>
              </div>
              <h2 className="text-2xl font-display mb-1">Hello, I&apos;m Aurova.</h2>
              <p className="text-gray-500 text-sm italic max-w-xs leading-relaxed mb-8">
                &ldquo;Your feelings are valid. I&apos;m here to listen to anything you&apos;d like to share today.&rdquo;
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button key={prompt} onClick={() => handleSend(prompt)}
                    className="p-3 bg-white border-2 border-black rounded-xl text-sm text-left hover:border-primary hover:bg-primary/5 transition-all shadow-brutalist-sm hover:shadow-none text-gray-700 font-medium">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary border border-black flex items-center justify-center shrink-0 mb-5">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>auto_awesome</span>
                </div>
              )}

              <div className="max-w-[78%] group">
                <div className={`px-4 py-3 rounded-2xl border-2 border-black shadow-brutalist-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white dark:bg-card-dark text-gray-900 dark:text-white rounded-bl-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>

                {msg.role === 'model' && (
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-400">{fmtTime(msg.timestamp)}</span>
                    {msg.provider && msg.provider !== 'safety' && (
                      <span className="text-[10px] text-gray-400">{PROVIDER_ICON[msg.provider] ?? ''} <span className="capitalize">{msg.provider}</span></span>
                    )}
                    {msg.riskLevel && msg.riskLevel !== 'safe' && RISK_BADGE[msg.riskLevel] && (
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${RISK_BADGE[msg.riskLevel].color}`}>
                        {RISK_BADGE[msg.riskLevel].label}
                      </span>
                    )}
                    {(msg.retrievedCount ?? 0) > 0 && (
                      <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
                        \ud83e\udde0 {msg.retrievedCount} memories
                      </span>
                    )}
                    <button onClick={() => speakText(msg.id, msg.text)}
                      title={speakingMsgId === msg.id ? 'Stop' : 'Read aloud'}
                      className={`ml-auto w-6 h-6 rounded-full border border-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100
                        ${speakingMsgId === msg.id ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50 text-gray-500'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                        {speakingMsgId === msg.id ? 'stop_circle' : 'volume_up'}
                      </span>
                    </button>
                  </div>
                )}

                {msg.role === 'user' && (
                  <p className="text-[10px] text-gray-400 text-right mt-1">{fmtTime(msg.timestamp)}</p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-secondary border border-black flex items-center justify-center shrink-0 mb-5">
                  <span className="material-symbols-outlined text-black" style={{ fontSize: '14px' }}>person</span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary border border-black flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>auto_awesome</span>
              </div>
              <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl rounded-bl-sm px-4 py-3 shadow-brutalist-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 bg-white dark:bg-card-dark border-t-2 border-black shrink-0">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <button
              onMouseDown={startRecording} onMouseUp={stopRecording}
              onTouchStart={startRecording} onTouchEnd={stopRecording}
              title="Hold to record"
              className={`p-3 border-2 border-black rounded-xl transition-all shrink-0
                ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-brutalist-sm scale-110' : 'bg-white text-gray-500 hover:bg-aura-cream shadow-brutalist-sm'}`}>
              <span className="material-symbols-outlined">{isRecording ? 'mic' : 'mic_none'}</span>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isRecording ? '\ud83d\udd34 Listening\u2026' : "Tell me what\u2019s on your mind\u2026"}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-black rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary shadow-brutalist-sm transition-all placeholder:text-gray-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
              className="p-3 bg-primary text-white border-2 border-black rounded-xl shadow-brutalist-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          {isTyping && <p className="text-center text-[10px] text-gray-400 mt-2 italic">Aurova is thinking\u2026</p>}
        </div>

      </div>
    </div>
  );
};

export default Chat;
