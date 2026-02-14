import api from './api';

const feedbackService = {
    submitFeedback: async (feedbackData) => {
        const res = await api.post('/feedback', feedbackData);
        return res.data;
    },

    getAppointmentFeedback: async (appointmentId) => {
        const res = await api.get(`/feedback/appointment/${appointmentId}`);
        return res.data;
    },

    getDoctorFeedback: async (doctorId, page = 1, limit = 10) => {
        const res = await api.get(`/feedback/doctor/${doctorId}/feedback`, {
            params: { page, limit }
        });
        return res.data;
    },

    getDoctorRating: async (doctorId) => {
        const res = await api.get(`/feedback/doctor/${doctorId}/rating`);
        return res.data;
    },

    updateFeedback: async (feedbackId, updateData) => {
        const res = await api.put(`/feedback/${feedbackId}`, updateData);
        return res.data;
    },

    getFeedbackAnalytics: async () => {
        const res = await api.get('/feedback/analytics/overall');
        return res.data;
    }
};

export default feedbackService;
