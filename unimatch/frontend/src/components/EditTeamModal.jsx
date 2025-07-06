import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { XIcon } from './ui/Icons';
import { SparkIcon, GroupsIcon, CoupleIcon, DateIcon } from './ui/SocialIcons';

// Constants for form options
const TEAM_VIBES = [
  'Chill & Laid-back', 'Adventurous & Spontaneous', 'Academic & Studious', 'Party & Social',
  'Creative & Artistic', 'Fitness & Active', 'Foodie & Culinary', 'Tech & Gaming',
  'Music & Arts', 'Travel & Exploration', 'Volunteering & Community', 'Entrepreneurial & Business'
];

const TOP_INTERESTS = [
  'Movies & TV', 'Music & Concerts', 'Sports & Fitness', 'Food & Cooking', 'Travel & Adventure',
  'Gaming & Esports', 'Art & Design', 'Technology & Innovation', 'Books & Literature', 'Photography',
  'Fashion & Style', 'Science & Research', 'Volunteering & Social Impact', 'Entrepreneurship & Business',
  'Outdoor Activities', 'Wellness & Mindfulness', 'Dancing & Performance', 'Language Learning',
  'History & Culture', 'Politics & Current Events'
];

const MEETING_PURPOSES = [
  'Casual Hangouts', 'Study Sessions', 'Adventure & Exploration', 'Cultural Events',
  'Food & Dining', 'Fitness & Sports', 'Creative Projects', 'Networking & Professional',
  'Volunteer Work', 'Entertainment & Fun'
];

const TARGET_TEAM_VIBES = [
  'Similar to Us', 'Complementary & Different', 'Academic & Goal-oriented', 'Fun & Social',
  'Creative & Innovative', 'Active & Energetic', 'Mature & Professional', 'Diverse & Inclusive'
];

const AVAILABILITY_OPTIONS = [
  'Weekday Evenings', 'Weekend Days', 'Weekend Evenings', 'Weekday Afternoons',
  'Flexible Schedule', 'Mornings', 'Late Nights', 'Specific Days Only'
];

const PREFERRED_LOCATIONS = [
  'Campus', 'City Center', 'Cafes & Restaurants', 'Parks & Outdoor', 'Student Housing',
  'Libraries & Study Spaces', 'Sports Facilities', 'Cultural Venues', 'Online/Virtual', 'Flexible'
];

// Tag Selector Component
const TagSelector = ({ field, options, selected, onToggle, title, maxSelect }) => (
  <div className="form-group">
    <label className="form-label">{title} {selected.length > 0 && <span className="text-neutral-500">({selected.length}/{maxSelect})</span>}</label>
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(field, option)}
          disabled={!selected.includes(option) && selected.length >= maxSelect}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
            selected.includes(option)
              ? 'bg-gradient text-white shadow-md'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

const EditTeamModal = ({ team, isOpen, onClose, onEditSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamComposition: '2:2',
    teamVibe: [],
    topInterests: [],
    meetingPurpose: [],
    targetTeamVibe: [],
    availability: [],
    preferredLocation: 'Campus',
    teamGender: 'Mixed',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when team prop changes
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
        teamComposition: team.teamComposition || '2:2',
        teamVibe: team.teamVibe || [],
        topInterests: team.topInterests || [],
        meetingPurpose: team.meetingPurpose || [],
        targetTeamVibe: team.targetTeamVibe || [],
        availability: team.availability || [],
        preferredLocation: team.preferredLocation || 'Campus',
        teamGender: team.teamGender || 'Mixed',
      });
    }
  }, [team]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.put(`/teams/${team._id}`, formData);
      onEditSuccess(res.data);
      onClose();
    } catch (err) {
      console.error("Error updating team:", err);
      setError(err.response?.data?.message || 'Failed to update team.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary rounded-full p-3">
              <GroupsIcon className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-800">Edit Team</h2>
              <p className="text-neutral-600">Update your team's information and preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-error bg-opacity-10 border border-error text-error p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Team Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Team Composition</label>
              <select
                name="teamComposition"
                className="form-input"
                value={formData.teamComposition}
                onChange={handleInputChange}
              >
                <option value="2:2">2:2 (2 guys, 2 girls)</option>
                <option value="3:3">3:3 (3 guys, 3 girls)</option>
                <option value="4:4">4:4 (4 guys, 4 girls)</option>
                <option value="2:3">2:3 (2 guys, 3 girls)</option>
                <option value="3:2">3:2 (3 guys, 2 girls)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Team Gender *</label>
              <select
                name="teamGender"
                className="form-input"
                value={formData.teamGender}
                onChange={handleInputChange}
                required
              >
                <option value="Male">Male Team</option>
                <option value="Female">Female Team</option>
                <option value="Mixed">Mixed Team</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Location</label>
              <select
                name="preferredLocation"
                className="form-input"
                value={formData.preferredLocation}
                onChange={handleInputChange}
              >
                {PREFERRED_LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Team Description / Slogan</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="A catchy phrase to describe your team!"
              maxLength="200"
              rows="3"
            />
          </div>

          <TagSelector 
            field="teamVibe"
            options={TEAM_VIBES}
            selected={formData.teamVibe}
            onToggle={handleTagToggle}
            title="Our Team's Vibe"
            maxSelect={3}
          />
          
          <TagSelector 
            field="topInterests"
            options={TOP_INTERESTS}
            selected={formData.topInterests}
            onToggle={handleTagToggle}
            title="Our Top 5 Interests"
            maxSelect={5}
          />

          <hr className="border-neutral-200" />

          <TagSelector 
            field="meetingPurpose"
            options={MEETING_PURPOSES}
            selected={formData.meetingPurpose}
            onToggle={handleTagToggle}
            title="What We Want to Do Together"
            maxSelect={3}
          />

          <TagSelector 
            field="targetTeamVibe"
            options={TARGET_TEAM_VIBES}
            selected={formData.targetTeamVibe}
            onToggle={handleTagToggle}
            title="Teams We'd Like to Meet"
            maxSelect={3}
          />

          <TagSelector 
            field="availability"
            options={AVAILABILITY_OPTIONS}
            selected={formData.availability}
            onToggle={handleTagToggle}
            title="When We're Available"
            maxSelect={4}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <SparkIcon className="mr-2" size={16} />
                  Update Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal; 