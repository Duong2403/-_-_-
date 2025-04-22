import React, { useRef, useEffect } from 'react';

// TODO: Add Header (room name, schedule button, menu)
// TODO: Add Footer (input, emoji, file attachment)
// TODO: Implement image/file display in messages

const MessagesView = ({ messages, selectedMatch, user, onSendMessage }) => {
    const messagesEndRef = useRef(null);
    const [newMessage, setNewMessage] = React.useState(''); // Manage input state here

     // Scroll to Bottom
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedMatch) return;
        onSendMessage(newMessage.trim()); // Pass message text up to ChatPage
        setNewMessage(''); // Clear input
    };

    return (
        <div className="messages-view-column" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
             {/* TODO: Header */}
             <div className="messages-header" style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f8f9fa' }}>
                 {selectedMatch ? `Chat with Team ${selectedMatch.requestingTeam?.name || selectedMatch.receivingTeam?.name || 'Unknown'}` : 'Select a Chat'}
                 {/* Add Schedule & Menu buttons here */}
             </div>

             {/* Message Stream */}
            <div className="message-stream" style={{ flexGrow: 1, overflowY: 'scroll', padding: '10px' }}>
                {selectedMatch ? (
                    messages.length > 0 ? (
                        messages.map((msg, index) => (
                            <div key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: msg.sender._id === user._id ? 'flex-end' : 'flex-start' }}>
                                <div style={{ maxWidth: '70%' }}>
                                    <div style={{ fontSize: '0.8em', color: 'gray', marginBottom: '2px', textAlign: msg.sender._id === user._id ? 'right' : 'left' }}>
                                        {msg.sender.name} ({new Date(msg.timestamp).toLocaleTimeString()})
                                    </div>
                                    <div style={{ background: msg.sender._id === user._id ? '#dcf8c6' : '#eee', padding: '8px 12px', borderRadius: '10px', wordBreak: 'break-word' }}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : <p>No messages yet for this chat.</p>
                ) : <p>Please select a match to start chatting.</p>}
                <div ref={messagesEndRef} /> {/* Element to scroll to */}
            </div>

             {/* TODO: Footer / Message Input */}
             <div className="message-input-footer" style={{ padding: '10px', borderTop: '1px solid #ccc' }}>
                 {selectedMatch && (
                    <form onSubmit={handleFormSubmit} style={{ display: 'flex' }}>
                        {/* Add emoji/file buttons here */}
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type your message..."
                            style={{ flexGrow: 1, marginRight: '10px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                            disabled={!selectedMatch} // Disable if no chat selected
                        />
                        <button type="submit" disabled={!selectedMatch || !newMessage.trim()}>Send</button>
                    </form>
                 )}
             </div>
        </div>
    );
};

export default MessagesView;
