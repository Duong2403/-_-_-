import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { 
    PlusIcon,
    XIcon,
    SearchIcon
} from './ui/Icons';
import { 
    GroupsIcon,
    UniversityIcon
} from './ui/SocialIcons';

const AddMemberModal = ({ isOpen, onClose, team, onMemberAdded }) => {
    const { user } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(null); // Track which user invitation is being sent to
    const [error, setError] = useState('');

    // Search for users when query changes
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}&university=${encodeURIComponent(user.university)}`);
                console.log('Search results:', res.data);
                
                // Filter out users who are already members of the team
                const filteredResults = res.data.filter(searchUser => 
                    !team.members.some(member => member._id === searchUser._id)
                );
                
                setSearchResults(filteredResults);
            } catch (err) {
                console.error('Error searching users:', err);
                setError('Failed to search users');
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, user.university, team.members]);

    const handleInviteUser = async (inviteeId) => {
        setSending(inviteeId);
        setError('');
        try {
            await api.post('/invitations', {
                teamId: team._id,
                inviteeId: inviteeId
            });
            
            // Remove the invited user from search results
            setSearchResults(prev => prev.filter(u => u._id !== inviteeId));
            
            // Show success message
            alert('Invitation sent successfully!');
            
            // Optionally call callback to refresh team data
            if (onMemberAdded) {
                onMemberAdded();
            }
        } catch (err) {
            console.error('Error sending invitation:', err);
            setError(err.response?.data?.message || 'Failed to send invitation');
        } finally {
            setSending(null);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <PlusIcon className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-neutral-800">Add Member</h2>
                            <p className="text-sm text-neutral-600">Invite users to join {team.name}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <XIcon size={20} className="text-neutral-600" />
                    </button>
                </div>

                {/* Search Section */}
                <div className="p-6 border-b border-neutral-200">
                    <div className="relative">
                        <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-rose focus:border-transparent"
                        />
                    </div>
                    {error && (
                        <p className="text-error text-sm mt-2">{error}</p>
                    )}
                </div>

                {/* Results Section */}
                <div className="flex-1 overflow-y-auto max-h-96">
                    {loading ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-primary-rose border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-neutral-600">Searching...</p>
                        </div>
                    ) : searchQuery.length < 2 ? (
                        <div className="p-6 text-center text-neutral-500">
                            <SearchIcon size={48} className="mx-auto mb-4 text-neutral-300" />
                            <p>Enter at least 2 characters to search for users</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="p-6 text-center text-neutral-500">
                            <GroupsIcon size={48} className="mx-auto mb-4 text-neutral-300" />
                            <p>No users found matching "{searchQuery}"</p>
                            <p className="text-sm mt-1">Try searching by name or email</p>
                        </div>
                    ) : (
                        <div className="p-4">
                            <p className="text-sm text-neutral-600 mb-4">
                                Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} from {user.university}
                            </p>
                            <div className="space-y-3">
                                {searchResults.map(searchUser => (
                                    <div key={searchUser._id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-friendship rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {searchUser.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-800">{searchUser.name}</p>
                                                <p className="text-sm text-neutral-500">{searchUser.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleInviteUser(searchUser._id)}
                                            disabled={sending === searchUser._id}
                                            className="btn btn-primary btn-sm"
                                        >
                                            {sending === searchUser._id ? (
                                                <>
                                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <PlusIcon size={16} className="mr-1" />
                                                    Invite
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-200 bg-neutral-50">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <UniversityIcon size={16} />
                        <span>Only users from {user.university} can be invited</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal; 