import React from 'react';
import { 
    GroupsIcon, 
    UniversityIcon,
    MessageIcon
} from '../ui/SocialIcons';

// TODO: Fetch and display accepted matches/chat rooms
// TODO: Handle selecting a room (pass selection up to ChatPage)
// TODO: Display avatar, preview, unread badge (requires backend changes)

// Accept the new props: getOtherTeamName, myTeams, user
const RoomList = ({ 
    matches, 
    selectedMatch, 
    onSelectMatch, 
    selectedPrivateChatUser, 
    onSelectPrivateChat, 
    isPrivateChatSelected 
}) => {

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 bg-white">
                <h2 className="text-lg font-semibold text-neutral-800 mb-1 flex items-center gap-2">
                    <GroupsIcon size={20} />
                    Teams
                </h2>
                <p className="text-sm text-neutral-600">
                    {matches.length} conversation{matches.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4">
                {matches.length > 0 ? (
                    <div className="space-y-3">
                        {matches.map(match => {
                            const isSelected = selectedMatch?._id === match._id;
                            const otherTeam = match.requestingTeam?._id === match.userTeam?._id 
                                ? match.receivingTeam 
                                : match.requestingTeam;

                            return (
                                <div
                                    key={match._id}
                                    onClick={() => onSelectMatch(match)}
                                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-primary-rose bg-opacity-10 border-2 border-primary-rose'
                                            : 'bg-white border-2 border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            isSelected 
                                                ? 'bg-primary-rose text-white' 
                                                : 'bg-gradient-love text-white'
                                        }`}>
                                            <UniversityIcon size={20} />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className={`font-semibold ${
                                                isSelected ? 'text-primary-rose' : 'text-neutral-800'
                                            }`}>
                                                {otherTeam?.name || 'Unknown Team'}
                                            </h3>
                                            <p className={`text-sm ${
                                                isSelected ? 'text-primary-rose text-opacity-80' : 'text-neutral-600'
                                            }`}>
                                                {otherTeam?.university || 'University'} • {otherTeam?.members?.length || 0} members
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${
                                                isSelected ? 'bg-primary-rose' : 'bg-green-500'
                                            }`}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mb-4">
                            <GroupsIcon className="text-neutral-500" size={24} />
                        </div>
                        <h3 className="font-medium text-neutral-800 mb-2">No Active Chats</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                            You don't have any active team conversations yet.
                        </p>
                        <button 
                            onClick={() => window.location.href = '/matching'}
                            className="px-4 py-2 bg-primary-rose text-white rounded-lg hover:bg-primary-rose-dark transition-colors"
                        >
                            Find Teams
                        </button>
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
