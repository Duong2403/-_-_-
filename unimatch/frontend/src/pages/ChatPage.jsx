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
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]);
    const [meetingProposals, setMeetingProposals] = useState([]); // State for meeting proposals
    const [error, setError] = useState('');
    const selectedMatchIdRef = useRef(null); // Ref to hold current selected match ID

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

        // Listener for chat messages
        newSocket.on('receiveMessage', (message) => {
            console.log('Message received:', message);
            setMessages((prevMessages) => {
                if (selectedMatchIdRef.current && message.matchId === selectedMatchIdRef.current) {
                    return [...prevMessages, message];
                }
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
        selectedMatchIdRef.current = selectedMatch?._id || null;

        if (socket && selectedMatch) {
            const matchId = selectedMatch._id;
            console.log(`Joining room: ${matchId}`);
            socket.emit('joinRoom', matchId);

            const fetchChatData = async () => {
                setError('');
                setMessages([]);
                setMeetingProposals([]);
                try {
                    const [historyRes, meetingsRes] = await Promise.all([
                        api.get(`/messages/${matchId}`),
                        api.get(`/meetings/match/${matchId}`)
                    ]);
                    setMessages(historyRes.data);
                    setMeetingProposals(meetingsRes.data);
                } catch (err) {
                    console.error("Error fetching chat data:", err);
                    setError(err.response?.data?.message || 'Failed to fetch chat data.');
                    setMessages([]);
                    setMeetingProposals([]);
                }
            };
            fetchChatData();

            return () => {
                console.log(`Leaving room: ${matchId}`);
                socket.emit('leaveRoom', matchId);
            };
        } else {
             setMessages([]);
             setMeetingProposals([]);
        }
    }, [socket, selectedMatch]);

    // --- Handlers ---
    const handleSelectMatch = (match) => {
        setSelectedMatch(match);
    };

    const handleSendMessage = (messageText) => {
        if (!socket || !selectedMatch || !messageText) return;
        const messageData = {
            matchId: selectedMatch._id,
            text: messageText,
        };
        socket.emit('sendMessage', messageData);
    };

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
                user={user}
                onSendMessage={handleSendMessage}
            />
            <GroupInfo
                selectedMatch={selectedMatch}
                meetingProposals={meetingProposals}
                api={api} // Pass api instance
                // TODO: Pass a function to refresh proposals after cancel/respond if socket update isn't sufficient
            />
        </div>
    );
};

export default ChatPage;
