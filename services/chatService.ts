import axios from 'axios';
import { authService } from './auth';

const API_URL = 'http://localhost:5000/api/chat';

export const chatService = {
    async sendMessage(text: string, sessionId: string, frontendContext?: string, language?: string) {
        try {
            const token = authService.getToken();
            console.log("🔑 Token:", token ? "EXISTS" : "MISSING");

            if (!token) {
                throw new Error("No authentication token found. Please log in.");
            }

            const response = await axios.post(API_URL,
                { text, sessionId, frontendContext, language },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error("❌ Chat Service Error:", error);
            console.error("❌ Response Data:", error.response?.data);
            console.error("❌ Status Code:", error.response?.status);
            throw error;
        }
    },

    async getHistory(sessionId: string) {
        try {
            const token = authService.getToken();
            console.log("🔑 History Fetch Token:", token ? "EXISTS" : "MISSING");

            if (!token) return [];

            const response = await axios.get(`${API_URL}/history/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error("❌ History fetch error:", error);
            return [];
        }
    },

    async getSessions(): Promise<Array<{ sessionId: string; lastMessage: string; lastAt: string; count: number }>> {
        try {
            const token = authService.getToken();
            if (!token) return [];
            const response = await axios.get(`${API_URL}/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error("❌ Sessions fetch error:", error);
            return [];
        }
    }
};
