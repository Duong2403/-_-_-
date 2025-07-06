import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Predefined options for visual pickers
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

const PERSONALITY_TRAITS = [
  'Outgoing', 'Creative', 'Analytical', 'Empathetic', 'Organized', 'Adventurous',
  'Calm', 'Energetic', 'Thoughtful', 'Humorous', 'Ambitious', 'Caring',
  'Independent', 'Team-oriented', 'Optimistic', 'Realistic', 'Curious', 'Reliable'
];

const ACADEMIC_INTERESTS = [
  'Computer Science', 'AI/Machine Learning', 'Web Development', 'Data Science',
  'Business', 'Marketing', 'Finance', 'Economics', 'Psychology', 'Sociology',
  'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Engineering', 'Medicine',
  'Art', 'Design', 'Music', 'Literature', 'Languages', 'History', 'Philosophy'
];

const HOBBIES = [
  'Reading', 'Gaming', 'Sports', 'Music', 'Art', 'Photography', 'Cooking',
  'Traveling', 'Movies', 'Dancing', 'Singing', 'Writing', 'Drawing', 'Crafts',
  'Fitness', 'Yoga', 'Hiking', 'Swimming', 'Cycling', 'Board Games', 'Puzzles'
];

const MUSIC_GENRES = [
  'K-pop', 'Pop', 'Rock', 'Hip-hop', 'R&B', 'Jazz', 'Classical', 'Electronic',
  'Folk', 'Country', 'Indie', 'Alternative', 'Reggae', 'Blues', 'Metal'
];

const MOVIE_GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Fantasy',
  'Thriller', 'Mystery', 'Documentary', 'Animation', 'Adventure', 'Crime'
];

const SPORTS = [
  'Soccer', 'Basketball', 'Baseball', 'Tennis', 'Badminton', 'Swimming',
  'Running', 'Cycling', 'Volleyball', 'Table Tennis', 'Golf', 'Boxing',
  'Martial Arts', 'Yoga', 'Pilates', 'Weight Training'
];

const FRIENDSHIP_GOALS = [
  'Study buddy', 'Activity partner', 'Deep conversations', 'Casual hangouts',
  'Travel companion', 'Workout partner', 'Creative collaborator', 'Language exchange',
  'Cultural exchange', 'Professional networking', 'Hobby sharing', 'Support system'
];

const LANGUAGES = [
  'Korean', 'English', 'Japanese', 'Chinese', 'Spanish', 'French', 'German',
  'Italian', 'Russian', 'Portuguese', 'Arabic', 'Hindi', 'Thai', 'Vietnamese'
];

const FOOD_PREFERENCES = [
  'Korean', 'Western', 'Japanese', 'Chinese', 'Italian', 'Mexican', 'Indian',
  'Thai', 'Vietnamese', 'Vegetarian', 'Vegan', 'Spicy food', 'Sweet food',
  'Healthy food', 'Fast food', 'Home cooking'
];

const SOCIAL_STYLES = [
  'Social butterfly', 'Small groups', 'One-on-one', 'Flexible'
];

const ProfileEditForm = ({ currentUser, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    major: '',
    mbti: '',
    socialStyle: '',
    academicInterests: [],
    personalityTraits: [],
    hobbies: [],
    musicGenres: [],
    movieGenres: [],
    sports: [],
    friendshipGoals: [],
    languages: [],
    foodPreferences: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  // Populate form when currentUser data is available
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        major: currentUser.major || '',
        mbti: currentUser.mbti || '',
        socialStyle: currentUser.socialStyle || '',
        academicInterests: currentUser.academicInterests || [],
        personalityTraits: currentUser.personalityTraits || [],
        hobbies: currentUser.hobbies || [],
        musicGenres: currentUser.musicGenres || [],
        movieGenres: currentUser.movieGenres || [],
        sports: currentUser.sports || [],
        friendshipGoals: currentUser.friendshipGoals || [],
        languages: currentUser.languages || [],
        foodPreferences: currentUser.foodPreferences || [],
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
    setError('');
    setSuccess('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put('/users/me', formData);
      setLoading(false);
      setSuccess('Profile updated successfully!');
      onUpdate(res.data);
    } catch (err) {
      console.error('Profile update error:', err.response ? err.response.data : err);
      setError(err.response?.data?.message || 'Failed to update profile.');
      setLoading(false);
    }
  };

  const TagSelector = ({ field, options, selected, title, maxSelect = 10 }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {title} {selected.length > 0 && <span className="text-neutral-500">({selected.length}/{maxSelect})</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => handleArrayToggle(field, option)}
            disabled={!selected.includes(option) && selected.length >= maxSelect}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selected.includes(option)
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const sections = [
    { id: 'basic', title: 'Basic Info', icon: '👤' },
    { id: 'personality', title: 'Personality', icon: '🧠' },
    { id: 'academic', title: 'Academic', icon: '📚' },
    { id: 'interests', title: 'Interests', icon: '🎯' },
    { id: 'social', title: 'Social', icon: '👥' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Edit Your Profile</h2>
          <p className="text-blue-100 mt-1">Make your profile shine to connect with amazing people!</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={onSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Basic Info Section */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Bio (Tell others about yourself)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  maxLength="500"
                  placeholder="Write a short bio about yourself..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-neutral-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Major/Field of Study
                </label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science, Business Administration"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Personality Section */}
          {activeSection === 'personality' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  MBTI Type
                </label>
                <select
                  name="mbti"
                  value={formData.mbti}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your MBTI type</option>
                  {MBTI_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <TagSelector
                field="personalityTraits"
                options={PERSONALITY_TRAITS}
                selected={formData.personalityTraits}
                title="Personality Traits"
                maxSelect={6}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Social Style
                </label>
                <select
                  name="socialStyle"
                  value={formData.socialStyle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your social style</option>
                  {SOCIAL_STYLES.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Academic Section */}
          {activeSection === 'academic' && (
            <div className="space-y-6">
              <TagSelector
                field="academicInterests"
                options={ACADEMIC_INTERESTS}
                selected={formData.academicInterests}
                title="Academic Interests"
                maxSelect={8}
              />
            </div>
          )}

          {/* Interests Section */}
          {activeSection === 'interests' && (
            <div className="space-y-6">
              <TagSelector
                field="hobbies"
                options={HOBBIES}
                selected={formData.hobbies}
                title="Hobbies & Activities"
                maxSelect={10}
              />

              <TagSelector
                field="musicGenres"
                options={MUSIC_GENRES}
                selected={formData.musicGenres}
                title="Music Genres"
                maxSelect={6}
              />

              <TagSelector
                field="movieGenres"
                options={MOVIE_GENRES}
                selected={formData.movieGenres}
                title="Movie Genres"
                maxSelect={6}
              />

              <TagSelector
                field="sports"
                options={SPORTS}
                selected={formData.sports}
                title="Sports & Fitness"
                maxSelect={6}
              />
            </div>
          )}

          {/* Social Section */}
          {activeSection === 'social' && (
            <div className="space-y-6">
              <TagSelector
                field="friendshipGoals"
                options={FRIENDSHIP_GOALS}
                selected={formData.friendshipGoals}
                title="What kind of friends are you looking for?"
                maxSelect={6}
              />

              <TagSelector
                field="languages"
                options={LANGUAGES}
                selected={formData.languages}
                title="Languages You Speak"
                maxSelect={8}
              />

              <TagSelector
                field="foodPreferences"
                options={FOOD_PREFERENCES}
                selected={formData.foodPreferences}
                title="Food Preferences"
                maxSelect={8}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditForm;
