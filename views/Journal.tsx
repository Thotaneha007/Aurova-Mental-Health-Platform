/**
 * Journal Entry Form — TRANSACTION FORM
 * Module: Core User Experience (Shaik Abdus Sattar)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: textarea, select, radio, checkbox, date-picker, tag-chips, range-slider, toggle
 */

import React, { useState, useEffect } from 'react';
import { analyzeMood } from '../services/geminiService';
import { journalService } from '../services/journalService';
import { JournalEntry } from '../types';

interface JournalProps {
  onSave: (entry: JournalEntry) => void;
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const MOOD_OPTIONS = ['Happy', 'Calm', 'Neutral', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Grateful', 'Overwhelmed', 'Lonely'];
const TAG_OPTIONS = ['self-care', 'work', 'relationships', 'health', 'family', 'growth', 'sleep', 'exercise', 'therapy', 'gratitude'];

interface JournalFormData {
  content: string;
  mood: string;
  tags: string[];
  isPrivate: boolean;
}

const Journal: React.FC<JournalProps> = ({ onSave, onBack, isLoggedIn, onAuthRequired }) => {
  // ── State ──
  const [mode, setMode] = useState<'list' | 'insert' | 'edit'>('list');
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form state
  const [formData, setFormData] = useState<JournalFormData>({
    content: '',
    mood: '',
    tags: [],
    isPrivate: true
  });
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Search state
  const [searchText, setSearchText] = useState('');
  const [searchMood, setSearchMood] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── DISPLAY: Load all entries ──
  const fetchEntries = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const data = await journalService.getEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchEntries();
  }, [isLoggedIn]);

