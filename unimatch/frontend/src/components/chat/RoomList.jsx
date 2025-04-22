import React from 'react';
import { Link } from 'react-router-dom'; // Might need Link later

// TODO: Fetch and display accepted matches/chat rooms
// TODO: Handle selecting a room (pass selection up to ChatPage)
// TODO: Display avatar, preview, unread badge (requires backend changes)

// Accept the new props: getOtherTeamName, myTeams, user
const RoomList = ({ acceptedMatches, selectedMatch, onSelectMatch, getOtherTeamName, myTeams, user }) => {
    return (
        <div className="room-list-column" style={{ borderRight: '1px solid #ccc', padding: '10px', height: 'calc(100vh - 100px)', overflowY: 'auto', width: '250px' /* Example width */ }}>
            <h3>Chats</h3>
            {acceptedMatches.length > 0 ? (
                 <ul>
                    {acceptedMatches.map(match => (
                        <li
                            key={match._id}
                            onClick={() => onSelectMatch(match)}
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                background: selectedMatch?._id === match._id ? '#e0e0e0' : 'transparent'
                            }}
                            className="room-list-item" // Add class for styling
                        >
                            {/* Use the passed-in function and data */}
                            {/* Ensure getOtherTeamName exists before calling */}
                            Chat with {typeof getOtherTeamName === 'function' ? getOtherTeamName(match, myTeams) : 'Unknown Team'}
                            {/* TODO: Add avatar, preview, badge */}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No active chats. Find a match!</p>
            )}
        </div>
    );
};

export default RoomList;
