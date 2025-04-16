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
  Optional: Add a response interceptor to handle common errors,
  like 401 Unauthorized (e.g., redirect to login if token expires).
*/
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Handle unauthorized access, e.g., clear token, redirect to login
//       localStorage.removeItem('authToken');
//       // Maybe call a logout function from context if accessible here,
//       // or simply redirect. Be careful about circular dependencies.
//       window.location.href = '/login'; // Simple redirect
//     }
//     return Promise.reject(error);
//   }
// );


export default api;
