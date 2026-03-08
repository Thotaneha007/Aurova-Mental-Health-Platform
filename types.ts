
export enum AppView {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  DOCTOR_DASHBOARD = 'doctor_dashboard',
  JOURNAL = 'journal',
  CHAT = 'chat',
  REPORTS = 'reports',
  COMMUNITY = 'community',
  EXPERTS = 'experts',
  RESOURCES = 'resources',
  SOUL_FEED = 'soul_feed',
  LOGIN = 'login',
  SIGNUP = 'signup',
  FORGOT_PASSWORD = 'forgot_password',
  CHECK_EMAIL = 'check_email',
  RESET_PASSWORD = 'reset_password',
  // Forms - Shaik (Core User Experience)
  USER_PROFILE = 'user_profile',
  JOURNAL_CRUD = 'journal_crud',
  BOOKING_MANAGEMENT = 'booking_management',
  CONSULTATION_FORM = 'consultation_form',
  // Forms - Sanhitha (Doctor Management, Clinical Ops)
  DOCTOR_PROFILE_FORM = 'doctor_profile_form',
  CLINICAL_FORM_TEMPLATE = 'clinical_form_template',
  CONSULTATION_NOTES = 'consultation_notes',
  AVAILABILITY_SLOTS = 'availability_slots',
  PATIENT_INTAKE_REVIEW = 'patient_intake_review',
  DOCTOR_REPORTS = 'doctor_reports',
  // Forms - Neha (Wellness)
  WELLNESS_PREFERENCE = 'wellness_preference',
  MOOD_TRACKER = 'mood_tracker',
  BREATHWORK_LOG = 'breathwork_log',
  ROUTINE_PROGRESS = 'routine_progress',
  SOULFEED_INTERACT = 'soulfeed_interact'
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
  analysis?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  riskLevel?: string;
  provider?: 'groq' | 'gemini' | 'fallback' | 'safety';
  retrievedCount?: number;
  isCrisis?: boolean;
}

export interface MoodData {
  day: string;
  score: number;
}

export interface Meeting {
  id: string;
  patientName?: string;
  doctorName?: string;
  doctorImg?: string;
  date: string;
  time: string;
  type: 'Video' | 'Audio' | 'Chat';
  status: 'upcoming' | 'completed' | 'cancelled';
}

export type UserRole = 'user' | 'doctor' | 'anonymous';

export interface UserProfile {
  id?: string;
  email?: string;
  displayName?: string;
  name?: string; // fallback for current usage
  isAnonymous: boolean;
  role: UserRole;
}

// ── Wellness / Neha Forms ─────────────────────────────────────────

export interface WellnessPreference {
  id: string;
  goals: string[];
  preferredActivities: string[];
  sessionDuration: '5min' | '10min' | '20min' | '30min+';
  reminderEnabled: boolean;
  reminderTime: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  score: number; // 1-10
  emotions: string[];
  note: string;
  triggers: string[];
}

export interface BreathworkLog {
  id: string;
  date: string;
  pattern: string;
  durationMinutes: number;
  rounds: number;
  note: string;
  feltBefore: number;
  feltAfter: number;
}

export interface RoutineProgress {
  id: string;
  date: string;
  routineTitle: string;
  completedSteps: number;
  totalSteps: number;
  note: string;
  durationMinutes: number;
}

export interface SoulFeedSuggestion {
  id: string;
  name: string;
  knownFor: string;
  struggle: string;
  whyInspires: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ── Booking / Consultation (Shaik) ────────────────────────

export interface Booking {
  id: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorImage?: string;
  scheduledTime: string;
  duration: number;
  sessionType: 'Video' | 'Voice' | 'Chat';
  status: 'upcoming' | 'in-session' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  symptoms?: string;
  urgencyLevel?: string;
  notes?: string;
  formStatus?: 'pending' | 'submitted' | 'not-required';
  createdAt: string;
}

