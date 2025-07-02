import React, { useRef, useEffect, useState } from 'react';
import { SendIcon, EmojiIcon, AttachmentIcon, MessageIcon, GroupsIcon } from '../ui/SocialIcons';

const MessagesView = ({ messages, selectedMatch, selectedPrivateChatUser, user, onSendMessage }) => {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Message pagination state
    const [visibleMessageCount, setVisibleMessageCount] = useState(50);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        onSendMessage(newMessage.trim());
        setNewMessage('');
    };

    // Load more messages handler
    const handleLoadMore = () => {
        setVisibleMessageCount(prev => prev + 30);
    };

    // Determine chat context
    const isGroupChatView = selectedMatch && !selectedPrivateChatUser;
    const isPrivateChatView = selectedPrivateChatUser;

    // Get chat header info
    const getChatHeaderInfo = () => {
        if (isGroupChatView) {
            const otherTeam = selectedMatch.requestingTeam?.members?.some(m => m._id === user._id) 
                ? selectedMatch.receivingTeam 
                : selectedMatch.requestingTeam;
            return {
                name: otherTeam?.name || 'Team Chat',
                subtitle: `${selectedMatch.requestingTeam?.members?.length || 0} + ${selectedMatch.receivingTeam?.members?.length || 0} members`,
                isGroup: true
            };
        } else if (isPrivateChatView) {
            return {
                name: selectedPrivateChatUser.name,
                subtitle: 'Active now',
                isGroup: false
            };
        }
        return { name: 'Select a Chat', subtitle: '', isGroup: false };
    };

    const headerInfo = getChatHeaderInfo();

    // Format message timestamp
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    // Filter and limit messages
    const filteredMessages = messages.filter(msg => {
        if (isPrivateChatView && !msg.isPrivate) return false;
        if (isGroupChatView && msg.isPrivate) return false;
        return true;
    });

    // Get visible messages (last N messages)
    const visibleMessages = filteredMessages.slice(-visibleMessageCount);
    const hasMoreMessages = filteredMessages.length > visibleMessageCount;
    const hiddenMessageCount = filteredMessages.length - visibleMessages.length;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        headerInfo.isGroup ? 'bg-gradient-friendship' : 'bg-gradient-love'
                    }`}>
                        {headerInfo.isGroup ? (
                            <GroupsIcon size={20} />
                        ) : (
                            headerInfo.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-neutral-800">{headerInfo.name}</h2>
                        <p className="text-sm text-neutral-500">{headerInfo.subtitle}</p>
                    </div>
                </div>
                
                {/* Message Count */}
                {filteredMessages.length > 0 && (
                    <div className="text-xs text-neutral-500">
                        {hiddenMessageCount > 0 ? (
                            <span>{visibleMessages.length} of {filteredMessages.length}</span>
                        ) : (
                            <span>{filteredMessages.length} total</span>
                        )}
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-3 bg-neutral-50 bg-opacity-30"
                style={{ minHeight: 0 }}
            >
                {isGroupChatView || isPrivateChatView ? (
                    <>
                        {/* Load More Button */}
                        {hasMoreMessages && (
                            <div className="flex justify-center mb-4">
                                <button
                                    onClick={handleLoadMore}
                                    className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 text-sm rounded-full transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <MessageIcon size={14} />
                                    Load {hiddenMessageCount} earlier messages
                                </button>
                            </div>
                        )}

                        {visibleMessages.length > 0 ? (
                            <div className="space-y-2">
                                {visibleMessages.map((msg, index) => {
                                    const isMyMessage = msg.sender._id === user._id;

                                    return (
                                        <div
                                            key={msg._id || index}
                                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex items-end gap-2 max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Avatar for others */}
                                                {!isMyMessage && (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-sunset flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                        {msg.sender.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                {/* Message bubble */}
                                                <div className="flex flex-col">
                                                    {/* Sender name for others */}
                                                    {!isMyMessage && (
                                                        <div className="text-xs font-medium text-neutral-600 mb-1 px-3">
                                                            {msg.sender.name}
                                                        </div>
                                                    )}

                                                    {/* Message content */}
                                                    <div className={`px-4 py-2 rounded-2xl ${
                                                        isMyMessage 
                                                            ? 'bg-primary-rose text-white rounded-br-md' 
                                                            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
                                                    }`}>
                                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                                    </div>

                                                    {/* Timestamp */}
                                                    <div className={`text-xs text-neutral-400 mt-1 px-2 ${
                                                        isMyMessage ? 'text-right' : 'text-left'
                                                    }`}>
                                                        {formatMessageTime(msg.createdAt || msg.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageIcon className="text-neutral-500" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No messages yet</h3>
                                    <p className="text-neutral-600 text-sm">
                                        {isPrivateChatView 
                                            ? `Start a private conversation with ${selectedPrivateChatUser.name}`
                                            : 'Send the first message to break the ice!'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 bg-gradient-friendship rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageIcon className="text-white" size={40} />
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-800 mb-4">Select a chat to start messaging</h3>
                            <p className="text-neutral-600">
                                Choose a team from the sidebar to start your conversation!
                            </p>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Fixed at bottom */}
            {(isGroupChatView || isPrivateChatView) && (
                <div className="border-t border-neutral-200 bg-white p-4 flex-shrink-0">
                    <form onSubmit={handleFormSubmit} className="flex items-end gap-3">
                        {/* Quick Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="p-2 text-neutral-500 hover:text-primary-rose hover:bg-primary-rose hover:bg-opacity-10 rounded-lg transition-colors"
                                title="Attach file"
                            >
                                <AttachmentIcon size={18} />
                            </button>
                            
                            <button
                                type="button"
                                className="p-2 text-neutral-500 hover:text-primary-rose hover:bg-primary-rose hover:bg-opacity-10 rounded-lg transition-colors"
                                title="Add emoji"
                            >
                                <EmojiIcon size={18} />
                            </button>
                        </div>

                        {/* Message Input */}
                        <div className="flex-1 relative">
                            <div className="relative bg-neutral-100 rounded-2xl border-2 border-transparent focus-within:border-primary-rose focus-within:bg-white transition-all duration-200">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    placeholder={isPrivateChatView 
                                        ? `Message ${selectedPrivateChatUser.name} privately...` 
                                        : "Type a message..."
                                    }
                                    className="w-full px-4 py-3 bg-transparent border-0 rounded-2xl text-sm focus:outline-none placeholder-neutral-500"
                                    maxLength={500}
                                />
                            </div>
                            
                            {/* Private chat indicator */}
                            {isPrivateChatView && (
                                <div className="flex items-center gap-1 mt-1 px-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span className="text-xs text-amber-600 font-medium">Private conversation</span>
                                </div>
                            )}
                        </div>

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className={`p-3 rounded-xl transition-all ${
                                newMessage.trim()
                                    ? 'bg-primary-rose text-white hover:bg-primary-rose-dark shadow-lg hover:shadow-xl'
                                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            }`}
                            title="Send message"
                        >
                            <SendIcon size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MessagesView; 