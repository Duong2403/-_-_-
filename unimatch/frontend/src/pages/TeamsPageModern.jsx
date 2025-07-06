import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { 
  GroupsIcon,
  CoupleIcon,
  DateIcon,
  CoffeeIcon,
  SparkIcon,
  UniversityIcon
} from '../components/ui/SocialIcons';
import { 
  PlusIcon, 
  StarIcon,
  CheckIcon,
  ArrowRightIcon 
} from '../components/ui/Icons';

// --- Predefined Options for Selectors ---
const TEAM_VIBES = ['Lively', 'Humorous', 'Calm', 'Serious', 'Planners', 'Spontaneous', 'Intellectual', 'Adventurous'];
const TOP_INTERESTS = ['Restaurants', 'Gaming', 'Movies', 'Music', 'Sports', 'Cafes', 'Traveling', 'Reading', 'Board Games', 'Drinking', 'Volunteering', 'Fitness'];
const MEETING_PURPOSES = ['Make Friends', 'Study Group', 'Project Partner', 'Dating', 'Networking', 'New Experiences', 'Language Exchange'];
const TARGET_TEAM_VIBES = ['Similar to Us', 'Lively & Fun', 'Intellectually Stimulating', 'Chill & Relaxed', 'Different from Us', 'No Preference'];
const AVAILABILITY = ['Weekday Evenings', 'Weekend Afternoons', 'Weekend Evenings', 'Flexible', 'During Exams', 'Not During Exams'];
const PREFERRED_LOCATIONS = ['Near Our University', 'Near Your University', 'A Middle Point (e.g., Hongdae)', 'Online/Metaverse'];

// --- Reusable Tag Selector Component ---
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

