import React, { useRef, useEffect, useState } from 'react';
import { SendIcon, EmojiIcon, AttachmentIcon, MessageIcon, GroupsIcon } from '../ui/SocialIcons';
import { uploadChatImage, uploadTeamChatImage } from '../../services/api';
import EmojiPicker from './EmojiPicker';
import ImageUpload from './ImageUpload';

const MessagesView = ({ messages, selectedMatch, selectedTeamChat, selectedPrivateChatUser, user, onSendMessage }) => {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Message pagination state
    const [visibleMessageCount, setVisibleMessageCount] = useState(10);
    
    // Emoji picker state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Image upload state
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    // Emoji picker handlers
    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(prev => !prev);
    };

    // Image upload handlers
    const handleImageUpload = async (imageFile) => {
        console.log('=== IMAGE UPLOAD DEBUG START ===');
        console.log('1. Image file:', {
            name: imageFile?.name,
            size: imageFile?.size,
            type: imageFile?.type
        });
        console.log('2. Chat state:', {
            isPrivateChatView,
            isTeamChatView,
            selectedMatch: selectedMatch ? {
                id: selectedMatch._id,
                requestingTeam: selectedMatch.requestingTeam?.name,
                receivingTeam: selectedMatch.receivingTeam?.name
            } : null,
            selectedTeamChat: selectedTeamChat ? {
                id: selectedTeamChat._id,
                teamName: selectedTeamChat.teamInfo?.name
            } : null,
            selectedPrivateChatUser: selectedPrivateChatUser ? {
                id: selectedPrivateChatUser._id,
                name: selectedPrivateChatUser.name,
                matchIdContext: selectedPrivateChatUser.matchIdContext
            } : null
        });
        console.log('3. User info:', {
            userId: user?._id,
            userName: user?.name
        });
        
        setIsUploadingImage(true);
        setUploadProgress(0);

        try {
            const isPrivate = !!isPrivateChatView; // Convert to boolean
            const isTeamImage = !!isTeamChatView; // Convert to boolean
            const matchId = isPrivate ? selectedPrivateChatUser?.matchIdContext : selectedMatch?._id;
            const teamId = isTeamImage ? selectedTeamChat?.teamInfo?._id : null;
            const recipientId = isPrivate ? selectedPrivateChatUser?._id : null;

            console.log('Upload parameters:', {
                isPrivate,
                isTeamImage,
                matchId,
                teamId,
                recipientId,
                imageFileName: imageFile.name,
                imageSize: imageFile.size
            });

            if (!matchId && !teamId) {
                throw new Error(`No context selected. isPrivate: ${isPrivate}, isTeamImage: ${isTeamImage}, selectedMatch: ${selectedMatch?._id}, selectedTeamChat: ${selectedTeamChat?.teamInfo?._id}, selectedPrivateChatUser.matchIdContext: ${selectedPrivateChatUser?.matchIdContext}`);
            }

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev < 90) return prev + 10;
                    return prev;
                });
            }, 200);

            console.log('4. Testing backend connectivity...');
            try {
                // Test if backend is reachable
                const testResponse = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                console.log('Backend connectivity test:', testResponse.status);
            } catch (connectError) {
                console.error('Backend connectivity test failed:', connectError);
                throw new Error('Cannot connect to backend server. Please check if the server is running.');
            }

            console.log('5. Calling upload API...');
            
            let uploadedMessage;
            if (isTeamImage) {
                console.log('6. Team chat API call parameters:', {
                    imageFile: imageFile.name,
                    teamId
                });
                uploadedMessage = await uploadTeamChatImage(imageFile, teamId);
            } else {
                console.log('6. Match chat API call parameters:', {
                    imageFile: imageFile.name,
                    matchId,
                    isPrivate,
                    recipientId
                });
                uploadedMessage = await uploadChatImage(imageFile, matchId, isPrivate, recipientId);
            }
            
            console.log('7. Upload successful:', uploadedMessage);
            console.log('=== IMAGE UPLOAD DEBUG END ===');
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            // Trigger message refresh by calling onSendMessage with the new message
            if (onSendMessage) {
                onSendMessage(null, uploadedMessage);
            }

            setTimeout(() => {
                setIsUploadingImage(false);
                setUploadProgress(0);
            }, 500);

        } catch (error) {
            console.error('Error uploading image:', error);
            console.error('Error details:', error.response?.data || error.message);
            alert(`Failed to upload image: ${error.response?.data?.message || error.message}`);
            setIsUploadingImage(false);
            setUploadProgress(0);
        }
    };

    // Determine chat context
    const isGroupChatView = selectedMatch && !selectedPrivateChatUser && !selectedTeamChat;
    const isTeamChatView = selectedTeamChat && !selectedPrivateChatUser && !selectedMatch;
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
                isGroup: true,
                isTeam: false
            };
        } else if (isTeamChatView) {
            return {
                name: selectedTeamChat.teamInfo?.name || 'Team Chat',
                subtitle: `${selectedTeamChat.teamInfo?.members?.length || 0} team members`,
                isGroup: true,
                isTeam: true
            };
        } else if (isPrivateChatView) {
            return {
                name: selectedPrivateChatUser.name,
                subtitle: 'Active now',
                isGroup: false,
                isTeam: false
            };
        }
        return { name: 'Select a Chat', subtitle: '', isGroup: false, isTeam: false };
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
        <div className="chat-messages-view bg-white">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        headerInfo.isTeam ? 'bg-blue-500' :
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

            {/* Messages Area - Fixed Height Container */}
            <div 
                ref={messagesContainerRef}
                className="chat-messages-container px-4 py-3 bg-neutral-50 bg-opacity-30 chat-scroll"
            >
                {(isGroupChatView || isTeamChatView || isPrivateChatView) ? (
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
                            <div className="message-spacing">
                                {visibleMessages.map((msg, index) => {
                                    // Proper user ID comparison with multiple fallback methods
                                    const isMyMessage = msg.sender._id === user._id || 
                                                       msg.sender._id === user.id || 
                                                       String(msg.sender._id) === String(user._id) ||
                                                       String(msg.sender._id) === String(user.id);

                                    return (
                                        <div
                                            key={msg._id || index}
                                            className={`flex mb-3 ${isMyMessage ? 'justify-end pr-2' : 'justify-start pl-2'}`}
                                        >
                                            <div className={`flex items-end gap-2 max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row ml-8'}`}>
                                                {/* Avatar - show for all messages */}
                                                <div className={`message-avatar ${isMyMessage ? 'bg-primary-rose' : 'message-avatar-gradient'}`}>
                                                    {msg.sender.name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Message bubble */}
                                                <div className="flex flex-col">
                                                    {/* Sender name */}
                                                    <div className={`text-xs font-medium text-neutral-600 mb-1 px-3 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                                                        {isMyMessage ? 'You' : msg.sender.name}
                                                    </div>

                                                    {/* Message content */}
                                                    <div className={`rounded-2xl shadow-sm ${
                                                        isMyMessage 
                                                            ? 'bg-primary-rose text-white rounded-br-md' 
                                                            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
                                                    } ${msg.messageType === 'image' ? 'p-1' : 'px-4 py-2'}`}>
                                                        {msg.messageType === 'image' ? (
                                                            <div className="relative">
                                                                <img
                                                                    src={msg.attachment?.url}
                                                                    alt={msg.attachment?.filename || 'Shared image'}
                                                                    className="max-w-full max-h-64 rounded-xl object-cover"
                                                                    loading="lazy"
                                                                />
                                                                {/* Image overlay info */}
                                                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                                    {msg.attachment?.filename}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                                        )}
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
                                            : isTeamChatView
                                            ? 'Start chatting with your team members!'
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
            {(isGroupChatView || isTeamChatView || isPrivateChatView) && (
                <div className="chat-input-area p-4">
                    <form onSubmit={handleFormSubmit} className="flex items-end gap-3">
                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 relative">
                            {/* Image Upload Component */}
                            <ImageUpload
                                onUpload={handleImageUpload}
                                isUploading={isUploadingImage}
                                uploadProgress={uploadProgress}
                            />
                            
                            {/* Emoji Picker Button */}
                            <button
                                type="button"
                                onClick={toggleEmojiPicker}
                                className={`p-2 text-neutral-500 hover:text-primary-rose hover:bg-primary-rose hover:bg-opacity-10 rounded-lg transition-colors ${
                                    showEmojiPicker ? 'text-primary-rose bg-primary-rose bg-opacity-10' : ''
                                }`}
                                title="Add emoji"
                            >
                                <EmojiIcon size={18} />
                            </button>

                            {/* Emoji Picker */}
                            <EmojiPicker
                                isOpen={showEmojiPicker}
                                onClose={() => setShowEmojiPicker(false)}
                                onEmojiSelect={handleEmojiSelect}
                            />
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
                                        : isTeamChatView
                                        ? `Message your team...`
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