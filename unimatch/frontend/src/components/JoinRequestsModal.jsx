import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  XIcon,
  CheckIcon,
  UsersIcon,
  MessageIcon,
  CalendarIcon
} from './ui/Icons';
import { 
  UniversityIcon
} from './ui/SocialIcons';
import { 
  GroupsIcon,
  SparkIcon
} from './ui/SocialIcons';

const JoinRequestsModal = ({ isOpen, onClose, onRequestProcessed }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchJoinRequests();
    }
  }, [isOpen]);

  const fetchJoinRequests = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both incoming and outgoing requests
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/join-requests/my-teams'),
        api.get('/join-requests/my-requests')
      ]);
      
      setIncomingRequests(incomingRes.data);
      setOutgoingRequests(outgoingRes.data);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    console.log(`=== JOIN REQUEST ACTION ===`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Action: ${action}`);
    
    setProcessing(requestId);
    try {
      const response = await api.put(`/join-requests/${requestId}`, { status: action });
      console.log(`✅ Join request ${action} successful:`, response.data);
      
      // Remove the processed request from the incoming list
      setIncomingRequests(prev => prev.filter(req => req._id !== requestId));
      
      // If approved, emit custom event for team membership change
      if (action === 'approved' && response.data) {
        const { applicant, team } = response.data;
        console.log(`🔄 Emitting team membership change event for approval`);
        
        // Emit custom event for immediate UI updates
        window.dispatchEvent(new CustomEvent('teamMembershipChanged', {
          detail: { 
            action: 'member_approved', 
            teamId: team._id, 
            teamName: team.name,
            newMemberId: applicant._id,
            newMemberName: applicant.name
          }
        }));
      }
      
      // Call the callback to refresh parent component
      if (onRequestProcessed) {
        onRequestProcessed(action, response.data);
      }
      
      // Show success message
      const successMessage = action === 'approved' 
        ? `${response.data.applicant?.name || 'User'} has been added to ${response.data.team?.name || 'the team'}!`
        : `Join request rejected.`;
      
      // Use a more visible notification method if available
      if (window.showToast) {
        window.showToast(successMessage, action === 'approved' ? 'success' : 'info');
      } else {
        alert(successMessage);
      }
      
    } catch (err) {
      console.error(`❌ Error ${action}ing request:`, err);
      console.error('Error details:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || `Failed to ${action} request`;
      alert(errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    setProcessing(requestId);
    try {
      await api.delete(`/join-requests/${requestId}`);
      
      // Remove the cancelled request from the outgoing list
      setOutgoingRequests(prev => prev.filter(req => req._id !== requestId));
      
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <GroupsIcon className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-800">Join Requests</h2>
                <p className="text-sm text-neutral-500">
                  {incomingRequests.length} incoming, {outgoingRequests.length} outgoing
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'incoming'
                  ? 'border-primary-rose text-primary-rose'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Incoming Requests ({incomingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'outgoing'
                  ? 'border-primary-rose text-primary-rose'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Outgoing Requests ({outgoingRequests.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary-rose border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading join requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-error bg-opacity-10 border border-error text-error p-4 rounded-lg">
                {error}
              </div>
            </div>
          ) : activeTab === 'incoming' ? (
            incomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparkIcon className="text-neutral-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Incoming Requests</h3>
                <p className="text-neutral-600">
                  You don't have any pending join requests for your teams.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map(request => (
                <div key={request._id} className="border border-neutral-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-friendship rounded-full flex items-center justify-center">
                        <UsersIcon className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-800">{request.applicant.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <UniversityIcon size={14} />
                          <span>{request.applicant.university}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <CalendarIcon size={14} />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-500 mb-1">Wants to join</div>
                      <div className="font-medium text-neutral-800">{request.team.name}</div>
                      <div className="text-xs text-neutral-500">{request.team.university}</div>
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                        <MessageIcon size={14} />
                        <span>Message:</span>
                      </div>
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
                        {request.message}
                      </div>
                    </div>
                  )}

                  {/* User Profile Preview */}
                  <div className="mb-4">
                    <div className="text-sm text-neutral-600 mb-2">Profile:</div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="text-sm text-neutral-700">
                        <div className="mb-1">
                          <span className="font-medium">Email:</span> {request.applicant.email}
                        </div>
                        {request.applicant.bio && (
                          <div>
                            <span className="font-medium">Bio:</span> {request.applicant.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRequestAction(request._id, 'approved')}
                      disabled={processing === request._id}
                      className="btn btn-success flex-1"
                    >
                      {processing === request._id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="mr-2" size={16} />
                          Approve & Add to Team
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRequestAction(request._id, 'rejected')}
                      disabled={processing === request._id}
                      className="btn btn-error flex-1"
                    >
                      {processing === request._id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XIcon className="mr-2" size={16} />
                          Reject Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Outgoing requests tab
          outgoingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparkIcon className="text-neutral-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Outgoing Requests</h3>
              <p className="text-neutral-600">
                You haven't sent any join requests to other teams.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map(request => (
                <div key={request._id} className="border border-neutral-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                        <GroupsIcon className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-800">{request.team.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <UniversityIcon size={14} />
                          <span>{request.team.university}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <CalendarIcon size={14} />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                        <MessageIcon size={14} />
                        <span>Your message:</span>
                      </div>
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
                        {request.message}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {request.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCancelRequest(request._id)}
                        disabled={processing === request._id}
                        className="btn btn-outline flex-1"
                      >
                        {processing === request._id ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full mr-2"></div>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XIcon className="mr-2" size={16} />
                            Cancel Request
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
        </div>
      </div>
    </div>
  );
};

export default JoinRequestsModal; 