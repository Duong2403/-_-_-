import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // To fetch accepted matches
import { Link } from 'react-router-dom'; // Import Link

// Import chat components
import RoomList from '../components/chat/RoomList';
import MessagesView from '../components/chat/MessagesView';
import GroupInfo from '../components/chat/GroupInfo';

const ChatPage = () => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [myTeams, setMyTeams] = useState([]); // Needed for getOtherTeamName
    const [acceptedMatches, setAcceptedMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null); // For group chat context
    const [selectedPrivateChatUser, setSelectedPrivateChatUser] = useState(null); // For 1-on-1 chat { _id, name }
    const [messages, setMessages] = useState([]);
    const [meetingProposals, setMeetingProposals] = useState([]); // State for meeting proposals
    const [error, setError] = useState('');
    const selectedMatchIdRef = useRef(null); // Ref to hold current selected match ID
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
                const teamsRes = await api.get('/teams');
                setMyTeams(teamsRes.data);
                const userTeamIds = teamsRes.data.map(t => t._id);
                if (userTeamIds.length === 0) {
                    setAcceptedMatches([]);
                    return;
                }

                let allMatches = [];
                for (const teamId of userTeamIds) {
                    if (teamId) {
                         try {
                            // Fetch matches and populate necessary fields including members
                            const matchRes = await api.get(`/matches/team/${teamId}`);
                            allMatches = allMatches.concat(matchRes.data);
                         } catch (matchErr) {
                             console.error(`Error fetching matches for team ${teamId}:`, matchErr);
                         }
                    }
                }

                const accepted = allMatches.filter(m =>
                    m && m.status === 'accepted' && m.requestingTeam && m.receivingTeam
                );
                const uniqueAccepted = accepted.reduce((acc, current) => {
                    const x = acc.find(item => item._id === current._id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                setAcceptedMatches(uniqueAccepted);
                if (uniqueAccepted.length > 0 && !selectedMatch) {
                    setSelectedMatch(uniqueAccepted[0]);
                } else if (uniqueAccepted.length === 0) {
                    setSelectedMatch(null);
                }

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

        const newSocket = io('http://localhost:5000', { auth: { token } });
        setSocket(newSocket);

        newSocket.on('connect', () => console.log('Socket connected:', newSocket.id));
        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setError(`Socket connection failed: ${err.message}`);
        });
        newSocket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));

        // Listener for chat messages (group or private)
        newSocket.on('receiveMessage', (message) => {
            console.log('Message received:', message);
            console.log('Current state/refs:', {
                selectedMatchIdRef: selectedMatchIdRef.current,
                selectedPrivateChatUserIdRef: selectedPrivateChatUserIdRef.current,
                selectedPrivateChatUser: selectedPrivateChatUser, // Check the state value
                user: user,
                incomingMessage: message
            });

            setMessages((prevMessages) => {
                const isCurrentlyViewingGroupChat = selectedMatchIdRef.current && !selectedPrivateChatUserIdRef.current;
                const isCurrentlyViewingPrivateChat = selectedPrivateChatUserIdRef.current;

                // --- Logic for adding message to state ---

                // 1. If currently viewing a group chat:
                if (isCurrentlyViewingGroupChat && !message.isPrivate && message.matchId === selectedMatchIdRef.current) {
                    return [...prevMessages, message];
                }

                // 2. If currently viewing a private chat:
                if (isCurrentlyViewingPrivateChat && message.isPrivate) {
                    // Check if the message is between the logged-in user and the selected private chat user
                    const isMessageBetweenCurrentUsers =
                        (message.sender._id === user?._id && message.recipient?._id === selectedPrivateChatUserIdRef.current) ||
                        (message.sender._id === selectedPrivateChatUserIdRef.current && message.recipient?._id === user?._id);

                    // Also ensure the private message belongs to the context match of the selected private chat user
                    const belongsToSelectedPrivateChatContext = selectedPrivateChatUser?.matchIdContext ? message.matchId === selectedPrivateChatUser.matchIdContext : false; // Must belong to the context match

                    if (isMessageBetweenCurrentUsers && belongsToSelectedPrivateChatContext) {
                        return [...prevMessages, message];
                    }
                }

                // If the message doesn't belong to the currently viewed chat, don't add it
                // TODO: Potentially show a notification for new messages in other chats
                return prevMessages;
            });
        });

        // Listener for new meeting proposals
        newSocket.on('meetingProposed', (proposedMeeting) => {
            console.log('Meeting proposal received:', proposedMeeting);
            if (selectedMatchIdRef.current && proposedMeeting.match?._id === selectedMatchIdRef.current) {
                 setMeetingProposals(prev => [...prev, proposedMeeting]);
            }
        });

        // Listener for meeting updates (accepted response, cancelled, etc.)
        newSocket.on('meetingUpdated', (updatedMeeting) => {
            console.log('Meeting update received:', updatedMeeting);
            if (selectedMatchIdRef.current && updatedMeeting.match?._id === selectedMatchIdRef.current) {
                setMeetingProposals(prev => {
                    const index = prev.findIndex(m => m._id === updatedMeeting._id);
                    if (index !== -1) {
                        // Replace the old meeting with the updated one
                        const newProposals = [...prev];
                        newProposals[index] = updatedMeeting;
                        return newProposals;
                    } else {
                        // If not found, maybe it was just proposed by this client? Add it.
                        return [...prev, updatedMeeting];
                    }
                });
            }
        });

        // Cleanup: remove listeners and disconnect
        return () => {
            console.log('Disconnecting socket...');
            newSocket.off('connect');
            newSocket.off('connect_error');
            newSocket.off('disconnect');
            newSocket.off('receiveMessage');
            newSocket.off('meetingProposed');
            newSocket.off('meetingUpdated');
            newSocket.disconnect();
        };
    }, [token]); // Only re-run if token changes

    // --- Joining/Leaving Rooms, Fetching History & Meetings ---
    useEffect(() => {
        // Update refs for use in socket listeners
        selectedMatchIdRef.current = selectedMatch?._id || null;
        selectedPrivateChatUserIdRef.current = selectedPrivateChatUser?._id || null;

        // Determine if we are viewing a group chat or a private chat
        const isGroupChatView = selectedMatch && !selectedPrivateChatUser;
        const isPrivateChatView = selectedPrivateChatUser; // Private chat takes precedence if selected

        // --- Group Chat Logic ---
        if (socket && isGroupChatView) {
            const matchId = selectedMatch._id;
            console.log(`Joining group room: ${matchId}`);
            socket.emit('joinRoom', matchId); // Join the group room

            const fetchGroupChatData = async () => {
                setError('');
                setMessages([]); // Clear previous messages
                setMeetingProposals([]); // Clear previous proposals
                try {
                    // Fetch group messages and meeting proposals for the match
                    const [historyRes, meetingsRes] = await Promise.all([
                        api.get(`/messages/${matchId}`), // Fetches only group messages by default now? Need to check API
                        api.get(`/meetings/match/${matchId}`)
                    ]);
                    // Filter messages on client-side just in case API returns mixed? Or update API.
                    // Assuming API GET /messages/:matchId returns ONLY group messages for now.
                    setMessages(historyRes.data.filter(m => !m.isPrivate));
                    setMeetingProposals(meetingsRes.data);
                } catch (err) {
                    console.error("Error fetching group chat data:", err);
                    setError(err.response?.data?.message || 'Failed to fetch group chat data.');
                    setMessages([]);
                    setMeetingProposals([]);
                }
            };
            fetchGroupChatData();

            // Cleanup function for group chat
            return () => {
                console.log(`Leaving group room: ${matchId}`);
                socket.emit('leaveRoom', matchId);
            };
        }
        // --- Private Chat Logic ---
        else if (socket && isPrivateChatView) {
            const otherUserId = selectedPrivateChatUser._id;
            console.log(`Fetching private chat history with user: ${otherUserId}`);
            // No specific socket room needed for 1-on-1, handled by userSockets map on server

            const fetchPrivateChatData = async () => {
                setError('');
                setMessages([]); // Clear previous messages
                setMeetingProposals([]); // No meeting proposals in private chat view
                try {
                    // Fetch private messages between logged-in user and selected user
                    const historyRes = await api.get(`/messages/private/${otherUserId}`);
                    setMessages(historyRes.data); // API should return only relevant private messages
                } catch (err) {
                    console.error("Error fetching private chat data:", err);
                    setError(err.response?.data?.message || 'Failed to fetch private chat data.');
                    setMessages([]);
                }
            };
            fetchPrivateChatData();

            // No specific cleanup needed for socket rooms for private chat
            return () => {};
        }
        // --- No Chat Selected ---
        else {
             setMessages([]);
             setMeetingProposals([]);
        }
    }, [socket, selectedMatch, selectedPrivateChatUser]); // Re-run when socket, selected group, or selected private user changes

    // --- Handlers ---
    const handleSelectMatch = (match) => {
        setSelectedPrivateChatUser(null); // Deselect private chat when selecting a group chat
        setSelectedMatch(match);
    };

     // New handler to select a private chat partner
     // partner should be { _id, name, matchIdContext }
     const handleSelectPrivateChat = (partner) => {
        console.log("handleSelectPrivateChat received partner:", partner); // Log the incoming partner object
        if (partner._id === user?._id) return; // Don't select self
        setSelectedMatch(null); // Deselect group chat when selecting a private chat
        // Store the partner details including matchIdContext
        setSelectedPrivateChatUser(partner);
        console.log("Selected private chat with:", partner);
    };


    const handleSendMessage = (messageText) => {
        if (!socket || !messageText) return;

        const isPrivate = !!selectedPrivateChatUser; // Determine if it's a private message

        // Determine the matchId context based on whether it's a group or private chat
        const contextMatchId = isPrivate ? selectedPrivateChatUser?.matchIdContext : selectedMatch?._id;

        console.log("handleSendMessage contextMatchId:", contextMatchId, "isPrivate:", isPrivate, "selectedPrivateChatUser:", selectedPrivateChatUser); // Log context

        if (!contextMatchId) {
             // This should ideally not happen if a chat (group or private) is selected,
             // but as a safeguard, ensure we have a valid match context ID.
             console.error("Cannot send message without a valid match context.");
             setError("Please select a chat to send messages."); // Keep the user-friendly error message
             return;
        }


        const messageData = {
            matchId: contextMatchId, // Associate with the correct match context
            text: messageText,
            isPrivate: isPrivate,
            recipientId: isPrivate ? selectedPrivateChatUser._id : undefined,
        };
        console.log("Sending message:", messageData);
        socket.emit('sendMessage', messageData);
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

    // Determine if we are viewing a group chat or a private chat
    const isGroupChatView = selectedMatch && !selectedPrivateChatUser;
    const isPrivateChatView = selectedPrivateChatUser;

    // --- Render ---
    return (
        <div className="chat-page-container" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
            {error && <p style={{ color: 'red', position: 'absolute', top: '70px', left: '20px' }}>Error: {error}</p>}
            <RoomList
                acceptedMatches={acceptedMatches}
                selectedMatch={selectedMatch}
                onSelectMatch={handleSelectMatch}
                getOtherTeamName={getOtherTeamName}
                myTeams={myTeams}
                user={user}
            />
            <MessagesView
                messages={messages}
                selectedMatch={selectedMatch}
                selectedPrivateChatUser={selectedPrivateChatUser} // Pass the private chat user
                user={user}
                onSendMessage={handleSendMessage}
            />
            <GroupInfo
                selectedMatch={selectedMatch}
                meetingProposals={isPrivateChatView ? [] : meetingProposals} // No meetings in private chat view
                api={api} // Pass api instance
                onChatClosed={handleChatClosed} // Pass the handler down
                onSelectPrivateChat={handleSelectPrivateChat} // Pass the private chat selection handler
                isPrivateChatSelected={!!selectedPrivateChatUser} // Indicate if a private chat is active
            />
        </div>
    );
};

export default ChatPage;
