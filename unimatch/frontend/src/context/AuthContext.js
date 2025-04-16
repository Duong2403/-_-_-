import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Import the configured api instance

// Create Context
const AuthContext = createContext();

// Create Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken')); // Load token from local storage initially
  const [loading, setLoading] = useState(true); // To check if initial user load is complete

  // Remove the useEffect that sets the default header, as the interceptor handles it now.

  // Fetch user data if token exists on initial load
  useEffect(() => {
    const fetchUser = async () => {
      // We still need the token state to trigger this effect
      if (token) {
        try {
          // Use the /api/users/me endpoint via our api instance
          const res = await api.get('/users/me'); // Use api instance
          setUser(res.data);
        } catch (err) {
          console.error('Error fetching user on load:', err.response ? err.response.data : err);
          // Token might be invalid, clear it
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false); // Finished loading attempt
    };

    fetchUser();
  }, [token]); // Re-run if token changes (This effect now only handles initial load based on localStorage token)

  // Login function
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password }); // Use api instance
      // IMPORTANT: Set user state BEFORE setting token state
      // This ensures that any component reacting to `user` sees the new user
      // before any effect reacting to `token` runs (like the fetchUser effect)
      setUser(res.data); // User data from login response
      setToken(res.data.token);
      localStorage.setItem('authToken', res.data.token); // Explicitly save token here too
      return res.data;
    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err);
      throw err; // Re-throw error to be caught in the component
    }
  };

  // Register function
  const register = async (userData) => {
     try {
      const res = await api.post('/auth/register', userData); // Use api instance
      // Set user state BEFORE setting token state
      setUser(res.data); // User data from register response
      setToken(res.data.token);
      localStorage.setItem('authToken', res.data.token); // Explicitly save token here too
      return res.data;
    } catch (err) {
      console.error('Registration failed:', err.response ? err.response.data : err);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null); // This will trigger the interceptor removal and localStorage cleanup via useEffect
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token, // Boolean flag for convenience
        loading,
        login,
        register,
        logout,
        setUser, // Allow direct setting of user if needed (e.g., after profile update)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
