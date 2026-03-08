/**
 * Clinical Form Template — TRANSACTION FORM
 * Module: Clinical Form Workflow (AC Sanhitha Reddy)
 * Operations: INSERT · UPDATE · DELETE · SEARCH · DISPLAY
 * Input types: text, textarea, select, checkbox, toggle, dynamic field builder, radio
 */

import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';

interface ClinicalFormTemplateProps {
  onBack: () => void;
}

const FIELD_TYPES = ['text', 'textarea', 'select', 'checkbox', 'number', 'date', 'radio', 'multiselect', 'email', 'phone', 'url', 'image'];
const FIELD_TYPE_ICONS: Record<string, string> = {
  text: 'text_fields', textarea: 'notes', select: 'list', checkbox: 'check_box', number: 'tag',
  date: 'calendar_today', radio: 'radio_button_checked', multiselect: 'checklist', email: 'email', phone: 'phone', url: 'link', image: 'image'
};

interface EditorField {
  key: string; label: string; type: string; required: boolean;
  placeholder: string; helpText: string; options: string;
  min: string; max: string; minLength: string; maxLength: string; pattern: string;
}

const emptyField = (idx: number): EditorField => ({
  key: `field_${idx + 1}`, label: '', type: 'text', required: false,
  placeholder: '', helpText: '', options: '',
  min: '', max: '', minLength: '', maxLength: '', pattern: ''
});

