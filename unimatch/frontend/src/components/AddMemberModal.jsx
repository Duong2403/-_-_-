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
    const [activeTab, setActiveTab] = useState('email'); // Change default to 'email' for Gmail invitations
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(null); // Track which user invitation is being sent to
    const [error, setError] = useState('');
    const [pendingInviteIds, setPendingInviteIds] = useState(new Set());
    
    // Email invitation state
    const [emailInvite, setEmailInvite] = useState({
        email: '',
        name: ''
    });
    const [sendingEmail, setSendingEmail] = useState(false);

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
                
                // Create a Set of member IDs for efficient lookup, handling both populated and unpopulated members.
                const memberIds = new Set(team.members.map(member => (member && typeof member === 'object') ? member._id : member));
                
                // Filter out users who are already members of the team
                const filteredResults = res.data.filter(searchUser => !memberIds.has(searchUser._id));
                
                setSearchResults(filteredResults);
            } catch (err) {
                console.error('Error searching users:', err);
                setError(err.response?.data?.message || 'Failed to search users');
            } finally {
                setLoading(false);
            }
        };

        searchUsers();
    }, [searchQuery, user.university, team.members]);

    useEffect(() => {
        const fetchPendingInvites = async () => {
            if (isOpen && team?._id) {
                try {
                    const res = await api.get(`/invitations/team/${team._id}`);
                    const inviteeIds = new Set(res.data.map(invite => invite.invitee));
                    setPendingInviteIds(inviteeIds);
                } catch (err) {
                    console.error('Failed to fetch pending invitations:', err);
                    // Handle error silently, main functionality can still proceed
                }
            }
        };
        fetchPendingInvites();
    }, [isOpen, team?._id]);

    const handleInviteUser = async (inviteeId) => {
        setSending(inviteeId);
        setError('');
        try {
            const response = await api.post('/invitations', {
                teamId: team._id,
                inviteeId: inviteeId
            });
            
            console.log('Invitation sent:', response.data);
            
            // Remove the invited user from search results
            setSearchResults(prev => prev.filter(u => u._id !== inviteeId));
            
            // Add to pending invites locally to update UI immediately
            setPendingInviteIds(prev => new Set(prev).add(inviteeId));
            
            // Show success message with email status
            const emailStatus = response.data.emailSent ? ' (Email notification sent)' : ' (Email notification failed)';
            alert(`Invitation sent successfully!${emailStatus}`);
            
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

    const handleEmailInvitation = async () => {
        if (!emailInvite.email.trim()) {
            setError('Email address is required');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInvite.email.trim().match(emailRegex)) {
            setError('Please enter a valid email address');
            return;
        }

        setSendingEmail(true);
        setError('');

        try {
            console.log('Sending Gmail invitation to:', emailInvite.email.trim());
            const response = await api.post('/invitations/email', {
                teamId: team._id,
                inviteeEmail: emailInvite.email.trim(),
                inviteeName: emailInvite.name.trim() || null
            });

            console.log('Gmail invitation sent successfully:', response.data);

            // Clear the form
            setEmailInvite({ email: '', name: '' });

            // Show detailed success message
            const successMessage = `🎉 Gmail invitation sent successfully!\n\n` +
                `📧 Email: ${emailInvite.email}\n` +
                `👥 Team: ${team.name}\n\n` +
                `They will receive an email with instructions to create an account and join your team.`;
            
            alert(successMessage);

            // Optionally call callback
            if (onMemberAdded) {
                onMemberAdded();
            }

        } catch (err) {
            console.error('Error sending Gmail invitation:', err);
            
            // Enhanced error handling
            if (err.response?.status === 400) {
                const errorData = err.response.data;
                
                if (errorData.userExists) {
                    setError(`⚠️ ${errorData.message}\n\nThis person already has an account. Please use the 'Search Existing Users' tab instead.`);
                    setActiveTab('search');
                    setSearchQuery(emailInvite.email);
                } else {
                    setError(`❌ ${errorData.message || 'Invalid request. Please check your input and try again.'}`);
                }
            } else if (err.response?.status === 403) {
                setError('❌ You are not authorized to send invitations for this team. Only team creators can send Gmail invitations.');
            } else if (err.response?.status === 404) {
                setError('❌ Team not found. Please refresh the page and try again.');
            } else if (err.response?.status === 500) {
                const errorMessage = err.response?.data?.message || err.message || '';
                if (errorMessage.includes('Email service not configured') || errorMessage.includes('Email service disabled')) {
                    setError('❌ Gmail service is not configured. Please contact your administrator to set up the email service with Gmail credentials.');
                } else {
                    setError('❌ Email service error. Please check your internet connection and try again later.');
                }
            } else {
                setError(`❌ Failed to send Gmail invitation: ${err.response?.data?.message || err.message || 'Unknown error'}`);
            }
        } finally {
            setSendingEmail(false);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setEmailInvite({ email: '', name: '' });
        setError('');
        setActiveTab('email'); // Default to Gmail invitation tab
        setPendingInviteIds(new Set());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-neutral-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                                <GroupsIcon className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-neutral-800">Add Team Members</h2>
                                <p className="text-sm text-neutral-500">Invite others to join "{team.name}"</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                            <XIcon size={20} className="text-neutral-400" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mt-6 border-b border-neutral-200">
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'email'
                                    ? 'text-primary-rose border-b-2 border-primary-rose'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                📧
                                <span className="font-semibold">Gmail Invitation</span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recommended</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'search'
                                    ? 'text-primary-rose border-b-2 border-primary-rose'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <SearchIcon size={16} />
                                Search Existing Users
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Search Users Tab */}
                    {activeTab === 'search' && (
                        <div>
                            <div className="relative mb-4">
                                <SearchIcon 
                                    size={20} 
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" 
                                />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-rose focus:border-transparent"
                                />
                            </div>

                            {loading && (
                                <div className="text-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-primary-rose border-t-transparent rounded-full mx-auto"></div>
                                    <p className="text-sm text-neutral-500 mt-2">Searching...</p>
                                </div>
                            )}

                            {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-neutral-500">No users found matching your search.</p>
                                    <p className="text-sm text-neutral-400 mt-1">Try searching with different keywords or use email invitation below.</p>
                                </div>
                            )}

                            {searchResults.length > 0 && (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {searchResults.map(searchUser => {
                                        const isPending = pendingInviteIds.has(searchUser._id);
                                        return (
                                        <div key={searchUser._id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {searchUser.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-neutral-800">{searchUser.name}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                        <UniversityIcon size={14} />
                                                        <span>{searchUser.university}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleInviteUser(searchUser._id)}
                                                disabled={sending === searchUser._id || isPending}
                                                className={`btn btn-sm ${isPending ? 'btn-disabled' : 'btn-primary'}`}
                                            >
                                                {sending === searchUser._id ? (
                                                    <>
                                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                        Sending...
                                                    </>
                                                ) : isPending ? (
                                                    'Pending'
                                                ) : (
                                                    <>
                                                        <PlusIcon size={16} className="mr-1" />
                                                        Invite
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gmail Invitation Tab */}
                    {activeTab === 'email' && (
                        <div>
                            <div className="space-y-4">
                                {/* Enhanced Header */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-green-500 text-2xl">📧</span>
                                        <div>
                                            <h4 className="font-semibold text-green-800 mb-1">Gmail Invitation</h4>
                                            <p className="text-sm text-green-700">
                                                Send an invitation via Gmail to anyone, even if they don't have a UniMatch account yet.
                                                They'll receive a beautiful email with instructions to join your team.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        📧 Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="example@gmail.com"
                                        value={emailInvite.email}
                                        onChange={(e) => setEmailInvite(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        autoComplete="email"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Any valid email address (Gmail, Yahoo, Outlook, etc.)
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        👤 Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Their full name"
                                        value={emailInvite.name}
                                        onChange={(e) => setEmailInvite(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        autoComplete="name"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        This will personalize the invitation email
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-500 text-lg">✨</span>
                                        <div>
                                            <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• They'll receive a professional invitation email</li>
                                                <li>• If they don't have an account, they can create one</li>
                                                <li>• They'll automatically be added to your team</li>
                                                <li>• You'll be notified when they join</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleEmailInvitation}
                                    disabled={sendingEmail || !emailInvite.email.trim()}
                                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                        sendingEmail || !emailInvite.email.trim()
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                    }`}
                                >
                                    {sendingEmail ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"></div>
                                            Sending Gmail Invitation...
                                        </>
                                    ) : (
                                        <>
                                            📧 Send Gmail Invitation
                                        </>
                                    )}
                                </button>
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