import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Assuming a debounce hook exists

// Component to search and add members
const MemberSearch = ({ team, onMemberAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [invitingMemberId, setInvitingMemberId] = useState(null); // Track which member is being invited

    const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce search input by 500ms

    // Effect to search users when debounced query changes
    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedSearchQuery || !team?.university) {
                setSearchResults([]);
                setLoadingSearch(false);
                return;
            }
            setLoadingSearch(true);
            setSearchError('');
            try {
                const res = await api.get(`/users/search`, {
                    params: { q: debouncedSearchQuery, university: team.university }
                });
                // Filter out users who are already members
                const currentMemberIds = team.members.map(m => m._id);
                const potentialNewMembers = res.data.filter(user => !currentMemberIds.includes(user._id));
                setSearchResults(potentialNewMembers);
            } catch (err) {
                console.error("Error searching users:", err);
                setSearchError(err.response?.data?.message || 'Failed to search users.');
                setSearchResults([]);
            } finally {
                setLoadingSearch(false);
            }
        };

        searchUsers();
    }, [debouncedSearchQuery, team?.university, team?.members]); // Depend on debounced query and team info

    const handleAddMember = async (userIdToAdd) => {
        setAddingMemberId(userIdToAdd); // Set loading state for this specific button
        setSearchError('');
        try {
            const res = await api.put(`/teams/${team._id}/members`, { userIdToAdd });
            onMemberAdded(res.data); // Notify parent component of the updated team
            setSearchQuery(''); // Clear search after adding
            setSearchResults([]); // Clear results
        } catch (err) {
             console.error("Error adding member:", err);
             setSearchError(err.response?.data?.message || 'Failed to add member.');
        } finally {
             setAddingMemberId(null); // Clear loading state for button
        }
    };

    // Renamed from handleAddMember to handleInviteMember
    const handleInviteMember = async (inviteeId) => {
        setInvitingMemberId(inviteeId); // Set loading state for this specific button
        setSearchError('');
        try {
            // Call the new invite route
            const res = await api.put(`/teams/${team._id}/invite`, { inviteeId });
            // Don't need to call onMemberAdded as member isn't added yet
            alert(res.data.message || 'Invitation sent!'); // Show success message from backend
            setSearchQuery(''); // Clear search after inviting
            setSearchResults([]); // Clear results
        } catch (err) {
             console.error("Error inviting member:", err);
             setSearchError(err.response?.data?.message || 'Failed to send invitation.');
        } finally {
             setInvitingMemberId(null); // Clear loading state for button
        }
    };


    return (
        <div>
            <h4>Invite New Member</h4> {/* Changed heading */}
            <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: '10px', width: '300px' }}
            />
            {loadingSearch && <p>Searching...</p>}
            {searchError && <p style={{ color: 'red' }}>{searchError}</p>}
            {searchResults.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, border: '1px solid #eee', maxHeight: '150px', overflowY: 'auto' }}>
                    {searchResults.map(user => (
                        <li key={user._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', borderBottom: '1px solid #eee' }}>
                            <span>{user.name} ({user.email})</span>
                            <button
                                onClick={() => handleInviteMember(user._id)} // Call invite handler
                                disabled={invitingMemberId === user._id} // Check inviting state
                                style={{ padding: '3px 8px', fontSize: '0.8em' }}
                            >
                                {invitingMemberId === user._id ? 'Inviting...' : 'Invite'} {/* Change button text */}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
             {!loadingSearch && debouncedSearchQuery && searchResults.length === 0 && <p>No matching users found (or they are already members).</p>}
        </div>
    );
};


const TeamDetailPage = () => {
    const { teamId } = useParams(); // Get teamId from URL parameter
    const { user } = useAuth();
    const [team, setTeam] = useState(null);
    const [reviews, setReviews] = useState([]); // State for reviews
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewsLoading, setReviewsLoading] = useState(true); // Separate loading for reviews
    const [reviewsError, setReviewsError] = useState(''); // Separate error for reviews

    const fetchTeamDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/teams/${teamId}`);
            setTeam(res.data);
        } catch (err) {
            console.error("Error fetching team details:", err);
            setError(err.response?.data?.message || 'Failed to fetch team details.');
        } finally {
            setLoading(false);
        }
    };

     const fetchTeamReviews = async () => {
        if (!teamId) return;
        setReviewsLoading(true);
        setReviewsError('');
        try {
            const res = await api.get(`/reviews/team/${teamId}`);
            setReviews(res.data);
        } catch (err) {
            console.error("Error fetching team reviews:", err);
            setReviewsError(err.response?.data?.message || 'Failed to fetch reviews.');
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamDetails();
        fetchTeamReviews(); // Fetch reviews when component mounts or teamId changes
    }, [teamId]); // Refetch if teamId changes

    const handleMemberAdded = (updatedTeamData) => {
        // Callback function for when a member is successfully added via MemberSearch
        setTeam(updatedTeamData); // Update the team state
    };

    if (loading) return <p>Loading team details...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!team) return <p>Team not found.</p>;

    // Check if the current user is the creator for displaying management options
    const isCreator = user && team.createdBy && user._id === team.createdBy._id;

    // --- Action Handlers --- Moved Before Return ---

    const handleLeaveTeam = async () => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;
        setLoading(true); // Use the main loading state for page-level actions
        setError('');
        try {
            await api.delete(`/teams/${teamId}/leave`);
            alert('You have left the team.');
            // Navigate back to the main teams page after leaving
            // Need to import useNavigate
            // const navigate = useNavigate(); // Add this hook at the top
            // navigate('/teams');
            window.location.href = '/teams'; // Simple redirect for now
        } catch (err) {
             console.error("Error leaving team:", err);
             setError(err.response?.data?.message || 'Failed to leave team.');
             setLoading(false); // Only stop loading on error here
        }
        // No finally block needed if redirecting on success
    };

     const handleDeleteTeam = async () => {
        if (!window.confirm('Are you sure you want to permanently delete this team? This cannot be undone.')) return;
        setLoading(true); // Use the main loading state
        setError('');
        try {
            await api.delete(`/teams/${teamId}`);
            alert('Team deleted successfully.');
            // Navigate back to the main teams page after deleting
            window.location.href = '/teams'; // Simple redirect for now
        } catch (err) {
             console.error("Error deleting team:", err);
             setError(err.response?.data?.message || 'Failed to delete team.');
             setLoading(false);
        }
    };

    // --- Render Logic ---

    return (
        <div>
            <h2>Team: {team.name}</h2>
            <p><strong>University:</strong> {team.university}</p>
            <p><strong>Description:</strong> {team.description || 'N/A'}</p>
            <p><strong>Purpose:</strong> {team.purpose}</p>
            <p><strong>Interests:</strong> {team.interests?.join(', ') || 'N/A'}</p>
            <p><strong>Meeting Preference:</strong> {team.meetingPreference}</p>
            <p><strong>Status:</strong> {team.status}</p>
            <p><strong>Created By:</strong> {team.createdBy?.name || 'Unknown'}</p>

            <h3>Members ({team.members.length})</h3>
            <ul>
                {team.members.map(member => (
                    <li key={member._id}>
                        <Link to={`/users/${member._id}`}>{member.name}</Link> ({member.email})
                        {/* TODO: Add remove member button if creator/self */}
                    </li>
                ))}
            </ul>

            <hr style={{ margin: '20px 0' }} />

            {/* Only show add member functionality to the creator for now */}
            {isCreator ? (
                // Pass team prop, onMemberAdded is no longer needed here
                <MemberSearch team={team} />
            ) : (
                <p>Only the team creator can invite new members.</p> // Updated text
            )}

            {/* --- Management Buttons --- */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                {/* TODO: Add Edit Team Details form (if creator) */}

                {/* Leave Team Button (if member but not creator OR creator with >1 members) */}
                {user && team.members.some(m => m._id === user._id) && (!isCreator || team.members.length > 1) && (
                     <button
                        onClick={handleLeaveTeam}
                        style={{ background: '#ffc107', color: '#333', marginRight: '10px' }}
                        disabled={loading} // Disable while any action is loading
                     >
                         Leave Team
                     </button>
                )}

                {/* Delete Team Button (if creator) */}
                {isCreator && (
                    <button
                        onClick={handleDeleteTeam}
                        style={{ background: '#dc3545', color: 'white' }}
                        disabled={loading} // Disable while any action is loading
                    >
                        Delete Team
                    </button>
                )}
            </div>

            {/* --- Reviews Section --- */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h3>Reviews ({reviews.length})</h3>
                {reviewsLoading ? (
                    <p>Loading reviews...</p>
                ) : reviewsError ? (
                    <p style={{ color: 'red' }}>Error loading reviews: {reviewsError}</p>
                ) : reviews.length > 0 ? (
                    <ul>
                        {reviews.map(review => (
                            <li key={review._id} style={{ marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                <div><strong>Rating: {'★'.repeat(review.teamRating)}{'☆'.repeat(5 - review.teamRating)}</strong></div>
                                {review.comment && <p style={{ fontStyle: 'italic', margin: '5px 0' }}>"{review.comment}"</p>}
                                <div style={{ fontSize: '0.9em', color: 'gray' }}>
                                    By: {review.reviewer?.name || 'Anonymous'} from Team {review.reviewingTeam?.name || 'Unknown'}
                                    {' '} on {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                                {/* Optionally display member ratings if needed */}
                                {/* {review.memberRatings.length > 0 && ( ... display logic ... )} */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No reviews yet for this team.</p>
                )}
            </div>


            <div style={{ marginTop: '20px' }}>
                <Link to="/teams">Back to My Teams</Link>
            </div>
        </div>
    );
};

export default TeamDetailPage;
