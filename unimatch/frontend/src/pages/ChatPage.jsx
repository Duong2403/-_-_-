import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api, { getTeamChatMessages, getTeamChat } from '../services/api'; // To fetch accepted matches and team chats
import { Link } from 'react-router-dom'; // Import Link

// Import chat components
import RoomList from '../components/chat/RoomList';
import MessagesView from '../components/chat/MessagesView';
import GroupInfo from '../components/chat/GroupInfo';
import { MessageIcon, SparkIcon, GroupsIcon } from '../components/ui/SocialIcons';

const ChatPage = () => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [myTeams, setMyTeams] = useState([]); // Needed for getOtherTeamName
    const [acceptedMatches, setAcceptedMatches] = useState([]);
    const [teamChats, setTeamChats] = useState([]); // For team chat rooms
    const [selectedMatch, setSelectedMatch] = useState(null); // For group chat context
    const [selectedTeamChat, setSelectedTeamChat] = useState(null); // For team chat context
    const [selectedPrivateChatUser, setSelectedPrivateChatUser] = useState(null); // For 1-on-1 chat { _id, name }
    const [messages, setMessages] = useState([]);
    const [meetingProposals, setMeetingProposals] = useState([]); // State for meeting proposals
    const [error, setError] = useState('');
    const selectedMatchIdRef = useRef(null); // Ref to hold current selected match ID
    const selectedTeamChatIdRef = useRef(null); // Ref to hold current selected team chat ID
    const selectedPrivateChatUserIdRef = useRef(null); // Ref for private chat user ID

    // --- Helper Function ---
    const getOtherTeamName = (match, userTeams) => {
        if (!match || !user || !userTeams) return 'Unknown Team';
        try {
            const myTeam = userTeams.find(t => match.requestingTeam?._id === t._id || match.receivingTeam?._id === t._id);
            if (!myTeam) return 'Unknown Team';

            if (match.requestingTeam?._id === myTeam._id) {
                return match.receivingTeam?.name || 'Unknown/Deleted Team';
            } else if (match.receivingTeam?._id === myTeam._id) {
                return match.requestingTeam?.name || 'Unknown/Deleted Team';
            } else {
                return 'Unknown Team';
            }
        } catch (e) {
             console.error("Error in getOtherTeamName:", e, match);
             return 'Error Determining Name';
        }
    };

    // --- Fetch Accepted Matches ---
    useEffect(() => {
        const fetchAcceptedMatches = async () => {
            if (!user) return;
            setError('');
            try {
                const teamsRes = await api.get('/teams/my-teams');
                setMyTeams(teamsRes.data);
                const userTeamIds = teamsRes.data.map(t => t._id);
                console.log('User teams fetched:', teamsRes.data);
                console.log('User team IDs:', userTeamIds);
                
                if (userTeamIds.length === 0) {
                    console.log('No teams found for user, setting empty matches');
                    setAcceptedMatches([]);
                    return;
                }

                let allMatches = [];
                for (const teamId of userTeamIds) {
                    if (teamId) {
                         try {
                            // Fetch matches and populate necessary fields including members
                            const matchRes = await api.get(`/matches/team/${teamId}`);
                            console.log(`Matches for team ${teamId}:`, matchRes.data);
                            allMatches = allMatches.concat(matchRes.data);
                         } catch (matchErr) {
                             console.error(`Error fetching matches for team ${teamId}:`, matchErr);
                             console.error('Match error details:', {
                                 status: matchErr.response?.status,
                                 message: matchErr.response?.data?.message,
                                 teamId: teamId
                             });
                         }
                    }
                }

                const accepted = allMatches.filter(m =>
                    m && m.status === 'accepted' && m.requestingTeam && m.receivingTeam
                );
                console.log('Accepted matches:', accepted);
                
                const uniqueAccepted = accepted.reduce((acc, current) => {
                    const x = acc.find(item => item._id === current._id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                console.log('Unique accepted matches:', uniqueAccepted);
                setAcceptedMatches(uniqueAccepted);
                
                // Fetch team chats for active teams with 2+ members
                const activeTeams = teamsRes.data.filter(team => 
                    team.status === 'active' || team.status === 'matched'
                );
                const teamChatPromises = activeTeams.map(async (team) => {
                    try {
                        const teamChatData = await getTeamChat(team._id);
                        return {
                            ...teamChatData,
                            teamInfo: team // Include team information for display
                        };
                    } catch (error) {
                        console.log(`No active team chat for team ${team.name}:`, error.response?.status);
                        return null; // Team might not have a chat yet (< 2 members)
                    }
                });
                
                const teamChatResults = await Promise.all(teamChatPromises);
                const activeTeamChats = teamChatResults.filter(chat => chat !== null);
                console.log('Active team chats:', activeTeamChats);
                setTeamChats(activeTeamChats);

            } catch (err) {
                console.error("Error fetching accepted matches/teams:", err);
                setError(err.response?.data?.message || 'Failed to fetch matches or teams.');
            }
        };
        fetchAcceptedMatches();
    }, [user]);

    // --- Socket Connection & Event Listeners ---
    useEffect(() => {
        if (!token) return;

        console.log('Creating new socket connection...');
        const newSocket = io('http://localhost:5000', { 
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        });
        setSocket(newSocket);

        newSocket.on('connect', () => console.log('Socket connected:', newSocket.id));
        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setError(`Socket connection failed: ${err.message}`);
        });
        newSocket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));

        // Listener for team chat messages
        newSocket.on('receiveTeamMessage', (message) => {
            console.log('Team message received:', message);
            
            // Only add message if we're currently viewing this team chat
            if (selectedTeamChatIdRef.current && message.teamId === selectedTeamChatIdRef.current) {
                console.log('Adding team message to state');
                setMessages(prevMessages => [...prevMessages, message]);
            } else {
                console.log('Team message not for current chat, ignoring');
            }
        });

        // Listener for team chat events
        newSocket.on('teamChatAvailable', (data) => {
            console.log('Team chat now available:', data);
            // Refresh team chats when a new one becomes available
            // This could be improved by just adding the new chat to state
        });

        newSocket.on('teamChatDeactivated', (data) => {
            console.log('Team chat deactivated:', data);
            // Remove from state if needed
        });

        // Listener for chat messages (group or private)
        newSocket.on('receiveMessage', (message) => {
            console.log('Message received:', message);
            console.log('Current state/refs:', {
                selectedMatchIdRef: selectedMatchIdRef.current,
                selectedPrivateChatUserIdRef: selectedPrivateChatUserIdRef.current,
                selectedPrivateChatUser: selectedPrivateChatUser,
                user: user,
                incomingMessage: message
            });

            setMessages((prevMessages) => {
                const isCurrentlyViewingGroupChat = selectedMatchIdRef.current && !selectedPrivateChatUserIdRef.current;
                const isCurrentlyViewingPrivateChat = selectedPrivateChatUserIdRef.current;

                console.log('Message filtering logic:', {
                    isCurrentlyViewingGroupChat,
                    isCurrentlyViewingPrivateChat,
                    messageIsPrivate: message.isPrivate,
                    messageMatchId: message.matchId,
                    currentMatchId: selectedMatchIdRef.current,
                    messageSender: message.sender._id,
                    messageRecipient: message.recipient?._id,
                    currentUserId: user?._id,
                    selectedPrivateChatUserId: selectedPrivateChatUserIdRef.current
                });

                // --- Logic for adding message to state ---

                // 1. If currently viewing a group chat:
                if (isCurrentlyViewingGroupChat && !message.isPrivate && message.matchId === selectedMatchIdRef.current) {
                    console.log('Adding group message to state');
                    return [...prevMessages, message];
                }

                // 2. If currently viewing a private chat:
                if (isCurrentlyViewingPrivateChat && message.isPrivate) {
                    // Check if the message is between the logged-in user and the selected private chat user
                    const isMessageBetweenCurrentUsers =
                        (message.sender._id === user?._id && message.recipient?._id === selectedPrivateChatUserIdRef.current) ||
                        (message.sender._id === selectedPrivateChatUserIdRef.current && message.recipient?._id === user?._id);

                    // Also ensure the private message belongs to the context match of the selected private chat user
                    const belongsToSelectedPrivateChatContext = selectedPrivateChatUser?.matchIdContext ? 
                        message.matchId === selectedPrivateChatUser.matchIdContext : true; // Allow if no context specified

                    console.log('Private message validation:', {
                        isMessageBetweenCurrentUsers,
                        belongsToSelectedPrivateChatContext,
                        selectedPrivateChatUserMatchContext: selectedPrivateChatUser?.matchIdContext
                    });

                    if (isMessageBetweenCurrentUsers && belongsToSelectedPrivateChatContext) {
                        console.log('Adding private message to state');
                        return [...prevMessages, message];
                    }
                }

                console.log('Message does not match current chat context, not adding to state');
                // If the message doesn't belong to the currently viewed chat, don't add it
                // TODO: Potentially show a notification for new messages in other chats
                return prevMessages;
            });
        });

        // Listener for new meeting proposals
        newSocket.on('meetingProposed', (proposedMeeting) => {
            console.log('Meeting proposal received:', proposedMeeting);
            if (selectedMatchIdRef.current && proposedMeeting.match?._id === selectedMatchIdRef.current) {
                // Only add if not cancelled
                if (proposedMeeting.status !== 'cancelled') {
                    setMeetingProposals(prev => [...prev, proposedMeeting]);
                }
            }
        });

        // Listener for meeting updates (accepted response, cancelled, etc.)
        newSocket.on('meetingUpdated', (updatedMeeting) => {
            console.log('Meeting update received:', updatedMeeting);
            console.log('Current selected match ID:', selectedMatchIdRef.current);
            console.log('Updated meeting match ID:', updatedMeeting.match?._id);
            
            if (selectedMatchIdRef.current && updatedMeeting.match?._id === selectedMatchIdRef.current) {
                console.log('Meeting update is for current match, updating proposals');
                setMeetingProposals(prev => {
                    console.log('Previous meeting proposals:', prev);
                    const index = prev.findIndex(m => m._id === updatedMeeting._id);
                    console.log('Found meeting at index:', index);
                    
                    if (index !== -1) {
                        // If meeting is cancelled, remove it from the list
                        if (updatedMeeting.status === 'cancelled') {
                            console.log('Removing cancelled meeting from proposals');
                            return prev.filter(m => m._id !== updatedMeeting._id);
                        } else {
                            // Replace the old meeting with the updated one
                            console.log('Replacing meeting at index', index, 'with updated meeting');
                            const newProposals = [...prev];
                            newProposals[index] = updatedMeeting;
                            console.log('New meeting proposals:', newProposals);
                            return newProposals;
                        }
                    } else {
                        // If not found and not cancelled, add it
                        if (updatedMeeting.status !== 'cancelled') {
                            console.log('Adding new meeting to proposals');
                            return [...prev, updatedMeeting];
                        }
                        return prev;
                    }
                });
            } else {
                console.log('Meeting update is not for current match, ignoring');
            }
        });

        // Cleanup: remove listeners and disconnect
        return () => {
            console.log('Disconnecting socket...');
            newSocket.off('connect');
            newSocket.off('connect_error');
            newSocket.off('disconnect');
            newSocket.off('receiveMessage');
            newSocket.off('receiveTeamMessage');
            newSocket.off('teamChatAvailable');
            newSocket.off('teamChatDeactivated');
            newSocket.off('meetingProposed');
            newSocket.off('meetingUpdated');
            newSocket.disconnect();
        };
    }, [token]); // Only re-run if token changes

    // --- Joining/Leaving Rooms, Fetching History & Meetings ---
    useEffect(() => {
        if (!socket) return;

        // Update refs for use in socket listeners
        selectedMatchIdRef.current = selectedMatch?._id || null;
        selectedTeamChatIdRef.current = selectedTeamChat?.teamInfo?._id || null;
        selectedPrivateChatUserIdRef.current = selectedPrivateChatUser?._id || null;

        const isGroupChatView = selectedMatch?._id;
        const isTeamChatView = selectedTeamChat?.teamInfo?._id;
        const isPrivateChatView = selectedPrivateChatUser?._id;

        const fetchAndJoinGroup = async (matchId) => {
            console.log(`Joining group room: ${matchId}`);
            socket.emit('joinRoom', matchId);

            setError('');
            setMessages([]);
            setMeetingProposals([]);
            try {
                const [historyRes, meetingsRes] = await Promise.all([
                    api.get(`/messages/${matchId}`),
                    api.get(`/meetings/match/${matchId}`)
                ]);
                setMessages(historyRes.data.filter(m => !m.isPrivate));
                setMeetingProposals(meetingsRes.data.filter(m => m.status !== 'cancelled'));
            } catch (err) {
                console.error("Error fetching group chat data:", err);
                setError(err.response?.data?.message || 'Failed to fetch group chat data.');
            }
        };

        const fetchPrivateChat = async (otherUserId) => {
            console.log(`Fetching private chat history with user: ${otherUserId}`);
            setError('');
            setMessages([]);
            setMeetingProposals([]);
            try {
                const historyRes = await api.get(`/messages/private/${otherUserId}`);
                setMessages(historyRes.data);
            } catch (err) {
                console.error("Error fetching private chat data:", err);
                setError(err.response?.data?.message || 'Failed to fetch private chat data.');
            }
        };

        const fetchAndJoinTeamChat = async (teamId) => {
            console.log(`Joining team chat room: ${teamId}`);
            socket.emit('joinTeamRoom', teamId);

            setError('');
            setMessages([]);
            setMeetingProposals([]); // Team chats don't have meetings currently
            try {
                const historyRes = await getTeamChatMessages(teamId);
                setMessages(historyRes);
            } catch (err) {
                console.error("Error fetching team chat data:", err);
                setError(err.response?.data?.message || 'Failed to fetch team chat data.');
            }
        };

        if (isGroupChatView) {
            fetchAndJoinGroup(selectedMatch._id);
        } else if (isTeamChatView) {
            fetchAndJoinTeamChat(selectedTeamChat.teamInfo._id);
        } else if (isPrivateChatView) {
            fetchPrivateChat(selectedPrivateChatUser._id);
        } else {
            setMessages([]);
            setMeetingProposals([]);
        }

        return () => {
            if (isGroupChatView) {
                console.log(`Leaving group room: ${selectedMatch._id}`);
                socket.emit('leaveRoom', selectedMatch._id);
            } else if (isTeamChatView) {
                console.log(`Leaving team room: ${selectedTeamChat.teamInfo._id}`);
                socket.emit('leaveTeamRoom', selectedTeamChat.teamInfo._id);
            }
            // No specific room to leave for private chats
        };
    }, [socket, selectedMatch?._id, selectedTeamChat?.teamInfo?._id, selectedPrivateChatUser?._id]); // Re-run only when IDs change

    // --- Handlers ---
    const handleSelectMatch = (match) => {
        setSelectedPrivateChatUser(null); // Deselect private chat when selecting a group chat
        setSelectedTeamChat(null); // Deselect team chat when selecting a match chat
        setSelectedMatch(match);
    };

    const handleSelectTeamChat = (teamChat) => {
        setSelectedPrivateChatUser(null); // Deselect private chat when selecting a team chat
        setSelectedMatch(null); // Deselect match chat when selecting a team chat
        setSelectedTeamChat(teamChat);
    };

     // New handler to select a private chat partner
     // partner should be { _id, name, matchIdContext }
     const handleSelectPrivateChat = (partner) => {
        console.log("handleSelectPrivateChat received partner:", partner); // Log the incoming partner object
        if (partner._id === user?._id) return; // Don't select self
        setSelectedMatch(null); // Deselect group chat when selecting a private chat
        setSelectedTeamChat(null); // Deselect team chat when selecting a private chat
        // Store the partner details including matchIdContext
        setSelectedPrivateChatUser(partner);
        console.log("Selected private chat with:", partner);
    };


    const handleSendMessage = async (messageText, uploadedMessage = null) => {
        // If this is an uploaded message, just add it to the messages state
        if (uploadedMessage) {
            setMessages(prevMessages => [...prevMessages, uploadedMessage]);
            return;
        }

        if (!socket || !messageText) return;

        const isPrivate = !!selectedPrivateChatUser; // Determine if it's a private message
        const isTeamMessage = !!selectedTeamChat; // Determine if it's a team message

        // Determine the context based on what type of chat is selected
        const contextMatchId = isPrivate ? selectedPrivateChatUser?.matchIdContext : selectedMatch?._id;
        const contextTeamId = isTeamMessage ? selectedTeamChat?.teamInfo?._id : null;

        console.log("handleSendMessage context:", { 
            contextMatchId, 
            contextTeamId, 
            isPrivate, 
            isTeamMessage,
            selectedPrivateChatUser,
            selectedTeamChat 
        });

        if (!contextMatchId && !contextTeamId) {
             // This should ideally not happen if a chat is selected,
             // but as a safeguard, ensure we have a valid context ID.
             console.error("Cannot send message without a valid context.");
             setError("Please select a chat to send messages.");
             return;
        }

        try {
            if (isTeamMessage) {
                // Send team message
                const teamMessageData = {
                    teamId: contextTeamId,
                    text: messageText,
                };
                
                console.log("Sending team message via socket:", teamMessageData);
                socket.emit('sendTeamMessage', teamMessageData);
            } else {
                // Send match message (existing logic)
                const messageData = {
                    matchId: contextMatchId,
                    text: messageText,
                    isPrivate: isPrivate,
                    recipientId: isPrivate ? selectedPrivateChatUser._id : undefined,
                };
                
                console.log("Sending match message via socket:", messageData);
                socket.emit('sendMessage', messageData);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            setError(error.response?.data?.message || 'Failed to send message');
        }
    };

    // Handler for when a chat is closed via the GroupInfo component
    const handleChatClosed = (closedMatchId) => {
        setAcceptedMatches(prevMatches => prevMatches.filter(match => match._id !== closedMatchId));
        if (selectedMatch?._id === closedMatchId) {
            setSelectedMatch(null); // Clear selection if the closed chat was selected
            setMessages([]); // Clear messages
            setMeetingProposals([]); // Clear proposals
        }
        // Optionally, select the next available match or show a message
    };

    // Determine if we are viewing a group chat, team chat, or private chat
    const isGroupChatView = selectedMatch && !selectedPrivateChatUser && !selectedTeamChat;
    const isTeamChatView = selectedTeamChat && !selectedPrivateChatUser && !selectedMatch;
    const isPrivateChatView = selectedPrivateChatUser;

    // --- Render ---
    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Error Message */}
            {error && (
                <div className="bg-error bg-opacity-10 border border-error text-error p-4 m-4 rounded-lg">
                    {error}
                </div>
            )}
            
            {/* No Chats State */}
            {acceptedMatches.length === 0 && teamChats.length === 0 && !error && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-neutral-200 rounded-full p-6">
                                <MessageIcon className="text-neutral-500" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">No Chats Available</h2>
                        <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                            You don't have any approved matches yet. Send join requests to teams and wait for approval to start chatting.
                        </p>
                        <Link to="/matching" className="btn btn-primary">
                            <SparkIcon className="mr-2" size={16} />
                            Find Teams to Join
                        </Link>
                    </div>
                </div>
            )}
            
            {/* Chat Container - Full Height minus navbar */}
            {(acceptedMatches.length > 0 || teamChats.length > 0) && (
                <div className="chat-layout-container">
                    {/* Chat Layout */}
                    <div className="chat-main-area">
                        {/* Left Sidebar - Chat List */}
                        <div className="w-80 bg-white border-r border-neutral-200 flex flex-col h-full">
                            <div className="flex-1 overflow-y-auto">
                                <RoomList
                                    matches={acceptedMatches}
                                    teamChats={teamChats}
                                    selectedMatch={selectedMatch}
                                    selectedTeamChat={selectedTeamChat}
                                    onSelectMatch={handleSelectMatch}
                                    onSelectTeamChat={handleSelectTeamChat}
                                    selectedPrivateChatUser={selectedPrivateChatUser}
                                    onSelectPrivateChat={handleSelectPrivateChat}
                                    isPrivateChatSelected={!!selectedPrivateChatUser}
                                />
                            </div>
                        </div>

                        {/* Main Chat Area */}
                        <div className="flex-1 bg-white h-full">
                            <MessagesView
                                messages={messages}
                                selectedMatch={selectedMatch}
                                selectedTeamChat={selectedTeamChat}
                                selectedPrivateChatUser={selectedPrivateChatUser}
                                user={user}
                                onSendMessage={handleSendMessage}
                            />
                        </div>

                        {/* Right Sidebar - Simplified Info Panel */}
                        <div className="w-80 bg-neutral-50 border-l border-neutral-200 flex flex-col h-full">
                            <GroupInfo
                                selectedMatch={selectedMatch}
                                meetingProposals={meetingProposals}
                                api={api}
                                onChatClosed={handleChatClosed}
                                onSelectPrivateChat={handleSelectPrivateChat}
                                isPrivateChatSelected={!!selectedPrivateChatUser}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
