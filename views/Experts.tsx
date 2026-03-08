
import React, { useState, useMemo, useEffect } from 'react';
import { doctorService } from '../services/doctorService';

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  duration?: number;
  status: 'available' | 'booked' | 'in-progress' | 'completed' | 'off';
  sessionType: 'Video' | 'Voice' | 'Chat';
}

interface DailySchedule {
  date: string;
  slots: Slot[];
}

interface Review {
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Expert {
  id: string;
  userId: string;
  name: string;
  title: string;
  category: string;
  specialties: string[];
  experience: number;
  rating: number;
  consultations: number;
  img: string;
  about: string;
  education: string;
  reviews: Review[];
  dailySchedules: DailySchedule[];
  verified: boolean;
  activeFormId?: string;
  clinicalForms?: any[];
}

interface ExpertsProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

const Experts: React.FC<ExpertsProps> = ({ onBack, isLoggedIn, onAuthRequired }) => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'default'>('default');

  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [lockedSlot, setLockedSlot] = useState<{ slotId: string; date: string; clinicalForm: any } | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<'Video' | 'Voice' | 'Chat'>('Video');
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [pendingForms, setPendingForms] = useState<any[]>([]);
  const [activePendingForm, setActivePendingForm] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

  const fetchPendingForms = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await doctorService.getPendingPatientForms();
      setPendingForms(data || []);
    } catch (err) {
      console.error("Failed to fetch pending forms:", err);
    }
  };

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const data = await doctorService.getDiscovery();
        const formatted = data.map((d: any) => ({
          id: d._id,
          userId: d.userId?._id,
          name: d.fullName,
          title: d.specialization,
          category: d.specialization,
          specialties: [d.specialization, 'Mental Wellness'],
          experience: d.experienceYears || 5,
          rating: d.stats?.avgRating || 0,
          consultations: d.stats?.meetingsTaken || 0,
          img: d.profileImage || `https://i.pravatar.cc/150?u=${d._id}`,
          about: d.bio,
          education: d.education || 'Medical Degree',
          reviews: d.reviews || [],
          dailySchedules: d.dailySchedules || [],
          verified: d.isVerified,
          activeFormId: d.activeFormId,
          clinicalForms: d.clinicalForms || []
        }));
        setExperts(formatted);
      } catch (err) {
        console.error("Failed to fetch expert discovery list:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExperts();
    fetchPendingForms();
  }, [isLoggedIn]);

  const categories = useMemo(() => {
    const cats = new Set(['All']);
    experts.forEach(e => cats.add(e.category));
    return Array.from(cats);
  }, [experts]);

  const filteredAndSortedExperts = useMemo(() => {
    let result = experts.filter(e => {
      const matchCat = activeCategory === 'All' || e.category === activeCategory;
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'experience') result.sort((a, b) => b.experience - a.experience);

    return result;
  }, [experts, activeCategory, searchQuery, sortBy]);

  const selectedExpert = useMemo(() => experts.find(e => e.id === selectedExpertId), [experts, selectedExpertId]);

  const availableDates = useMemo(() => {
    if (!selectedExpert) return [];
    const today = new Date().toISOString().split('T')[0];
    return selectedExpert.dailySchedules
      .filter(ds => ds.date >= today && ds.slots.some(s => s.status === 'available'))
      .map(ds => ds.date);
  }, [selectedExpert]);

  const activeSlots = useMemo(() => {
    if (!selectedExpert || !bookingDate) return [];
    const day = selectedExpert.dailySchedules.find(ds => ds.date === bookingDate);
    return day ? day.slots.filter(s => s.status === 'available') : [];
  }, [selectedExpert, bookingDate]);

  // Step 1: Lock the slot
  const handleLockSlot = async (slotId: string) => {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }
    if (!selectedExpert || !bookingDate) return;

    setBookingInProgress(true);
    try {
      const result = await doctorService.lockSlot(selectedExpert.userId, bookingDate, slotId);
      setLockedSlot({
        slotId,
        date: bookingDate,
        clinicalForm: result.clinicalForm
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reserve slot. It may have been taken.');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Step 2: Confirm booking (payment + booking), then form is filled post-booking
  const handleConfirmBooking = async () => {
    if (!selectedExpert || !lockedSlot) return;

    setBookingInProgress(true);
    try {
      const result = await doctorService.bookSlot(
        selectedExpert.userId,
        lockedSlot.date,
        lockedSlot.slotId,
        selectedSessionType,
        true
      );

      setBookingSuccess(result);
      setLockedSlot(null);
      await fetchPendingForms();

      if (result?.prerequisiteFormRequired && result?.consultation?.id) {
        const latestPending = await doctorService.getPendingPatientForms();
        const target = (latestPending || []).find((f: any) => f.consultationId === result.consultation.id);
        if (target) {
          const initial: Record<string, any> = {};
          (target.form?.fieldsSnapshot || []).forEach((field: any, idx: number) => {
            const key = field.key || field.label || `field_${idx + 1}`;
            if (field.type === 'checkbox') initial[key] = false;
            else if (field.type === 'multiselect') initial[key] = [];
            else initial[key] = '';
          });
          setFormResponses(initial);
          setActivePendingForm(target);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Cancel the locked slot
  const handleCancelLock = async () => {
    if (!selectedExpert || !lockedSlot) return;

    try {
      await doctorService.unlockSlot(selectedExpert.userId, lockedSlot.date, lockedSlot.slotId);
    } catch (err) {
      console.error('Failed to unlock slot:', err);
    }
    setLockedSlot(null);
  };

  const handleSubmitPendingForm = async () => {
    if (!activePendingForm?.consultationId) return;
    try {
      await doctorService.submitPatientForm(activePendingForm.consultationId, formResponses);
      setActivePendingForm(null);
      setFormResponses({});
      await fetchPendingForms();
      alert('Prerequisite form submitted successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit form.');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-aura-cream dark:bg-background-dark">
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 border-8 border-primary border-t-black rounded-full animate-spin"></div>
        <p className="font-display font-bold text-2xl text-black">Opening Clinical Records...</p>
      </div>
    </div>
  );

  if (selectedExpert) {
    return (
      <div className="pt-24 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <button onClick={() => { setSelectedExpertId(null); setBookingDate(null); }} className="flex items-center gap-2 mb-12 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-2 transition-transform">keyboard_backspace</span> Back to Directory
        </button>

        <div className="grid lg:grid-cols-12 gap-12">

          {/* Left: Identity & Creds */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-white dark:bg-card-dark border-4 border-black rounded-[3.5rem] p-10 shadow-brutalist relative overflow-hidden">
              <div className="aspect-square rounded-[2.5rem] border-4 border-black overflow-hidden mb-8 shadow-brutalist-sm group">
                <img src={selectedExpert.img} alt={selectedExpert.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-display font-bold">{selectedExpert.name}</h2>
                <p className="text-primary font-bold uppercase tracking-widest text-xs italic">{selectedExpert.title}</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="px-3 py-1 bg-aura-cream border-2 border-black rounded-lg text-[9px] font-bold uppercase tracking-widest">{selectedExpert.experience} Yrs Exp</span>
                  {selectedExpert.verified && <span className="px-3 py-1 bg-secondary border-2 border-black rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">verified</span> Verified</span>}
                </div>
              </div>
            </div>

            {/* Rating Card */}
            <div className="bg-card-yellow p-10 rounded-[3.5rem] border-4 border-black shadow-brutalist flex flex-col items-center text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Practice Trust Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-display font-bold">{selectedExpert.rating || 'N/A'}</span>
                <span className="text-2xl font-bold opacity-30">/5.0</span>
              </div>
              <div className="flex gap-1 mt-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className="material-symbols-outlined text-black font-bold">{s <= Math.round(selectedExpert.rating) ? 'star' : 'star_outline'}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Availability & Reviews */}
          <div className="lg:col-span-8 space-y-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-8 border-b-2 border-black/5 pb-4">Specialist Manifesto</p>
              <h3 className="text-4xl font-display leading-[1.1] text-black italic mb-8">"{selectedExpert.about}"</h3>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest">Medical Credentials</h4>
                  <div className="flex items-center gap-4 bg-white border-2 border-black p-6 rounded-2xl shadow-brutalist-sm">
                    <span className="material-symbols-outlined text-primary text-3xl">school</span>
                    <span className="font-bold text-sm tracking-tight">{selectedExpert.education}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest">Core Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpert.specialties.map(s => (
                      <span key={s} className="px-5 py-3 bg-aura-cream border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-widest">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {pendingForms.length > 0 && (
              <div className="bg-card-yellow border-4 border-black rounded-[3rem] p-8 shadow-brutalist">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-4">Pending Prerequisite Forms</p>
                <div className="space-y-3">
                  {pendingForms.map((item: any) => (
                    <button
                      key={item.consultationId}
                      onClick={() => {
                        const initial: Record<string, any> = {};
                        (item.form?.fieldsSnapshot || []).forEach((field: any, idx: number) => {
                          const key = field.key || field.label || `field_${idx + 1}`;
                          if (field.type === 'checkbox') initial[key] = false;
                          else if (field.type === 'multiselect') initial[key] = [];
                          else initial[key] = '';
                        });
                        setFormResponses(initial);
                        setActivePendingForm(item);
                      }}
                      className="w-full text-left bg-white border-2 border-black rounded-2xl p-4 hover:-translate-y-0.5 transition-all"
                    >
                      <p className="text-xs font-bold">{item.form?.title || 'Prerequisite Form'}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.doctor?.name} • {new Date(item.scheduledTime).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Engine */}
            <div className="bg-white dark:bg-card-dark border-4 border-black rounded-[4rem] shadow-brutalist overflow-hidden">
              <div className="p-10 bg-black text-white flex justify-between items-center">
                <h3 className="text-3xl font-display font-bold italic">Schedule <span className="text-primary not-italic">Encounter.</span></h3>
                <span className="material-symbols-outlined text-4xl">calendar_month</span>
              </div>
              <div className="p-12 space-y-10">
                {availableDates.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">1. Select Appointment Window</p>
                      <div className="flex flex-wrap gap-3">
                        {availableDates.map(date => (
                          <button
                            key={date}
                            onClick={() => setBookingDate(date)}
                            className={`px-6 py-4 rounded-2xl border-2 font-bold text-xs uppercase transition-all ${bookingDate === date ? 'bg-primary text-white border-black shadow-retro scale-105' : 'bg-aura-cream border-black hover:bg-white'}`}
                          >
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </button>
                        ))}
                      </div>
                    </div>

                    {bookingDate ? (
                      <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">2. Choose Synchronous Format</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          {activeSlots.map(slot => (
                            <button
                              key={slot._id}
                              onClick={() => handleLockSlot(slot._id)}
                              disabled={bookingInProgress}
                              className="bg-white border-2 border-black p-6 rounded-3xl shadow-brutalist-sm hover:-translate-y-2 transition-all group text-left disabled:opacity-50"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg border-2 border-black ${slot.sessionType === 'Video' ? 'bg-primary' : slot.sessionType === 'Voice' ? 'bg-secondary' : 'bg-card-blue'}`}>
                                  <span className="material-symbols-outlined text-sm text-white font-bold">{slot.sessionType === 'Video' ? 'videocam' : slot.sessionType === 'Voice' ? 'mic' : 'chat'}</span>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity">Select</span>
                              </div>
                              <p className="text-xl font-display font-bold leading-none">{slot.startTime}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{slot.sessionType === 'Voice' ? 'Audio' : slot.sessionType === 'Chat' ? 'Text' : 'Video'} • {slot.duration || 30}m</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center border-2 border-dashed border-black/10 rounded-3xl italic text-gray-400 font-medium">Select a date above to view available clinical slots.</div>
                    )}
                  </>
                ) : (
                  <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-200 mb-6 font-bold">event_busy</span>
                    <h4 className="text-2xl font-display font-medium text-gray-400 italic">This specialist is currently at full capacity for the next 7 days.</h4>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-8 border-b-2 border-black/5 pb-4">Clinical Testimonials</p>
              {selectedExpert.reviews.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {selectedExpert.reviews.map((rev, i) => (
                    <div key={i} className="bg-aura-cream p-8 rounded-[2.5rem] border-2 border-black shadow-brutalist-sm relative group">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="font-bold text-sm">{rev.patientName || 'Anonymous'}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(rev.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className="material-symbols-outlined text-xs text-secondary font-bold">{s <= rev.rating ? 'star' : 'star_outline'}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                      <span className="material-symbols-outlined absolute -bottom-2 -right-2 text-black/5 text-6xl group-hover:text-primary/10 transition-colors">format_quote</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center opacity-40">
                  <p className="text-sm font-bold italic">No review records found for this clinical branch yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {lockedSlot && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] border-4 border-black shadow-brutalist max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-primary border-b-4 border-black">
                <h3 className="text-2xl font-display font-bold text-white">Complete Your Booking</h3>
                <p className="text-white/70 text-sm mt-1">Slot reserved for 10 minutes</p>
              </div>

              <div className="p-8 space-y-8">
                {/* Session Type Selection */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">1. Select Session Type</p>
                  <div className="grid grid-cols-3 gap-4">
                    {(['Video', 'Voice', 'Chat'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedSessionType(type)}
                        className={`p-4 rounded-2xl border-2 border-black text-center transition-all ${selectedSessionType === type ? 'bg-primary text-white scale-105' : 'bg-white hover:bg-gray-50'
                          }`}
                      >
                        <span className="material-symbols-outlined text-2xl mb-1">
                          {type === 'Video' ? 'videocam' : type === 'Voice' ? 'mic' : 'chat'}
                        </span>
                        <p className="text-xs font-bold uppercase">{type}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prerequisite Form Notice */}
                {lockedSlot.clinicalForm && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">2. Prerequisite Form</p>
                    <div className="bg-aura-cream p-6 rounded-2xl border-2 border-black space-y-4">
                      <h4 className="font-bold text-lg">{lockedSlot.clinicalForm.title}</h4>
                      <p className="text-sm text-gray-700">
                        This form will be sent right after payment and booking confirmation.
                        You can complete it from your pending forms panel.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCancelLock}
                    className="flex-1 py-4 px-6 border-2 border-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingInProgress}
                    className="flex-1 py-4 px-6 bg-primary text-white border-2 border-black rounded-2xl font-bold text-sm uppercase tracking-widest shadow-brutalist-sm hover:-translate-y-1 transition-all disabled:opacity-50"
                  >
                    {bookingInProgress ? 'Processing...' : 'Pay & Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Success Modal */}
        {bookingSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] border-4 border-black shadow-brutalist max-w-md w-full text-center p-12 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black">
                <span className="material-symbols-outlined text-4xl text-white">check</span>
              </div>
              <h3 className="text-3xl font-display font-bold mb-4">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-8">
                Your appointment with <strong>{selectedExpert.name}</strong> has been scheduled.
              </p>
              <div className="bg-aura-cream p-6 rounded-2xl border-2 border-black mb-8">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Appointment Details</p>
                <p className="text-lg font-bold">{new Date(bookingSuccess.consultation?.scheduledTime).toLocaleString()}</p>
                <p className="text-sm text-gray-600">{bookingSuccess.consultation?.sessionType} Session</p>
                {bookingSuccess.prerequisiteFormRequired && (
                  <p className="text-xs text-primary font-bold mt-2">Prerequisite form pending. Please submit it before your session.</p>
                )}
              </div>
              <button
                onClick={() => { setBookingSuccess(null); setSelectedExpertId(null); setBookingDate(null); }}
                className="w-full py-4 bg-black text-white border-2 border-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:-translate-y-1 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {activePendingForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] border-4 border-black shadow-brutalist max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8 bg-black text-white border-b-4 border-black flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-bold">Complete Prerequisite Form</h3>
                  <p className="text-xs text-white/70 mt-1">{activePendingForm.form?.title}</p>
                </div>
                <button
                  onClick={() => { setActivePendingForm(null); setFormResponses({}); }}
                  className="w-10 h-10 border-2 border-white rounded-xl flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 space-y-5">
                {(activePendingForm.form?.fieldsSnapshot || []).map((field: any, idx: number) => {
                  const fieldKey = field.key || field.label || `field_${idx + 1}`;
                  return (
                    <div key={fieldKey} className="space-y-2">
                      {field.referenceImage && (
                        <img
                          src={field.referenceImage}
                          alt="Question reference"
                          className="w-full max-h-48 object-cover rounded-xl border-2 border-black"
                        />
                      )}
                      <label className="text-sm font-bold block">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.type === 'select' && (
                        <select
                          value={formResponses[fieldKey] || ''}
                          onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          className="w-full p-3 border-2 border-black rounded-xl"
                        >
                          <option value="">Select...</option>
                          {(field.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}

                      {field.type === 'radio' && (
                        <div className="space-y-2">
                          {(field.options || []).map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`radio_${fieldKey}`}
                                checked={formResponses[fieldKey] === opt}
                                onChange={() => setFormResponses(prev => ({ ...prev, [fieldKey]: opt }))}
                                className="w-4 h-4"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'multiselect' && (
                        <div className="space-y-2">
                          {(field.options || []).map((opt: string) => {
                            const selected = Array.isArray(formResponses[fieldKey]) && formResponses[fieldKey].includes(opt);
                            return (
                              <label key={opt} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => {
                                    const current = Array.isArray(formResponses[fieldKey]) ? formResponses[fieldKey] : [];
                                    const next = selected ? current.filter((v: string) => v !== opt) : [...current, opt];
                                    setFormResponses(prev => ({ ...prev, [fieldKey]: next }));
                                  }}
                                  className="w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {field.type === 'checkbox' && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(formResponses[fieldKey])}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldKey]: e.target.checked }))}
                            className="w-5 h-5"
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          value={formResponses[fieldKey] || ''}
                          onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          rows={4}
                          minLength={field.minLength ? Number(field.minLength) : undefined}
                          maxLength={field.maxLength ? Number(field.maxLength) : undefined}
                          className="w-full p-3 border-2 border-black rounded-xl resize-none"
                        />
                      )}

                      {field.type === 'image' && (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={formResponses[fieldKey] || ''}
                            placeholder={field.placeholder || 'https://example.com/photo.jpg'}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                            className="w-full p-3 border-2 border-black rounded-xl"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black rounded-xl text-xs font-bold uppercase cursor-pointer bg-white">
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => setFormResponses(prev => ({ ...prev, [fieldKey]: String(reader.result || '') }));
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {formResponses[fieldKey] && (
                            <img src={formResponses[fieldKey]} alt="Uploaded response" className="w-full max-h-48 object-cover rounded-xl border-2 border-black" />
                          )}
                        </div>
                      )}

                      {!['select', 'radio', 'multiselect', 'checkbox', 'textarea', 'image'].includes(field.type) && (
                        <input
                          type={
                            field.type === 'number' ? 'number'
                              : field.type === 'date' ? 'date'
                                : field.type === 'email' ? 'email'
                                  : field.type === 'phone' ? 'tel'
                                    : field.type === 'url' ? 'url'
                                      : 'text'
                          }
                          value={formResponses[fieldKey] || ''}
                          placeholder={field.placeholder || ''}
                          onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          min={field.type === 'number' && field.min !== undefined ? Number(field.min) : undefined}
                          max={field.type === 'number' && field.max !== undefined ? Number(field.max) : undefined}
                          minLength={field.minLength ? Number(field.minLength) : undefined}
                          maxLength={field.maxLength ? Number(field.maxLength) : undefined}
                          pattern={field.pattern || (field.type === 'phone' ? '[0-9+()\\-\\s]{7,20}' : undefined)}
                          className="w-full p-3 border-2 border-black rounded-xl"
                        />
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => { setActivePendingForm(null); setFormResponses({}); }}
                    className="flex-1 py-3 border-2 border-black rounded-xl font-bold text-xs uppercase"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleSubmitPendingForm}
                    className="flex-1 py-3 bg-primary text-white border-2 border-black rounded-xl font-bold text-xs uppercase"
                  >
                    Submit Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-24 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 selection:bg-primary selection:text-white">
      <header className="mb-10">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-primary transition-all active:translate-y-1">
          <span className="material-symbols-outlined text-sm">west</span> Back to Hub
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-block bg-primary text-white px-3 py-1 rounded-lg border-2 border-black text-[9px] font-bold uppercase tracking-[0.3em] shrink-0">Specialist Directory</div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-black leading-tight">
              Clinical <span className="italic text-primary">Experts.</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium max-w-md leading-relaxed hidden lg:block">
            Vetted professional support for every dimension of your clinical journey.
          </p>
        </div>
      </header>

      {/* Search & Categories */}
      <div className="bg-white dark:bg-card-dark border-4 border-black p-6 rounded-[3rem] shadow-brutalist mb-20 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-grow relative h-16">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-black/20 text-2xl">search</span>
            <input
              type="text"
              placeholder="Search for Specialists, Expertise or Keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-aura-cream border-2 border-black rounded-2xl pl-16 pr-6 font-bold text-sm focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-4 h-16">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-8 bg-white border-2 border-black rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-brutalist-sm focus:border-primary"
            >
              <option value="default">Sort: Default</option>
              <option value="rating">Sort: Top Rated</option>
              <option value="experience">Sort: Seniority</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-6 border-t-2 border-black/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-4 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-black text-white border-black shadow-retro scale-105' : 'bg-white border-black/5 hover:border-black'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {filteredAndSortedExperts.length > 0 ? filteredAndSortedExperts.map((expert, i) => (
          <div
            key={expert.id}
            onClick={() => setSelectedExpertId(expert.id)}
            className="bg-white dark:bg-card-dark border-4 border-black rounded-[4rem] p-12 shadow-brutalist hover:shadow-brutalist-hover hover:-translate-y-4 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-10">
              <div className="w-28 h-28 rounded-[2.5rem] border-4 border-black overflow-hidden shadow-brutalist-sm group-hover:rotate-6 transition-transform relative z-10">
                <img src={expert.img} alt={expert.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].slice(0, Math.round(expert.rating || 5)).map(s => <span key={s} className="material-symbols-outlined text-[12px] text-primary font-bold">star</span>)}
                </div>
                <span className="text-[10px] font-black uppercase text-gray-300 group-hover:text-black transition-colors">{expert.experience} Yrs Professional</span>
              </div>
            </div>

            <div className="flex-grow space-y-4">
              <h3 className="text-4xl font-display font-bold leading-tight group-hover:text-primary transition-colors">{expert.name}</h3>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-4 h-[2px] bg-primary" /> {expert.title}
              </p>
              <p className="text-sm text-gray-400 italic font-medium leading-relaxed line-clamp-3 pt-4 border-t-2 border-black/5">
                "{expert.about || 'Specialist in holistic mental wellness and clinical psychology.'}"
              </p>
            </div>

            <div className="mt-12 pt-10 border-t-4 border-black flex items-center justify-between">
              <span className="text-3xl font-display font-bold group-hover:italic transition-all">Clinical Record</span>
              <button className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-retro group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined">north_east</span>
              </button>
            </div>

            {/* Background Accent */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-aura-cream rounded-full opacity-50 group-hover:scale-150 transition-transform duration-1000" />
          </div>
        )) : (
          <div className="col-span-full py-40 text-center border-4 border-dashed border-black/10 rounded-[5rem]">
            <span className="material-symbols-outlined text-8xl text-gray-200 mb-8 animate-pulse">clinical_notes</span>
            <h4 className="text-3xl font-display font-bold text-gray-300 italic">No clinical matches found in the current directory.</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default Experts;
