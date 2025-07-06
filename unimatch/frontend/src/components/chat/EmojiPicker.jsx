import React, { useState, useRef, useEffect } from 'react';

const EmojiPicker = ({ isOpen, onClose, onEmojiSelect }) => {
    const [activeCategory, setActiveCategory] = useState('smileys');
    const [recentEmojis, setRecentEmojis] = useState([]);
    const pickerRef = useRef(null);

    // Emoji categories
    const emojiCategories = {
        recent: {
            name: 'Recently Used',
            icon: '🕒',
            emojis: recentEmojis
        },
        smileys: {
            name: 'Smileys & Emotion',
            icon: '😀',
            emojis: [
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
                '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
                '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
                '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
                '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
                '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
            ]
        },
        people: {
            name: 'People & Body',
            icon: '👋',
            emojis: [
                '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
                '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
                '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
                '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
                '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
            ]
        },
        nature: {
            name: 'Animals & Nature',
            icon: '🐶',
            emojis: [
                '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
                '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
                '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
                '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
                '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕'
            ]
        },
        food: {
            name: 'Food & Drink',
            icon: '🍎',
            emojis: [
                '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
                '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
                '🥒', '🥬', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
                '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈',
                '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟'
            ]
        },
        activities: {
            name: 'Activities',
            icon: '⚽',
            emojis: [
                '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
                '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
                '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
                '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺',
                '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆'
            ]
        },
        objects: {
            name: 'Objects',
            icon: '💎',
            emojis: [
                '💎', '🔔', '🎵', '🎶', '🎤', '🎧', '📻', '🎷', '🪗', '🎸',
                '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '📱', '📞', '☎️', '📟',
                '📠', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽',
                '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬', '📺', '📷'
            ]
        },
        symbols: {
            name: 'Symbols',
            icon: '❤️',
            emojis: [
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
                '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
                '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
                '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳'
            ]
        }
    };

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Load recent emojis from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentEmojis');
        if (saved) {
            setRecentEmojis(JSON.parse(saved));
        }
    }, []);

    const handleEmojiClick = (emoji) => {
        // Add to recent emojis
        const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
        setRecentEmojis(newRecent);
        localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
        
        onEmojiSelect(emoji);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-full mb-2 right-0 z-50">
            <div 
                ref={pickerRef}
                className="bg-white border border-neutral-200 rounded-xl shadow-xl w-80 h-96 flex flex-col"
            >
                {/* Header */}
                <div className="p-3 border-b border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-800">Choose an emoji</h3>
                </div>

                {/* Category Tabs */}
                <div className="flex border-b border-neutral-200 overflow-x-auto">
                    {Object.entries(emojiCategories).map(([key, category]) => (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key)}
                            className={`p-2 text-lg hover:bg-neutral-100 transition-colors min-w-[40px] ${
                                activeCategory === key ? 'bg-primary-rose bg-opacity-10' : ''
                            }`}
                            title={category.name}
                        >
                            {category.icon}
                        </button>
                    ))}
                </div>

                {/* Emoji Grid */}
                <div className="flex-1 p-2 overflow-y-auto">
                    {emojiCategories[activeCategory]?.emojis.length > 0 ? (
                        <div className="grid grid-cols-8 gap-1">
                            {emojiCategories[activeCategory].emojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="p-2 text-lg hover:bg-neutral-100 rounded transition-colors"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
                            {activeCategory === 'recent' ? 'No recent emojis' : 'No emojis in this category'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmojiPicker; 