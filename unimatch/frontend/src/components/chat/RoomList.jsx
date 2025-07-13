import React from 'react';
import { 
    GroupsIcon, 
    UniversityIcon,
    MessageIcon
} from '../ui/SocialIcons';

// Updated component to handle both team chats and match chats
const RoomList = ({ 
    matches = [], 
    teamChats = [],
    selectedMatch, 
    selectedTeamChat,
    onSelectMatch, 
    onSelectTeamChat,
    selectedPrivateChatUser, 
    onSelectPrivateChat, 
    isPrivateChatSelected 
}) => {

    const totalChats = matches.length + teamChats.length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 bg-white">
                <h2 className="text-lg font-semibold text-neutral-800 mb-1 flex items-center gap-2">
                    <MessageIcon size={20} />
                    Chats
                </h2>
                <p className="text-sm text-neutral-600">
                    {totalChats} conversation{totalChats !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4">
                {totalChats > 0 ? (
                    <div className="space-y-4">
                        {/* Team Chats Section */}
                        {teamChats.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <GroupsIcon size={16} className="text-blue-600" />
                                    <h3 className="text-sm font-semibold text-blue-800">Team Chats</h3>
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        {teamChats.length}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {teamChats.map(teamChat => {
                                        const isSelected = selectedTeamChat?._id === teamChat._id;
                                        const team = teamChat.teamInfo;

                                        return (
                                            <div
                                                key={teamChat._id}
                                                onClick={() => onSelectTeamChat(teamChat)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-blue-50 border-2 border-blue-200'
                                                        : 'bg-white border-2 border-neutral-200 hover:border-blue-200 hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        isSelected 
                                                            ? 'bg-blue-500 text-white' 
                                                            : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        <GroupsIcon size={16} />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <h4 className={`font-medium text-sm ${
                                                            isSelected ? 'text-blue-800' : 'text-neutral-800'
                                                        }`}>
                                                            {team?.name || 'Team Chat'}
                                                        </h4>
                                                        <p className={`text-xs ${
                                                            isSelected ? 'text-blue-600' : 'text-neutral-500'
                                                        }`}>
                                                            Internal • {team?.members?.length || 0} members
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            isSelected ? 'bg-blue-500' : 'bg-green-400'
                                                        }`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Match Chats Section */}
                        {matches.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <UniversityIcon size={16} className="text-primary-rose" />
                                    <h3 className="text-sm font-semibold text-primary-rose">Match Chats</h3>
                                    <span className="text-xs text-primary-rose bg-primary-rose bg-opacity-10 px-2 py-1 rounded-full">
                                        {matches.length}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {matches.map(match => {
                                        const isSelected = selectedMatch?._id === match._id;
                                        const otherTeam = match.requestingTeam?._id === match.userTeam?._id 
                                            ? match.receivingTeam 
                                            : match.requestingTeam;

                                        return (
                                            <div
                                                key={match._id}
                                                onClick={() => onSelectMatch(match)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-primary-rose bg-opacity-10 border-2 border-primary-rose'
                                                        : 'bg-white border-2 border-neutral-200 hover:border-primary-rose hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        isSelected 
                                                            ? 'bg-primary-rose text-white' 
                                                            : 'bg-gradient-love text-white'
                                                    }`}>
                                                        <UniversityIcon size={16} />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <h4 className={`font-medium text-sm ${
                                                            isSelected ? 'text-primary-rose' : 'text-neutral-800'
                                                        }`}>
                                                            vs {otherTeam?.name || 'Unknown Team'}
                                                        </h4>
                                                        <p className={`text-xs ${
                                                            isSelected ? 'text-primary-rose text-opacity-80' : 'text-neutral-500'
                                                        }`}>
                                                            External • {otherTeam?.university || 'University'}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            isSelected ? 'bg-primary-rose' : 'bg-green-400'
                                                        }`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mb-4">
                            <MessageIcon className="text-neutral-500" size={24} />
                        </div>
                        <h3 className="font-medium text-neutral-800 mb-2">No Active Chats</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                            Join or create teams to start chatting. Team chats are available when your team has 2+ members.
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => window.location.href = '/teams'}
                                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                My Teams
                            </button>
                            <button 
                                onClick={() => window.location.href = '/matching'}
                                className="px-3 py-2 bg-primary-rose text-white text-sm rounded-lg hover:bg-primary-rose-dark transition-colors"
                            >
                                Find Teams
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Private Chat Indicator */}
            {selectedPrivateChatUser && (
                <div className="p-4 border-t border-neutral-200 bg-blue-50">
                    <div className="flex items-center gap-2">
                        <MessageIcon size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                            Private chat with {selectedPrivateChatUser.name}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomList;
