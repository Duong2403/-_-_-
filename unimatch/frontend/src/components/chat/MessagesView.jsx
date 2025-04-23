import React, { useRef, useEffect } from 'react';

// TODO: Add Header (room name, schedule button, menu)
// TODO: Add Footer (input, emoji, file attachment)
// TODO: Implement image/file display in messages

const MessagesView = ({ messages, selectedMatch, selectedPrivateChatUser, user, onSendMessage }) => {
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
        if (!newMessage.trim()) return; // Check for empty message
        const isPrivate = !!selectedPrivateChatUser;
        const recipientId = selectedPrivateChatUser?._id;
        onSendMessage(newMessage.trim(), recipientId, isPrivate); // Pass message text, recipient, and isPrivate flag
        setNewMessage(''); // Clear input
    };

    // Determine if it's a group chat or private chat
    const isGroupChatView = selectedMatch && !selectedPrivateChatUser;
    const isPrivateChatView = selectedPrivateChatUser;

    // Determine the chat header
    let chatHeader = 'Select a Chat';
    if (isGroupChatView) {
        chatHeader = `Chat with Team ${selectedMatch.requestingTeam?.name || selectedMatch.receivingTeam?.name || 'Unknown'}`;
    } else if (isPrivateChatView) {
        chatHeader = `Private Chat with ${selectedPrivateChatUser.name}`;
    }

    return (
        <div className="messages-view-column" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
             {/* Header */}
             <div className="messages-header" style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f8f9fa' }}>
                 {chatHeader}
                 {/* Add Schedule & Menu buttons here - maybe disable in private chat view? */}
             </div>

             {/* Message Stream */}
            <div className="message-stream" style={{ flexGrow: 1, overflowY: 'scroll', padding: '10px' }}>
                {isGroupChatView || isPrivateChatView ? (
                    messages.length > 0 ? (
                        messages.map((msg, index) => {
                            // Filter messages based on chat type (group vs private)
                            if (isPrivateChatView && !msg.isPrivate) return null; // Skip group messages in private view
                            if (isGroupChatView && msg.isPrivate) return null; // Skip private messages in group view

                            const isMyMessage = msg.sender._id === user._id;
                            return (
                                <div key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '70%' }}>
                                        <div style={{ fontSize: '0.8em', color: 'gray', marginBottom: '2px', textAlign: isMyMessage ? 'right' : 'left' }}>
                                            {msg.sender.name} ({new Date(msg.timestamp).toLocaleTimeString()})
                                            {isPrivateChatView && !isMyMessage && ` (Private)`} {/* Indicate private message origin */}
                                        </div>
                                        <div style={{ background: isMyMessage ? '#dcf8c6' : '#eee', padding: '8px 12px', borderRadius: '10px', wordBreak: 'break-word' }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : <p>No messages yet for this chat.</p>
                ) : <p>Please select a match or user to start chatting.</p>}
                <div ref={messagesEndRef} /> {/* Element to scroll to */}
            </div>

             {/* Footer / Message Input */}
             <div className="message-input-footer" style={{ padding: '10px', borderTop: '1px solid #ccc' }}>
                 {(isGroupChatView || isPrivateChatView) && (
                    <form onSubmit={handleFormSubmit} style={{ display: 'flex' }}>
                        {/* Add emoji/file buttons here */}
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type your message..."
                            style={{ flexGrow: 1, marginRight: '10px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                            disabled={!selectedMatch && !selectedPrivateChatUser} // Disable if no chat selected
                        />
                        <button type="submit" disabled={!newMessage.trim()}>Send</button>
                    </form>
                 )}
             </div>
        </div>
    );
};

export default MessagesView;
