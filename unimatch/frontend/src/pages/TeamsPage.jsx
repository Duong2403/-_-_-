import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom'; // For linking to team details later

// Placeholder for CreateTeamForm component
const CreateTeamForm = ({ onCreateSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [purpose, setPurpose] = useState('Other'); // Default value
    const [interests, setInterests] = useState(''); // Input as comma-separated string
    const [meetingPreference, setMeetingPreference] = useState('Flexible'); // Default value
    // const [initialMemberEmails, setInitialMemberEmails] = useState(''); // REMOVED state for emails
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Convert comma-separated interests string to array, trimming whitespace
            const interestsArray = interests.split(',').map(item => item.trim()).filter(item => item !== '');

            const res = await api.post('/teams', {
                name,
                description,
                purpose,
                interests: interestsArray,
                meetingPreference
                // initialMemberEmails: initialMemberEmails.split(',').map(e => e.trim()).filter(e => e !== '') // REMOVED sending emails
            });
            onCreateSuccess(res.data); // Pass new team data up
            // Clear form
            setName('');
            setDescription('');
            setPurpose('Other');
            setInterests('');
            setMeetingPreference('Flexible');
            // setInitialMemberEmails(''); // REMOVED clearing emails input
        } catch (err) {
            console.error("Error creating team:", err);
            setError(err.response?.data?.message || 'Failed to create team.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
            <h3>Create New Team</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="teamName">Team Name: </label>
                <input
                    type="text"
                    id="teamName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="teamDescription">Description (Optional): </label>
                <textarea
                    id="teamDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    maxLength="500"
                />
            </div>
             {/* Purpose Dropdown */}
             <div style={{ marginBottom: '10px' }}>
                <label htmlFor="teamPurpose">Purpose: </label>
                <select
                    id="teamPurpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                >
                    <option value="Study Group">Study Group</option>
                    <option value="Project Team">Project Team</option>
                    <option value="Social Club">Social Club</option>
                    <option value="Competition Team">Competition Team</option>
                    <option value="Other">Other</option>
                </select>
            </div>
             {/* Interests Input */}
             <div style={{ marginBottom: '10px' }}>
                <label htmlFor="teamInterests">Interests (comma-separated): </label>
                <input
                    type="text"
                    id="teamInterests"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g., AI, Web Dev, Hiking"
                />
            </div>
             {/* Meeting Preference Dropdown */}
             <div style={{ marginBottom: '10px' }}>
                <label htmlFor="teamMeetingPref">Meeting Preference: </label>
                <select
                    id="teamMeetingPref"
                    value={meetingPreference}
                    onChange={(e) => setMeetingPreference(e.target.value)}
                >
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Flexible">Flexible</option>
                </select>
            </div>
            {/* REMOVED Initial Members Input */}
            <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Team'}
            </button>
        </form>
    );
};


const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/teams'); // Fetches teams for the logged-in user
        setTeams(res.data);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError(err.response?.data?.message || 'Failed to fetch teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []); // Fetch on component mount

  const handleTeamCreated = (newTeam) => {
      // Add the newly created team to the list
      setTeams(prevTeams => [...prevTeams, newTeam]);
  };

  return (
    <div>
      <h1>My Teams</h1>

      <CreateTeamForm onCreateSuccess={handleTeamCreated} />

      {loading && <p>Loading teams...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        teams.length > 0 ? (
          <ul>
            {teams.map(team => (
              <li key={team._id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                {/* Link the team name */}
                <Link to={`/teams/${team._id}`}>
                  <strong>{team.name}</strong>
                </Link>
                <p>University: {team.university}</p>
                <p>Description: {team.description || 'N/A'}</p>
                <p>Purpose: {team.purpose}</p>
                <p>Interests: {team.interests?.join(', ') || 'N/A'}</p>
                <p>Meeting Preference: {team.meetingPreference}</p>
                <p>Members: {team.members.length}</p> {/* Display member count for now */}
                {/* Add more details or management buttons later */}
              </li>
            ))}
          </ul>
        ) : (
          <p>You are not currently a member of any teams. Why not create one?</p>
        )
      )}
    </div>
  );
};

export default TeamsPage;
