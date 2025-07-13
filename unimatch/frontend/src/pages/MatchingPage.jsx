import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { SparkIcon, GroupsIcon, CoupleIcon, UniversityIcon, DateIcon } from '../components/ui/SocialIcons';
import { UNIVERSITIES } from '../constants/universities';
import { SearchIcon, FilterIcon } from '../components/ui/Icons';
import useDebounce from '../hooks/useDebounce';
import { useToast } from '../components/Toast';

const MatchingPage = () => {
    const { user } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();
    const [myTeams, setMyTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [allTeams, setAllTeams] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [teamMatches, setTeamMatches] = useState([]);
    const [loadingMyTeams, setLoadingMyTeams] = useState(true);
    const [loadingAllTeams, setLoadingAllTeams] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [sendingRequest, setSendingRequest] = useState(null);
    const [error, setError] = useState('');
    
    // Filter states
    const [universityFilter, setUniversityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // Debounced search
    const debouncedSearch = useDebounce(searchFilter, 300);

    // Create refresh function for join requests
    const refreshJoinRequests = useCallback(async () => {
        if (!selectedTeamId) {
            setJoinRequests([]);
            return;
        }

        setLoadingRequests(true);
        
        try {
            // Fetch both incoming and outgoing join requests
            const [incomingRes, outgoingRes] = await Promise.all([
                api.get('/join-requests/my-teams'),
                api.get('/join-requests/my-requests')
            ]);
            
            console.log("Incoming join requests:", incomingRes.data);
            console.log("Outgoing join requests:", outgoingRes.data);
            
            // Transform the data to match the expected structure
            // Note: Join requests are from individual users, not teams
            const incomingData = Array.isArray(incomingRes.data) ? incomingRes.data : [];
            const outgoingData = Array.isArray(outgoingRes.data) ? outgoingRes.data : [];
            
            const transformedRequests = [
                ...incomingData.filter(req => req && req._id).map(req => ({
                    ...req,
                    type: 'incoming',
                    // Keep original structure for incoming requests
                })),
                ...outgoingData.filter(req => req && req._id).map(req => ({
                    ...req,
                    type: 'outgoing',
                    // Keep original structure for outgoing requests
                }))
            ];
            
            setJoinRequests(transformedRequests);
        } catch (err) {
            console.error("Error fetching join requests:", err);
            showError('Failed to fetch join requests');
            setJoinRequests([]);
        } finally {
            setLoadingRequests(false);
        }
    }, [selectedTeamId, showError]);

    // Create refresh function for team matches
    const refreshTeamMatches = useCallback(async () => {
        if (!selectedTeamId) {
            setTeamMatches([]);
            return;
        }

        setLoadingMatches(true);
        
        try {
            // Fetch team matches for the selected team
            const response = await api.get(`/matches/team/${selectedTeamId}`);
            console.log("Team matches:", response.data);
            
            // Transform matches to include type information
            const matchesData = Array.isArray(response.data) ? response.data : [];
            const transformedMatches = matchesData.filter(match => match && match.receivingTeam && match.requestingTeam).map(match => {
                const isIncoming = match.receivingTeam?._id === selectedTeamId;
                const isOutgoing = match.requestingTeam?._id === selectedTeamId;
                
                return {
                    ...match,
                    type: isIncoming ? 'incoming' : 'outgoing',
                    otherTeam: isIncoming ? match.requestingTeam : match.receivingTeam
                };
            });
            
            setTeamMatches(transformedMatches);
        } catch (err) {
            console.error("Error fetching team matches:", err);
            showError('Failed to fetch team matches');
            setTeamMatches([]);
        } finally {
            setLoadingMatches(false);
        }
    }, [selectedTeamId, showError]);

    // Create refresh function for discoverable teams
    const refreshDiscoverableTeams = useCallback(async () => {
        setLoadingAllTeams(true);
        setError('');
        
        try {
            const params = new URLSearchParams();
            if (universityFilter) params.append('university', universityFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (debouncedSearch) params.append('search', debouncedSearch);
            
            const response = await api.get(`/teams/all-discoverable?${params.toString()}`);
            console.log("All discoverable teams response:", response.data);
            setAllTeams(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching all teams:", err);
            setError(err.response?.data?.message || 'Failed to fetch teams.');
            setAllTeams([]);
        } finally {
            setLoadingAllTeams(false);
        }
    }, [universityFilter, statusFilter, debouncedSearch]);

    // Create refresh function for user's teams
    const refreshMyTeams = useCallback(async () => {
        setLoadingMyTeams(true);
        setError('');
        try {
            const res = await api.get('/teams/my-teams');
            console.log("My teams response:", res.data);
            setMyTeams(Array.isArray(res.data) ? res.data : []);
            if (res.data.length > 0 && res.data[0] && res.data[0]._id) {
                // Only update selectedTeamId if it's not already set or if current selection is invalid
                if (!selectedTeamId || !res.data.find(team => team._id === selectedTeamId)) {
                    setSelectedTeamId(res.data[0]._id);
                    console.log("Auto-selected team:", res.data[0]._id, res.data[0].name);
                }
            }
        } catch (err) {
            console.error("Error fetching user's teams:", err);
            setError(err.response?.data?.message || 'Failed to fetch your teams.');
        } finally {
            setLoadingMyTeams(false);
        }
    }, [selectedTeamId]);

    // Fetch user's teams on mount
    useEffect(() => {
        refreshMyTeams();
    }, [refreshMyTeams]);

    // Fetch all discoverable teams
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchAllTeams = async () => {
            setLoadingAllTeams(true);
            setError('');
            
            try {
                const params = new URLSearchParams();
                if (universityFilter) params.append('university', universityFilter);
                if (statusFilter) params.append('status', statusFilter);
                if (debouncedSearch) params.append('search', debouncedSearch);
                
                const response = await api.get(`/teams/all-discoverable?${params.toString()}`, { signal: controller.signal });
                if (isMounted) {
                    console.log("All discoverable teams response:", response.data);
                    setAllTeams(Array.isArray(response.data) ? response.data : []);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && isMounted) {
                    console.error("Error fetching all teams:", err);
                    setError(err.response?.data?.message || 'Failed to fetch teams.');
                    setAllTeams([]);
                }
            } finally {
                if (isMounted) {
                    setLoadingAllTeams(false);
                }
            }
        };

        fetchAllTeams();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [universityFilter, statusFilter, debouncedSearch]);

    // Fetch join requests when selectedTeamId changes
    useEffect(() => {
        refreshJoinRequests();
    }, [refreshJoinRequests]);

    // Fetch team matches when selectedTeamId changes
    useEffect(() => {
        refreshTeamMatches();
    }, [refreshTeamMatches]);

    // Set up periodic refresh of user's teams to catch membership changes
    useEffect(() => {
        const interval = setInterval(() => {
            // Only refresh if not currently loading
            if (!loadingMyTeams) {
                refreshMyTeams();
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [refreshMyTeams, loadingMyTeams]);

    // Listen for team membership changes from other components
    useEffect(() => {
        const handleTeamMembershipChange = (event) => {
            const { action, teamId, teamName } = event.detail;
            console.log(`Team membership changed: ${action} team ${teamName} (${teamId})`);
            
            // Refresh user's teams and related data
            refreshMyTeams();
            refreshJoinRequests();
            refreshDiscoverableTeams();
        };

        window.addEventListener('teamMembershipChanged', handleTeamMembershipChange);
        
        return () => {
            window.removeEventListener('teamMembershipChanged', handleTeamMembershipChange);
        };
    }, [refreshMyTeams, refreshJoinRequests, refreshDiscoverableTeams]);

    // Filter join requests for display (memoized for performance)
    // IMPORTANT: These hooks must be called before any early returns to avoid hook order violations
    const incomingPending = useMemo(() => {
        const joinRequestsIncoming = joinRequests?.filter(req =>
            req.type === 'incoming' &&
            req.status === 'pending' &&
            req.team?._id === selectedTeamId
        ) || [];
        
        const teamMatchesIncoming = teamMatches?.filter(match =>
            match.type === 'incoming' &&
            match.status === 'pending'
        ) || [];
        
        return [...joinRequestsIncoming, ...teamMatchesIncoming];
    }, [joinRequests, teamMatches, selectedTeamId]);
    
    const outgoingPending = useMemo(() => {
        const joinRequestsOutgoing = joinRequests?.filter(req =>
            req.type === 'outgoing' &&
            req.status === 'pending'
        ) || [];
        
        const teamMatchesOutgoing = teamMatches?.filter(match =>
            match.type === 'outgoing' &&
            match.status === 'pending'
        ) || [];
        
        return [...joinRequestsOutgoing, ...teamMatchesOutgoing];
    }, [joinRequests, teamMatches]);
    
    const acceptedMatches = useMemo(() => {
        const joinRequestsAccepted = joinRequests?.filter(req => {
            // Only show approved requests, exclude 'left' status
            if (req.status !== 'approved') return false;
            
            // For outgoing requests (user joined a team), check if user is still a member
            if (req.type === 'outgoing') {
                return myTeams.some(team => team._id === req.team?._id);
            }
            
            // For incoming requests (someone joined user's team), check if they're still a member
            if (req.type === 'incoming') {
                // Find the team and check if the applicant is still a member
                const team = myTeams.find(team => team._id === req.team?._id);
                if (team) {
                    return team.members?.some(member => member._id === req.applicant?._id);
                }
                return false;
            }
            
            return true;
        }) || [];
        
        const teamMatchesAccepted = teamMatches?.filter(match =>
            match.status === 'accepted'
        ) || [];
        
        return [...joinRequestsAccepted, ...teamMatchesAccepted];
    }, [joinRequests, teamMatches, myTeams]);

    const handleSendJoinRequest = useCallback(async (teamId) => {
        setError('');
        setSendingRequest(teamId);
        
        try {
            const response = await api.post(`/join-requests`, { teamId });
            console.log('Join request sent successfully:', response.data);
            
            // Refresh both teams and join requests
            await Promise.all([
                refreshDiscoverableTeams(),
                refreshJoinRequests()
            ]);
            
            // Show success message
            setError(''); // Clear any previous errors
            showSuccess('Join request sent successfully!');
            
        } catch (err) {
            console.error("Error sending join request:", err);
            console.error("Error response:", err.response?.data);
            const errorMessage = err.response?.data?.message || 'Failed to send join request.';
            setError(errorMessage);
        } finally {
            setSendingRequest(null);
        }
    }, [refreshDiscoverableTeams, refreshJoinRequests]);

    const handleSendTeamMatchRequest = useCallback(async (targetTeamId) => {
        setError('');
        setSendingRequest(targetTeamId);
        
        try {
            const response = await api.post(`/matches`, { 
                requestingTeamId: selectedTeamId,
                receivingTeamId: targetTeamId
            });
            console.log('Team match request sent successfully:', response.data);
            
            // Refresh teams, join requests, and team matches
            await Promise.all([
                refreshDiscoverableTeams(),
                refreshJoinRequests(),
                refreshTeamMatches()
            ]);
            
            // Show success message
            showSuccess('Team match request sent successfully!');
            
        } catch (err) {
            console.error("Error sending team match request:", err);
            console.error("Error response:", err.response?.data);
            const errorMessage = err.response?.data?.message || 'Failed to send team match request.';
            setError(errorMessage);
        } finally {
            setSendingRequest(null);
        }
    }, [selectedTeamId, refreshDiscoverableTeams, refreshJoinRequests, refreshTeamMatches]);

    const [actionLoading, setActionLoading] = useState({
        accepting: null,
        rejecting: null,
        cancelling: null
    });

    const handleRespondRequest = useCallback(async (requestId, response) => {
        setError('');
        
        // Set loading state
        if (response === 'accepted') {
            setActionLoading(prev => ({ ...prev, accepting: requestId }));
        } else {
            setActionLoading(prev => ({ ...prev, rejecting: requestId }));
        }
        
        try {
            const status = response === 'accepted' ? 'approved' : 'rejected';
            await api.put(`/join-requests/${requestId}`, { status });
            
            // Refresh multiple data sources after approval
            await Promise.all([
                refreshJoinRequests(),
                refreshDiscoverableTeams(), // Refresh discoverable teams to update membership
                // Note: We don't refresh myTeams here because the approver is not the one joining
            ]);
            
            showSuccess(`Join request ${response}!`);
        } catch (err) {
            console.error(`Error responding to join request (${response}):`, err);
            showError(err.response?.data?.message || `Failed to ${response} join request.`);
        } finally {
            // Clear loading state
            if (response === 'accepted') {
                setActionLoading(prev => ({ ...prev, accepting: null }));
            } else {
                setActionLoading(prev => ({ ...prev, rejecting: null }));
            }
        }
    }, [refreshJoinRequests, refreshDiscoverableTeams, showSuccess, showError]);

    const handleCancelRequest = useCallback(async (requestId) => {
        setError('');
        if (!window.confirm('Are you sure you want to cancel this pending request?')) return;
        
        setActionLoading(prev => ({ ...prev, cancelling: requestId }));
        
        try {
            await api.delete(`/join-requests/${requestId}`);
            
            // Refresh join requests properly
            await refreshJoinRequests();
            
            showInfo('Join request cancelled.');
        } catch (err) {
            console.error("Error cancelling join request:", err);
            showError(err.response?.data?.message || 'Failed to cancel join request.');
        } finally {
            setActionLoading(prev => ({ ...prev, cancelling: null }));
        }
    }, [refreshJoinRequests, showInfo, showError]);

    const handleRespondTeamMatch = useCallback(async (matchId, response) => {
        setError('');
        
        // Set loading state
        if (response === 'accepted') {
            setActionLoading(prev => ({ ...prev, accepting: matchId }));
        } else {
            setActionLoading(prev => ({ ...prev, rejecting: matchId }));
        }
        
        try {
            await api.put(`/matches/${matchId}/respond`, { response });
            
            // Refresh both join requests and team matches
            await Promise.all([
                refreshJoinRequests(),
                refreshTeamMatches()
            ]);
            
            showSuccess(`Team match ${response}!`);
        } catch (err) {
            console.error(`Error responding to team match (${response}):`, err);
            showError(err.response?.data?.message || `Failed to ${response} team match.`);
        } finally {
            // Clear loading state
            if (response === 'accepted') {
                setActionLoading(prev => ({ ...prev, accepting: null }));
            } else {
                setActionLoading(prev => ({ ...prev, rejecting: null }));
            }
        }
    }, [refreshJoinRequests, refreshTeamMatches, showSuccess, showError]);

    const handleCancelTeamMatch = useCallback(async (matchId) => {
        setError('');
        if (!window.confirm('Are you sure you want to cancel this team match request?')) return;
        
        setActionLoading(prev => ({ ...prev, cancelling: matchId }));
        
        try {
            await api.delete(`/matches/${matchId}/cancel`);
            
            // Refresh both join requests and team matches
            await Promise.all([
                refreshJoinRequests(),
                refreshTeamMatches()
            ]);
            
            showInfo('Team match request cancelled.');
        } catch (err) {
            console.error("Error cancelling team match:", err);
            showError(err.response?.data?.message || 'Failed to cancel team match request.');
        } finally {
            setActionLoading(prev => ({ ...prev, cancelling: null }));
        }
    }, [refreshJoinRequests, refreshTeamMatches, showInfo, showError]);

    if (loadingMyTeams) {
        return (
            <div className="bg-neutral-50 min-h-screen">
                <div className="container py-16">
                    <div className="text-center animate-fade-in">
                        <div className="flex justify-center mb-6">
                            <div className="bg-neutral-200 rounded-full p-6">
                                <SparkIcon className="text-neutral-500" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Loading your teams...</h2>
                        <p className="text-neutral-600">Please wait while we fetch your data</p>
                    </div>
                </div>
            </div>
        );
    }

    if (myTeams.length === 0) {
        return (
            <div className="bg-neutral-50 min-h-screen">
                <div className="container py-16">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-gradient-friendship rounded-full p-6">
                                <GroupsIcon className="text-white" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Join a Team First</h2>
                        <p className="text-neutral-600 mb-6">You need to be part of a team to find matches with other university groups.</p>
                        <Link to="/teams" className="btn btn-primary">
                            <GroupsIcon className="mr-2" size={16} />
                            Go to Teams
                        </Link>
                    </div>
                </div>
            </div>
        );
    }



  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-love rounded-full p-4">
              <SparkIcon className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-neutral-800 mb-4 font-family-heading">
            Find Your <span className="text-gradient">Perfect Match</span> 💕
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Connect your team with amazing groups from other universities
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error p-4 rounded-lg mb-6 animate-slide-up">
            {error}
          </div>
        )}

        {/* Team Selector */}
        <div className="card mb-8 animate-slide-up">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-neutral-800 flex items-center">
              <GroupsIcon className="mr-2" size={20} />
              Select Your Team
            </h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="teamSelect" className="form-label">Choose which team to find matches for:</label>
              <select
                id="teamSelect"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={loadingAllTeams || loadingRequests}
                className="form-input"
              >
                {myTeams.filter(team => team && team._id).map(team => (
                  <option key={team._id} value={team._id}>{team.name || 'Unnamed Team'} - {team.university || 'Unknown University'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Find New Matches Section */}
        <div className="card mb-8 animate-slide-up">
          <div className="card-header">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-neutral-800 flex items-center">
                  <CoupleIcon className="mr-2" size={20} />
                  Find New Matches
                </h2>
                <p className="text-sm text-neutral-500 mt-1">Discover and send invitations to any group</p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline btn-sm"
              >
                <FilterIcon className="mr-2" size={16} />
                Filters
              </button>
            </div>
            
            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-neutral-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label text-sm">Search Teams</label>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by name, description..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="form-input pl-10"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-sm">University</label>
                    <select
                      value={universityFilter}
                      onChange={(e) => setUniversityFilter(e.target.value)}
                      className="form-input"
                    >
                      <option value="">All Universities</option>
                      {UNIVERSITIES.map(uni => (
                        <option key={uni} value={uni}>{uni}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-sm">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="form-input"
                    >
                      <option value="">All Statuses</option>
                      <option value="forming">Forming</option>
                      <option value="active">Active</option>
                      <option value="matched">Matched</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setUniversityFilter('');
                      setStatusFilter('');
                      setSearchFilter('');
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    Clear Filters
                  </button>
                  <span className="text-sm text-neutral-500 flex items-center">
                    {loadingAllTeams ? 'Loading...' : `${allTeams.length} teams found`}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="card-body">
            {loadingAllTeams ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-neutral-200 rounded-full p-4">
                    <SparkIcon className="text-neutral-500" size={32} />
                  </div>
                </div>
                <p className="text-neutral-600">Loading teams...</p>
              </div>
            ) : allTeams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allTeams.filter(team => team && team._id).map(team => (
                      <div key={team._id} className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="card-body p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-sunset rounded-full flex items-center justify-center text-white font-bold">
                              {team.name ? team.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="flex-1">
                              <Link to={`/teams/${team._id}`} className="hover:underline">
                                <h3 className="text-lg font-semibold text-neutral-800 hover:text-primary-rose transition-colors">
                                  {team.name || 'Unnamed Team'}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="badge badge-primary">{team.university}</span>
                                <span className={`badge ${
                                  team.status === 'active' ? 'badge-success' :
                                  team.status === 'forming' ? 'badge-warning' :
                                  team.status === 'matched' ? 'badge-info' :
                                  'badge-outline'
                                }`}>
                                  {team.status}
                                </span>
                                {team.teamGender && (
                                  <span className="badge badge-outline">{team.teamGender}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-neutral-600 mb-4 line-clamp-2">
                            {team.description || 'No description available'}
                          </p>
                          
                          <div className="mb-4">
                            <h4 className="font-medium text-neutral-700 mb-2 flex items-center gap-1">
                              <GroupsIcon size={14} />
                              Members ({team.members?.length || 0}):
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {team.members?.filter(member => member && member._id && member.name).length > 0 ? (
                                team.members.filter(member => member && member._id && member.name).map(member => (
                                  <Link 
                                    key={member._id} 
                                    to={`/users/${member._id}`}
                                    className="badge badge-outline text-xs hover:bg-primary-light transition-colors"
                                  >
                                    {member.name}
                                  </Link>
                                ))
                              ) : (
                                <span className="text-sm text-neutral-400">No members listed</span>
                              )}
                            </div>
                          </div>

                          {/* Team Details */}
                          {(team.teamVibe?.length > 0 || team.topInterests?.length > 0) && (
                            <div className="mb-4 space-y-2">
                              {team.teamVibe?.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-1">Vibe</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {team.teamVibe.slice(0, 2).map(vibe => (
                                      <span key={vibe} className="badge badge-secondary text-xs">{vibe}</span>
                                    ))}
                                    {team.teamVibe.length > 2 && (
                                      <span className="badge badge-outline text-xs">+{team.teamVibe.length - 2}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {team.topInterests?.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-1">Interests</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {team.topInterests.slice(0, 3).map(interest => (
                                      <span key={interest} className="badge badge-primary text-xs">{interest}</span>
                                    ))}
                                    {team.topInterests.length > 3 && (
                                      <span className="badge badge-outline text-xs">+{team.topInterests.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Link 
                              to={`/teams/${team._id}`}
                              className="btn btn-outline flex-1"
                            >
                              View Profile
                            </Link>
                            <div className="flex flex-col gap-1 flex-1">
                              <button 
                                onClick={() => handleSendJoinRequest(team._id)}
                                className="btn btn-primary btn-sm"
                                disabled={sendingRequest === team._id || loadingAllTeams}
                              >
                                <SparkIcon className="mr-2" size={14} />
                                {sendingRequest === team._id ? 'Sending...' : 'Join Team'}
                              </button>
                              <button 
                                onClick={() => handleSendTeamMatchRequest(team._id)}
                                className="btn btn-secondary btn-sm"
                                disabled={sendingRequest === team._id || loadingAllTeams}
                              >
                                <CoupleIcon className="mr-2" size={14} />
                                {sendingRequest === team._id ? 'Sending...' : 'Team Match'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                      <CoupleIcon className="text-neutral-400" size={32} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Teams Found</h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-4">
                    No teams match your current filters. Try adjusting your search criteria or clearing filters to see more teams.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-blue-800 text-sm">
                      <strong>Tip:</strong> Use the filters above to search by university, status, or team name to find specific groups!
                    </p>
                  </div>
                </div>
              )
            }
          </div>
        </div>

        {/* Match Requests Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Incoming Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <DateIcon className="mr-2" size={18} />
                Incoming Requests
              </h3>
              <span className="badge badge-primary">{incomingPending.length}</span>
            </div>
            <div className="card-body">
              {loadingRequests || loadingMatches ? (
                <div className="text-center py-4">
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : incomingPending.length > 0 ? (
                <div className="space-y-4">
                  {incomingPending.filter(request => request && request._id).map(request => {
                    // Check if this is a join request or team match request
                    const isJoinRequest = request.applicant !== undefined;
                    const isTeamMatch = request.requestingTeam !== undefined;
                    
                    if (isJoinRequest) {
                      // Render join request
                      return (
                        <div key={request._id} className="bg-neutral-50 p-4 rounded-lg">
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="badge badge-blue text-xs">Individual Request</span>
                            </div>
                            <Link to={`/users/${request.applicant?._id}`} className="hover:underline">
                              <h4 className="font-semibold text-neutral-800 hover:text-primary-rose">
                                {request.applicant?.name || 'Unknown User'}
                              </h4>
                            </Link>
                            <p className="text-sm text-neutral-500">{request.applicant?.university}</p>
                            {request.message && (
                              <p className="text-sm text-neutral-600 mt-1 italic">
                                "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-neutral-400 mt-2">
                              Wants to join: <span className="font-medium">{request.team?.name || 'Unnamed Team'}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleRespondRequest(request._id, 'accepted')}
                              className="btn btn-success btn-sm flex-1"
                              disabled={actionLoading.accepting === request._id || actionLoading.rejecting === request._id}
                            >
                              {actionLoading.accepting === request._id ? 'Accepting...' : 'Accept'}
                            </button>
                            <button 
                              onClick={() => handleRespondRequest(request._id, 'rejected')}
                              className="btn btn-error btn-sm flex-1"
                              disabled={actionLoading.accepting === request._id || actionLoading.rejecting === request._id}
                            >
                              {actionLoading.rejecting === request._id ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      );
                                          } else if (isTeamMatch) {
                        // Render team match request
                        return (
                          <div key={request._id} className="bg-blue-50 p-4 rounded-lg">
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-info text-xs">Team Match Request</span>
                              </div>
                              <Link to={`/teams/${request.otherTeam?._id}`} className="hover:underline">
                                <h4 className="font-semibold text-neutral-800 hover:text-primary-rose">
                                  {request.otherTeam?.name || 'Unnamed Team'}
                                </h4>
                              </Link>
                              <p className="text-sm text-neutral-500">{request.otherTeam?.university}</p>
                              <p className="text-xs text-neutral-400 mt-2">
                                Wants to match with: <span className="font-medium">{request.receivingTeam?.name || 'Unnamed Team'}</span>
                              </p>
                            <p className="text-xs text-neutral-400">
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleRespondTeamMatch(request._id, 'accepted')}
                              className="btn btn-success btn-sm flex-1"
                              disabled={actionLoading.accepting === request._id || actionLoading.rejecting === request._id}
                            >
                              {actionLoading.accepting === request._id ? 'Accepting...' : 'Accept Match'}
                            </button>
                            <button 
                              onClick={() => handleRespondTeamMatch(request._id, 'rejected')}
                              className="btn btn-error btn-sm flex-1"
                              disabled={actionLoading.accepting === request._id || actionLoading.rejecting === request._id}
                            >
                              {actionLoading.rejecting === request._id ? 'Rejecting...' : 'Reject Match'}
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No incoming requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Outgoing Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <SparkIcon className="mr-2" size={18} />
                Outgoing Requests
              </h3>
              <span className="badge badge-secondary">{outgoingPending.length}</span>
            </div>
            <div className="card-body">
              {loadingRequests || loadingMatches ? (
                <div className="text-center py-4">
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : outgoingPending.length > 0 ? (
                <div className="space-y-4">
                  {outgoingPending.filter(request => request && request._id).map(request => {
                    // Check if this is a join request or team match request
                    const isJoinRequest = request.applicant !== undefined;
                    const isTeamMatch = request.requestingTeam !== undefined;
                    
                    if (isJoinRequest) {
                      // Render join request
                      return (
                        <div key={request._id} className="bg-neutral-50 p-4 rounded-lg">
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="badge badge-blue text-xs">Individual Request</span>
                            </div>
                            <Link to={`/teams/${request.team?._id}`} className="hover:underline">
                              <h4 className="font-semibold text-neutral-800 hover:text-primary-rose">
                                {request.team?.name || 'Unnamed Team'}
                              </h4>
                            </Link>
                            <p className="text-sm text-neutral-500">{request.team?.university}</p>
                            {request.message && (
                              <p className="text-sm text-neutral-600 mt-1 italic">
                                Your message: "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1">
                              Status: <span className="font-medium capitalize">{request.status}</span>
                            </p>
                          </div>
                          <button 
                            onClick={() => handleCancelRequest(request._id)}
                            className="btn btn-outline btn-sm w-full"
                            disabled={actionLoading.cancelling === request._id}
                          >
                            {actionLoading.cancelling === request._id ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        </div>
                      );
                                          } else if (isTeamMatch) {
                        // Render team match request
                        return (
                          <div key={request._id} className="bg-blue-50 p-4 rounded-lg">
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-info text-xs">Team Match Request</span>
                              </div>
                              <Link to={`/teams/${request.otherTeam?._id}`} className="hover:underline">
                                <h4 className="font-semibold text-neutral-800 hover:text-primary-rose">
                                  {request.otherTeam?.name || 'Unnamed Team'}
                                </h4>
                              </Link>
                              <p className="text-sm text-neutral-500">{request.otherTeam?.university}</p>
                              <p className="text-xs text-neutral-400 mt-1">
                                Status: <span className="font-medium capitalize">{request.status}</span>
                              </p>
                            <p className="text-xs text-neutral-400">
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleCancelTeamMatch(request._id)}
                            className="btn btn-outline btn-sm w-full"
                            disabled={actionLoading.cancelling === request._id}
                          >
                            {actionLoading.cancelling === request._id ? 'Cancelling...' : 'Cancel Match Request'}
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No outgoing requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Successful Joins */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <CoupleIcon className="mr-2" size={18} />
                Successful Joins
              </h3>
              <span className="badge badge-success">{acceptedMatches.length}</span>
            </div>
            <div className="card-body">
              {loadingRequests ? (
                <div className="text-center py-4">
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : acceptedMatches.length > 0 ? (
                <div className="space-y-4">
                  {acceptedMatches.filter(request => request && request._id).map(request => {
                    // Determine what to display based on request type
                    const displayInfo = request.type === 'outgoing' 
                      ? { 
                          name: request.team?.name || 'Unnamed Team', 
                          id: request.team?._id,
                          subtitle: `You joined ${request.team?.name || 'Unnamed Team'}`,
                          link: `/teams/${request.team?._id}`
                        }
                      : { 
                          name: request.applicant?.name || 'Unknown User', 
                          id: request.applicant?._id,
                          subtitle: `${request.applicant?.name || 'Unknown User'} joined ${request.team?.name || 'Unnamed Team'}`,
                          link: `/users/${request.applicant?._id}`
                        };

                    return (
                      <div key={request._id} className="bg-green-50 p-4 rounded-lg">
                        <div className="mb-3">
                          <Link to={displayInfo.link} className="hover:underline">
                            <h4 className="font-semibold text-green-800 hover:text-green-600">
                              {displayInfo.name}
                            </h4>
                          </Link>
                          <p className="text-xs text-green-600 mt-1">
                            {displayInfo.subtitle}
                          </p>
                          <p className="text-xs text-green-500 mt-1">
                            Approved on {new Date(request.reviewedAt || request.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {request.type === 'outgoing' ? (
                          <Link 
                            to={`/teams/${request.team?._id}`}
                            className="btn btn-primary btn-sm w-full"
                          >
                            View Team
                          </Link>
                        ) : (
                          <Link 
                            to={`/teams/${request.team?._id}`}
                            className="btn btn-primary btn-sm w-full"
                          >
                            Manage Team
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No successful joins yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Match Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <CoupleIcon className="mr-2" size={18} />
                Team Matches
              </h3>
              <span className="badge badge-info">{acceptedMatches.filter(req => req.requestingTeam !== undefined).length}</span>
            </div>
            <div className="card-body">
              {loadingRequests || loadingMatches ? (
                <div className="text-center py-4">
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : acceptedMatches.filter(req => req.requestingTeam !== undefined).length > 0 ? (
                <div className="space-y-4">
                  {acceptedMatches.filter(req => req && req._id && req.requestingTeam !== undefined).map(match => (
                    <div key={match._id} className="bg-green-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Link to={`/teams/${match.otherTeam?._id}`} className="hover:underline">
                          <h4 className="font-semibold text-green-800 hover:text-green-600">
                            {match.otherTeam?.name || 'Unnamed Team'}
                          </h4>
                        </Link>
                        <p className="text-xs text-green-600 mt-1">
                          Team match with {match.otherTeam?.name || 'Unnamed Team'}
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          Matched on {new Date(match.respondedAt || match.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link 
                        to={`/chat`}
                        className="btn btn-primary btn-sm w-full"
                      >
                        Start Team Chat
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No team matches yet</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    Use "Team Match" buttons above to create team-to-team matches for group chat
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingPage;
