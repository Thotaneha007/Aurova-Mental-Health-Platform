
import React, { useState, useMemo, useEffect } from 'react';
import { Meeting, AppView } from '../types';
import { doctorService } from '../services/doctorService';

interface Slot {
  _id?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  status: 'available' | 'booked' | 'in-progress' | 'completed' | 'off';
  sessionType: 'Video' | 'Voice' | 'Chat';
  patientId?: any;
  lockExpires?: Date | string;
  clinicalFormData?: {
    formId: string;
    title: string;
    responses: any;
    filledAt: string;
  };
}

interface DailySchedule {
  date: string;
  slots: Slot[];
}

interface DoctorDashboardProps {
  name: string;
  onNavigate?: (view: AppView) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ name, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'patients' | 'availability'>('schedule');
  const [profile, setProfile] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedForm, setSelectedForm] = useState<any>(null);

  const [dailySchedules, setDailySchedules] = useState<DailySchedule[]>([]);
  const [viewDate, setViewDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    specialization: '',
    experienceYears: 0,
    education: '',
    bio: '',
    profileImage: ''
  });

  const [setupConfig, setSetupConfig] = useState({
    startTime: '09:00',
    endTime: '17:00',
    gracePeriod: 5,
    slotDuration: 30
  });
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formEditor, setFormEditor] = useState({
    title: '',
    description: '',
    fields: [{
      key: 'field_1',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      helpText: '',
      referenceImage: '',
      min: '',
      max: '',
      minLength: '',
      maxLength: '',
      pattern: '',
      options: ''
    }] as any[]
  });
  const [formSearchQuery, setFormSearchQuery] = useState('');

  // Fetch Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prof, cons] = await Promise.all([
        doctorService.getProfile(),
        doctorService.getConsultations()
      ]);
      setProfile(prof);
      setConsultations(cons);
      setDailySchedules(prof.dailySchedules || []);
      setEditForm({
        fullName: prof.fullName,
        specialization: prof.specialization,
        experienceYears: prof.experienceYears,
        education: prof.education || 'Medical Degree',
        bio: prof.bio,
        profileImage: prof.profileImage || ''
      });
    } catch (err) {
      console.error("Failed to fetch doctor data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doctorService.updateProfile(editForm);
      await fetchData();
      setIsEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  const resetFormEditor = () => {
    setEditingFormId(null);
    setFormEditor({
      title: '',
      description: '',
      fields: [{
        key: 'field_1',
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        helpText: '',
        referenceImage: '',
        min: '',
        max: '',
        minLength: '',
        maxLength: '',
        pattern: '',
        options: ''
      }]
    });
  };

  const handleAddField = () => {
    setFormEditor(prev => ({
      ...prev,
      fields: [...prev.fields, {
        key: `field_${prev.fields.length + 1}`,
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        helpText: '',
        referenceImage: '',
        min: '',
        max: '',
        minLength: '',
        maxLength: '',
        pattern: '',
        options: ''
      }]
    }));
  };

  const updateEditorField = (index: number, patch: Record<string, any>) => {
    setFormEditor(prev => ({
      ...prev,
      fields: prev.fields.map((field: any, idx: number) => idx === index ? { ...field, ...patch } : field)
    }));
  };

  const removeEditorField = (index: number) => {
    setFormEditor(prev => ({
      ...prev,
      fields: prev.fields.filter((_: any, idx: number) => idx !== index)
    }));
  };

  const handleReferenceImageUpload = (index: number, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateEditorField(index, { referenceImage: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
  };

  const isChoiceField = (type: string) => ['select', 'radio', 'multiselect'].includes(type);

  const handleSaveForm = async () => {
    try {
      const payload = {
        title: formEditor.title,
        description: formEditor.description,
        fields: formEditor.fields.map((f: any, idx: number) => ({
          key: f.key || `field_${idx + 1}`,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder || '',
          helpText: f.helpText || '',
          referenceImage: f.referenceImage || '',
          min: f.min === '' ? undefined : Number(f.min),
          max: f.max === '' ? undefined : Number(f.max),
          minLength: f.minLength === '' ? undefined : Number(f.minLength),
          maxLength: f.maxLength === '' ? undefined : Number(f.maxLength),
          pattern: f.pattern || '',
          required: !!f.required,
          options: (f.options || '').split(',').map((o: string) => o.trim()).filter(Boolean),
          order: idx
        }))
      };

      if (editingFormId) await doctorService.updateForm(editingFormId, payload);
      else await doctorService.createForm(payload.title, payload.description, payload.fields);

      await fetchData();
      resetFormEditor();
      alert('Form saved successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save form.');
    }
  };

  const handleEditForm = (form: any) => {
    setEditingFormId(form._id);
    setFormEditor({
      title: form.title || '',
      description: form.description || '',
      fields: (form.fields || []).map((f: any, idx: number) => ({
        key: f.key || `field_${idx + 1}`,
        label: f.label || '',
        type: f.type || 'text',
        placeholder: f.placeholder || '',
        helpText: f.helpText || '',
        referenceImage: f.referenceImage || '',
        min: f.min ?? '',
        max: f.max ?? '',
        minLength: f.minLength ?? '',
        maxLength: f.maxLength ?? '',
        pattern: f.pattern || '',
        required: !!f.required,
        options: (f.options || []).join(', ')
      }))
    });
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Delete this form?')) return;
    try {
      await doctorService.deleteForm(formId);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete form.');
    }
  };

  const handleActivateForm = async (formId: string) => {
    try {
      await doctorService.activateForm(formId);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate form.');
    }
  };

  const handleDeactivateActiveForm = async () => {
    try {
      await doctorService.deactivateForm();
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to deactivate active form.');
    }
  };

  const filteredClinicalForms = useMemo(() => {
    const forms = profile?.clinicalForms || [];
    const q = formSearchQuery.trim().toLowerCase();
    if (!q) return forms;

    return forms.filter((form: any) => {
      const titleMatch = String(form.title || '').toLowerCase().includes(q);
      const descriptionMatch = String(form.description || '').toLowerCase().includes(q);
      const fieldMatch = (form.fields || []).some((field: any) =>
        String(field.label || '').toLowerCase().includes(q) ||
        String(field.type || '').toLowerCase().includes(q) ||
        String(field.helpText || '').toLowerCase().includes(q) ||
        (field.options || []).join(' ').toLowerCase().includes(q)
      );
      return titleMatch || descriptionMatch || fieldMatch;
    });
  }, [profile, formSearchQuery]);

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return { days, monthName, year, month };
  }, [viewDate]);

  const generateSlots = (startStr: string, endStr: string, slotMinutes: number, graceMinutes: number) => {
    const slots: Slot[] = [];
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const start = new Date(2000, 0, 1, startH, startM);
    const end = new Date(2000, 0, 1, endH, endM);

    let current = new Date(start);

    while (new Date(current.getTime() + slotMinutes * 60000) <= end) {
      const slotEnd = new Date(current.getTime() + slotMinutes * 60000);

      slots.push({
        startTime: current.toTimeString().slice(0, 5),
        endTime: slotEnd.toTimeString().slice(0, 5),
        duration: slotMinutes,
        status: 'available',
        sessionType: 'Video'
      });

      current = new Date(slotEnd.getTime() + Math.max(2, graceMinutes) * 60000);
    }
    return slots;
  };

  const selectDate = (day: number) => {
    const d = new Date(calendarData.year, calendarData.month, day);
    const dateStr = d.toLocaleDateString('en-CA');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date();
    limit.setDate(today.getDate() + 7);
    limit.setHours(23, 59, 59, 999);

    if (d < today || d > limit) {
      alert("Scheduling is allowed only for the next 7 days.");
      return;
    }
    setSelectedDate(dateStr);
  };

  const toggleSlotType = (index: number) => {
    if (!selectedDate) return;
    setDailySchedules(prev => {
      const day = prev.find(d => d.date === selectedDate);
      if (!day) return prev;

      const newSlots = [...day.slots];
      const slot = newSlots[index];

      // Don't modify booked slots here
      if (slot.status === 'booked' || slot.status === 'in-progress') return prev;

      const types: ('Video' | 'Voice' | 'Chat')[] = ['Video', 'Voice', 'Chat'];
      if (slot.status === 'available') {
        const nextTypeIndex = (types.indexOf(slot.sessionType) + 1);
        if (nextTypeIndex < types.length) {
          slot.sessionType = types[nextTypeIndex];
        } else {
          slot.status = 'off';
        }
      } else {
        slot.status = 'available';
        slot.sessionType = 'Video';
      }

      return prev.map(d => d.date === selectedDate ? { ...d, slots: newSlots } : d);
    });
  };

  const handleApplyBaseSlots = () => {
    if (!selectedDate) return;
    const newSlots = generateSlots(setupConfig.startTime, setupConfig.endTime, setupConfig.slotDuration, setupConfig.gracePeriod);

    setDailySchedules(prev => {
      const existingDay = prev.find(d => d.date === selectedDate);
      if (!existingDay) {
        return [...prev, { date: selectedDate, slots: newSlots }];
      }

      // Protect important slots
      const protectedSlots = existingDay.slots.filter(s => s.status === 'booked' || s.status === 'in-progress');
      const merged = [...newSlots];
      protectedSlots.forEach(ps => {
        const idx = merged.findIndex(ms => ms.startTime === ps.startTime);
        if (idx !== -1) merged[idx] = ps;
        else merged.push(ps);
      });
      merged.sort((a, b) => a.startTime.localeCompare(b.startTime));
      return prev.map(d => d.date === selectedDate ? { ...d, slots: merged } : d);
    });
  };

  const handleClearSlots = () => {
    if (!selectedDate) return;

    setDailySchedules(prev => {
      const existingDay = prev.find(d => d.date === selectedDate);
      if (!existingDay) return prev;

      const protectedSlots = existingDay.slots.filter(s => s.status === 'booked' || s.status === 'in-progress');

      if (protectedSlots.length > 0) {
        alert("Cannot clear schedule with active bookings.");
        return prev;
      }

      return prev.filter(d => d.date !== selectedDate);
    });

    setSelectedDate(null);
  };

  const handlePostSchedule = async () => {
    try {
      console.log('🔄 Starting sync...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Clean up past dates
      const cleaned = dailySchedules.filter(d => new Date(d.date) >= today);

      // Ensure all slots have required fields
      const formattedSchedules = cleaned.map(day => ({
        date: day.date,
        slots: day.slots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration || setupConfig.slotDuration,
          status: slot.status || 'available',
          sessionType: slot.sessionType || 'Video',
          ...(slot.patientId && { patientId: slot.patientId }),
          ...(slot.lockExpires && { lockExpires: slot.lockExpires }),
          ...(slot.clinicalFormData && { clinicalFormData: slot.clinicalFormData })
        }))
      }));

      console.log('📤 Sending data:', JSON.stringify(formattedSchedules, null, 2));

      await doctorService.updateProfile({ dailySchedules: formattedSchedules });

      console.log('✅ Sync successful');
      alert("Practice schedule synchronized successfully!");

      // Refresh to get latest data from server
      await fetchData();

    } catch (err: any) {
      console.error('❌ Sync Error:', err);
      console.error('Response:', err.response?.data);

      const serverMessage = err.response?.data?.message || err.message;
      alert(`Synchronization Failed: ${serverMessage}`);
    }
  };

  const renderSchedule = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Profile & Stats Sidebar Layout */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Profile Card */}
        <div className="lg:col-span-9 space-y-8">
          <div className="bg-white dark:bg-card-dark border-4 border-black p-10 rounded-[3rem] shadow-brutalist relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
              <div className="relative group">
                <div className="w-40 h-40 rounded-[2.5rem] border-4 border-black shadow-brutalist-sm overflow-hidden bg-aura-cream">
                  {profile?.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card-blue">
                      <span className="material-symbols-outlined text-6xl text-black">person</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary text-white border-2 border-black rounded-xl flex items-center justify-center shadow-brutalist-sm hover:scale-110 transition-all">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
              </div>

              <div className="flex-grow space-y-4">
                <div className="space-y-1">
                  <h2 className="text-5xl font-display font-bold text-black dark:text-white">{profile?.fullName || name}</h2>
                  <p className="text-xl font-bold text-primary italic">{profile?.specialization}</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                  <span className="px-4 py-2 bg-aura-cream border-2 border-black rounded-xl text-[10px] font-bold uppercase tracking-widest">{profile?.experienceYears} Years Exp</span>
                  <span className="px-4 py-2 bg-card-blue border-2 border-black rounded-xl text-[10px] font-bold uppercase tracking-widest">{profile?.education || 'Medical Degree'}</span>
                </div>

                <p className="text-gray-500 font-medium leading-relaxed max-w-2xl">
                  {profile?.bio || 'Professional medical practitioner specialized in patient-centric care.'}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Consultations */}
          <div className="space-y-6">
            <h3 className="text-3xl font-display font-bold dark:text-white italic">Upcoming <span className="text-primary not-italic">Encounters.</span></h3>
            <div className="grid gap-6">
              {consultations.filter(c => c.status === 'upcoming').length > 0 ? consultations.filter(c => c.status === 'upcoming').map((session) => (
                <div key={session._id} className="bg-white dark:bg-card-dark border-2 border-black p-8 rounded-[2.5rem] shadow-brutalist flex flex-col md:flex-row items-center gap-8 hover:translate-x-2 transition-all">
                  <div className="w-16 h-16 bg-card-yellow border-2 border-black rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-black text-2xl">event_upcoming</span>
                  </div>
                  <div className="flex-grow">
                    <h5 className="text-xl font-display font-bold dark:text-white">{session.patientId?.displayName || 'Unknown Patient'}</h5>
                    <div className="flex gap-4 mt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_month</span> {new Date(session.scheduledTime).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span> {new Date(session.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      doctorService.getPatientSummary(session.patientId?._id).then(setSelectedPatient);
                    }}
                    className="px-6 py-4 bg-black text-white border-2 border-black rounded-xl font-bold uppercase text-[10px] shadow-retro">
                    Clinical Deck
                  </button>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-black/10 rounded-[2.5rem]">
                  <p className="font-bold text-gray-400 italic">No upcoming patient interactions.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark border-4 border-black rounded-[3rem] p-8 shadow-brutalist space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold italic">Prerequisite <span className="text-primary not-italic">Forms.</span></h3>
              <div className="flex items-center gap-2">
                {profile?.activeFormId ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2 border-black rounded-lg bg-secondary">
                      Active Form Assigned
                    </span>
                    <button
                      onClick={handleDeactivateActiveForm}
                      className="px-3 py-1 text-[10px] font-bold uppercase border-2 border-black rounded-lg bg-white"
                    >
                      Deactivate
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2 border-black rounded-lg bg-aura-cream">
                    No Active Form
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 border-2 border-black rounded-2xl bg-card-yellow">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Current Active Form</p>
              <p className="text-sm font-bold">
                {profile?.clinicalForms?.find((f: any) => String(f._id) === String(profile?.activeFormId))?.title || 'None selected'}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={formSearchQuery}
                onChange={(e) => setFormSearchQuery(e.target.value)}
                placeholder="Search forms by name, question, type, option..."
                className="w-full h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredClinicalForms.map((form: any) => (
                <div key={form._id} className="border-2 border-black rounded-2xl p-4 bg-aura-cream">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{form.title}</p>
                    {String(profile?.activeFormId) === String(form._id) && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-primary text-white border border-black rounded-lg">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mb-3">{(form.fields || []).length} fields</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleActivateForm(form._id)} className="px-3 py-1 text-[10px] font-bold uppercase border-2 border-black rounded-lg bg-secondary">
                      {String(profile?.activeFormId) === String(form._id) ? 'Assigned' : 'Assign + Activate'}
                    </button>
                    <button onClick={() => handleEditForm(form)} className="px-3 py-1 text-[10px] font-bold uppercase border-2 border-black rounded-lg bg-white">Edit</button>
                    <button onClick={() => handleDeleteForm(form._id)} className="px-3 py-1 text-[10px] font-bold uppercase border-2 border-black rounded-lg bg-white">Delete</button>
                  </div>
                </div>
              ))}
              {!profile?.clinicalForms?.length && (
                <div className="md:col-span-2 text-center py-8 border-2 border-dashed border-black/20 rounded-2xl text-sm text-gray-500">
                  No forms created yet.
                </div>
              )}
              {profile?.clinicalForms?.length > 0 && filteredClinicalForms.length === 0 && (
                <div className="md:col-span-2 text-center py-8 border-2 border-dashed border-black/20 rounded-2xl text-sm text-gray-500">
                  No forms matched your search.
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-black/10 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {editingFormId ? 'Update Form' : 'Create Form'}
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Form title"
                  value={formEditor.title}
                  onChange={e => setFormEditor(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full h-12 px-4 border-2 border-black rounded-2xl text-sm font-bold bg-white"
                />
                <textarea
                  placeholder="Form description"
                  value={formEditor.description}
                  onChange={e => setFormEditor(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full p-4 border-2 border-black rounded-2xl text-sm bg-white"
                />
                {formEditor.fields.map((field: any, idx: number) => (
                  <div key={idx} className="p-4 md:p-5 border-2 border-black/15 rounded-2xl bg-[#f8f8f8] space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Question {idx + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeEditorField(idx)}
                        disabled={formEditor.fields.length <= 1}
                        className="px-3 py-1 border-2 border-black rounded-lg text-[10px] font-bold uppercase bg-white disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid md:grid-cols-12 gap-3">
                      <input
                        type="text"
                        placeholder="Question title"
                        value={field.label}
                        onChange={e => updateEditorField(idx, { label: e.target.value })}
                        className="md:col-span-7 h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                      />
                      <select
                        value={field.type}
                        onChange={e => updateEditorField(idx, { type: e.target.value })}
                        className="md:col-span-5 h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="radio">MCQ (Single)</option>
                        <option value="multiselect">MCQ (Multiple)</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox (Yes/No)</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="url">URL</option>
                        <option value="image">Image URL</option>
                      </select>
                    </div>

                    {isChoiceField(field.type) ? (
                      <input
                        type="text"
                        placeholder="Options (comma-separated)"
                        value={field.options}
                        onChange={e => updateEditorField(idx, { options: e.target.value })}
                        className="w-full h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                      />
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Placeholder text"
                          value={field.placeholder || ''}
                          onChange={e => updateEditorField(idx, { placeholder: e.target.value })}
                          className="h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Help text (optional)"
                          value={field.helpText || ''}
                          onChange={e => updateEditorField(idx, { helpText: e.target.value })}
                          className="h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                        />
                      </div>
                    )}

                    {field.type === 'number' && (
                      <div className="grid md:grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Min value"
                          value={field.min ?? ''}
                          onChange={e => updateEditorField(idx, { min: e.target.value })}
                          className="h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Max value"
                          value={field.max ?? ''}
                          onChange={e => updateEditorField(idx, { max: e.target.value })}
                          className="h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                        />
                      </div>
                    )}

                    {['text', 'textarea'].includes(field.type) && (
                      <div className="grid md:grid-cols-3 gap-3">
                        <input
                          type="number"
                          placeholder="Min chars"
                          value={field.minLength ?? ''}
                          onChange={e => updateEditorField(idx, { minLength: e.target.value })}
                          className="h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Max chars"
                          value={field.maxLength ?? ''}
                          onChange={e => updateEditorField(idx, { maxLength: e.target.value })}
                          className="h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Pattern regex (optional)"
                          value={field.pattern || ''}
                          onChange={e => updateEditorField(idx, { pattern: e.target.value })}
                          className="h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                        />
                      </div>
                    )}

                    <div className="grid md:grid-cols-12 gap-3">
                      <input
                        type="text"
                        placeholder="Reference image URL (optional)"
                        value={field.referenceImage || ''}
                        onChange={e => updateEditorField(idx, { referenceImage: e.target.value })}
                        className="md:col-span-8 h-11 px-3 border-2 border-black rounded-xl text-sm bg-white"
                      />
                      <label className="md:col-span-4 h-11 px-3 border-2 border-black rounded-xl text-sm bg-white flex items-center justify-center cursor-pointer font-bold uppercase text-[10px]">
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleReferenceImageUpload(idx, e.target.files?.[0])}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Required</span>
                      <button
                        type="button"
                        onClick={() => updateEditorField(idx, { required: !field.required })}
                        className={`w-12 h-7 border-2 border-black rounded-full relative transition-colors ${field.required ? 'bg-primary' : 'bg-white'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border border-black transition-all ${field.required ? 'left-6' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="p-3 rounded-xl border border-dashed border-black/25 bg-white/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Preview</p>
                      {field.referenceImage && (
                        <img
                          src={field.referenceImage}
                          alt="Question reference"
                          className="w-full max-h-52 object-cover rounded-xl border border-black mb-3"
                        />
                      )}
                      <p className="text-sm font-semibold text-black mb-2">{field.label || 'Untitled question'}</p>
                      {field.type === 'radio' && (
                        <div className="space-y-2">
                          {String(field.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2 text-xs text-gray-700">
                              <input type="radio" disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                          {!String(field.options || '').trim() && <p className="text-xs text-gray-500">Add options to preview radio choices</p>}
                        </div>
                      )}

                      {field.type === 'multiselect' && (
                        <div className="space-y-2">
                          {String(field.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2 text-xs text-gray-700">
                              <input type="checkbox" disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                          {!String(field.options || '').trim() && <p className="text-xs text-gray-500">Add options to preview multi-choice checkboxes</p>}
                        </div>
                      )}

                      {field.type === 'select' && (
                        <select className="w-full h-10 px-2 border border-black rounded-lg text-xs bg-white" disabled>
                          <option value="">Select...</option>
                          {String(field.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          className="w-full p-2 border border-black rounded-lg text-xs resize-none bg-white"
                          rows={3}
                          placeholder={field.placeholder || 'Long answer text'}
                          disabled
                        />
                      )}

                      {field.type === 'checkbox' && (
                        <label className="flex items-center gap-2 text-xs text-gray-700">
                          <input type="checkbox" disabled />
                          <span>Yes</span>
                        </label>
                      )}

                      {!['radio', 'multiselect', 'select', 'textarea', 'checkbox'].includes(field.type) && (
                        <input
                          type={
                            field.type === 'number' ? 'number'
                              : field.type === 'date' ? 'date'
                                : field.type === 'email' ? 'email'
                                  : field.type === 'phone' ? 'tel'
                                    : field.type === 'url' || field.type === 'image' ? 'url'
                                      : 'text'
                          }
                          className="w-full h-10 px-2 border border-black rounded-lg text-xs bg-white"
                          placeholder={field.placeholder || 'Short answer'}
                          disabled
                        />
                      )}
                      {field.type === 'number' && (
                        <p className="text-[10px] text-gray-500 mt-2">Rules: {field.min !== '' && field.min !== undefined ? `min ${field.min}` : 'no min'} | {field.max !== '' && field.max !== undefined ? `max ${field.max}` : 'no max'}</p>
                      )}
                      {['text', 'textarea'].includes(field.type) && (
                        <p className="text-[10px] text-gray-500 mt-2">Rules: {field.minLength ? `minLength ${field.minLength}` : 'no minLength'} | {field.maxLength ? `maxLength ${field.maxLength}` : 'no maxLength'}{field.pattern ? ` | pattern ${field.pattern}` : ''}</p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="p-5 border-2 border-black rounded-2xl bg-white space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Form Preview</p>
                  <div className="p-5 border-2 border-black/15 rounded-2xl bg-aura-cream space-y-4">
                    <h4 className="text-xl font-display font-bold">{formEditor.title || 'Untitled Form'}</h4>
                    {formEditor.description && <p className="text-sm text-gray-600">{formEditor.description}</p>}
                    <div className="space-y-4">
                      {formEditor.fields.map((field: any, idx: number) => (
                        <div key={`preview_${idx}`} className="p-4 bg-white border border-black/10 rounded-xl space-y-2">
                          {field.referenceImage && (
                            <img src={field.referenceImage} alt="Question reference" className="w-full max-h-44 object-cover rounded-lg border border-black/20" />
                          )}
                          <p className="text-sm font-bold">
                            {field.label || `Question ${idx + 1}`}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                          {field.type === 'radio' && (field.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2 text-sm"><input type="radio" disabled />{opt}</label>
                          ))}
                          {field.type === 'multiselect' && (field.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled />{opt}</label>
                          ))}
                          {field.type === 'select' && (
                            <select className="w-full h-10 px-2 border border-black/20 rounded-lg text-sm bg-white" disabled>
                              <option value="">Select...</option>
                              {(field.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          {field.type === 'textarea' && <textarea rows={3} disabled className="w-full p-2 border border-black/20 rounded-lg text-sm bg-white" placeholder={field.placeholder || 'Long answer'} />}
                          {field.type === 'checkbox' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled />Yes</label>}
                          {!['radio', 'multiselect', 'select', 'textarea', 'checkbox'].includes(field.type) && (
                            <input
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' || field.type === 'image' ? 'url' : 'text'}
                              disabled
                              className="w-full h-10 px-2 border border-black/20 rounded-lg text-sm bg-white"
                              placeholder={field.placeholder || 'Short answer'}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddField} className="px-4 py-2 border-2 border-black rounded-xl text-[10px] font-bold uppercase">Add Field</button>
                <button onClick={handleSaveForm} className="px-4 py-2 bg-primary text-white border-2 border-black rounded-xl text-[10px] font-bold uppercase">
                  {editingFormId ? 'Update Form' : 'Create Form'}
                </button>
                {editingFormId && (
                  <button onClick={resetFormEditor} className="px-4 py-2 border-2 border-black rounded-xl text-[10px] font-bold uppercase">Cancel Edit</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Reviews Sidebar */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card-blue border-2 border-black p-6 rounded-[2rem] shadow-brutalist flex flex-col items-center justify-center text-center">
              <p className="text-[9px] font-bold text-black/40 uppercase tracking-tighter mb-2">Total Earnings</p>
              <p className="text-3xl font-display font-bold text-black">${profile?.stats?.amountEarned || 0}</p>
            </div>
            <div className="bg-secondary border-2 border-black p-6 rounded-[2rem] shadow-brutalist flex flex-col items-center justify-center text-center">
              <p className="text-[9px] font-bold text-black/40 uppercase tracking-tighter mb-2">Meetings</p>
              <p className="text-3xl font-display font-bold text-black">{profile?.stats?.meetingsTaken || 0}</p>
            </div>
            <div className="bg-card-yellow border-2 border-black p-6 rounded-[2rem] shadow-brutalist flex flex-col items-center justify-center text-center col-span-2">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className="material-symbols-outlined text-black text-sm">{s <= (profile?.stats?.avgRating || 0) ? 'star' : 'star_outline'}</span>
                ))}
              </div>
              <p className="text-3xl font-display font-bold text-black">{profile?.stats?.avgRating || 0}<span className="text-sm">/5.0</span></p>
              <p className="text-[9px] font-bold text-black/40 uppercase tracking-tighter">Avg Patient Satisfaction</p>
            </div>
          </div>

          {/* Patient Feedback */}
          <div className="bg-white dark:bg-card-dark border-2 border-black p-8 rounded-[2.5rem] shadow-brutalist">
            <h4 className="text-xl font-display font-bold mb-6 italic">Patient <span className="text-primary not-italic">Voices.</span></h4>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {profile?.reviews && profile.reviews.length > 0 ? profile.reviews.map((rev: any, i: number) => (
                <div key={i} className="space-y-2 border-b-2 border-black/5 pb-4 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-black dark:text-white">{rev.patientName || 'Anonymous'}</span>
                    <span className="text-[9px] text-gray-400 font-bold">{new Date(rev.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className="material-symbols-outlined text-xs text-secondary">{s <= rev.rating ? 'star' : 'star_outline'}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 italic">"{rev.comment}"</p>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic">No reviews yet. New practices take time to flourish.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAvailability = () => {
    const selectedDaySchedule = selectedDate ? dailySchedules.find(ds => ds.date === selectedDate) : null;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Calendar Section */}
          <div className={`lg:col-span-6 bg-white dark:bg-card-dark border-4 border-black rounded-[3rem] shadow-brutalist overflow-hidden`}>
            <div className="p-8 bg-aura-cream border-b-2 border-black/10 flex items-center justify-between">
              <h3 className="text-3xl font-display font-bold italic">{calendarData.monthName} <span className="text-primary not-italic">{calendarData.year}</span></h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-brutalist-sm hover:translate-y-[-2px] transition-all"><span className="material-symbols-outlined">chevron_left</span></button>
                <button onClick={handleNextMonth} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-brutalist-sm hover:translate-y-[-2px] transition-all"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-7 gap-4 text-center text-[9px] font-bold text-gray-400 mb-6 uppercase tracking-[0.2em]">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {calendarData.days.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                  const d = new Date(calendarData.year, calendarData.month, day);
                  const dateStr = d.toLocaleDateString('en-CA');
                  const daySchedule = dailySchedules.find(ds => ds.date === dateStr);
                  const isSelected = selectedDate === dateStr;

                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  const limit = new Date(); limit.setDate(today.getDate() + 7);
                  const isClickable = d >= today && d <= limit;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => selectDate(day)}
                      disabled={!isClickable}
                      className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all relative ${!isClickable ? 'opacity-20 grayscale cursor-not-allowed' : isSelected ? 'bg-primary text-white border-black shadow-brutalist scale-110' : daySchedule ? 'bg-aura-cream border-black hover:border-primary' : 'bg-white border-gray-100 hover:border-black'}`}
                    >
                      <span className="text-xl font-display font-bold">{day}</span>
                      {daySchedule && !isSelected && <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slot Setup Panel */}
          <div className="lg:col-span-6 bg-white dark:bg-card-dark border-4 border-black rounded-[3rem] shadow-brutalist overflow-hidden">
            {selectedDate ? (
              <>
                <div className="p-8 bg-black text-white border-b-2 border-black flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-display font-bold">Slot Architect</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="w-10 h-10 bg-white text-black border-2 border-black rounded-xl hover:rotate-90 transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-10 space-y-10">
                  {/* Setup Controls */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block ml-1">Start</label>
                      <input type="time" value={setupConfig.startTime} onChange={e => setSetupConfig({ ...setupConfig, startTime: e.target.value })} className="w-full h-11 px-3 border-2 border-black rounded-xl font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block ml-1">End</label>
                      <input type="time" value={setupConfig.endTime} onChange={e => setSetupConfig({ ...setupConfig, endTime: e.target.value })} className="w-full h-11 px-3 border-2 border-black rounded-xl font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block ml-1">Slot(m)</label>
                      <input type="number" value={setupConfig.slotDuration} onChange={e => setSetupConfig({ ...setupConfig, slotDuration: Number(e.target.value) })} className="w-full h-11 px-3 border-2 border-black rounded-xl font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block ml-1">Grace</label>
                      <input type="number" value={setupConfig.gracePeriod} onChange={e => setSetupConfig({ ...setupConfig, gracePeriod: Number(e.target.value) })} className="w-full h-11 px-3 border-2 border-black rounded-xl font-bold text-xs" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <h4 className="text-xl font-display font-bold italic">Generated <span className="text-primary not-italic">Slots.</span></h4>
                      <button onClick={handleApplyBaseSlots} className="px-4 py-2 bg-secondary text-black border-2 border-black rounded-xl font-bold text-[9px] uppercase shadow-brutalist-sm hover:translate-y-[-2px] transition-all">Apply Parameters</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2 custom-scrollbar border-2 border-black/5 rounded-[2rem] bg-aura-cream">
                      {selectedDaySchedule?.slots.map((s, i) => {
                        let typeIcon = 'videocam';
                        let typeColor = 'bg-primary';
                        let typeLabel = 'Video';
                        if (s.sessionType === 'Voice') { typeIcon = 'mic'; typeColor = 'bg-secondary'; typeLabel = 'Audio'; }
                        if (s.sessionType === 'Chat') { typeIcon = 'chat'; typeColor = 'bg-card-blue'; typeLabel = 'Text'; }
                        if (s.status === 'off') { typeIcon = 'block'; typeColor = 'bg-gray-200 grayscale'; typeLabel = 'Off'; }

                        const isBooked = s.status === 'booked' || s.status === 'in-progress';

                        return (
                          <div
                            key={i}
                            onClick={() => !isBooked && toggleSlotType(i)}
                            className={`p-5 border-2 border-black rounded-2xl flex flex-col gap-3 transition-all shadow-brutalist-sm relative overflow-hidden ${isBooked ? 'bg-black text-white' : 'bg-white hover:scale-105 cursor-pointer'}`}
                          >
                            <div className="flex justify-between items-start z-10">
                              <div className={`p-2 rounded-lg border-2 border-black transition-colors ${isBooked ? 'bg-white/20' : typeColor}`}>
                                <span className="material-symbols-outlined text-sm font-bold text-white">{isBooked ? 'lock' : typeIcon}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold leading-none">{s.startTime} - {s.endTime}</p>
                                <p className="text-[8px] font-bold opacity-50 mt-1">{s.duration || setupConfig.slotDuration} MINS</p>
                              </div>
                            </div>

                            <div className="z-10 mt-auto flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-widest">{isBooked ? 'Booked Session' : typeLabel}</span>
                              {isBooked && (
                                <span className="text-[10px] font-bold border-b border-primary text-primary">{s.patientId?.displayName || 'Reserved'}</span>
                              )}
                            </div>

                            {isBooked && s.clinicalFormData && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedForm(s.clinicalFormData); }}
                                className="z-20 mt-2 py-1.5 bg-primary text-black text-[8px] font-bold uppercase rounded-lg border border-black shadow-brutalist-sm hover:scale-105 transition-all">
                                View Clinical Form
                              </button>
                            )}

                            {!isBooked && (
                              <div className="absolute top-1 right-1 opacity-10">
                                <span className="material-symbols-outlined text-4xl">edit</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!selectedDaySchedule?.slots.length && (
                        <div className="col-span-full py-10 text-center opacity-40">
                          <p className="text-xs font-bold italic">Set parameters above and "Apply" to create slots.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-black/5 flex gap-4">
                    <button onClick={handlePostSchedule} className="flex-grow py-5 bg-black text-white border-2 border-black rounded-2xl font-bold uppercase text-xs shadow-retro hover:scale-105 transition-all">Synchronize Everything</button>
                    <button onClick={handleClearSlots} className="px-8 py-5 border-2 border-black rounded-2xl font-bold uppercase text-xs hover:bg-red-50 transition-all">Purge Day</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-24 h-24 bg-aura-cream border-2 border-dashed border-black rounded-full flex items-center justify-center opacity-30">
                  <span className="material-symbols-outlined text-4xl">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-medium text-gray-400">Select a date to</h3>
                  <h3 className="text-2xl font-display font-bold text-black dark:text-white">Orchestrate Availability</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-aura-cream dark:bg-aura-black">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-full" />
        <p className="font-display font-bold text-xl">Loading Clinical Workspace...</p>
      </div>
    </div>
  );

  return (
    <div className="pt-28 pb-40 max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 bg-aura-cream dark:bg-background-dark min-h-screen relative font-sans">

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card-dark border-4 border-black rounded-[3rem] shadow-brutalist w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-8 bg-aura-cream border-b-2 border-black flex justify-between items-center">
              <h2 className="text-3xl font-display font-bold italic">Update <span className="text-primary not-italic">Identity.</span></h2>
              <button onClick={() => setIsEditingProfile(false)} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-10 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Full Name</label>
                  <input type="text" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full h-12 px-4 border-2 border-black rounded-xl font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Specialization</label>
                  <input type="text" value={editForm.specialization} onChange={e => setEditForm({ ...editForm, specialization: e.target.value })} className="w-full h-12 px-4 border-2 border-black rounded-xl font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Exp Years</label>
                  <input type="number" value={editForm.experienceYears} onChange={e => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })} className="w-full h-12 px-4 border-2 border-black rounded-xl font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Education</label>
                  <input type="text" value={editForm.education} onChange={e => setEditForm({ ...editForm, education: e.target.value })} className="w-full h-12 px-4 border-2 border-black rounded-xl font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Profile Image URL</label>
                <input type="text" value={editForm.profileImage} onChange={e => setEditForm({ ...editForm, profileImage: e.target.value })} className="w-full h-12 px-4 border-2 border-black rounded-xl font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Bio</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} rows={4} className="w-full p-4 border-2 border-black rounded-xl font-bold text-sm resize-none"></textarea>
              </div>
              <button type="submit" className="w-full py-5 bg-primary text-white border-2 border-black rounded-2xl font-bold uppercase text-xs shadow-retro hover:translate-y-[-2px] transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Form Modal */}
      {selectedForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card-dark border-4 border-black rounded-[4rem] shadow-brutalist w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-10 bg-aura-cream border-b-2 border-black flex justify-between items-center">
              <h2 className="text-3xl font-display font-bold italic">Patient <span className="text-primary not-italic">Intake.</span></h2>
              <button onClick={() => setSelectedForm(null)} className="w-12 h-12 border-2 border-black rounded-2xl flex items-center justify-center shadow-brutalist-sm"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-12 overflow-y-auto max-h-[70vh] space-y-8">
              <div className="pb-4 border-b-2 border-black/5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Form Title</p>
                <p className="text-xl font-bold">{selectedForm.title || "Pre-Session Assessment"}</p>
              </div>
              <div className="space-y-6">
                {Object.entries(selectedForm.responses || {}).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">{key.replace(/_/g, ' ')}</p>
                    <div className="p-6 bg-aura-cream rounded-2xl border-2 border-black italic font-medium">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase text-center pt-8 border-t-2 border-black/5">
                Submitted on {selectedForm.submittedAt ? new Date(selectedForm.submittedAt).toLocaleString() : (selectedForm.filledAt ? new Date(selectedForm.filledAt).toLocaleString() : 'Not submitted yet')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Header */}
      <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] mb-8 border-2 border-black">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live Clinical Suite
          </div>
          <h1 className="text-6xl lg:text-8xl font-display font-bold text-black dark:text-white leading-[0.9]">
            Studio. <span className="italic text-primary">Doctor.</span>
          </h1>
          <p className="text-xl text-gray-500 mt-6 font-medium italic">Welcome back, {profile?.fullName?.split(' ')[0]}. Here is your practice at a glance.</p>
        </div>

        <div className="flex bg-white dark:bg-card-dark border-4 border-black rounded-[2.5rem] p-2 shadow-brutalist items-center">
          <button onClick={() => setActiveTab('schedule')} className={`px-10 py-5 rounded-[1.8rem] font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'schedule' ? 'bg-primary text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('availability')} className={`px-10 py-5 rounded-[1.8rem] font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'availability' ? 'bg-primary text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400'}`}>Availability</button>
          <button onClick={() => setActiveTab('patients')} className={`px-10 py-5 rounded-[1.8rem] font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'patients' ? 'bg-primary text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400'}`}>Patient Vault</button>
        </div>
      </header>

      {/* ── Sanhitha's Module Quick-Access ── */}
      {onNavigate && (
        <section className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">grid_view</span> Doctor Modules
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {([
              { view: AppView.DOCTOR_PROFILE_FORM,    label: 'Profile',          icon: 'badge',            color: 'bg-card-purple' },
              { view: AppView.CLINICAL_FORM_TEMPLATE, label: 'Clinical Forms',   icon: 'description',      color: 'bg-card-blue' },
              { view: AppView.CONSULTATION_NOTES,     label: 'Consultation Notes', icon: 'clinical_notes',  color: 'bg-card-green' },
              { view: AppView.PATIENT_INTAKE_REVIEW,  label: 'Intake Reviews',   icon: 'assignment_ind',   color: 'bg-rose-100' },
              { view: AppView.DOCTOR_REPORTS,         label: 'Reports',          icon: 'analytics',        color: 'bg-black' },
            ] as const).map(m => (
              <button
                key={m.view}
                onClick={() => onNavigate(m.view)}
                className={`${m.color} ${m.color === 'bg-black' ? 'text-white' : 'text-black dark:text-white'} flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl border-2 border-black shadow-brutalist-sm hover:shadow-brutalist hover:translate-y-[-2px] active:translate-y-0 transition-all`}
              >
                <span className="material-symbols-outlined text-2xl">{m.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center">{m.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <main>
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'availability' && renderAvailability()}
        {activeTab === 'patients' && (
          <div className="py-40 text-center border-4 border-dashed border-black/10 rounded-[4rem]">
            <span className="material-symbols-outlined text-8xl text-gray-200 mb-6">database</span>
            <p className="text-2xl font-display font-bold text-gray-300 uppercase tracking-[0.2em]">Archival Data Synchronization in Progress</p>
            <p className="text-gray-400 italic mt-2">Extended patient clinical histories are being moved to the new Daily Records standard.</p>
          </div>
        )}
      </main>

      {/* Patient Summary Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card-dark border-4 border-black rounded-[4rem] shadow-brutalist w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-10 border-b-2 border-black/10 flex justify-between items-center bg-aura-cream">
              <div>
                <h2 className="text-4xl font-display font-bold">Clinical File: {selectedPatient.patient?.displayName}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedPatient.patient?.email}</p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-14 h-14 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-brutalist-sm hover:rotate-90 transition-all">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="p-12 overflow-y-auto space-y-12 custom-scrollbar">
              <div>
                <p className="font-display font-bold text-primary mb-6 uppercase tracking-[0.2em] text-sm">Psychological Trajectory</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {selectedPatient.insights.filter((ins: any) => ins.mood).map((ins: any, i: number) => (
                    <div key={i} className="p-6 bg-aura-cream dark:bg-white/5 rounded-3xl border-2 border-black shadow-brutalist-sm transform hover:rotate-2 transition-transform">
                      <p className="text-[10px] font-bold text-gray-500 mb-4">{new Date(ins.date).toLocaleDateString()}</p>
                      <p className="text-2xl font-bold text-black dark:text-white uppercase tracking-tighter">{ins.mood}</p>
                      <div className="mt-4 flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].slice(0, Math.floor(ins.score || 5)).map(s => (
                          <div key={s} className="w-1.5 h-4 bg-primary rounded-full" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-display font-bold text-primary mb-6 uppercase tracking-[0.2em] text-sm">Journal Reflexes</p>
                <div className="space-y-6">
                  {selectedPatient.journals.map((j: any) => (
                    <div key={j.id} className="p-8 bg-white border-2 border-black rounded-[2.5rem] shadow-brutalist-sm italic text-gray-600 leading-relaxed">
                      "{j.content}"
                      <div className="mt-6 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-primary not-italic">
                        <span>AI Decoding: {j.aiAnalysis?.mood || 'Neutral'}</span>
                        <span className="text-gray-300">{new Date(j.date).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
