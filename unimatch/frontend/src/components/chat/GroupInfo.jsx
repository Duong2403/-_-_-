import React, { useState, useMemo } from 'react'; // Import useState, useMemo
import { Link } from 'react-router-dom';
import ScheduleMeetingModal from './ScheduleMeetingModal'; // Import the modal
import SubmitReviewModal from './SubmitReviewModal'; // Import the review modal
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook

// TODO: Display online status (requires backend changes/socket integration)
// TODO: Add Quick Stats (e.g., member count, date matched)

// Added onSelectPrivateChat and isPrivateChatSelected props
const GroupInfo = ({ selectedMatch, meetingProposals, api, onChatClosed, onSelectPrivateChat, isPrivateChatSelected }) => {
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // State for review modal
    const [respondingMeetingId, setRespondingMeetingId] = useState(null); // Add state for loading indicator
    const [isExitingChat, setIsExitingChat] = useState(false); // State for exit chat loading
    const { user } = useAuth(); // Get user from context for checking responses

    // Determine user's team and opponent team within the selected match
    const { userTeam, opponentTeam } = useMemo(() => {
        // console.log("useMemo calculating teams: selectedMatch=", selectedMatch, "user=", user); // Log inputs
        if (!selectedMatch || !user) {
            // console.log("useMemo: Missing selectedMatch or user");
            return { userTeam: null, opponentTeam: null };
        }
        const reqTeam = selectedMatch.requestingTeam;
        const recTeam = selectedMatch.receivingTeam;
        // console.log("useMemo: reqTeam=", reqTeam, "recTeam=", recTeam); // Log teams from match

        // Ensure teams and members arrays are populated before checking
        if (!reqTeam?.members || !recTeam?.members) {
             // console.log("useMemo: Teams or members not fully populated yet.");
             return { userTeam: null, opponentTeam: null }; // Return null if data isn't ready
        }

        const userIsRequesting = reqTeam.members.some(m => m._id === user._id);
        const userIsReceiving = recTeam.members.some(m => m._id === user._id);
        // console.log("useMemo: userIsRequesting=", userIsRequesting, "userIsReceiving=", userIsReceiving); // Log checks

        if (userIsRequesting) {
            // console.log("useMemo: User is in requesting team. Opponent:", recTeam?.name);
            return { userTeam: reqTeam, opponentTeam: recTeam };
        } else if (userIsReceiving) {
            // console.log("useMemo: User is in receiving team. Opponent:", reqTeam?.name);
            return { userTeam: recTeam, opponentTeam: reqTeam };
        } else {
            // console.log("useMemo: User not found in either team members list.");
            return { userTeam: null, opponentTeam: null }; // Should not happen if match data is correct
        }
    }, [selectedMatch, user]);

    // Safely determine combined members list for display
    let members = [];
    if (selectedMatch?.requestingTeam && selectedMatch?.receivingTeam) {
        const reqMembers = selectedMatch.requestingTeam.members || [];
        const recMembers = selectedMatch.receivingTeam.members || [];
        members = reqMembers.concat(recMembers);
    }

     // Handler function to respond to a meeting proposal
     const handleRespond = async (meetingId, slotIndex, status) => {
        if (!api) {
             console.error("API instance not passed to GroupInfo component.");
             alert("Error: Cannot process request.");
             return;
        }
        setRespondingMeetingId(meetingId);
        try {
            await api.put(`/meetings/${meetingId}/respond`, { acceptedSlotIndex: slotIndex, status });
            alert(`Response (${status}) submitted!`);
            // TODO: Refresh meeting proposals state after responding
        } catch (err) {
            console.error("Error responding to meeting proposal:", err);
            alert(`Error: ${err.response?.data?.message || 'Failed to respond.'}`);
        } finally {
            setRespondingMeetingId(null);
        }
    };

    // Handler function to cancel a meeting proposal or scheduled meeting
    const handleCancelMeeting = async (meetingId) => {
        if (!api) {
             console.error("API instance not passed to GroupInfo component.");
             alert("Error: Cannot process request.");
             return;
        }
        if (!window.confirm('Are you sure you want to cancel this meeting/proposal?')) {
            return;
        }
        setRespondingMeetingId(meetingId); // Use same loading state
        try {
            await api.delete(`/meetings/${meetingId}`);
            alert('Meeting cancelled successfully!');
            // TODO: Refresh meeting proposals state after cancelling (or rely on socket event)
        } catch (err) {
            console.error("Error cancelling meeting:", err);
            alert(`Error: ${err.response?.data?.message || 'Failed to cancel meeting.'}`);
        } finally {
            setRespondingMeetingId(null);
        }
    };

    // Handler function to exit/close the current chat
    const handleExitChat = async () => {
        if (!api || !selectedMatch) {
            console.error("API instance or selectedMatch not available.");
            alert("Error: Cannot process request.");
            return;
        }
        if (!window.confirm('Are you sure you want to exit this chat? This will close the match for both teams.')) {
            return;
        }
        setIsExitingChat(true);
        try {
            await api.put(`/matches/${selectedMatch._id}/close`);
            alert('Chat closed successfully!');
            // Notify parent component (ChatPage) to remove this chat from the list
            if (typeof onChatClosed === 'function') { // Double check it's a function
                onChatClosed(selectedMatch._id);
            }
        } catch (err) {
            console.error("Error closing chat:", err);
            alert(`Error: ${err.response?.data?.message || 'Failed to close chat.'}`);
        } finally {
            setIsExitingChat(false);
        }
    };


    return (
        <div className="group-info-column" style={{ borderLeft: '1px solid #ccc', padding: '10px', height: 'calc(100vh - 100px)', overflowY: 'auto', width: '250px' }}>
            <h3>Group Info</h3>
            {selectedMatch ? (
                <>
                    <h4>{opponentTeam?.name || 'Team Details'}</h4>
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        style={{ width: '100%', marginBottom: '5px' }}
                        disabled={!selectedMatch || !!meetingProposals?.find(p => p.status === 'scheduled' || p.status === 'proposed')}
                        title={meetingProposals?.find(p => p.status === 'scheduled' || p.status === 'proposed') ? "Cancel existing meeting/proposal first" : ""}
                    >
                        Schedule Meeting
                    </button>
                     <button
                        onClick={() => setIsReviewModalOpen(true)}
                        style={{ width: '100%', marginBottom: '15px', background: '#ffc107' }}
                         disabled={!selectedMatch || !opponentTeam}
                     >
                         Review Team {opponentTeam?.name || ''}
                     </button>
                      <button
                         onClick={handleExitChat}
                         style={{ width: '100%', marginBottom: '15px', background: '#dc3545', color: 'white' }}
                         disabled={!selectedMatch || isExitingChat}
                         title="Leave this chat conversation"
                      >
                         {isExitingChat ? 'Exiting...' : 'Exit Chat'}
                      </button>

                    <h5>Members</h5>
                    <ul>
                        {members.map(member => (
                             <li key={member._id} style={{ marginBottom: '5px' }}>
                                 {/* Link to user profile OR start private chat */}
                                 {/* <Link to={`/users/${member._id}`}>{member.name}</Link> */}
                                 <span
                                    style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                                    onClick={() => {
                                        // Ensure onSelectPrivateChat is a function before calling
                                        if (typeof onSelectPrivateChat === 'function') {
                                            // Pass the member's ID, name, and the current selectedMatch ID as matchIdContext
                                            onSelectPrivateChat({ _id: member._id, name: member.name, matchIdContext: selectedMatch?._id });
                                        } else {
                                            console.error("onSelectPrivateChat prop is not a function.");
                                        }
                                    }}
                                 >
                                    {member.name}
                                 </span>
                             </li>
                        ))}
                    </ul>

                    {/* Display Scheduled Meeting */}
                    <h5 style={{ marginTop: '20px' }}>Scheduled Meeting</h5>
                    {(() => {
                        const scheduledMeeting = meetingProposals?.find(p => p.status === 'scheduled');
                        if (scheduledMeeting && scheduledMeeting.scheduledSlot) {
                            return (
                                <div style={{ fontSize: '0.9em', marginBottom: '10px', border: '1px solid lightgreen', padding: '5px', background: '#e9f5e9' }}>
                                    <strong>Status: Scheduled</strong><br />
                                    Location: {scheduledMeeting.location}<br />
                                    Time: {new Date(scheduledMeeting.scheduledSlot.startTime).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})} - {new Date(scheduledMeeting.scheduledSlot.endTime).toLocaleTimeString([], {timeStyle: 'short'})}
                                    <button
                                        onClick={() => handleCancelMeeting(scheduledMeeting._id)}
                                        disabled={respondingMeetingId === scheduledMeeting._id}
                                        style={{ fontSize: '0.8em', padding: '2px 5px', background: 'orange', marginLeft: '10px', display: 'block', marginTop: '5px' }}
                                    >
                                        Cancel Meeting
                                    </button>
                                </div>
                            );
                        } else {
                            return <p style={{ fontSize: '0.9em' }}>No meeting currently scheduled.</p>;
                        }
                    })()}

                    {/* Display Meeting Proposals (Only if no meeting is scheduled) */}
                    {!(meetingProposals?.some(p => p.status === 'scheduled')) && (
                        <>
                            <h5 style={{ marginTop: '20px' }}>Meeting Proposals</h5>
                            {meetingProposals && meetingProposals.filter(p => p.status === 'proposed').length > 0 ? (
                                <ul>
                                    {meetingProposals.filter(p => p.status === 'proposed').map(proposal => (
                                        <li key={proposal._id} style={{ fontSize: '0.9em', marginBottom: '10px', border: '1px solid #eee', padding: '5px' }}>
                                            Proposed by: {proposal.proposer?.name || 'Unknown'} <br />
                                            Location: {proposal.location} <br />
                                            {proposal.description && <>Description: {proposal.description}<br /></>}
                                            Proposed Slots:
                                            <ul>
                                                {proposal.proposedSlots.map((slot, index) => {
                                                    const myResponse = proposal.responses?.find(r => r.userId === user?._id);
                                                    const isAcceptedByMe = myResponse?.status === 'accepted' && myResponse?.acceptedSlotIndex === index;
                                                    const isRejectedByMe = myResponse?.status === 'rejected';
                                                    return (
                                                        <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                                            <span>
                                                                {new Date(slot.startTime).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})} - {new Date(slot.endTime).toLocaleTimeString([], {timeStyle: 'short'})}
                                                            </span>
                                                            {!isRejectedByMe && (
                                                                <button
                                                                    onClick={() => handleRespond(proposal._id, index, 'accepted')}
                                                                    disabled={respondingMeetingId === proposal._id}
                                                                    style={{ fontSize: '0.8em', padding: '2px 5px', background: isAcceptedByMe ? 'darkgreen' : 'lightgreen', marginLeft: '5px' }}
                                                                >
                                                                    {isAcceptedByMe ? 'Accepted' : 'Accept'}
                                                                </button>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                             {!proposal.responses?.some(r => r.userId === user?._id) && (
                                                 <button
                                                    onClick={() => handleRespond(proposal._id, -1, 'rejected')}
                                                    disabled={respondingMeetingId === proposal._id}
                                                    style={{ fontSize: '0.8em', padding: '2px 5px', background: 'lightcoral', marginTop: '5px' }}
                                                >
                                                    Reject All Slots
                                                </button>
                                             )}
                                             <button
                                                onClick={() => handleCancelMeeting(proposal._id)}
                                                disabled={respondingMeetingId === proposal._id}
                                                style={{ fontSize: '0.8em', padding: '2px 5px', background: 'orange', display: 'block', marginTop: '5px' }}
                                            >
                                                Cancel Proposal
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ fontSize: '0.9em' }}>No active meeting proposals.</p>
                            )}
                        </>
                    )}
                </>
            ) : (
                <p>Select a chat to see group info.</p>
            )}

            {isScheduleModalOpen && selectedMatch && (
                <ScheduleMeetingModal
                    matchId={selectedMatch._id}
                    onClose={() => setIsScheduleModalOpen(false)}
                    onMeetingProposed={(proposedMeeting) => {
                        console.log('Meeting proposed:', proposedMeeting);
                        alert('Meeting proposed successfully!');
                        // TODO: Add proposedMeeting to meetingProposals state locally or refetch
                    }}
                />
            )}

             {isReviewModalOpen && selectedMatch && userTeam && opponentTeam && (
                <SubmitReviewModal
                    match={selectedMatch}
                    userTeam={userTeam}
                    opponentTeam={opponentTeam}
                    onClose={() => setIsReviewModalOpen(false)}
                    onReviewSubmitted={(submittedReview) => {
                        console.log('Review submitted:', submittedReview);
                    }}
                />
            )}
        </div>
    );
};

export default GroupInfo;