  // ── SEARCH ──
  const handleSearch = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsLoading(true);
    try {
      const data = await journalService.searchEntries({
        q: searchText || undefined,
        mood: searchMood || undefined,
        from: searchDateFrom || undefined,
        to: searchDateTo || undefined,
        tag: searchTag || undefined
      });
      setEntries(data);
      showToast(`Found ${data.length} entries`, 'info');
    } catch (err) {
      showToast('Search failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSearchMood('');
    setSearchDateFrom('');
    setSearchDateTo('');
    setSearchTag('');
    fetchEntries();
  };

  // ── AI ANALYSIS ──
  const handleAnalyze = async () => {
    if (!formData.content.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeMood(formData.content);
      setAnalysis(res);
      if (res?.mood && !formData.mood) {
        setFormData(prev => ({ ...prev, mood: res.mood }));
      }
      if (res?.score) setMoodIntensity(res.score);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── INSERT ──
  const handleInsert = async () => {
    if (!formData.content.trim()) { showToast('Please write your reflection first.', 'error'); return; }
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsSaving(true);
    try {
      const saved = await journalService.createEntry(
        formData.content,
        analysis || { mood: formData.mood, score: moodIntensity },
        formData.mood,
        formData.tags,
        formData.isPrivate
      );
      onSave({
        id: saved._id,
        date: saved.createdAt,
        content: saved.content,
        mood: saved.aiAnalysis?.mood || saved.mood || 'Neutral',
        analysis: saved.aiAnalysis ? JSON.stringify(saved.aiAnalysis) : undefined
      });
      showToast('Journal entry saved!', 'success');
      resetForm();
      setMode('list');
      fetchEntries();
    } catch (err) {
      showToast('Failed to save entry.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    if (!selectedEntry?._id || !formData.content.trim()) return;
    if (!isLoggedIn) { onAuthRequired(); return; }
    setIsSaving(true);
    try {
      await journalService.updateEntry(selectedEntry._id, {
        content: formData.content,
        mood: formData.mood,
        tags: formData.tags,
        isPrivate: formData.isPrivate,
        aiAnalysis: analysis || { mood: formData.mood, score: moodIntensity }
      });
      showToast('Entry updated!', 'success');
      resetForm();
      setMode('list');
      fetchEntries();
    } catch (err) {
      showToast('Failed to update.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── DELETE ──
  const handleDelete = async (id: string) => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    try {
      await journalService.deleteEntry(id);
      showToast('Entry deleted.', 'info');
      setDeleteConfirmId(null);
      fetchEntries();
    } catch (err) {
      showToast('Failed to delete.', 'error');
    }
  };

  // ── Helpers ──
  const resetForm = () => {
    setFormData({ content: '', mood: '', tags: [], isPrivate: true });
    setMoodIntensity(5);
    setAnalysis(null);
    setSelectedEntry(null);
  };

  const openEditMode = (entry: any) => {
    setSelectedEntry(entry);
    setFormData({
      content: entry.content,
      mood: entry.aiAnalysis?.mood || entry.mood || '',
      tags: entry.tags || [],
      isPrivate: entry.isPrivate !== false
    });
    setMoodIntensity(entry.aiAnalysis?.score || 5);
    setAnalysis(entry.aiAnalysis || null);
    setMode('edit');
  };

  const openInsertMode = () => {
    resetForm();
    setMode('insert');
  };

  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  // ── FORM VIEW (Insert / Edit) ──
  const renderForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {mode === 'insert' ? 'INSERT · New Entry' : 'UPDATE · Edit Entry'}
          </p>
          <h2 className="text-3xl font-display font-bold dark:text-white">
            {mode === 'insert' ? 'New Reflection' : 'Edit Reflection'}
          </h2>
        </div>
        <button onClick={() => { resetForm(); setMode('list'); }} className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
          Cancel
        </button>
      </div>

      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
        <div className="p-8 space-y-6">

          {/* ── Textarea: Content ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              <span className="material-symbols-outlined text-sm align-middle mr-1">edit_note</span>
              Your Reflection *
            </label>
            <textarea
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="What's on your mind? Let it all flow..."
              rows={6}
              className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary resize-none transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1 font-bold">{formData.content.length} characters</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ── Select: Mood ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                <span className="material-symbols-outlined text-sm align-middle mr-1">mood</span>
                Mood (Dropdown)
              </label>
              <select
                value={formData.mood}
                onChange={e => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              >
                <option value="">— Select Mood —</option>
                {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* ── Range Slider: Mood Intensity ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                <span className="material-symbols-outlined text-sm align-middle mr-1">tune</span>
                Mood Intensity (Range Slider): {moodIntensity}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={moodIntensity}
                onChange={e => setMoodIntensity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-1">
                <span>Low</span><span>Moderate</span><span>High</span>
              </div>
            </div>
          </div>

          {/* ── Radio Group: Mood Quick Select ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              <span className="material-symbols-outlined text-sm align-middle mr-1">radio_button_checked</span>
              Quick Mood (Radio Buttons)
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map(m => (
                <label
                  key={m}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold
                    ${formData.mood === m ? 'bg-primary text-white border-black shadow-retro' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}
                >
                  <input
                    type="radio"
                    name="moodRadio"
                    value={m}
                    checked={formData.mood === m}
                    onChange={e => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                    className="sr-only"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          {/* ── Checkbox Group: Tags ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              <span className="material-symbols-outlined text-sm align-middle mr-1">label</span>
              Tags (Checkboxes) — select all that apply
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => {
                const checked = formData.tags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold
                      ${checked ? 'bg-secondary border-black shadow-retro text-black' : 'bg-white dark:bg-aura-black dark:text-white border-black/20 hover:border-primary/50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          tags: checked ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
                        }));
                      }}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    {tag}
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Toggle Switch: Privacy ── */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-aura-black/30 rounded-xl border-2 border-black/10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">shield</span>
              <div>
                <p className="font-bold text-sm dark:text-white">Private Entry (Toggle)</p>
                <p className="text-xs text-gray-400">When ON, this entry is visible only to you</p>
              </div>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
              className={`relative w-14 h-7 rounded-full border-2 border-black transition-all ${formData.isPrivate ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-black shadow transition-all ${formData.isPrivate ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* ── AI Analysis Button ── */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !formData.content.trim()}
              className="px-6 py-3 bg-white text-black font-bold rounded-xl border-2 border-black shadow-brutalist hover:shadow-brutalist-hover hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:translate-y-1 text-xs uppercase tracking-widest"
            >
              {isAnalyzing ? (
                <span className="animate-spin material-icons-outlined text-sm">sync</span>
              ) : (
                <span className="material-icons-outlined text-sm">psychology</span>
              )}
              {isAnalyzing ? 'Analyzing...' : 'AI Mood Analysis'}
            </button>
          </div>

          {/* AI Result */}
          {analysis && (
            <div className="bg-card-purple border-2 border-black rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 text-black">
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-black/60">AI Insight</h4>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{(analysis.score || 5) > 7 ? '☀️' : (analysis.score || 5) > 4 ? '☁️' : '🌧️'}</span>
                <div>
                  <p className="font-bold text-lg">{analysis.mood}</p>
                  <p className="text-xs italic text-black/70">"{analysis.summary}"</p>
                </div>
              </div>
              {analysis.suggestions && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {analysis.suggestions.map((s: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-white border border-black rounded-lg text-[10px] font-bold">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CRUD Action Bar ── */}
        <div className="px-8 py-5 border-t-2 border-black bg-gray-50 dark:bg-aura-black/20 flex flex-wrap gap-3 justify-end">
          {mode === 'insert' && (
            <button
              onClick={handleInsert}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {isSaving ? 'Saving...' : 'INSERT Entry'}
            </button>
          )}
          {mode === 'edit' && (
            <>
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:translate-y-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {isSaving ? 'Updating...' : 'UPDATE Entry'}
              </button>
              <button
                onClick={() => { handleDelete(selectedEntry._id); setMode('list'); }}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:translate-y-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                DELETE Entry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ── LIST VIEW ──
  const renderList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header + Action bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Journal Entries</p>
          <h2 className="text-4xl font-display font-bold dark:text-white">Your <span className="text-primary italic">Reflections.</span></h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">INSERT, UPDATE, DELETE, SEARCH, DISPLAY — All operations available.</p>
        </div>
      </div>

      {/* CRUD Operation Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={openInsertMode}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span> INSERT
        </button>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest transition-all active:translate-y-1 shadow-retro
            ${showSearch ? 'bg-yellow-400 text-black' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}
        >
          <span className="material-symbols-outlined text-sm">search</span> SEARCH
        </button>
        <button
          onClick={fetchEntries}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1"
        >
          <span className="material-symbols-outlined text-sm">visibility</span> DISPLAY ALL
        </button>
      </div>

      {/* ── SEARCH Panel ── */}
      {showSearch && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-yellow-500">manage_search</span>
            <h3 className="font-bold text-sm dark:text-white uppercase tracking-widest">Search Entries</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Text search */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Keyword (Text)</label>
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search content..."
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
            {/* Mood filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Mood (Dropdown)</label>
              <select
                value={searchMood}
                onChange={e => setSearchMood(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              >
                <option value="">All moods</option>
                {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {/* Tag filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tag (Dropdown)</label>
              <select
                value={searchTag}
                onChange={e => setSearchTag(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              >
                <option value="">All tags</option>
                {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Date from */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">From Date (Date Picker)</label>
              <input
                type="date"
                value={searchDateFrom}
                onChange={e => setSearchDateFrom(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
            {/* Date to */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">To Date (Date Picker)</label>
              <input
                type="date"
                value={searchDateTo}
                onChange={e => setSearchDateTo(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
            {/* Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1"
              >
                <span className="material-symbols-outlined text-sm">search</span> Go
              </button>
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Entries List ── */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold text-sm">Loading entries...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
          <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">history_edu</span>
          <p className="text-gray-400 font-bold text-lg">No journal entries yet.</p>
          <p className="text-gray-400 text-sm mb-6">Click INSERT to write your first reflection.</p>
          <button onClick={openInsertMode} className="px-6 py-3 bg-primary text-white rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest shadow-retro">
            Write First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{entries.length} entries found</p>
          {entries.map((entry: any) => (
            <div
              key={entry._id}
              className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist-sm hover:shadow-brutalist transition-all overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border
                        ${(entry.aiAnalysis?.mood || entry.mood) === 'Happy' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' :
                          (entry.aiAnalysis?.mood || entry.mood) === 'Sad' ? 'bg-blue-100 border-blue-400 text-blue-800' :
                          (entry.aiAnalysis?.mood || entry.mood) === 'Anxious' ? 'bg-orange-100 border-orange-400 text-orange-800' :
                          (entry.aiAnalysis?.mood || entry.mood) === 'Calm' ? 'bg-green-100 border-green-400 text-green-800' :
                          'bg-gray-100 border-gray-300 text-gray-700'}`}
                      >
                        {entry.aiAnalysis?.mood || entry.mood || 'Neutral'}
                      </span>
                      {entry.aiAnalysis?.score && (
                        <span className="text-[10px] font-bold text-gray-400">Score: {entry.aiAnalysis.score}/10</span>
                      )}
                      <span className="text-[10px] text-gray-400 font-bold">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {entry.isPrivate && (
                        <span className="material-symbols-outlined text-xs text-gray-400">lock</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{entry.content}</p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Per-entry CRUD Buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openEditMode(entry)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-blue-600 transition-all active:translate-y-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span> UPDATE
                    </button>
                    {deleteConfirmId === entry._id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase shadow-retro"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1.5 bg-gray-200 font-bold rounded-lg border-2 border-black text-[10px] uppercase"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(entry._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-red-600 transition-all active:translate-y-0.5"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span> DELETE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors active:translate-y-0.5">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back to Space
      </button>

      {mode === 'list' ? renderList() : renderForm()}
    </div>
  );
};

export default Journal;
