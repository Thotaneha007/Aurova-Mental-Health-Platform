import axios from 'axios';
import { authService } from './auth';

const API_URL = 'http://localhost:5000/api/doctor';

const getHeaders = () => ({
    headers: { 'Authorization': `Bearer ${authService.getToken()}` }
});

export const doctorService = {
    // ==================== PROFILE ====================
    async getProfile() {
        const response = await axios.get(`${API_URL}/profile`, getHeaders());
        return response.data;
    },

    async updateProfile(profileData: any) {
        const response = await axios.put(`${API_URL}/profile`, profileData, getHeaders());
        return response.data;
    },

    // ==================== DISCOVERY (For Patients) ====================
    async getDiscovery() {
        const response = await axios.get(`${API_URL}/discovery`, getHeaders());
        return response.data;
    },

    // ==================== SLOT OPERATIONS ====================
    async lockSlot(doctorId: string, date: string, slotId: string) {
        const response = await axios.post(`${API_URL}/slots/lock`,
            { doctorId, date, slotId }, getHeaders());
        return response.data;
    },

    async unlockSlot(doctorId: string, date: string, slotId: string) {
        const response = await axios.post(`${API_URL}/slots/unlock`,
            { doctorId, date, slotId }, getHeaders());
        return response.data;
    },

    async bookSlot(
        doctorId: string,
        date: string,
        slotId: string,
        sessionType?: string,
        paymentConfirmed: boolean = true,
        anonymousBooking: boolean = false
    ) {
        const response = await axios.post(`${API_URL}/slots/book`,
            { doctorId, date, slotId, sessionType, paymentConfirmed, anonymousBooking }, getHeaders());
        return response.data;
    },

    async cancelSlot(date: string, slotId: string) {
        const response = await axios.post(`${API_URL}/slots/cancel`,
            { date, slotId }, getHeaders());
        return response.data;
    },

    // ==================== PATIENT BOOKINGS (For Patients) ====================
    async getPatientBookings() {
        const response = await axios.get(`${API_URL}/patient/bookings`, getHeaders());
        return response.data;
    },

    async getPendingPatientForms() {
        const response = await axios.get(`${API_URL}/patient/forms/pending`, getHeaders());
        return response.data;
    },

    async submitPatientForm(consultationId: string, responses: Record<string, any>) {
        const response = await axios.post(`${API_URL}/patient/consultations/${consultationId}/form`, { responses }, getHeaders());
        return response.data;
    },

    // ==================== CONSULTATIONS (For Doctors) ====================
    async getConsultations() {
        const response = await axios.get(`${API_URL}/consultations`, getHeaders());
        return response.data;
    },

    async getUpcomingConsultations() {
        const response = await axios.get(`${API_URL}/consultations/upcoming`, getHeaders());
        return response.data;
    },

    async updateConsultationNotes(id: string, notes: string) {
        const response = await axios.put(`${API_URL}/consultations/${id}/notes`, { notes }, getHeaders());
        return response.data;
    },

    // ==================== STATS (For Doctors) ====================
    async getStats() {
        const response = await axios.get(`${API_URL}/stats`, getHeaders());
        return response.data;
    },

    // ==================== CLINICAL FORMS ====================
    async createForm(title: string, description: string, fields: any[]) {
        const response = await axios.post(`${API_URL}/forms`,
            { title, description, fields }, getHeaders());
        return response.data;
    },

    async getForms() {
        const response = await axios.get(`${API_URL}/forms`, getHeaders());
        return response.data;
    },

    async getForm(formId: string) {
        const response = await axios.get(`${API_URL}/forms/${formId}`, getHeaders());
        return response.data;
    },

    async updateForm(formId: string, payload: any) {
        const response = await axios.put(`${API_URL}/forms/${formId}`, payload, getHeaders());
        return response.data;
    },

    async deleteForm(formId: string) {
        const response = await axios.delete(`${API_URL}/forms/${formId}`, getHeaders());
        return response.data;
    },

    async activateForm(formId: string) {
        const response = await axios.put(`${API_URL}/forms/${formId}/activate`, {}, getHeaders());
        return response.data;
    },

    async deactivateForm() {
        const response = await axios.put(`${API_URL}/forms/deactivate`, {}, getHeaders());
        return response.data;
    },

    // ==================== PATIENT VAULT (For Doctors) ====================
    async getPatientVault() {
        const response = await axios.get(`${API_URL}/vault`, getHeaders());
        return response.data;
    },

    async getPatientSummary(patientId: string) {
        const response = await axios.get(`${API_URL}/patients/${patientId}/summary`, getHeaders());
        return response.data;
    },

    // ==================== ADDITIONAL CRUD (Sanhitha AC) ====================

    // Profile DELETE
    async deleteProfile() {
        const response = await axios.delete(`${API_URL}/profile`, getHeaders());
        return response.data;
    },

    // Consultation CRUD
    async getConsultation(id: string) {
        const response = await axios.get(`${API_URL}/consultations/${id}`, getHeaders());
        return response.data;
    },
    async searchConsultations(params: { q?: string; status?: string; from?: string; to?: string }) {
        const response = await axios.get(`${API_URL}/consultations/search`, { ...getHeaders(), params });
        return response.data;
    },
    async deleteConsultationNotes(id: string) {
        const response = await axios.delete(`${API_URL}/consultations/${id}/notes`, getHeaders());
        return response.data;
    },
    async updateConsultationStatus(id: string, status: string) {
        const response = await axios.put(`${API_URL}/consultations/${id}/status`, { status }, getHeaders());
        return response.data;
    },

    // Slot CRUD
    async getSlotsByDate(date: string) {
        const response = await axios.get(`${API_URL}/slots/${date}`, getHeaders());
        return response.data;
    },
    async createSlot(data: { date: string; startTime: string; endTime: string; duration?: number; sessionType?: string }) {
        const response = await axios.post(`${API_URL}/slots`, data, getHeaders());
        return response.data;
    },
    async updateSlot(date: string, slotId: string, data: any) {
        const response = await axios.put(`${API_URL}/slots/${date}/${slotId}`, data, getHeaders());
        return response.data;
    },
    async deleteSlot(date: string, slotId: string) {
        const response = await axios.delete(`${API_URL}/slots/${date}/${slotId}`, getHeaders());
        return response.data;
    },
    async searchSlots(params: { from?: string; to?: string; status?: string; sessionType?: string }) {
        const response = await axios.get(`${API_URL}/slots/ops/search`, { ...getHeaders(), params });
        return response.data;
    },

    // Clinical forms search
    async searchForms(params: { q?: string; active?: string }) {
        const response = await axios.get(`${API_URL}/forms/ops/search`, { ...getHeaders(), params });
        return response.data;
    },

    // Intake reviews
    async getIntakeReviews() {
        const response = await axios.get(`${API_URL}/intake-reviews`, getHeaders());
        return response.data;
    },
    async searchIntakeReviews(params: { q?: string; from?: string; to?: string }) {
        const response = await axios.get(`${API_URL}/intake-reviews/search`, { ...getHeaders(), params });
        return response.data;
    },
    async deleteIntakeReview(consultationId: string) {
        const response = await axios.delete(`${API_URL}/intake-reviews/${consultationId}`, getHeaders());
        return response.data;
    },

    // Analytics
    async getAnalytics(params?: Record<string, string>) {
        const response = await axios.get(`${API_URL}/analytics`, { ...getHeaders(), params });
        return response.data;
    }
};
