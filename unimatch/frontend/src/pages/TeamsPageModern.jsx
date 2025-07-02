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

// Modern Create Team Form Component
const CreateTeamForm = ({ onCreateSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('Friendship');
  const [interests, setInterests] = useState('');
  const [meetingPreference, setMeetingPreference] = useState('Flexible');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const interestsArray = interests.split(',').map(item => item.trim()).filter(item => item !== '');

      const res = await api.post('/teams', {
        name,
        description,
        purpose,
        interests: interestsArray,
        meetingPreference
      });
      
      onCreateSuccess(res.data);
      
      // Clear form and hide it
      setName('');
      setDescription('');
      setPurpose('Friendship');
      setInterests('');
      setMeetingPreference('Flexible');
      setShowForm(false);
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  };

  const purposeOptions = [
    { value: 'Friendship', icon: GroupsIcon, color: 'bg-gradient-friendship' },
    { value: 'Dating', icon: CoupleIcon, color: 'bg-gradient-love' },
    { value: 'Study Group', icon: UniversityIcon, color: 'bg-gradient-secondary' },
    { value: 'Social Activities', icon: CoffeeIcon, color: 'bg-gradient-accent' },
    { value: 'Mixed (Friends & Dating)', icon: SparkIcon, color: 'bg-gradient-primary' }
  ];

  const meetingOptions = [
    { value: 'Online', emoji: '💻' },
    { value: 'In-Person', emoji: '🏛️' },
    { value: 'Hybrid', emoji: '🔄' },
    { value: 'Flexible', emoji: '⚡' }
  ];

  if (!showForm) {
    return (
      <div className="card mb-8 animate-fade-in">
        <div className="card-body text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient rounded-full p-4">
              <PlusIcon className="text-white" size={32} />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Create a New Group</h3>
          <p className="text-neutral-600 mb-6">
            Form a group with your university friends to meet other groups and make connections
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="mr-2" size={16} />
            Create Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-8 animate-slide-up">
      <div className="card-header">
        <h3 className="text-xl font-semibold text-neutral-800">Create New Group</h3>
      </div>
      <div className="card-body">
        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Group Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your group name..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your group's interests and what you're looking for..."
              maxLength="500"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label className="form-label">What are you looking for?</label>
            <select
              className="form-input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="Friendship">Friendship</option>
              <option value="Dating">Dating</option>
              <option value="Study Group">Study Group</option>
              <option value="Social Activities">Social Activities</option>
              <option value="Mixed (Friends & Dating)">Mixed (Friends & Dating)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Interests & Skills</label>
            <input
              type="text"
              className="form-input"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g., Movies, Sports, Music, Travel, Gaming, Food"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Meeting Preference</label>
            <select
              className="form-input"
              value={meetingPreference}
              onChange={(e) => setMeetingPreference(e.target.value)}
            >
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Group'}
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
  const getPurposeIcon = (purpose) => {
    switch (purpose) {
      case 'Friendship': return GroupsIcon;
      case 'Dating': return CoupleIcon;
      case 'Study Group': return UniversityIcon;
      case 'Social Activities': return CoffeeIcon;
      case 'Mixed (Friends & Dating)': return SparkIcon;
      default: return GroupsIcon;
    }
  };

  const getPurposeColor = (purpose) => {
    switch (purpose) {
      case 'Friendship': return 'bg-gradient-friendship';
      case 'Dating': return 'bg-gradient-love';
      case 'Study Group': return 'bg-gradient-secondary';
      case 'Social Activities': return 'bg-gradient-accent';
      case 'Mixed (Friends & Dating)': return 'bg-gradient-primary';
      default: return 'bg-gradient-friendship';
    }
  };

  const IconComponent = getPurposeIcon(team.purpose);

  return (
    <div className="card hover:shadow-2xl transition-all duration-300 animate-bounce-in">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`${getPurposeColor(team.purpose)} rounded-lg p-3`}>
              <IconComponent className="text-white" size={24} />
            </div>
            <div>
              <Link 
                to={`/teams/${team._id}`}
                className="text-xl font-semibold text-neutral-800 hover:text-primary-rose transition-colors"
              >
                {team.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-outline">{team.purpose}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-neutral-500">
            <GroupsIcon size={16} />
            <span className="text-sm font-medium">{team.members.length}</span>
          </div>
        </div>

        <p className="text-neutral-600 mb-4 leading-relaxed">
          {team.description || 'No description provided yet.'}
        </p>

        <div className="mb-4">
          <span className="badge badge-primary">{team.university}</span>
        </div>

        {team.interests && team.interests.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {team.interests.slice(0, 3).map((interest, index) => (
                <span key={index} className="badge badge-outline text-xs">
                  {interest}
                </span>
              ))}
              {team.interests.length > 3 && (
                <span className="badge badge-outline text-xs">
                  +{team.interests.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <Link 
          to={`/teams/${team._id}`}
          className="btn btn-outline w-full"
        >
          View Details
          <ArrowRightIcon className="ml-2" size={16} />
        </Link>
      </div>
    </div>
  );
};

// Main Teams Page Component
const TeamsPageModern = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/teams');
        setTeams(res.data);
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
    setTeams(prevTeams => [...prevTeams, newTeam]);
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient rounded-full p-4">
              <GroupsIcon className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-neutral-800 mb-4 font-family-heading">
            My <span className="text-gradient">Groups</span>
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Create groups with your university friends and connect with groups from other schools
          </p>
        </div>

        {/* Create Team Form */}
        <CreateTeamForm onCreateSuccess={handleTeamCreated} />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-neutral-600">Loading your groups...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error p-6 rounded-lg text-center mb-8">
            <h3 className="font-semibold mb-2">Error Loading Groups</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Teams Grid */}
        {!loading && !error && (
          <>
            {teams.length > 0 ? (
              <div className="grid grid-3 gap-6">
                {teams.map(team => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
            ) : (
                              <div className="text-center py-16 animate-fade-in">
                  <div className="flex justify-center mb-6">
                    <div className="bg-neutral-200 rounded-full p-6">
                      <GroupsIcon className="text-neutral-500" size={48} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-800 mb-4">
                    No Groups Yet
                  </h3>
                  <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                    You haven't created any groups yet. Form your first group with university friends to start meeting other groups!
                  </p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeamsPageModern; 