const ClinicalFormTemplate: React.FC<ClinicalFormTemplateProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'list' | 'insert' | 'edit'>('list');
  const [forms, setForms] = useState<any[]>([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewForm, setPreviewForm] = useState<any>(null);
  const [previewResponses, setPreviewResponses] = useState<Record<string, any>>({});

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchActive, setSearchActive] = useState('');

  // Form editor
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<EditorField[]>([emptyField(0)]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };
  const toastColors: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-primary' };

  const isChoiceField = (t: string) => ['select', 'radio', 'multiselect'].includes(t);
  const isNumericField = (t: string) => t === 'number';

  // ── DISPLAY ──
  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const profile = await doctorService.getProfile();
      setForms(profile.clinicalForms || []);
      setActiveFormId(profile.activeFormId || null);
    } catch { showToast('Failed to load forms.', 'error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchForms(); }, []);

  // ── SEARCH ──
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchForms({ q: searchText || undefined, active: searchActive || undefined });
      setForms(data.forms || []);
      setActiveFormId(data.activeFormId || null);
      showToast(`Found ${(data.forms || []).length} forms`, 'info');
    } catch { showToast('Search failed', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── INSERT ──
  const handleInsert = async () => {
    if (!title.trim()) { showToast('Title is required.', 'error'); return; }
    if (fields.some(f => !f.label.trim())) { showToast('All fields need a label.', 'error'); return; }
    setIsSaving(true);
    try {
      const payload = buildPayload();
      await doctorService.createForm(payload.title, payload.description, payload.fields);
      showToast('Form template created!', 'success');
      resetEditor();
      setMode('list');
      fetchForms();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to create.', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    if (!editingFormId) return;
    setIsSaving(true);
    try {
      const payload = buildPayload();
      await doctorService.updateForm(editingFormId, payload);
      showToast('Template updated!', 'success');
      resetEditor();
      setMode('list');
      fetchForms();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to update.', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── DELETE ──
  const handleDelete = async (formId: string) => {
    try {
      await doctorService.deleteForm(formId);
      showToast('Template deleted.', 'info');
      setDeleteConfirmId(null);
      fetchForms();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to delete.', 'error'); }
  };

  const handleActivate = async (formId: string) => {
    try {
      await doctorService.activateForm(formId);
      showToast('Form activated!', 'success');
      fetchForms();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
  };

  const handleDeactivate = async () => {
    try {
      await doctorService.deactivateForm();
      showToast('Active form deactivated.', 'info');
      fetchForms();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
  };

  const buildPayload = () => ({
    title,
    description,
    fields: fields.map((f, idx) => ({
      key: f.key || `field_${idx + 1}`,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder,
      helpText: f.helpText,
      required: f.required,
      options: f.options.split(',').map(o => o.trim()).filter(Boolean),
      min: f.min === '' ? undefined : Number(f.min),
      max: f.max === '' ? undefined : Number(f.max),
      minLength: f.minLength === '' ? undefined : Number(f.minLength),
      maxLength: f.maxLength === '' ? undefined : Number(f.maxLength),
      pattern: f.pattern,
      order: idx
    }))
  });

  const resetEditor = () => {
    setEditingFormId(null);
    setTitle(''); setDescription(''); setFields([emptyField(0)]);
  };

  const openEditMode = (form: any) => {
    setEditingFormId(form._id);
    setTitle(form.title || '');
    setDescription(form.description || '');
    setFields((form.fields || []).map((f: any, idx: number) => ({
      key: f.key || `field_${idx + 1}`, label: f.label || '', type: f.type || 'text',
      required: !!f.required, placeholder: f.placeholder || '', helpText: f.helpText || '',
      options: (f.options || []).join(', '),
      min: f.min ?? '', max: f.max ?? '',
      minLength: f.minLength ?? '', maxLength: f.maxLength ?? '', pattern: f.pattern || ''
    })));
    setMode('edit');
  };

  const openPreview = (form: any) => {
    const initial: Record<string, any> = {};
    (form.fields || []).forEach((f: any) => {
      if (f.type === 'checkbox') initial[f.key] = false;
      else if (f.type === 'multiselect') initial[f.key] = [];
      else initial[f.key] = '';
    });
    setPreviewResponses(initial);
    setPreviewForm(form);
  };

  const renderPreviewField = (field: any) => {
    const val = previewResponses[field.key];
    const set = (v: any) => setPreviewResponses(p => ({ ...p, [field.key]: v }));
    const base = 'w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium bg-white dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary transition-colors';
    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">{field.label}</label>
          {field.required && <span className="text-red-500 text-xs font-black">*</span>}
        </div>
        {field.helpText && <p className="text-[10px] text-gray-400 italic mb-1">{field.helpText}</p>}
        {field.type === 'textarea' && (
          <textarea rows={3} value={val} onChange={e => set(e.target.value)} placeholder={field.placeholder} className={`${base} resize-none`} />
        )}
        {field.type === 'select' && (
          <select value={val} onChange={e => set(e.target.value)} className={base}>
            <option value="">— Select —</option>
            {(field.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {field.type === 'radio' && (
          <div className="flex flex-wrap gap-3">
            {(field.options || []).map((o: string) => (
              <label key={o} onClick={() => set(o)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all ${val === o ? 'border-primary bg-primary/10 text-primary' : 'border-black/20 hover:border-primary/50'}`}>
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${val === o ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                  {val === o && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
                {o}
              </label>
            ))}
          </div>
        )}
        {field.type === 'multiselect' && (
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((o: string) => {
              const selected = (val as string[]).includes(o);
              return (
                <button type="button" key={o} onClick={() => set(selected ? val.filter((x: string) => x !== o) : [...val, o])}
                  className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition-all ${selected ? 'border-primary bg-primary text-white' : 'border-black/20 hover:border-primary/50'}`}>{o}</button>
              );
            })}
          </div>
        )}
        {field.type === 'checkbox' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => set(!val)}
              className={`w-6 h-6 rounded-md border-2 border-black flex items-center justify-center transition-all ${val ? 'bg-primary' : 'bg-white'}`}>
              {val && <span className="material-symbols-outlined text-white text-sm">check</span>}
            </button>
            <span className="text-sm font-medium dark:text-white">{field.placeholder || field.label}</span>
          </label>
        )}
        {!['select','radio','multiselect','checkbox','textarea'].includes(field.type) && (
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
            value={val} onChange={e => set(e.target.value)}
            placeholder={field.placeholder}
            min={field.type === 'number' && field.min !== undefined ? Number(field.min) : undefined}
            max={field.type === 'number' && field.max !== undefined ? Number(field.max) : undefined}
            className={base}
          />
        )}
      </div>
    );
  };

  const addField = () => setFields(p => [...p, emptyField(p.length)]);
  const removeField = (idx: number) => setFields(p => p.filter((_, i) => i !== idx));
  const updateField = (idx: number, patch: Partial<EditorField>) => setFields(p => p.map((f, i) => i === idx ? { ...f, ...patch } : f));

  // ── FORM EDITOR ──
  const renderEditor = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {mode === 'insert' ? 'INSERT · New Template' : 'UPDATE · Edit Template'}
          </p>
          <h2 className="text-3xl font-display font-bold dark:text-white">
            {mode === 'insert' ? 'Create Clinical Form' : 'Edit Clinical Form'}
          </h2>
        </div>
        <button onClick={() => { resetEditor(); setMode('list'); }}
          className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-widest">Cancel</button>
      </div>

      <div className="bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist overflow-hidden">
        <div className="p-8 space-y-6">
          {/* Template info */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Title (Text) *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. General Intake Form" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Description (Text)</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief description" className="w-full border-2 border-black rounded-xl px-4 py-2.5 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
          </div>

          <hr className="border-black/10" />

          {/* Dynamic Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-base">dynamic_form</span> Form Fields ({fields.length})
              </h3>
              <button onClick={addField}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-green-600">
                <span className="material-symbols-outlined text-xs">add</span> Add Field
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div key={idx} className="p-5 bg-gray-50 dark:bg-aura-black/30 rounded-xl border-2 border-black/10 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-primary uppercase">Field #{idx + 1}</span>
                    {fields.length > 1 && (
                      <button onClick={() => removeField(idx)} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Key</label>
                      <input type="text" value={field.key} onChange={e => updateField(idx, { key: e.target.value })}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Label *</label>
                      <input type="text" value={field.label} onChange={e => updateField(idx, { label: e.target.value })}
                        placeholder="Question text" className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Type (Dropdown)</label>
                      <select value={field.type} onChange={e => updateField(idx, { type: e.target.value })}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white">
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Placeholder</label>
                      <input type="text" value={field.placeholder} onChange={e => updateField(idx, { placeholder: e.target.value })}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Help Text</label>
                      <input type="text" value={field.helpText} onChange={e => updateField(idx, { helpText: e.target.value })}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white" />
                    </div>
                  </div>
                  {isChoiceField(field.type) && (
                    <div className="mb-3">
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Options (comma-separated)</label>
                      <input type="text" value={field.options} onChange={e => updateField(idx, { options: e.target.value })}
                        placeholder="Option A, Option B, Option C" className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white" />
                    </div>
                  )}
                  {isNumericField(field.type) && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Min</label>
                        <input type="number" value={field.min} onChange={e => updateField(idx, { min: e.target.value })}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-gray-400 mb-0.5">Max</label>
                        <input type="number" value={field.max} onChange={e => updateField(idx, { max: e.target.value })}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs font-medium dark:bg-aura-black dark:text-white" />
                      </div>
                    </div>
                  )}
                  {/* Required toggle */}
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => updateField(idx, { required: !field.required })}
                      className={`relative w-10 h-5 rounded-full border-2 border-black transition-all ${field.required ? 'bg-primary' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white border border-black shadow transition-all ${field.required ? 'left-[calc(100%-1.1rem)]' : 'left-0.5'}`} />
                    </button>
                    <span className="text-[10px] font-bold uppercase text-gray-500">Required (Toggle)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-5 border-t-2 border-black bg-gray-50 dark:bg-aura-black/20 flex flex-wrap gap-3 justify-end">
          {mode === 'insert' && (
            <button onClick={handleInsert} disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1 disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">add_circle</span> {isSaving ? 'Creating...' : 'INSERT Template'}
            </button>
          )}
          {mode === 'edit' && (
            <button onClick={handleUpdate} disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:translate-y-1 disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">edit</span> {isSaving ? 'Updating...' : 'UPDATE Template'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── LIST VIEW ──
  const renderList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Transaction Form · Clinical Form Template</p>
        <h2 className="text-4xl font-display font-bold dark:text-white">Form <span className="text-primary italic">Builder.</span></h2>
        <p className="text-gray-500 mt-1 font-medium text-sm">INSERT, UPDATE, DELETE, SEARCH, DISPLAY — Manage intake form templates.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => { resetEditor(); setMode('insert'); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-green-600 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">add_circle</span> INSERT
        </button>
        <button onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">search</span> SEARCH
        </button>
        <button onClick={fetchForms}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest hover:bg-primary/80 transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">visibility</span> DISPLAY ALL
        </button>
      </div>

      {showSearch && (
        <div className="bg-white dark:bg-card-dark border-2 border-black rounded-2xl shadow-brutalist p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Keyword (Text)</label>
              <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search title, description..."
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="w-40">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status (Dropdown)</label>
              <select value={searchActive} onChange={e => setSearchActive(e.target.value)}
                className="w-full border-2 border-black rounded-xl px-3 py-2 text-sm font-medium dark:bg-aura-black dark:text-white">
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <button onClick={handleSearch}
              className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black shadow-retro text-xs uppercase tracking-widest">Go</button>
            <button onClick={() => { setSearchText(''); setSearchActive(''); fetchForms(); }}
              className="px-4 py-2 bg-gray-100 font-bold rounded-xl border-2 border-black text-xs uppercase tracking-widest">Clear</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-card-dark border-2 border-black rounded-[2rem] shadow-brutalist">
          <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">description</span>
          <p className="text-gray-400 font-bold text-lg">No form templates yet.</p>
          <p className="text-gray-400 text-sm mt-1">Create your first template to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{forms.length} templates</p>
          {forms.map((form: any) => {
            const isActive = String(form._id) === String(activeFormId);
            return (
              <div key={form._id} className={`bg-white dark:bg-card-dark border-2 rounded-2xl shadow-brutalist-sm hover:shadow-brutalist transition-all p-5 ${isActive ? 'border-primary' : 'border-black'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm dark:text-white truncate">{form.title}</h3>
                      {isActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded-full text-[9px] font-bold uppercase">Active</span>}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${form.isActive !== false ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>
                        {form.isActive !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {form.description && <p className="text-xs text-gray-500 mb-2">{form.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {(form.fields || []).slice(0, 6).map((f: any, i: number) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-aura-black/30 rounded-lg text-[9px] font-bold text-gray-600 dark:text-gray-300 border border-black/5">
                          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>{FIELD_TYPE_ICONS[f.type] || 'text_fields'}</span>
                          {f.label?.substring(0, 20)}{f.label?.length > 20 ? '…' : ''}
                        </span>
                      ))}
                      {(form.fields || []).length > 6 && <span className="text-[9px] font-bold text-gray-400">+{form.fields.length - 6} more</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => openPreview(form)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-primary/80 active:translate-y-0.5">
                      <span className="material-symbols-outlined text-xs">preview</span> PREVIEW
                    </button>
                    <button onClick={() => openEditMode(form)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-blue-600 active:translate-y-0.5">
                      <span className="material-symbols-outlined text-xs">edit</span> UPDATE
                    </button>
                    {!isActive ? (
                      <button onClick={() => handleActivate(form._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-green-600 active:translate-y-0.5">
                        <span className="material-symbols-outlined text-xs">check_circle</span> Activate
                      </button>
                    ) : (
                      <button onClick={handleDeactivate}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-400 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-orange-500 active:translate-y-0.5">
                        <span className="material-symbols-outlined text-xs">block</span> Deactivate
                      </button>
                    )}
                    {deleteConfirmId === form._id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(form._id)} className="px-2 py-1.5 bg-red-600 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase shadow-retro">Yes</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1.5 bg-gray-200 font-bold rounded-lg border-2 border-black text-[10px] uppercase">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(form._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg border-2 border-black text-[10px] uppercase tracking-widest shadow-retro hover:bg-red-600 active:translate-y-0.5">
                        <span className="material-symbols-outlined text-xs">delete</span> DELETE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-24 pb-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] ${toastColors[toast.type]} text-white px-6 py-3 rounded-2xl border-2 border-black shadow-retro font-bold text-sm flex items-center gap-3 animate-in slide-in-from-right-4`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Patient Preview Modal ── */}
      {previewForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreviewForm(null)}>
          <div className="bg-aura-cream dark:bg-card-dark border-4 border-black rounded-[2.5rem] shadow-brutalist w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-aura-cream dark:bg-card-dark border-b-2 border-black px-8 py-6 flex items-center justify-between z-10">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Patient View · Pre-Session Intake</p>
                <h3 className="text-xl font-display font-bold dark:text-white">{previewForm.title}</h3>
                {previewForm.description && <p className="text-xs text-gray-500 mt-0.5">{previewForm.description}</p>}
              </div>
              <button onClick={() => setPreviewForm(null)} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center hover:bg-black/5">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            {/* Fields */}
            <div className="px-8 py-6 space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  This is how the form appears to your patients before a session.
                </p>
              </div>
              {(previewForm.fields || []).map((field: any) => renderPreviewField(field))}
            </div>
            {/* Footer */}
            <div className="px-8 pb-8 pt-4 border-t border-black/10">
              <button disabled className="w-full py-4 bg-primary text-white font-bold rounded-2xl border-2 border-black opacity-50 cursor-not-allowed text-sm uppercase tracking-widest">
                Submit Intake Form (preview only)
              </button>
              <p className="text-[9px] text-center text-gray-400 mt-2">Patients see this exact layout before their consultation.</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors">
        <span className="material-icons-outlined text-sm">arrow_back</span> Back
      </button>
      {mode === 'list' ? renderList() : renderEditor()}
    </div>
  );
};

export default ClinicalFormTemplate;
