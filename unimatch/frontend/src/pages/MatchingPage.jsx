import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { SparkIcon, GroupsIcon, CoupleIcon, UniversityIcon } from '../components/ui/SocialIcons';

const MatchingPage = () => {
    const { user } = useAuth();
    const [myTeams, setMyTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [potentialMatches, setPotentialMatches] = useState([]);
    const [matchRequests, setMatchRequests] = useState([]); // Combined incoming/outgoing/accepted/rejected
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
                const res = await api.get('/teams'); // Gets teams for logged-in user
                setMyTeams(res.data);
                if (res.data.length > 0) {
                    // Auto-select the first team initially
                    setSelectedTeamId(res.data[0]._id);
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
            try {
                // Fetch potential teams
                const potentialsRes = await api.get(`/teams/${selectedTeamId}/potential-matches`);
                console.log("Potential matches response:", potentialsRes.data); // Log the response
                setPotentialMatches(potentialsRes.data);
            } catch (err) {
                 console.error("Error fetching potential matches:", err);
                 setError(err.response?.data?.message || 'Failed to fetch potential matches.');
                 setPotentialMatches([]); // Clear on error
            } finally {
                 setLoadingPotentials(false);
            }

            try {
                 // Fetch existing match requests (incoming/outgoing etc.)
                const requestsRes = await api.get(`/matches/team/${selectedTeamId}`);
                setMatchRequests(requestsRes.data);
            } catch (err) {
                 console.error("Error fetching match requests:", err);
                 setError(err.response?.data?.message || 'Failed to fetch match requests.');
                 setMatchRequests([]); // Clear on error
            } finally {
                 setLoadingRequests(false);
            }
        };

        fetchMatchingData();
    }, [selectedTeamId]); // Re-run when selected team changes

    // --- Handler Functions ---

    const handleSendRequest = async (receivingTeamId) => {
        setError('');
        try {
            await api.post('/matches', { requestingTeamId: selectedTeamId, receivingTeamId });
            // Refresh data after sending request
            // A simple way is to re-trigger the useEffect by changing selectedTeamId slightly
            // A better way might be to update state directly or have a dedicated refresh function
            setSelectedTeamId(''); // Clear selection
            setTimeout(() => setSelectedTeamId(selectedTeamId), 50); // Re-select after delay
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
             // Refresh data
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
             // Refresh data
            setSelectedTeamId('');
            setTimeout(() => setSelectedTeamId(selectedTeamId), 50);
            alert('Match request cancelled.');
        } catch (err) {
            console.error("Error cancelling match request:", err);
            setError(err.response?.data?.message || 'Failed to cancel match request.');
        }
    };


    // --- Render Logic ---

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

    // Filter match requests for display - Added null checks for teams
    const incomingPending = matchRequests.filter(m =>
        m.status === 'pending' &&
        m.receivingTeam?._id === selectedTeamId // Check if receivingTeam exists before accessing _id
    );
    const outgoingPending = matchRequests.filter(m =>
        m.status === 'pending' &&
        m.requestingTeam?._id === selectedTeamId // Check if requestingTeam exists before accessing _id
    );
    // Filter accepted matches more defensively, ensuring teams are populated
    const acceptedMatches = matchRequests.filter(m =>
        m && // Check if match object exists
        m.status === 'accepted' &&
        m.requestingTeam && // Check if requestingTeam object exists
        m.receivingTeam    // Check if receivingTeam object exists
    );
    // Add rejected/cancelled if needed

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
            ) : (
              potentialMatches.filter(team => team._id !== selectedTeamId).length > 0 ? (
                <div className="grid grid-2 gap-6">
                  {potentialMatches
                    .filter(team => team._id !== selectedTeamId)
                    .map(team => (
                      <div key={team._id} className="card hover:shadow-xl transition-all duration-300">
                        <div className="card-body">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-sunset rounded-full flex items-center justify-center text-white font-bold">
                              {team.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-800">{team.name}</h3>
                              <span className="badge badge-primary">{team.university}</span>
                            </div>
                          </div>
                          <p className="text-neutral-600 mb-4">{team.description || 'No description available'}</p>
                          <div className="mb-4">
                            <h4 className="font-medium text-neutral-700 mb-2">Members:</h4>
                            <div className="flex flex-wrap gap-2">
                              {team.members.map(member => (
                                <span key={member._id} className="badge badge-outline text-xs">{member.name}</span>
                              ))}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleSendRequest(team._id)}
                            className="btn btn-primary w-full"
                          >
                            <SparkIcon className="mr-2" size={16} />
                            Send Match Request
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="bg-neutral-200 rounded-full p-4">
                      <CoupleIcon className="text-neutral-500" size={32} />
                    </div>
                  </div>
                  <p className="text-neutral-600">No potential new matches found for this team.</p>
                  <p className="text-sm text-neutral-500 mt-2">Try checking back later or explore other teams!</p>
                </div>
              )
            )}
          </div>
        </div>

       <hr style={{ margin: '20px 0' }}/>

       {/* Match Requests Section */}
       <h2>Match Requests & Status</h2>
       {loadingRequests ? <p>Loading requests...</p> : (
           <>
               {/* Incoming Pending Requests */}
               <h3>Incoming Requests (Pending)</h3>
               {incomingPending.length > 0 ? (
                   <ul>
                       {incomingPending.map(match => (
                           <li key={match._id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                               Request from:{' '}
                               {/* Link to the requesting team's profile */}
                               <Link to={`/teams/${match.requestingTeam._id}`}>
                                   <strong>{match.requestingTeam.name}</strong>
                               </Link>
                               {' '} {/* Add space */}
                               ({match.requestingTeam.university})
                               <p>{match.requestingTeam.description || 'No description'}</p>
                               <p>Members:{' '}
                                   {/* List members with links to their profiles */}
                                   {match.requestingTeam.members.map((member, index) => (
                                       <React.Fragment key={member._id}>
                                           <Link to={`/users/${member._id}`}>{member.name}</Link>
                                           {index < match.requestingTeam.members.length - 1 && ', '}
                                       </React.Fragment>
                                   ))}
                               </p>
                               <button onClick={() => handleRespondRequest(match._id, 'accepted')} style={{ marginLeft: '10px', background: 'lightgreen' }}>Accept</button>
                               <button onClick={() => handleRespondRequest(match._id, 'rejected')} style={{ marginLeft: '5px', background: 'lightcoral' }}>Reject</button>
                           </li>
                       ))}
                   </ul>
               ) : <p>No incoming pending requests.</p>}

                {/* Outgoing Pending Requests */}
               <h3>Outgoing Requests (Pending)</h3>
               {outgoingPending.length > 0 ? (
                   <ul>
                       {outgoingPending.map(match => (
                           <li key={match._id}>
                               Request to: <strong>{match.receivingTeam.name}</strong>
                               <button onClick={() => handleCancelRequest(match._id)} style={{ marginLeft: '10px', background: 'orange' }}>Cancel Request</button>
                           </li>
                       ))}
                   </ul>
               ) : <p>No outgoing pending requests.</p>}

                {/* Accepted Matches */}
               <h3>Accepted Matches</h3>
                {acceptedMatches.length > 0 ? (
                   <ul>
                       {acceptedMatches.map(match => {
                           // Determine the other team safely with explicit null checks
                           let otherTeamName = 'Unknown/Deleted Team';
                           // Check if BOTH team objects exist after population
                           if (match.requestingTeam && match.receivingTeam) {
                               if (match.requestingTeam._id === selectedTeamId) {
                                   otherTeamName = match.receivingTeam.name;
                               } else {
                                   otherTeamName = match.requestingTeam.name;
                               }
                           } else {
                               // Log if one or both teams are missing (likely deleted)
                               console.warn(`Match ${match._id} references a deleted team.`);
                           }

                           // Determine the other team's ID for linking
                           let otherTeamId = null;
                           if (match.requestingTeam && match.receivingTeam) {
                               otherTeamId = match.requestingTeam._id === selectedTeamId
                                   ? match.receivingTeam._id
                                   : match.requestingTeam._id;
                           }

                           return (
                               <li key={match._id}>
                                   Matched with:{' '}
                                   {otherTeamId ? (
                                       <Link to={`/teams/${otherTeamId}`}>
                                           <strong>{otherTeamName}</strong>
                                       </Link>
                                   ) : (
                                       <strong>{otherTeamName}</strong>
                                   )}
                                   {' '} {/* Add space */}
                                   {/* Add link to chat later */}
                                   {/* Example: <Link to={`/chat/${match._id}`}>Chat</Link> */}
                               </li>
                           );
                       })}
                   </ul>
               ) : <p>No accepted matches yet.</p>}
           </>
       )}
      </div>
    </div>
  );
};

export default MatchingPage;
