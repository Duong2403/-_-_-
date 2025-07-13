import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import AddMemberModal from '../components/AddMemberModal';
import EditTeamModal from '../components/EditTeamModal';
import { 
    PlusIcon,
    ArrowRightIcon,
    CheckIcon,
    XIcon
} from '../components/ui/Icons';
import { 
    GroupsIcon,
    CoupleIcon,
    DateIcon,
    SparkIcon,
    UniversityIcon
} from '../components/ui/SocialIcons';

// Reusable component for displaying profile information in sections
const DetailSection = ({ icon: Icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <Icon className="text-primary-rose" size={24} />
            <h3 className="text-xl font-semibold text-neutral-800">{title}</h3>
        </div>
        {children}
    </div>
);

// Reusable tag component
const InfoTag = ({ children, className = '' }) => (
    <span className={`inline-block bg-primary-light text-primary-dark font-medium px-3 py-1 rounded-full text-sm ${className}`}>
        {children}
    </span>
);


const TeamDetailPage = () => {
    const { teamId } = useParams(); // Fixed: extract 'teamId' instead of 'id'
    const { user } = useContext(AuthContext);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            if (!teamId) {
                console.error('Team ID is undefined');
                setError('Invalid team ID');
                setLoading(false);
                return;
            }
            
            console.log('Fetching team with ID:', teamId); // Debug log
            try {
                const res = await api.get(`/teams/${teamId}`); // Fixed: use teamId instead of id
                console.log('Team data received:', res.data); // Debug log
                setTeam(res.data);
            } catch (err) {
                console.error('Error fetching team:', err);
                console.error('Error details:', err.response?.data); // More detailed error logging
                setError(err.response?.data?.message || 'Failed to fetch team details.');
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, [teamId]); // Fixed: dependency array uses teamId

    const handleJoinTeam = async () => {
        setIsJoining(true);
        try {
            const res = await api.post(`/teams/${teamId}/join`); // Fixed: use teamId instead of id
            setTeam(res.data); // Update team state with new member list
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to join team.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleMemberAdded = async () => {
        // Refresh team data when a new member is added
        try {
            const res = await api.get(`/teams/${teamId}`);
            setTeam(res.data);
        } catch (err) {
            console.error('Error refreshing team data:', err);
        }
    };

    const handleEditSuccess = async (updatedTeam) => {
        setTeam(updatedTeam);
        setIsEditModalOpen(false);
    };

    const isUserMember = team?.members.some(member => member._id === user._id);
    const isUserCreator = team?.createdBy._id === user._id;

    if (loading) return <div className="text-center p-10">Loading team details...</div>;
    if (error) return <div className="text-center p-10 text-error">{error}</div>;
    if (!team) return <div className="text-center p-10">Team not found.</div>;

    return (
        <div className="bg-neutral-50 min-h-screen">
            <div className="container py-10">

                {/* Header Section */}
                <div className="relative bg-white p-8 rounded-xl shadow-md mb-8 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-love rounded-full opacity-20"></div>
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-secondary rounded-full opacity-20"></div>
                    
                    <div className="relative z-10">
                         <div className="flex justify-between items-start flex-wrap gap-4">
                            <div>
                                <Link to="/teams" className="flex items-center gap-2 text-primary-rose hover:underline mb-4">
                                    <ArrowRightIcon size={16} style={{transform: 'rotate(180deg)'}} />
                                    Back to All Groups
                                </Link>
                                <h1 className="text-4xl font-bold text-neutral-800 font-family-heading">{team.name}</h1>
                                <p className="text-neutral-600 mt-2 text-lg">{team.description}</p>
                                <div className="mt-4 flex items-center gap-4">
                                    <InfoTag><UniversityIcon className="inline mr-1.5" size={14} />{team.university}</InfoTag>
                                    <InfoTag><GroupsIcon className="inline mr-1.5" size={14} />{team.teamComposition}</InfoTag>
                                    {team.teamGender && (
                                        <InfoTag>
                                            <CoupleIcon className="inline mr-1.5" size={14} />
                                            {team.teamGender} Team
                                        </InfoTag>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isUserCreator ? (
                                    <>
                                        <button 
                                            onClick={() => setIsAddMemberModalOpen(true)}
                                            className="btn btn-primary"
                                        >
                                            <PlusIcon size={16} className="mr-2" /> Add Member
                                        </button>
                                        <button 
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="btn btn-outline"
                                        >
                                            <PlusIcon size={16} className="mr-2" /> Edit Group
                                        </button>
                                    </>
                                ) : isUserMember ? (
                                    <span className="btn btn-primary-light cursor-default">
                                        <CheckIcon size={16} className="mr-2" /> You are a member
                                    </span>
                                ) : (
                                    <button onClick={handleJoinTeam} disabled={isJoining} className="btn btn-primary">
                                        {isJoining ? 'Joining...' : <><PlusIcon size={16} className="mr-2" /> Join Group</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-8">
                        <DetailSection icon={GroupsIcon} title="Our Group's Vibe">
                           <div className="flex flex-wrap gap-3">
                                {team.teamVibe?.length > 0 ? team.teamVibe.map(vibe => (
                                    <InfoTag key={vibe}>{vibe}</InfoTag>
                                )) : <p className="text-neutral-500">Vibe not specified.</p>}
                           </div>
                        </DetailSection>

                        <DetailSection icon={DateIcon} title="Top Interests">
                            <div className="flex flex-wrap gap-3">
                                {team.topInterests?.length > 0 ? team.topInterests.map(interest => (
                                    <InfoTag key={interest}>{interest}</InfoTag>
                                )) : <p className="text-neutral-500">No interests listed.</p>}
                            </div>
                        </DetailSection>

                         <DetailSection icon={CoupleIcon} title="What We're Looking For">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-neutral-700 mb-2">Purpose</h4>
                                     <div className="flex flex-wrap gap-3">
                                        {team.meetingPurpose?.length > 0 ? team.meetingPurpose.map(purpose => (
                                            <InfoTag key={purpose}>{purpose}</InfoTag>
                                        )) : <p className="text-neutral-500">Meeting purpose not specified.</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-700 mb-2">Ideal Team Vibe</h4>
                                     <div className="flex flex-wrap gap-3">
                                        {team.targetTeamVibe?.length > 0 ? team.targetTeamVibe.map(vibe => (
                                            <InfoTag key={vibe}>{vibe}</InfoTag>
                                        )) : <p className="text-neutral-500">No preference.</p>}
                                    </div>
                                </div>
                            </div>
                        </DetailSection>
                        
                        <DetailSection icon={DateIcon} title="Logistics">
                             <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-neutral-700 mb-2">Availability</h4>
                                     <div className="flex flex-wrap gap-3">
                                        {team.availability?.length > 0 ? team.availability.map(avail => (
                                            <InfoTag key={avail}>{avail}</InfoTag>
                                        )) : <p className="text-neutral-500">Availability not specified.</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-700 mb-2">Preferred Location</h4>
                                    <InfoTag>{team.preferredLocation || 'Not specified'}</InfoTag>
                                </div>
                            </div>
                        </DetailSection>
                    </div>

                    {/* Right Column: Members */}
                    <div className="space-y-8">
                        <DetailSection icon={UniversityIcon} title="Group Members">
                            <ul className="space-y-4">
                                {team.members.map(member => (
                                    <li key={member._id} className="group flex items-center justify-between bg-neutral-50 p-3 rounded-lg hover:bg-neutral-100 transition-colors">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 bg-gradient-sunset rounded-full flex items-center justify-center text-white font-bold">
                                                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className="flex-1">
                                                <Link 
                                                    to={`/users/${member._id}`}
                                                    className="font-semibold text-neutral-800 hover:text-primary-rose transition-colors cursor-pointer"
                                                >
                                                    {member.name || 'Unknown Member'}
                                                </Link>
                                                <p className="text-sm text-neutral-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {team.createdBy._id === member._id && (
                                                <span className="badge badge-primary-light">Creator</span>
                                            )}
                                            <Link 
                                                to={`/users/${member._id}`}
                                                className="btn btn-outline btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                View Profile
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </DetailSection>
                        
                        {isUserMember && (
                             <DetailSection icon={CoupleIcon} title="Group Chat">
                                <p className="text-neutral-600 mb-4">You can chat with your group members here.</p>
                                <Link to={`/chat/team/${team._id}`} className="btn btn-secondary w-full">
                                    Go to Group Chat
                                </Link>
                             </DetailSection>
                )}
            </div>
                </div>
            </div>
            
            {/* Add Member Modal */}
            <AddMemberModal 
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                team={team}
                onMemberAdded={handleMemberAdded}
            />

            {/* Edit Team Modal */}
            <EditTeamModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                team={team}
                onEditSuccess={handleEditSuccess}
            />
        </div>
    );
};

export default TeamDetailPage;
