import React, { useState, useMemo } from 'react';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import SubmitReviewModal from './SubmitReviewModal';
import { useAuth } from '../../context/AuthContext';
import { 
    GroupsIcon, 
    MeetingIcon, 
    CoupleIcon, 
    UniversityIcon,
    DateIcon,
    MessageIcon,
    SparkIcon
} from '../ui/SocialIcons';

// TODO: Display online status (requires backend changes/socket integration)
// TODO: Add Quick Stats (e.g., member count, date matched)

// Added onSelectPrivateChat and isPrivateChatSelected props
const GroupInfo = ({ selectedMatch, meetingProposals, api, onChatClosed, onSelectPrivateChat, isPrivateChatSelected }) => {
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [respondingMeetingId, setRespondingMeetingId] = useState(null);
    const [isExitingChat, setIsExitingChat] = useState(false);
    const { user } = useAuth();

    // Determine user's team and opponent team within the selected match
    const { userTeam, opponentTeam } = useMemo(() => {
        if (!selectedMatch || !user) {
            return { userTeam: null, opponentTeam: null };
        }
        const reqTeam = selectedMatch.requestingTeam;
        const recTeam = selectedMatch.receivingTeam;

        if (!reqTeam?.members || !recTeam?.members) {
            return { userTeam: null, opponentTeam: null };
        }

        const userIsRequesting = reqTeam.members.some(m => m._id === user._id);
        const userIsReceiving = recTeam.members.some(m => m._id === user._id);

        if (userIsRequesting) {
            return { userTeam: reqTeam, opponentTeam: recTeam };
        } else if (userIsReceiving) {
            return { userTeam: recTeam, opponentTeam: reqTeam };
        } else {
            return { userTeam: null, opponentTeam: null };
        }
    }, [selectedMatch, user]);

    // Get all members for private chat
    let allMembers = [];
    if (selectedMatch?.requestingTeam && selectedMatch?.receivingTeam) {
        const reqMembers = selectedMatch.requestingTeam.members || [];
        const recMembers = selectedMatch.receivingTeam.members || [];
        allMembers = reqMembers.concat(recMembers);
    }

    // Handler functions
    const handleRespond = async (meetingId, slotIndex, status) => {
        if (!api) return;
        
        setRespondingMeetingId(meetingId);
        try {
            const requestData = { acceptedSlotIndex: slotIndex, status };
            await api.put(`/meetings/${meetingId}/respond`, requestData);
        } catch (err) {
            console.error("Error responding to meeting proposal:", err);
        } finally {
            setRespondingMeetingId(null);
        }
    };

    const handleCancelMeeting = async (meetingId) => {
        if (!api || !window.confirm('Are you sure you want to cancel this meeting?')) return;
        
        setRespondingMeetingId(meetingId);
        try {
            await api.delete(`/meetings/${meetingId}`);
        } catch (err) {
            console.error("Error cancelling meeting:", err);
        } finally {
            setRespondingMeetingId(null);
        }
    };

    const handleExitChat = async () => {
        if (!api || !selectedMatch || !window.confirm('Are you sure you want to close this match? This action cannot be undone.')) return;
        
        setIsExitingChat(true);
        try {
            await api.put(`/matches/${selectedMatch._id}/close`);
            if (typeof onChatClosed === 'function') {
                onChatClosed(selectedMatch._id);
            }
        } catch (err) {
            console.error("Error closing chat:", err);
        } finally {
            setIsExitingChat(false);
        }
    };

    if (!selectedMatch) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GroupsIcon className="text-neutral-500" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-800 mb-2">No Chat Selected</h3>
                        <p className="text-neutral-600 text-sm">
                            Select a team to view details and start collaborating.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Team Header */}
            <div className="p-4 border-b border-neutral-200 bg-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-love rounded-full flex items-center justify-center">
                        <UniversityIcon className="text-white" size={18} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-neutral-800">{opponentTeam?.name || 'Team'}</h2>
                        <p className="text-xs text-neutral-600">{opponentTeam?.university || 'University'}</p>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-1 gap-2">
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        disabled={!!meetingProposals?.find(p => p.status === 'scheduled' || p.status === 'proposed')}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DateIcon size={16} />
                        Schedule Meeting
                    </button>
                    
                    <button
                        onClick={() => setIsReviewModalOpen(true)}
                        disabled={!opponentTeam}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        <SparkIcon size={16} />
                        Review Team
                    </button>

                    <button
                        onClick={handleExitChat}
                        disabled={isExitingChat}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        <GroupsIcon size={16} />
                        {isExitingChat ? 'Closing...' : 'Close Match'}
                    </button>
                </div>
            </div>

            {/* Content Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Team Members */}
                <div>
                    <h3 className="font-medium text-neutral-800 mb-3 flex items-center gap-2">
                        <CoupleIcon size={16} />
                        Team Members ({opponentTeam?.members?.length || 0})
                    </h3>
                    <div className="space-y-2">
                        {opponentTeam?.members?.map(member => (
                            <div key={member._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-sunset rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-neutral-800 text-sm">{member.name}</p>
                                        <p className="text-xs text-neutral-500">{member.email}</p>
                                    </div>
                                </div>
                                {member._id !== user._id && (
                                    <button
                                        onClick={() => onSelectPrivateChat({
                                            _id: member._id,
                                            name: member.name,
                                            matchIdContext: selectedMatch._id
                                        })}
                                        className="p-2 text-primary-rose hover:bg-primary-rose hover:bg-opacity-10 rounded-lg transition-colors"
                                        title={`Chat with ${member.name}`}
                                    >
                                        <MessageIcon size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Meetings */}
                {meetingProposals && meetingProposals.length > 0 && (
                    <div>
                        <h3 className="font-medium text-neutral-800 mb-3 flex items-center gap-2">
                            <MeetingIcon size={16} />
                            Active Meetings
                        </h3>
                        <div className="space-y-3">
                            {meetingProposals.map(proposal => (
                                <div key={proposal._id} className="p-3 bg-white rounded-lg border border-neutral-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            proposal.status === 'proposed' ? 'bg-amber-100 text-amber-800' :
                                            proposal.status === 'scheduled' ? 'bg-green-100 text-green-800' : 
                                            'bg-neutral-100 text-neutral-700'
                                        }`}>
                                            {proposal.status}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {new Date(proposal.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    {proposal.description && (
                                        <p className="text-sm text-neutral-600 mb-3">{proposal.description}</p>
                                    )}

                                    {proposal.status === 'proposed' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRespond(proposal._id, 0, 'accepted')}
                                                disabled={respondingMeetingId === proposal._id}
                                                className="flex-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRespond(proposal._id, 0, 'rejected')}
                                                disabled={respondingMeetingId === proposal._id}
                                                className="flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}

                                    {proposal.status === 'scheduled' && (
                                        <button
                                            onClick={() => handleCancelMeeting(proposal._id)}
                                            disabled={respondingMeetingId === proposal._id}
                                            className="w-full px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                                        >
                                            Cancel Meeting
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isScheduleModalOpen && (
                <ScheduleMeetingModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    selectedMatch={selectedMatch}
                    api={api}
                />
            )}

            {isReviewModalOpen && (
                <SubmitReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    opponentTeam={opponentTeam}
                    api={api}
                />
            )}
        </div>
    );
};

export default GroupInfo;
