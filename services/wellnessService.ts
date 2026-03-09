import axios from 'axios';
import { authService } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BASE = `${API_BASE}/api/wellness`;

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${authService.getToken()}` }
});

// ─── Wellness Preferences ────────────────────────────────────────────────────

export const wellnessPreferenceService = {
    async getAll() {
        const res = await axios.get(`${BASE}/preferences`, authHeaders());
        return res.data.preferences; // WellnessPreference[]
    },
    async create(data: {
        goals: string[];
        preferredActivities: string[];
        sessionDuration: string;
        reminderEnabled: boolean;
        reminderTime: string;
        notes?: string;
    }) {
        const res = await axios.post(`${BASE}/preferences`, data, authHeaders());
        return res.data.preference;
    },
    async update(id: string, data: Partial<Parameters<typeof wellnessPreferenceService.create>[0]>) {
        const res = await axios.put(`${BASE}/preferences/${id}`, data, authHeaders());
        return res.data.preference;
    },
    async remove(id: string) {
        const res = await axios.delete(`${BASE}/preferences/${id}`, authHeaders());
        return res.data;
    }
};

// ─── Mood Entries ────────────────────────────────────────────────────────────

export const moodService = {
    async getAll() {
        const res = await axios.get(`${BASE}/mood`, authHeaders());
        return res.data.entries; // MoodEntry[]
    },
    async create(data: {
        date: string;
        score: number;
        emotions: string[];
        triggers: string[];
        note?: string;
    }) {
        const res = await axios.post(`${BASE}/mood`, data, authHeaders());
        return res.data.entry;
    },
    async update(id: string, data: Partial<Parameters<typeof moodService.create>[0]>) {
        const res = await axios.put(`${BASE}/mood/${id}`, data, authHeaders());
        return res.data.entry;
    },
    async remove(id: string) {
        const res = await axios.delete(`${BASE}/mood/${id}`, authHeaders());
        return res.data;
    }
};

// ─── Breathwork Logs ─────────────────────────────────────────────────────────

export const breathworkService = {
    async getAll() {
        const res = await axios.get(`${BASE}/breathwork`, authHeaders());
        return res.data.logs; // BreathworkLog[]
    },
    async create(data: {
        date: string;
        pattern: string;
        durationMinutes: number;
        rounds: number;
        note?: string;
        feltBefore?: number;
        feltAfter?: number;
    }) {
        const res = await axios.post(`${BASE}/breathwork`, data, authHeaders());
        return res.data.log;
    },
    async update(id: string, data: Partial<Parameters<typeof breathworkService.create>[0]>) {
        const res = await axios.put(`${BASE}/breathwork/${id}`, data, authHeaders());
        return res.data.log;
    },
    async remove(id: string) {
        const res = await axios.delete(`${BASE}/breathwork/${id}`, authHeaders());
        return res.data;
    }
};

// ─── Routine Progress ────────────────────────────────────────────────────────

export const routineService = {
    async getAll() {
        const res = await axios.get(`${BASE}/routine`, authHeaders());
        return res.data.entries; // RoutineProgress[]
    },
    async create(data: {
        date: string;
        routineTitle: string;
        completedSteps: number;
        totalSteps: number;
        durationMinutes: number;
        note?: string;
    }) {
        const res = await axios.post(`${BASE}/routine`, data, authHeaders());
        return res.data.entry;
    },
    async update(id: string, data: Partial<Parameters<typeof routineService.create>[0]>) {
        const res = await axios.put(`${BASE}/routine/${id}`, data, authHeaders());
        return res.data.entry;
    },
    async remove(id: string) {
        const res = await axios.delete(`${BASE}/routine/${id}`, authHeaders());
        return res.data;
    }
};

// ─── SoulFeed Suggestions ────────────────────────────────────────────────────

export const soulFeedService = {
    async getAll() {
        const res = await axios.get(`${BASE}/soulfeed`, authHeaders());
        return res.data.suggestions; // SoulFeedSuggestion[]
    },
    async create(data: {
        name: string;
        knownFor: string;
        struggle: string;
        whyInspires: string;
    }) {
        const res = await axios.post(`${BASE}/soulfeed`, data, authHeaders());
        return res.data.suggestion;
    },
    async update(id: string, data: Partial<Parameters<typeof soulFeedService.create>[0]>) {
        const res = await axios.put(`${BASE}/soulfeed/${id}`, data, authHeaders());
        return res.data.suggestion;
    },
    async remove(id: string) {
        const res = await axios.delete(`${BASE}/soulfeed/${id}`, authHeaders());
        return res.data;
    }
};
