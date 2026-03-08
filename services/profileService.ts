import axios from 'axios';
import { authService } from './auth';

const API_URL = 'http://localhost:5000/api/profile';

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${authService.getToken()}` }
});

export const profileService = {
    /** Fetch the current user's profile + consent */
    async getProfile() {
        const response = await axios.get(API_URL, authHeaders());
        return response.data; // { profile: UserProfileData | null }
    },

    /** Upsert personal profile fields */
    async updateProfile(data: {
        firstName?: string;
        lastName?: string;
        dob?: string;
        gender?: string;
        pronouns?: string;
        phone?: string;
        emergencyContactName?: string;
        emergencyContactPhone?: string;
        bio?: string;
    }) {
        const response = await axios.put(API_URL, data, authHeaders());
        return response.data; // { profile }
    },

    /** Upsert consent settings */
    async updateConsent(consent: {
        dataStorage?: boolean;
        aiAnalysis?: boolean;
        communityVisible?: boolean;
        emailNotifications?: boolean;
        crisisAlerts?: boolean;
        dataExport?: boolean;
    }) {
        const response = await axios.put(`${API_URL}/consent`, { consent }, authHeaders());
        return response.data; // { profile }
    },

    /** Permanently delete the account and all data */
    async deleteAccount() {
        const response = await axios.delete(API_URL, authHeaders());
        return response.data; // { message }
    }
};
