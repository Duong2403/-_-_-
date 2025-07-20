import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DateIcon, SparkIcon } from './ui/SocialIcons';

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
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12">
      <div className="container max-w-md">
        <div className="card animate-fade-in">
          <div className="card-body">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-love rounded-full p-4">
                  <DateIcon className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-neutral-800 mb-2 font-family-heading">
                Welcome Back! 💕
              </h1>
              <p className="text-neutral-600">
                Sign in to continue your journey of finding amazing connections
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ background: '#e53e3e', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  className="form-input"
                  placeholder="Enter your university email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full"
              >
                <SparkIcon className="mr-2" size={16} />
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center mt-6 pt-6 border-t border-neutral-200">
              <p className="text-neutral-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-rose hover:text-primary-rose-dark font-medium">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
