import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Import Link

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

    if (loadingMyTeams) return <p>Loading your teams...</p>;

    // Added Link import, so this should work now
    if (myTeams.length === 0) return <p>You need to be part of a team to find matches. <Link to="/teams">Go to Teams</Link></p>;

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
    <div>
      <h1>Team Matching</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Team Selector */}
      <div>
        <label htmlFor="teamSelect">Select Your Team: </label>
        <select
            id="teamSelect"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            disabled={loadingPotentials || loadingRequests}
        >
            {myTeams.map(team => (
                <option key={team._id} value={team._id}>{team.name}</option>
            ))}
        </select>
      </div>
      <hr style={{ margin: '20px 0' }}/>

      {/* Potential Matches Section */}
      <h2>Find New Matches</h2>
      {loadingPotentials ? <p>Loading potential matches...</p> : (
          // Filter out the currently selected team before mapping
          potentialMatches.filter(team => team._id !== selectedTeamId).length > 0 ? (
              <ul>
                  {potentialMatches
                    .filter(team => team._id !== selectedTeamId) // Explicitly exclude the selected team
                    .map(team => (
                      <li key={team._id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                          <strong>{team.name}</strong> ({team.university})
                          <p>{team.description || 'No description'}</p>
                          <p>Members: {team.members.map(m => m.name).join(', ')}</p>
                          <button onClick={() => handleSendRequest(team._id)}>Send Match Request</button>
                      </li>
                  ))}
              </ul>
          ) : <p>No potential new matches found for this team.</p>
      )}

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
                           <li key={match._id}>
                               Request from: <strong>{match.requestingTeam.name}</strong>
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
  );
};

export default MatchingPage;
