import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: '/api', // Base URL for all API requests (proxied by Vite)
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
  Add an interceptor to automatically add the token to requests
  if it exists. This is an alternative/addition to setting the
  default header in AuthContext. Using interceptors is often preferred
  as it keeps token logic more contained within the API service setup.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
  Add a response interceptor to handle common errors,
  like 401 Unauthorized (e.g., redirect to login if token expires).
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., clear token, redirect to login
      localStorage.removeItem('authToken');
      // Only redirect if not already on login page to avoid loops
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        console.log('401 Unauthorized - redirecting to login');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


// Image upload function for chat messages
export const uploadChatImage = async (imageFile, matchId, isPrivate = false, recipientId = null) => {
  console.log('uploadChatImage called with:', { imageFile, matchId, isPrivate, recipientId });
  
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('matchId', matchId || '');
  formData.append('isPrivate', (isPrivate || false).toString());
  if (recipientId) {
    formData.append('recipientId', recipientId);
  }

  const response = await api.post('/messages/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Send text/emoji message
export const sendTextMessage = async (messageData) => {
  const response = await api.post('/messages', messageData);
  return response.data;
};

// Team Chat API Functions
export const getTeamChat = async (teamId) => {
  const response = await api.get(`/team-chats/${teamId}`);
  return response.data;
};

export const getTeamChatMessages = async (teamId) => {
  const response = await api.get(`/team-chats/${teamId}/messages`);
  return response.data;
};

export const sendTeamChatMessage = async (teamId, messageData) => {
  const response = await api.post(`/team-chats/${teamId}/messages`, messageData);
  return response.data;
};

export const getTeamChatInfo = async (teamId) => {
  const response = await api.get(`/team-chats/${teamId}/info`);
  return response.data;
};

// Image upload function for team chat messages
export const uploadTeamChatImage = async (imageFile, teamId) => {
  console.log('uploadTeamChatImage called with:', { imageFile, teamId });
  
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('teamId', teamId || '');
  formData.append('isTeamChat', 'true');

  const response = await api.post('/messages/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export default api;
