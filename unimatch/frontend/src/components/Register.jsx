import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

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
    <div>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={onSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label>University Email (.ac.kr or .edu):</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label>Password (min 6 characters):</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
         <div>
          <label>Age (19-29):</label>
          <input
            type="number"
            name="age"
            value={age}
            onChange={onChange}
            min="19"
            max="29"
            required
          />
        </div>
         <div>
          <label>University:</label>
          <input
            type="text"
            name="university"
            value={university}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default Register;
