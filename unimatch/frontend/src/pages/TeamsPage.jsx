import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom'; // For linking to team details later

// Placeholder for CreateTeamForm component
const CreateTeamForm = ({ onCreateSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/teams', { name, description });
            onCreateSuccess(res.data); // Pass new team data up
            setName(''); // Clear form
            setDescription('');
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
                {/* Link to a future TeamDetailPage */}
                {/* <Link to={`/teams/${team._id}`}> */}
                  <strong>{team.name}</strong>
                {/* </Link> */}
                <p>University: {team.university}</p>
                <p>Description: {team.description || 'N/A'}</p>
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
