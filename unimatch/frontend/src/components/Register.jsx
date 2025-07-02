import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UniversityIcon, GroupsIcon } from './ui/SocialIcons';

function Register() {
  const { register } = useAuth(); // Get register function from context
  const navigate = useNavigate(); // Hook for navigation
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    university: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, email, password, confirmPassword, age, university } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors first
    setSuccess('');

    // --- Validation Checks ---

    // 1. Check required fields
    if (!name || !email || !password || !confirmPassword || !age || !university) {
        setError('Please fill in all required fields.');
        return;
    }

    // 2. Check password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // 3. Basic age check on frontend (backend has stricter validation)
    if (parseInt(age, 10) < 19 || parseInt(age, 10) > 29) {
        setError('Age must be between 19 and 29');
         return;
     }
     // 4. Basic email check on frontend - Check only for .ac.kr or .edu ending
     const emailRegex = /\.(ac\.kr|edu)$/i; // Simpler check for ending only
     if (!emailRegex.test(email)) {
         setError('Email must end with .ac.kr or .edu');
         return;
     }


     setLoading(true);
    try {
      await register({ // Use context register function
        name,
        email,
        password,
        age: parseInt(age, 10),
        university,
      });
      console.log('Registration successful');
      navigate('/dashboard'); // Redirect to dashboard after successful registration

    } catch (err) {
      // Error message is already logged in AuthContext, just display it
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12">
      <div className="container max-w-lg">
        <div className="card animate-fade-in">
          <div className="card-body">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-friendship rounded-full p-4">
                  <UniversityIcon className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-neutral-800 mb-2 font-family-heading">
                Join <span className="text-gradient">UniMatch</span>! 🎓
              </h1>
              <p className="text-neutral-600">
                Create your account and start connecting with amazing groups from other universities
              </p>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="bg-error bg-opacity-10 border border-error text-error p-4 rounded-lg mb-6">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-success bg-opacity-10 border border-success text-success p-4 rounded-lg mb-6">
                {success}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={onChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Age (19-29)</label>
                  <input
                    type="number"
                    name="age"
                    value={age}
                    onChange={onChange}
                    className="form-input"
                    placeholder="Your age"
                    min="19"
                    max="29"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">University Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  className="form-input"
                  placeholder="your.email@university.ac.kr or .edu"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">Must end with .ac.kr or .edu</p>
              </div>

              <div className="form-group">
                <label className="form-label">University Name</label>
                <input
                  type="text"
                  name="university"
                  value={university}
                  onChange={onChange}
                  className="form-input"
                  placeholder="e.g., Seoul National University"
                  required
                />
              </div>

              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    className="form-input"
                    placeholder="Min 6 characters"
                    minLength="6"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    className="form-input"
                    placeholder="Confirm password"
                    minLength="6"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full"
              >
                <GroupsIcon className="mr-2" size={16} />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6 pt-6 border-t border-neutral-200">
              <p className="text-neutral-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-rose hover:text-primary-rose-dark font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