// Modern Create Team Form Component
const CreateTeamForm = ({ onCreateSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamComposition: '2:2',
    teamVibe: [],
    topInterests: [],
    meetingPurpose: [],
    targetTeamVibe: [],
    availability: [],
    preferredLocation: PREFERRED_LOCATIONS[0],
    teamGender: 'Mixed',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

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
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      teamComposition: '2:2',
      teamVibe: [],
      topInterests: [],
      meetingPurpose: [],
      targetTeamVibe: [],
      availability: [],
      preferredLocation: PREFERRED_LOCATIONS[0],
      teamGender: 'Mixed',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/teams', formData);
      onCreateSuccess(res.data);
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="card mb-8 animate-fade-in">
        <div className="card-body text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient rounded-full p-4">
              <PlusIcon className="text-white" size={32} />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Assemble Your Crew</h3>
          <p className="text-neutral-600 mb-6">
            Form a group with your university friends to meet other groups and make connections.
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="mr-2" size={16} />
            Create New Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-8 animate-slide-up">
      <div className="card-header">
        <h3 className="text-xl font-semibold text-neutral-800">New Group Details</h3>
        <p className="text-neutral-500 mt-1">Fill out your group's profile to find the perfect match.</p>
      </div>
      <div className="card-body">
        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label className="form-label">Group Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., The Weekend Explorers"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Team Composition *</label>
              <select
                name="teamComposition"
                className="form-input"
                value={formData.teamComposition}
                onChange={handleInputChange}
              >
                <option value="2:2">2:2</option>
                <option value="3:3">3:3</option>
                <option value="4:4">4:4</option>
                <option value="Other">Other</option>
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
          </div>

          <div className="form-group">
            <label className="form-label">Group Slogan / One-Liner</label>
            <input
              type="text"
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="A catchy phrase to describe your group!"
              maxLength="100"
            />
          </div>

          <TagSelector 
            field="teamVibe"
            options={TEAM_VIBES}
            selected={formData.teamVibe}
            onToggle={handleTagToggle}
            title="Our Group's Vibe"
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

          <hr className="my-4 border-neutral-200" />

          <h4 className="text-lg font-semibold text-neutral-800">Who We Want to Meet</h4>
          
          <TagSelector 
            field="meetingPurpose"
            options={MEETING_PURPOSES}
            selected={formData.meetingPurpose}
            onToggle={handleTagToggle}
            title="Our Meeting Purpose"
            maxSelect={2}
          />

          <TagSelector 
            field="targetTeamVibe"
            options={TARGET_TEAM_VIBES}
            selected={formData.targetTeamVibe}
            onToggle={handleTagToggle}
            title="We're Looking for a Team That Is..."
            maxSelect={3}
          />
          
          <hr className="my-4 border-neutral-200" />

          <h4 className="text-lg font-semibold text-neutral-800">Logistics</h4>

          <TagSelector 
            field="availability"
            options={AVAILABILITY}
            selected={formData.availability}
            onToggle={handleTagToggle}
            title="Our Availability"
            maxSelect={3}
          />

          <div className="form-group">
            <label className="form-label">Preferred Location</label>
            <select
              name="preferredLocation"
              className="form-input"
              value={formData.preferredLocation}
              onChange={handleInputChange}
            >
              {PREFERRED_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          <div className="flex gap-4 pt-4 border-t border-neutral-200">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create & Assemble Group'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team }) => {
  const getGenderIcon = (gender) => {
    if (gender === 'Male') return <GroupsIcon size={20} />;
    if (gender === 'Female') return <CoupleIcon size={20} />;
    return <SparkIcon size={20} />; // Mixed
  };

  const getGenderColor = (gender) => {
    if (gender === 'Male') return 'bg-gradient-primary';
    if (gender === 'Female') return 'bg-gradient-love';
    return 'bg-gradient-friendship'; // Mixed
  };

  const getPurposeIcon = (purpose) => {
    if (!purpose || purpose.length === 0) return <SparkIcon size={24} />;
    const firstPurpose = purpose[0];
    if (firstPurpose.includes('Friend')) return <GroupsIcon size={24} />;
    if (firstPurpose.includes('Dating')) return <CoupleIcon size={24} />;
    if (firstPurpose.includes('Study')) return <UniversityIcon size={24} />;
    return <SparkIcon size={24} />;
  };

  const getPurposeColor = (purpose) => {
    if (!purpose || purpose.length === 0) return 'from-neutral-400 to-neutral-600';
    const firstPurpose = purpose[0];
    if (firstPurpose.includes('Friend')) return 'bg-gradient-friendship';
    if (firstPurpose.includes('Dating')) return 'bg-gradient-love';
    if (firstPurpose.includes('Study')) return 'bg-gradient-secondary';
    return 'bg-gradient-primary';
  };

  return (
    <div className="card group hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="card-body p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-full text-white ${getPurposeColor(team.meetingPurpose)}`}>
            {getPurposeIcon(team.meetingPurpose)}
          </div>
          <div className="flex gap-2">
            <span className="badge badge-outline">{team.teamComposition || `${team.members.length} members`}</span>
            <span className={`badge text-white ${getGenderColor(team.teamGender)}`}>
              {getGenderIcon(team.teamGender)}
              <span className="ml-1">{team.teamGender}</span>
            </span>
          </div>
        </div>

        {/* Team Info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">{team.name}</h3>
          <p className="text-sm text-neutral-500 line-clamp-2 min-h-[2.5rem]">
            {team.description || 'No description provided.'}
          </p>
        </div>

        {/* Team Details Grid */}
        <div className="space-y-4">
          {/* Vibe Section */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-2 flex items-center gap-1">
              <SparkIcon size={12} />
              Vibe
            </h4>
            <div className="flex flex-wrap gap-1">
              {team.teamVibe?.length > 0 ? team.teamVibe.slice(0, 2).map(vibe => (
                <span key={vibe} className="badge badge-secondary text-xs">{vibe}</span>
              )) : <span className="text-xs text-neutral-400">Not specified</span>}
              {team.teamVibe?.length > 2 && (
                <span className="badge badge-outline text-xs">+{team.teamVibe.length - 2}</span>
              )}
            </div>
          </div>

          {/* Interests Section */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-2 flex items-center gap-1">
              <DateIcon size={12} />
              Interests
            </h4>
            <div className="flex flex-wrap gap-1">
              {team.topInterests?.length > 0 ? team.topInterests.slice(0, 3).map(interest => (
                <span key={interest} className="badge badge-primary text-xs">{interest}</span>
              )) : <span className="text-xs text-neutral-400">Not specified</span>}
              {team.topInterests?.length > 3 && (
                <span className="badge badge-outline text-xs">+{team.topInterests.length - 3}</span>
              )}
            </div>
          </div>

          {/* Meeting Purpose */}
          {team.meetingPurpose?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-2 flex items-center gap-1">
                <CoupleIcon size={12} />
                Purpose
              </h4>
              <div className="flex flex-wrap gap-1">
                {team.meetingPurpose.slice(0, 2).map(purpose => (
                  <span key={purpose} className="badge badge-primary-light text-xs">{purpose}</span>
                ))}
                {team.meetingPurpose.length > 2 && (
                  <span className="badge badge-outline text-xs">+{team.meetingPurpose.length - 2}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link to={`/teams/${team._id}`} className="btn btn-primary w-full mt-6 group-hover:bg-primary-dark transition-colors">
          View Details <ArrowRightIcon className="ml-2" size={16} />
        </Link>
      </div>
    </div>
  );
};

// Main Teams Page Component
const TeamsPageModern = () => {
  const [myTeams, setMyTeams] = useState([]);
  const [discoverTeams, setDiscoverTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError('');
      try {
        const [myTeamsRes, discoverTeamsRes] = await Promise.all([
          api.get('/teams/my-teams'),
          api.get('/teams')
        ]);
        setMyTeams(myTeamsRes.data);
        setDiscoverTeams(discoverTeamsRes.data);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError(err.response?.data?.message || 'Failed to fetch teams.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleTeamCreated = (newTeam) => {
    setMyTeams(prev => [newTeam, ...prev]);
  };

  if (loading) {
    return (
        <div className="bg-neutral-50 min-h-screen">
          <div className="container py-16">
            <div className="text-center animate-fade-in">
              <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Loading Teams...</h2>
              <p className="text-neutral-600">Please wait while we gather the teams</p>
            </div>
          </div>
        </div>
      );
  }

  if (error) {
     return (
        <div className="bg-neutral-50 min-h-screen">
          <div className="container py-16">
            <div className="text-center">
              <div className="bg-error bg-opacity-10 border border-error text-error p-6 rounded-lg max-w-md mx-auto">
                <h3 className="font-semibold mb-2">Error Loading Teams</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-love rounded-full p-4">
              <GroupsIcon className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-neutral-800 mb-4 font-family-heading">
            Find Your <span className="text-gradient">Crew</span>
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Create and manage your groups, or discover new ones to connect with.
          </p>
        </div>

        {/* Create Team Section */}
        <CreateTeamForm onCreateSuccess={handleTeamCreated} />

        {/* My Teams Section */}
        {myTeams.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <GroupsIcon className="text-white" size={16} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-neutral-800">My Groups</h2>
                <p className="text-sm text-neutral-500">Groups you've created or joined ({myTeams.length})</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.map(team => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
          </div>
        )}

        {/* Discover Teams Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-friendship rounded-full flex items-center justify-center">
              <SparkIcon className="text-white" size={16} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-800">Discover Other Groups</h2>
              <p className="text-sm text-neutral-500">Find new groups from your university to connect with ({discoverTeams.length} available)</p>
            </div>
          </div>
           {discoverTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoverTeams.map(team => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
             ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-neutral-200">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                      <SparkIcon className="text-neutral-400" size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Groups to Discover</h3>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    No other teams from your university are available right now. Check back later or be the first to create a group!
                  </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TeamsPageModern; 