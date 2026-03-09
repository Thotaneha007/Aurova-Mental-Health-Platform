import axios from 'axios';
import { authService } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_URL = `${API_BASE}/api/booking`;

const headers = () => ({
    headers: { 'Authorization': `Bearer ${authService.getToken()}` }
});

export const bookingService = {
    // ── INSERT ──
    async createBooking(data: {
        doctorId: string;
        scheduledDate: string;
        scheduledTime: string;
        duration?: number;
        sessionType?: 'Video' | 'Voice' | 'Chat';
        reason?: string;
        symptoms?: string;
        urgencyLevel?: string;
        notes?: string;
    }) {
        const response = await axios.post(API_URL, data, headers());
        return response.data;
    },

    // ── DISPLAY (all) ──
    async getBookings() {
        const response = await axios.get(API_URL, headers());
        return response.data;
    },

    // ── DISPLAY (single) ──
    async getBooking(id: string) {
        const response = await axios.get(`${API_URL}/${id}`, headers());
        return response.data;
    },

    // ── SEARCH ──
    async searchBookings(params: { status?: string; from?: string; to?: string; type?: string; q?: string }) {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.from) query.set('from', params.from);
        if (params.to) query.set('to', params.to);
        if (params.type) query.set('type', params.type);
        if (params.q) query.set('q', params.q);
        const response = await axios.get(`${API_URL}/ops/search?${query.toString()}`, headers());
        return response.data;
    },

    // ── UPDATE ──
    async updateBooking(id: string, data: {
        scheduledDate?: string;
        scheduledTime?: string;
        sessionType?: string;
        duration?: number;
        notes?: string;
        reason?: string;
        symptoms?: string;
        urgencyLevel?: string;
    }) {
        const response = await axios.put(`${API_URL}/${id}`, data, headers());
        return response.data;
    },

    // ── DELETE (cancel) ──
    async cancelBooking(id: string) {
        const response = await axios.delete(`${API_URL}/${id}`, headers());
        return response.data;
    },

    // ── PREREQUISITE FORM: INSERT/UPDATE ──
    async submitForm(bookingId: string, responses: Record<string, any>) {
        const response = await axios.put(`${API_URL}/${bookingId}/form`, { responses }, headers());
        return response.data;
    },

    // ── PREREQUISITE FORM: DISPLAY ──
    async getForm(bookingId: string) {
        const response = await axios.get(`${API_URL}/${bookingId}/form`, headers());
        return response.data;
    },

    // ── PREREQUISITE FORM: DELETE ──
    async clearForm(bookingId: string) {
        const response = await axios.delete(`${API_URL}/${bookingId}/form`, headers());
        return response.data;
    }
};
