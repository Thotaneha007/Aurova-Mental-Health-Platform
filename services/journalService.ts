import axios from 'axios';
import { authService } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_URL = `${API_BASE}/api/journal`;

const headers = () => ({
    headers: { 'Authorization': `Bearer ${authService.getToken()}` }
});

export const journalService = {
    // ── INSERT ──
    async createEntry(content: string, aiAnalysis: any, mood?: string, tags?: string[], isPrivate?: boolean) {
        const response = await axios.post(API_URL, { content, aiAnalysis, mood, tags, isPrivate }, headers());
        return response.data;
    },

    // ── DISPLAY (all) ──
    async getEntries() {
        const response = await axios.get(API_URL, headers());
        return response.data;
    },

    // ── DISPLAY (single) ──
    async getEntry(id: string) {
        const response = await axios.get(`${API_URL}/${id}`, headers());
        return response.data;
    },

    // ── SEARCH ──
    async searchEntries(params: { q?: string; mood?: string; from?: string; to?: string; tag?: string }) {
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.mood) query.set('mood', params.mood);
        if (params.from) query.set('from', params.from);
        if (params.to) query.set('to', params.to);
        if (params.tag) query.set('tag', params.tag);
        const response = await axios.get(`${API_URL}/ops/search?${query.toString()}`, headers());
        return response.data;
    },

    // ── UPDATE ──
    async updateEntry(id: string, data: { content?: string; mood?: string; tags?: string[]; isPrivate?: boolean; aiAnalysis?: any }) {
        const response = await axios.put(`${API_URL}/${id}`, data, headers());
        return response.data;
    },

    // ── DELETE ──
    async deleteEntry(id: string) {
        const response = await axios.delete(`${API_URL}/${id}`, headers());
        return response.data;
    }
};
