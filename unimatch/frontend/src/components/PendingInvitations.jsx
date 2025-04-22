import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const PendingInvitations = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [respondingInviteId, setRespondingInviteId] = useState(null); // Track which invite is being processed

    const fetchInvitations = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/invitations/pending');
            setInvitations(res.data);
        } catch (err) {
            console.error("Error fetching pending invitations:", err);
            setError(err.response?.data?.message || 'Failed to fetch invitations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []); // Fetch on mount

    const handleResponse = async (inviteId, response) => {
        setRespondingInviteId(inviteId); // Set loading state for this specific invite
        setError('');
        try {
            await api.put(`/invitations/${inviteId}/respond`, { response });
            // Remove the responded invitation from the list
            setInvitations(prev => prev.filter(invite => invite._id !== inviteId));
            alert(`Invitation ${response}.`);
        } catch (err) {
            console.error(`Error responding to invitation (${response}):`, err);
            setError(err.response?.data?.message || `Failed to ${response} invitation.`);
        } finally {
            setRespondingInviteId(null); // Clear loading state
        }
    };

    if (loading) return <p>Loading invitations...</p>;

    return (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd' }}>
            <h3>Pending Team Invitations</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {invitations.length > 0 ? (
                <ul>
                    {invitations.map(invite => (
                        <li key={invite._id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                            Invitation to join team{' '}
                            <Link to={`/teams/${invite.team._id}`}><strong>{invite.team.name}</strong></Link>
                            {' '}from <strong>{invite.inviter.name}</strong>.
                            <div style={{ marginTop: '5px' }}>
                                <button
                                    onClick={() => handleResponse(invite._id, 'accepted')}
                                    disabled={respondingInviteId === invite._id}
                                    style={{ background: 'lightgreen', marginRight: '5px' }}
                                >
                                    {respondingInviteId === invite._id ? 'Accepting...' : 'Accept'}
                                </button>
                                <button
                                    onClick={() => handleResponse(invite._id, 'rejected')}
                                    disabled={respondingInviteId === invite._id}
                                    style={{ background: 'lightcoral' }}
                                >
                                     {respondingInviteId === invite._id ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have no pending team invitations.</p>
            )}
        </div>
    );
};

export default PendingInvitations;
