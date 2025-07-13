import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getUniversityDisplayName } from '../constants/universities';
import { 
  GroupsIcon,
  SparkIcon,
  CoupleIcon,
  DateIcon,
  UniversityIcon
} from './ui/SocialIcons';
import { 
  PlusIcon,
  ArrowRightIcon,
  CheckIcon,
  XIcon
} from './ui/Icons';

const DiscoverableTeamCard = ({ team, onJoinRequest }) => {
  const [loading, setLoading] = useState(false);
  const [joinRequested, setJoinRequested] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [error, setError] = useState('');

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

  const handleJoinRequest = async () => {
    console.log(`=== DISCOVERABLE TEAM CARD JOIN REQUEST ===`);
    console.log(`Attempting to join team: ${team.name} (${team._id})`);
    console.log(`Team university: "${team.university}"`);
    console.log(`Join message: "${joinMessage}"`);
    
    setLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      const response = await api.post('/join-requests', {
        teamId: team._id,
        message: joinMessage
      });
      
      console.log('✅ Join request successful:', response.data);
      
      setJoinRequested(true);
      setShowJoinModal(false);
      setJoinMessage('');
      setError(''); // Clear errors on success
      
      // Call the parent callback to handle team removal and show success message
      if (onJoinRequest) {
        onJoinRequest(team);
      }
      
    } catch (err) {
      console.error('❌ Join request failed:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract and set detailed error message
      const errorMessage = err.response?.data?.message || 'Failed to send join request';
      setError(errorMessage);
      
      // Log additional error details for debugging
      if (err.response?.status) {
        console.error(`HTTP Status: ${err.response.status}`);
      }
      
      // Don't close modal on error so user can see the error and try again
      // setShowJoinModal(false); // Keep modal open
      
      // For certain errors, provide specific guidance
      if (errorMessage.includes('university')) {
        console.log('University mismatch detected - this should not happen if discovery is working correctly');
      } else if (errorMessage.includes('already have a pending request')) {
        console.log('Duplicate request detected');
        // Auto-close modal for this error since user can't retry
        setTimeout(() => {
          setShowJoinModal(false);
          setJoinRequested(true); // Show as requested since there's already a pending request
        }, 3000);
      }
      
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowJoinModal(false);
    setError(''); // Clear errors when closing modal
    setJoinMessage(''); // Clear message
  };

  return (
    <>
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
              <span className="badge badge-info">{getUniversityDisplayName(team.university)}</span>
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

            {/* Members Section */}
            {team.members && team.members.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-2 flex items-center gap-1">
                  <GroupsIcon size={12} />
                  Members ({team.members.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {team.members.filter(member => member && member._id && member.name).slice(0, 3).map(member => (
                    <Link
                      key={member._id}
                      to={`/users/${member._id}`}
                      className="flex items-center gap-1 bg-white rounded-full px-2 py-1 hover:bg-neutral-100 transition-colors text-xs"
                    >
                      <div className="w-5 h-5 bg-gradient-sunset rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-neutral-700 hover:text-primary-rose transition-colors">
                        {member.name.split(' ')[0]}
                      </span>
                    </Link>
                  ))}
                  {team.members.filter(member => member && member._id && member.name).length > 3 && (
                    <span className="flex items-center text-xs text-neutral-500 px-2 py-1">
                      +{team.members.filter(member => member && member._id && member.name).length - 3} more
                    </span>
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
            
            {joinRequested ? (
              <button className="btn btn-success w-full" disabled>
                <CheckIcon className="mr-2" size={16} />
                Join Request Sent
              </button>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn btn-outline w-full"
                disabled={loading}
              >
                <PlusIcon className="mr-2" size={16} />
                {loading ? 'Processing...' : 'Request to Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Join Request Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">
                Request to Join "{team.name}"
              </h3>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-600"
                disabled={loading}
              >
                <XIcon size={24} />
              </button>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <XIcon size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                {error.includes('university') && (
                  <p className="text-red-600 text-xs mt-1">
                    If you believe this is an error, please refresh the page and try again.
                  </p>
                )}
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-neutral-600 mb-3">
                Send a message to the team creator explaining why you'd like to join their team.
              </p>
              <textarea
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Hi! I'd love to join your team because..."
                className="form-input w-full h-24 resize-none"
                maxLength={500}
                disabled={loading}
              />
              <div className="text-xs text-neutral-400 mt-1">
                {joinMessage.length}/500 characters
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleJoinRequest}
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
              <button
                onClick={closeModal}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiscoverableTeamCard; 