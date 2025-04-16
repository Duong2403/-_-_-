import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

function Login() {
  const { login } = useAuth(); // Get login function from context
  const navigate = useNavigate(); // Hook for navigation
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log(`Attempting login for email: ${email}`); // Add frontend log

    if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
    }

    try {
      // Use the login function from AuthContext, which handles the API call
      await login(email, password);
      console.log('Login successful via context'); // Updated log
      // Add a small delay to allow context state to propagate (for testing)
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard after successful login
      }, 100); // 100ms delay

    } catch (err) {
      // Error message is already logged in AuthContext, just display it
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging In...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;
