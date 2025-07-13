import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITIES, getUniversityDbValue, getUniversityDisplayName } from '../constants/universities';
import DiscoverableTeamCard from '../components/DiscoverableTeamCard';
import JoinRequestsModal from '../components/JoinRequestsModal';
import { useToast } from '../components/Toast';

import { 
  GroupsIcon,
  SparkIcon,
  CoupleIcon,
  DateIcon,
  UniversityIcon
} from '../components/ui/SocialIcons';
import { 
  PlusIcon, 
  StarIcon,
  CheckIcon,
  ArrowRightIcon,
  TrashIcon,
  LogoutIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertCircleIcon,
  RefreshIcon
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
    university: '',
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
      university: '',
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
      // Convert university display name to database value
      const submitData = {
        ...formData,
        university: getUniversityDbValue(formData.university)
      };
      const res = await api.post('/teams', submitData);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="form-label">School/University *</label>
              <select
                name="university"
                className="form-input"
                value={formData.university}
                onChange={handleInputChange}
                required
              >
                <option value="">Select your school...</option>
                {UNIVERSITIES.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

// Team Card Component (memoized for performance)
const TeamCard = React.memo(({ team, isMyTeam, onLeave, onDelete, onActivate, actionLoading }) => {
  const { user } = useAuth();
  
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

  const isCreator = team.createdBy?._id === user?._id || team.createdBy === user?._id;
  const isMember = team.members?.some(member => member._id === user?._id || member === user?._id);

  return (
    <div className="card group hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="card-body p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-full text-white ${getPurposeColor(team.meetingPurpose)}`}>
            {getPurposeIcon(team.meetingPurpose)}
          </div>
          <div className="flex gap-2">
            <span className="badge badge-outline">{team.teamComposition || `${team.members?.length || 0} members`}</span>
            <span className={`badge text-white ${getGenderColor(team.teamGender)}`}>
              {getGenderIcon(team.teamGender)}
              <span className="ml-1">{team.teamGender}</span>
            </span>
            <span className={`badge ${team.status === 'forming' ? 'badge-warning' : team.status === 'active' ? 'badge-success' : 'badge-info'}`}>
              {team.status}
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

        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <Link to={`/teams/${team._id}`} className="btn btn-primary w-full group-hover:bg-primary-dark transition-colors">
            View Details <ArrowRightIcon className="ml-2" size={16} />
          </Link>
          
          {/* Management Actions for My Teams */}
          {isMyTeam && (
            <div className="space-y-2">
              {/* Activation Button for Forming Teams */}
              {isCreator && team.status === 'forming' && (
                <button
                  onClick={() => onActivate(team)}
                  disabled={actionLoading?.activating === team._id}
                  className="btn btn-success w-full text-sm"
                >
                  {actionLoading?.activating === team._id ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                      Activating...
                    </>
                  ) : (
                    <>
                      <SparkIcon className="mr-1" size={14} />
                      Activate Team
                    </>
                  )}
                </button>
              )}
              
              <div className="flex gap-2">
                {isCreator ? (
                  <button
                    onClick={() => onDelete(team)}
                    disabled={actionLoading?.deleting === team._id}
                    className="btn btn-error w-full text-sm"
                  >
                    {actionLoading?.deleting === team._id ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="mr-1" size={14} />
                        Delete Team
                      </>
                    )}
                  </button>
                ) : isMember && (
                  <button
                    onClick={() => onLeave(team)}
                    disabled={actionLoading?.leaving === team._id}
                    className="btn btn-outline w-full text-sm"
                  >
                    {actionLoading?.leaving === team._id ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full mr-1"></div>
                        Leaving...
                      </>
                    ) : (
                      <>
                        <LogoutIcon className="mr-1" size={14} />
                        Leave Team
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Main Teams Page Component
const TeamsPageModern = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [myTeams, setMyTeams] = useState([]);
  const [discoverTeams, setDiscoverTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    leaving: null,
    deleting: null,
    activating: null
  });
  
  // Add refresh function for discovery teams
  const refreshDiscoveryTeams = useCallback(async () => {
    console.log('=== REFRESHING DISCOVERY TEAMS ===');
    console.log(`Selected school filter: "${selectedSchool}"`);
    
    try {
      const endpoint = `/teams${selectedSchool ? `?school=${getUniversityDbValue(selectedSchool)}` : ''}`;
      console.log(`Fetching from: ${endpoint}`);
      
      const response = await api.get(endpoint);
      console.log(`✅ Discovery refresh successful: ${response.data.length} teams found`);
      
      setDiscoverTeams(response.data);
      setError(''); // Clear any previous errors
      
    } catch (err) {
      console.error('❌ Error refreshing discovery teams:', err);
      console.error('Error details:', err.response?.data);
      
      // Don't overwrite teams on refresh error, just log it
      const errorMessage = err.response?.data?.message || 'Failed to refresh discovery teams';
      console.error(`Discovery refresh failed: ${errorMessage}`);
      
      // Only set error if we have no teams currently displayed
      if (discoverTeams.length === 0) {
        setError(errorMessage);
      }
    }
  }, [selectedSchool, discoverTeams.length]);


  useEffect(() => {
    const fetchTeams = async () => {
      console.log('=== FETCHING TEAMS ===');
      console.log(`Selected school: "${selectedSchool}"`);
      
      setLoading(true);
      setError('');
      try {
        const [myTeamsRes, discoverTeamsRes] = await Promise.all([
          api.get('/teams/my-teams'),
          api.get(`/teams${selectedSchool ? `?school=${getUniversityDbValue(selectedSchool)}` : ''}`)
        ]);
        
        console.log(`✅ My teams: ${myTeamsRes.data.length}`);
        console.log(`✅ Discovery teams: ${discoverTeamsRes.data.length}`);
        
        setMyTeams(myTeamsRes.data);
        setDiscoverTeams(discoverTeamsRes.data);
      } catch (err) {
        console.error("❌ Error fetching teams:", err);
        console.error("Error details:", err.response?.data);
        
        // Handle errors separately for each request
        if (err.response?.status === 404) {
          setError('Teams endpoint not found. Please check your server.');
        } else if (err.response?.status === 401) {
          setError('You need to be logged in to view teams.');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch teams. Please try again.');
        }
        // Set empty arrays on error to prevent crashes
        setMyTeams([]);
        setDiscoverTeams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [selectedSchool]);

  const handleTeamCreated = (newTeam) => {
    console.log('✅ New team created:', newTeam.name);
    setMyTeams(prev => [newTeam, ...prev]);
    
    // Refresh discovery teams to ensure the new team doesn't appear in discovery
    // (since user is now a member)
    setTimeout(() => {
      refreshDiscoveryTeams();
    }, 1000);
  };

  // Enhanced join request handler with better feedback
  const handleJoinRequestSuccess = useCallback((team) => {
    console.log(`✅ Join request successful for team: ${team.name} (${team._id})`);
    
    // Remove the team from discovery list immediately for better UX
    setDiscoverTeams(prev => {
      const filtered = prev.filter(t => t._id !== team._id);
      console.log(`Removed team from discovery, ${filtered.length} teams remaining`);
      return filtered;
    });
    
    // Show success message
    showInfo(`Join request sent to "${team.name}"! You'll be notified when they respond.`);
    
    // Refresh discovery teams after a short delay to ensure backend state is consistent
    setTimeout(() => {
      console.log('Refreshing discovery teams after join request...');
      refreshDiscoveryTeams();
    }, 2000);
    
  }, [refreshDiscoveryTeams, showInfo]);

  // Listen for team membership changes from other components
  useEffect(() => {
    const handleTeamMembershipChange = (event) => {
      const { action, teamId, teamName } = event.detail;
      console.log(`🔄 Team membership changed: ${action} for team ${teamName} (${teamId})`);
      
      // Refresh both my teams and discovery teams
      setTimeout(() => {
        const fetchUpdatedTeams = async () => {
          try {
            const myTeamsRes = await api.get('/teams/my-teams');
            setMyTeams(myTeamsRes.data);
            console.log(`✅ Updated my teams after membership change`);
          } catch (err) {
            console.error('❌ Error refreshing my teams after membership change:', err);
          }
        };
        
        fetchUpdatedTeams();
        refreshDiscoveryTeams();
      }, 1000);
    };

    window.addEventListener('teamMembershipChanged', handleTeamMembershipChange);
    
    return () => {
      window.removeEventListener('teamMembershipChanged', handleTeamMembershipChange);
    };
  }, [refreshDiscoveryTeams]);

  // Add socket.io integration for real-time updates
  useEffect(() => {
    // Only set up socket if user is logged in
    if (!user?._id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    
    // Import socket.io-client dynamically to avoid SSR issues
    import('socket.io-client').then(({ io }) => {
      const socket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token') // Assuming token is stored in localStorage
        }
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected for team updates');
      });

      socket.on('teamMembershipChanged', (data) => {
        console.log('🔄 Real-time team membership change:', data);
        
        const { action, teamId, teamName, message } = data;
        
        // Show appropriate message to user
        if (action === 'joined') {
          showSuccess(message || `You've joined "${teamName}"!`);
        } else if (action === 'member_added') {
          showInfo(message || `${data.newMemberName} joined your team "${teamName}"`);
        } else if (action === 'left') {
          showInfo(message || `You've left "${teamName}"`);
        }
        
        // Refresh team data
        setTimeout(async () => {
          try {
            console.log('🔄 Refreshing teams after real-time update...');
            const myTeamsRes = await api.get('/teams/my-teams');
            setMyTeams(myTeamsRes.data);
            refreshDiscoveryTeams();
            console.log('✅ Teams refreshed after real-time update');
          } catch (err) {
            console.error('❌ Error refreshing teams after real-time update:', err);
          }
        }, 500);
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      // Cleanup function
      return () => {
        socket.disconnect();
      };
    }).catch(err => {
      console.error('Failed to import socket.io-client:', err);
    });
  }, [user?._id, refreshDiscoveryTeams, showSuccess, showInfo]);

  const handleLeaveTeam = useCallback(async (team) => {
    const confirmLeave = window.confirm(
      `Are you sure you want to leave "${team.name}"? This action cannot be undone.`
    );
    
    if (!confirmLeave) return;

    setActionLoading(prev => ({ ...prev, leaving: team._id }));
    try {
      await api.post(`/teams/${team._id}/leave`);
      setMyTeams(prev => prev.filter(t => t._id !== team._id));
      
      // Dispatch a custom event to notify other components about team membership change
      window.dispatchEvent(new CustomEvent('teamMembershipChanged', {
        detail: { action: 'left', teamId: team._id, teamName: team.name }
      }));
      
      showSuccess('Successfully left the team.');
    } catch (err) {
      console.error("Error leaving team:", err);
      showError(err.response?.data?.message || 'Failed to leave team.');
    } finally {
      setActionLoading(prev => ({ ...prev, leaving: null }));
    }
  }, [showSuccess, showError]);

  const handleDeleteTeam = useCallback(async (team) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${team.name}"? This action cannot be undone and will remove all team data.`
    );
    
    if (!confirmDelete) return;

    setActionLoading(prev => ({ ...prev, deleting: team._id }));
    try {
      await api.delete(`/teams/${team._id}`);
      setMyTeams(prev => prev.filter(t => t._id !== team._id));
      showSuccess('Team successfully deleted.');
    } catch (err) {
      console.error("Error deleting team:", err);
      showError(err.response?.data?.message || 'Failed to delete team.');
    } finally {
      setActionLoading(prev => ({ ...prev, deleting: null }));
    }
  }, [showSuccess, showError]);

  const handleActivateTeam = useCallback(async (team) => {
    const confirmActivate = window.confirm(
      `Are you ready to activate "${team.name}"? Once activated, other teams will be able to see and match with your team.`
    );
    
    if (!confirmActivate) return;

    setActionLoading(prev => ({ ...prev, activating: team._id }));
    try {
      const response = await api.post(`/teams/${team._id}/activate`);
      // Update the team in myTeams with the new status
      setMyTeams(prev => prev.map(t => t._id === team._id ? response.data : t));
      showSuccess('Team successfully activated! Other teams can now see and match with your team.');
    } catch (err) {
      console.error("Error activating team:", err);
      showError(err.response?.data?.message || 'Failed to activate team.');
    } finally {
      setActionLoading(prev => ({ ...prev, activating: null }));
    }
  }, [showSuccess, showError]);

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <GroupsIcon className="text-white" size={16} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-800">My Groups</h2>
                  <p className="text-sm text-neutral-500">Groups you've created or joined ({myTeams.length})</p>
                </div>
              </div>
              <button
                onClick={() => setShowJoinRequests(true)}
                className="btn btn-outline"
              >
                <GroupsIcon className="mr-2" size={16} />
                Manage Join Requests
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.map(team => (
                <TeamCard 
                  key={team._id} 
                  team={team} 
                  isMyTeam={true}
                  onLeave={handleLeaveTeam}
                  onDelete={handleDeleteTeam}
                  onActivate={handleActivateTeam}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Discover Teams Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-friendship rounded-full flex items-center justify-center">
                <SparkIcon className="text-white" size={16} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-neutral-800">Discover Other Groups</h2>
                <p className="text-sm text-neutral-500">Find new groups to connect with ({discoverTeams.length} available)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="schoolFilter" className="text-sm font-medium text-neutral-700">
                Filter by School:
              </label>
              <select
                id="schoolFilter"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="form-input w-64"
                disabled={loading}
              >
                <option value="">All Schools</option>
                {UNIVERSITIES.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center animate-pulse">
                  <SparkIcon className="text-neutral-400" size={24} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Loading Teams...</h3>
              <p className="text-neutral-600">Please wait while we fetch available teams</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-red-50 rounded-xl shadow-sm border border-red-200">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircleIcon className="text-red-500" size={24} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Teams</h3>
              <p className="text-red-600 max-w-md mx-auto">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-outline mt-4"
              >
                <RefreshIcon className="mr-2" size={16} />
                Retry
              </button>
            </div>
          ) : discoverTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoverTeams.map(team => (
                <DiscoverableTeamCard 
                  key={team._id} 
                  team={team} 
                  onJoinRequest={handleJoinRequestSuccess}
                />
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
              <p className="text-neutral-600 max-w-md mx-auto mb-4">
                {selectedSchool 
                  ? `No active teams from ${selectedSchool} are available right now.`
                  : 'No active teams are available for discovery right now.'
                }
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  <strong>Tip:</strong> {selectedSchool 
                    ? 'Try clearing the school filter to see teams from all universities, or check back later for new teams!'
                    : 'If you\'ve created teams, make sure to activate them using the "Activate Team" button in your groups section above!'
                  }
                </p>
              </div>
            </div>
          )}
        </div>


      </div>

      {/* Join Requests Modal */}
      <JoinRequestsModal
        isOpen={showJoinRequests}
        onClose={() => setShowJoinRequests(false)}
        onRequestProcessed={(action, requestData) => {
          console.log(`🔄 Join request processed: ${action}`, requestData);
          
          // Enhanced refresh logic based on action
          const fetchMyTeams = async () => {
            try {
              const response = await api.get('/teams/my-teams');
              setMyTeams(response.data);
              console.log(`✅ My teams refreshed after ${action}`);
              
              // If someone was approved, also refresh discovery teams
              if (action === 'approved') {
                await refreshDiscoveryTeams();
                console.log(`✅ Discovery teams refreshed after approval`);
                
                // Show celebration message for team growth
                if (requestData?.applicant?.name && requestData?.team?.name) {
                  showSuccess(`🎉 ${requestData.applicant.name} joined your team "${requestData.team.name}"!`);
                }
              }
            } catch (err) {
              console.error('❌ Error refreshing teams after join request processing:', err);
              showError('Failed to refresh team data. Please refresh the page.');
            }
          };
          
          fetchMyTeams();
        }}
      />
    </div>
  );
};

export default TeamsPageModern; 