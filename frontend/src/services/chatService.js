import api from './api';

const chatService = {
    searchUsers: async (query) => {
        const response = await api.get(`/chat/search-users?query=${query}`);
        return response.data;
    },

    getStaff: async () => {
        const response = await api.get('/chat/staff');
        return response.data;
    },

    getStreamToken: async () => {
        const response = await api.get('/chat/token');
        return response.data;
    }
};

export default chatService;
