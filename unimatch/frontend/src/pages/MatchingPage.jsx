import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { SparkIcon, GroupsIcon, CoupleIcon, UniversityIcon, DateIcon } from '../components/ui/SocialIcons';

const MatchingPage = () => {
    const { user } = useAuth();
    const [myTeams, setMyTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [potentialMatches, setPotentialMatches] = useState([]);
    const [matchRequests, setMatchRequests] = useState([]);
    const [loadingMyTeams, setLoadingMyTeams] = useState(true);
    const [loadingPotentials, setLoadingPotentials] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [error, setError] = useState('');

    // Fetch user's teams on mount
    useEffect(() => {
        const fetchMyTeams = async () => {
            setLoadingMyTeams(true);
            setError('');
            try {
                const res = await api.get('/teams/my-teams');
                console.log("My teams response:", res.data);
                setMyTeams(res.data);
                if (res.data.length > 0) {
                    setSelectedTeamId(res.data[0]._id);
                    console.log("Auto-selected team:", res.data[0]._id, res.data[0].name);
                }
            } catch (err) {
                console.error("Error fetching user's teams:", err);
                setError(err.response?.data?.message || 'Failed to fetch your teams.');
            } finally {
                setLoadingMyTeams(false);
            }
        };
        fetchMyTeams();
    }, []);

    // Fetch potential matches and existing requests when selectedTeamId changes
    useEffect(() => {
        if (!selectedTeamId) {
            setPotentialMatches([]);
            setMatchRequests([]);
            return;
        }

        const fetchMatchingData = async () => {
            setLoadingPotentials(true);
            setLoadingRequests(true);
            setError('');
            console.log("Fetching matching data for team:", selectedTeamId);
            
            try {
                const potentialsRes = await api.get(`/teams/${selectedTeamId}/potential-matches`);
                console.log("Potential matches response:", potentialsRes.data);
                setPotentialMatches(potentialsRes.data);
            } catch (err) {
                 console.error("Error fetching potential matches:", err);
                 console.error("Error details:", err.response?.data);
                 setError(err.response?.data?.message || 'Failed to fetch potential matches.');
                 setPotentialMatches([]);
            } finally {
                 setLoadingPotentials(false);
            }

            try {
                const requestsRes = await api.get(`/matches/team/${selectedTeamId}`);
                console.log("Match requests response:", requestsRes.data);
                setMatchRequests(requestsRes.data);
            } catch (err) {
                 console.error("Error fetching match requests:", err);
                 console.error("Error details:", err.response?.data);
                 setError(err.response?.data?.message || 'Failed to fetch match requests.');
                 setMatchRequests([]);
            } finally {
                 setLoadingRequests(false);
            }
        };

        fetchMatchingData();
    }, [selectedTeamId]);

    const handleSendRequest = async (receivingTeamId) => {
        setError('');
        try {
            await api.post('/matches', { requestingTeamId: selectedTeamId, receivingTeamId });
            setSelectedTeamId('');
            setTimeout(() => setSelectedTeamId(selectedTeamId), 50);
            alert('Match request sent!');
        } catch (err) {
            console.error("Error sending match request:", err);
            setError(err.response?.data?.message || 'Failed to send match request.');
        }
    };

    const handleRespondRequest = async (matchId, response) => {
         setError('');
        try {
            await api.put(`/matches/${matchId}/respond`, { response });
            setSelectedTeamId('');
            setTimeout(() => setSelectedTeamId(selectedTeamId), 50);
            alert(`Match request ${response}!`);
        } catch (err) {
            console.error(`Error responding to match request (${response}):`, err);
            setError(err.response?.data?.message || `Failed to ${response} match request.`);
        }
    };

     const handleCancelRequest = async (matchId) => {
         setError('');
         if (!window.confirm('Are you sure you want to cancel this pending request?')) return;
        try {
            await api.delete(`/matches/${matchId}/cancel`);
            setSelectedTeamId('');
            setTimeout(() => setSelectedTeamId(selectedTeamId), 50);
            alert('Match request cancelled.');
        } catch (err) {
            console.error("Error cancelling match request:", err);
            setError(err.response?.data?.message || 'Failed to cancel match request.');
        }
    };

    if (loadingMyTeams) {
        return (
            <div className="bg-neutral-50 min-h-screen">
                <div className="container py-16">
                    <div className="text-center animate-fade-in">
                        <div className="flex justify-center mb-6">
                            <div className="bg-neutral-200 rounded-full p-6">
                                <SparkIcon className="text-neutral-500" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Loading your teams...</h2>
                        <p className="text-neutral-600">Please wait while we fetch your data</p>
                    </div>
                </div>
            </div>
        );
    }

    if (myTeams.length === 0) {
        return (
            <div className="bg-neutral-50 min-h-screen">
                <div className="container py-16">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-gradient-friendship rounded-full p-6">
                                <GroupsIcon className="text-white" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Join a Team First</h2>
                        <p className="text-neutral-600 mb-6">You need to be part of a team to find matches with other university groups.</p>
                        <Link to="/teams" className="btn btn-primary">
                            <GroupsIcon className="mr-2" size={16} />
                            Go to Teams
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Filter match requests for display
    const incomingPending = matchRequests.filter(m =>
        m.status === 'pending' &&
        m.receivingTeam?._id === selectedTeamId
    );
    const outgoingPending = matchRequests.filter(m =>
        m.status === 'pending' &&
        m.requestingTeam?._id === selectedTeamId
    );
    const acceptedMatches = matchRequests.filter(m =>
        m && m.status === 'accepted' &&
        m.requestingTeam && m.receivingTeam
    );

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-love rounded-full p-4">
              <SparkIcon className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-neutral-800 mb-4 font-family-heading">
            Find Your <span className="text-gradient">Perfect Match</span> 💕
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Connect your team with amazing groups from other universities
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error p-4 rounded-lg mb-6 animate-slide-up">
            {error}
          </div>
        )}

        {/* Team Selector */}
        <div className="card mb-8 animate-slide-up">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-neutral-800 flex items-center">
              <GroupsIcon className="mr-2" size={20} />
              Select Your Team
            </h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="teamSelect" className="form-label">Choose which team to find matches for:</label>
              <select
                id="teamSelect"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={loadingPotentials || loadingRequests}
                className="form-input"
              >
                {myTeams.map(team => (
                  <option key={team._id} value={team._id}>{team.name} - {team.university}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Potential Matches Section */}
        <div className="card mb-8 animate-slide-up">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-neutral-800 flex items-center">
              <CoupleIcon className="mr-2" size={20} />
              Find New Matches
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Discover teams from other universities to connect with</p>
          </div>
          <div className="card-body">
            {loadingPotentials ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-neutral-200 rounded-full p-4">
                    <SparkIcon className="text-neutral-500" size={32} />
                  </div>
                </div>
                <p className="text-neutral-600">Loading potential matches...</p>
              </div>
            ) : potentialMatches.filter(team => team._id !== selectedTeamId).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {potentialMatches
                    .filter(team => team._id !== selectedTeamId)
                    .map(team => (
                      <div key={team._id} className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="card-body p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-sunset rounded-full flex items-center justify-center text-white font-bold">
                              {team.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <Link to={`/teams/${team._id}`} className="hover:underline">
                                <h3 className="text-lg font-semibold text-neutral-800 hover:text-primary-rose transition-colors">
                                  {team.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="badge badge-primary">{team.university}</span>
                                {team.teamGender && (
                                  <span className="badge badge-outline">{team.teamGender}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-neutral-600 mb-4 line-clamp-2">
                            {team.description || 'No description available'}
                          </p>
                          
                          <div className="mb-4">
                            <h4 className="font-medium text-neutral-700 mb-2 flex items-center gap-1">
                              <GroupsIcon size={14} />
                              Members ({team.members?.length || 0}):
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {team.members?.map(member => (
                                <Link 
                                  key={member._id} 
                                  to={`/users/${member._id}`}
                                  className="badge badge-outline text-xs hover:bg-primary-light transition-colors"
                                >
                                  {member.name}
                                </Link>
                              )) || <span className="text-sm text-neutral-400">No members listed</span>}
                            </div>
                          </div>

                          {/* Team Details */}
                          {(team.teamVibe?.length > 0 || team.topInterests?.length > 0) && (
                            <div className="mb-4 space-y-2">
                              {team.teamVibe?.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-1">Vibe</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {team.teamVibe.slice(0, 2).map(vibe => (
                                      <span key={vibe} className="badge badge-secondary text-xs">{vibe}</span>
                                    ))}
                                    {team.teamVibe.length > 2 && (
                                      <span className="badge badge-outline text-xs">+{team.teamVibe.length - 2}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {team.topInterests?.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-1">Interests</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {team.topInterests.slice(0, 3).map(interest => (
                                      <span key={interest} className="badge badge-primary text-xs">{interest}</span>
                                    ))}
                                    {team.topInterests.length > 3 && (
                                      <span className="badge badge-outline text-xs">+{team.topInterests.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Link 
                              to={`/teams/${team._id}`}
                              className="btn btn-outline flex-1"
                            >
                              View Profile
                            </Link>
                            <button 
                              onClick={() => handleSendRequest(team._id)}
                              className="btn btn-primary flex-1"
                            >
                              <SparkIcon className="mr-2" size={16} />
                              Send Request
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                      <CoupleIcon className="text-neutral-400" size={32} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">No New Matches Found</h3>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    No potential new matches found for this team. Try checking back later or explore other teams!
                  </p>
                </div>
              )
            }
          </div>
        </div>

        {/* Match Requests Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incoming Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <DateIcon className="mr-2" size={18} />
                Incoming Requests
              </h3>
              <span className="badge badge-primary">{incomingPending.length}</span>
            </div>
            <div className="card-body">
              {loadingRequests ? (
                <div className="text-center py-4">
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : incomingPending.length > 0 ? (
                <div className="space-y-4">
                  {incomingPending.map(match => (
                    <div key={match._id} className="bg-neutral-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Link to={`/teams/${match.requestingTeam._id}`} className="hover:underline">
                          <h4 className="font-semibold text-neutral-800 hover:text-primary-rose">
                            {match.requestingTeam.name}
                          </h4>
                        </Link>
                        <p className="text-sm text-neutral-500">{match.requestingTeam.university}</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {match.requestingTeam.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRespondRequest(match._id, 'accepted')}
                          className="btn btn-success btn-sm flex-1"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRespondRequest(match._id, 'rejected')}
                          className="btn btn-error btn-sm flex-1"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No incoming requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Outgoing Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <SparkIcon className="mr-2" size={18} />
                Outgoing Requests
              </h3>
              <span className="badge badge-secondary">{outgoingPending.length}</span>
            </div>
            <div className="card-body">
              {loadingRequests ? (
                <div className="text-center py-4">
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : outgoingPending.length > 0 ? (
                <div className="space-y-4">
                  {outgoingPending.map(match => (
                    <div key={match._id} className="bg-neutral-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Link to={`/teams/${match.receivingTeam._id}`} className="hover:underline">
                          <h4 className="font-semibold text-neutral-800 hover:text-primary-rose">
                            {match.receivingTeam.name}
                          </h4>
                        </Link>
                        <p className="text-sm text-neutral-500">{match.receivingTeam.university}</p>
                      </div>
                      <button 
                        onClick={() => handleCancelRequest(match._id)}
                        className="btn btn-outline btn-sm w-full"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No outgoing requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Accepted Matches */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <CoupleIcon className="mr-2" size={18} />
                Accepted Matches
              </h3>
              <span className="badge badge-success">{acceptedMatches.length}</span>
            </div>
            <div className="card-body">
              {loadingRequests ? (
                <div className="text-center py-4">
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : acceptedMatches.length > 0 ? (
                <div className="space-y-4">
                  {acceptedMatches.map(match => {
                    let otherTeamName = 'Unknown Team';
                    let otherTeamId = null;
                    
                    if (match.requestingTeam && match.receivingTeam) {
                      if (match.requestingTeam._id === selectedTeamId) {
                        otherTeamName = match.receivingTeam.name;
                        otherTeamId = match.receivingTeam._id;
                      } else {
                        otherTeamName = match.requestingTeam.name;
                        otherTeamId = match.requestingTeam._id;
                      }
                    }

                    return (
                      <div key={match._id} className="bg-green-50 p-4 rounded-lg">
                        <div className="mb-3">
                          {otherTeamId ? (
                            <Link to={`/teams/${otherTeamId}`} className="hover:underline">
                              <h4 className="font-semibold text-green-800 hover:text-green-600">
                                {otherTeamName}
                              </h4>
                            </Link>
                          ) : (
                            <h4 className="font-semibold text-green-800">{otherTeamName}</h4>
                          )}
                        </div>
                        <Link 
                          to={`/chat`}
                          className="btn btn-primary btn-sm w-full"
                        >
                          Start Chatting
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No accepted matches yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingPage;
