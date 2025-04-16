import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // To fetch accepted matches

import { Link } from 'react-router-dom'; // Import Link

const ChatPage = () => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [myTeams, setMyTeams] = useState([]); // Add state for user's teams
    const [acceptedMatches, setAcceptedMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null); // The match object for the current chat
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null); // To scroll to bottom
    const selectedMatchIdRef = useRef(null); // Ref to hold current selected match ID

    // --- Fetch Accepted Matches ---
    useEffect(() => {
        const fetchAcceptedMatches = async () => {
            setError('');
            try {
                // Fetch user's teams first
                const teamsRes = await api.get('/teams');
                setMyTeams(teamsRes.data); // Set the myTeams state
                const userTeamIds = teamsRes.data.map(t => t._id);

                if (userTeamIds.length === 0) {
                    setAcceptedMatches([]);
                    // No need to fetch matches if user has no teams
                    return;
                }

                // Fetch matches for all teams (could be inefficient, better backend endpoint needed)
                let allMatches = [];
                for (const teamId of userTeamIds) {
                    const matchRes = await api.get(`/matches/team/${teamId}`);
                    allMatches = allMatches.concat(matchRes.data);
                }

                // Filter for unique accepted matches
                const accepted = allMatches.filter(m => m.status === 'accepted');
                const uniqueAccepted = accepted.reduce((acc, current) => {
                    const x = acc.find(item => item._id === current._id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                setAcceptedMatches(uniqueAccepted);
                // Select the first match by default if available
                if (uniqueAccepted.length > 0 && !selectedMatch) {
                    setSelectedMatch(uniqueAccepted[0]);
                }

            } catch (err) {
                console.error("Error fetching accepted matches:", err);
                setError(err.response?.data?.message || 'Failed to fetch matches.');
            }
        };
        fetchAcceptedMatches();
    }, [user]); // Fetch when user is available

    // --- Socket Connection ---
    useEffect(() => {
        if (!token) return; // Don't connect if not logged in

        // Connect to the Socket.IO server
        // Pass token for authentication
        const newSocket = io('http://localhost:5000', { // Use your backend server URL
            auth: { token }
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setError(`Socket connection failed: ${err.message}`);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            // Handle disconnection, maybe try to reconnect
        });

        // Listener for incoming messages
        newSocket.on('receiveMessage', (message) => {
            console.log('Message received:', message);
            // Only add message if it belongs to the currently selected chat room
            setMessages((prevMessages) => {
                // Use the ref to check against the *current* selected match ID
                if (selectedMatchIdRef.current && message.matchId === selectedMatchIdRef.current) {
                    return [...prevMessages, message];
                }
                return prevMessages;
            });
        });

        // Cleanup on component unmount
        return () => {
            console.log('Disconnecting socket...');
            newSocket.disconnect();
        };
    }, [token]); // Reconnect if token changes

    // --- Joining/Leaving Rooms & Updating Ref ---
    useEffect(() => {
        // Update the ref whenever selectedMatch changes
        selectedMatchIdRef.current = selectedMatch?._id || null;

        if (socket && selectedMatch) {
            const matchId = selectedMatch._id;
            console.log(`Joining room: ${matchId}`);
            socket.emit('joinRoom', matchId);

            // Fetch initial messages for this room
            const fetchHistory = async () => {
                setError(''); // Clear previous errors
                try {
                    const res = await api.get(`/messages/${matchId}`);
                    setMessages(res.data); // Set initial messages
                } catch (err) {
                    console.error("Error fetching chat history:", err);
                    setError(err.response?.data?.message || 'Failed to fetch chat history.');
                    setMessages([]); // Clear messages on error
                }
            };
            fetchHistory();


            // Leave the previous room when selectedMatch changes
            return () => {
                console.log(`Leaving room: ${matchId}`);
                socket.emit('leaveRoom', matchId);
            };
        }
    }, [socket, selectedMatch]);

     // --- Scroll to Bottom ---
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); // Scroll whenever messages update

    // --- Message Sending ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!socket || !selectedMatch || !newMessage.trim()) return;

        const messageData = {
            matchId: selectedMatch._id,
            text: newMessage.trim(),
        };

        socket.emit('sendMessage', messageData);
        setNewMessage(''); // Clear input field
    };

    // --- Render ---
    // Pass myTeams state into the helper function
    const getOtherTeamName = (match, userTeams) => {
        if (!match || !user || !userTeams) return 'Other Team';
        // Find the team in the match that the current user is a member of
        const myTeam = userTeams.find(t => t._id === match.requestingTeam._id || t._id === match.receivingTeam._id);
        if (!myTeam) return 'Other Team'; // Should not happen if logic is correct

        if (myTeam._id === match.requestingTeam._id) {
            return match.receivingTeam.name;
        } else {
            return match.requestingTeam.name;
        }
    };


  return (
    <div>
      <h1>Chat</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Match Selector */}
      <div>
        <label htmlFor="matchSelect">Select Chat: </label>
        <select
            id="matchSelect"
            value={selectedMatch?._id || ''}
            onChange={(e) => {
                const match = acceptedMatches.find(m => m._id === e.target.value);
                setSelectedMatch(match);
            }}
            disabled={acceptedMatches.length === 0}
        >
            <option value="" disabled>-- Select a Match --</option>
            {acceptedMatches.map(match => (
                <option key={match._id} value={match._id}>
                    {/* Pass myTeams state to the helper function */}
                    Chat with {getOtherTeamName(match, myTeams)}
                </option>
            ))}
        </select>
      </div>
      <hr style={{ margin: '20px 0' }}/>

      {/* Message Display Area */}
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
        {selectedMatch ? (
            messages.length > 0 ? (
                messages.map((msg, index) => (
                    <div key={index} style={{ marginBottom: '5px', textAlign: msg.sender._id === user._id ? 'right' : 'left' }}>
                        <span style={{ fontSize: '0.8em', color: 'gray' }}>{msg.sender.name} ({new Date(msg.timestamp).toLocaleTimeString()})</span><br/>
                        <span style={{ background: msg.sender._id === user._id ? '#dcf8c6' : '#eee', padding: '5px 8px', borderRadius: '7px', display: 'inline-block' }}>
                            {msg.text}
                        </span>
                    </div>
                ))
            ) : <p>No messages yet for this chat.</p>
        ) : <p>Please select a match to start chatting.</p>}
         <div ref={messagesEndRef} /> {/* Element to scroll to */}
      </div>

      {/* Message Input Area */}
      {selectedMatch && (
        <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{ flexGrow: 1, marginRight: '10px', padding: '8px' }}
                disabled={!socket}
            />
            <button type="submit" disabled={!socket || !newMessage.trim()}>Send</button>
        </form>
      )}
    </div>
  );
};

export default ChatPage;
