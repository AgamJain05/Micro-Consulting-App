import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Clock, MessageSquare, Star, User, DollarSign, Calendar, CheckCircle, Inbox, Archive, XCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export const MySessions = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewModal, setReviewModal] = useState<{ sessionId: string, consultantName: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const res = await api.get('/api/v1/sessions/');
      return res.data;
    },
    enabled: !!user
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/sessions/${id}/accept`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
      const sessionId = data.id || data._id;
      navigate(`/session/${sessionId}`);
    },
    onError: (err: any) => {
        alert(err.response?.data?.detail || "Failed to accept session");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/v1/sessions/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
    },
    onError: (err: any) => {
        alert(err.response?.data?.detail || "Failed to reject session");
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading sessions...</div>;

  // Filter sessions
  const activeSessions = sessions?.filter((s: any) => s.status === 'active' || s.status === 'pending' || s.status === 'accepted') || [];
  const historySessions = sessions?.filter((s: any) => s.status === 'completed' || s.status === 'cancelled' || s.status === 'rejected') || [];

  const displayedSessions = activeTab === 'active' ? activeSessions : historySessions;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Sessions</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition ${
            activeTab === 'active' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox size={18} />
          Active & Pending
          {activeSessions.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {activeSessions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition ${
            activeTab === 'history' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Archive size={18} />
          History
        </button>
      </div>

      <div className="space-y-4">
        {displayedSessions.map((session: any) => {
          // Robust Check: Normalize IDs to strings
          const currentUserId = user?.id || user?._id;
          const clientId = session.client?.id || session.client?._id;
          
          const isClient = String(clientId) === String(currentUserId);
          
          const otherUser = isClient ? session.consultant : session.client;
          const isPending = session.status === 'pending';
          
          // Fallback if otherUser is null (e.g. Link not populated properly)
          const displayName = otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : "Unknown User";
          const displayInitial = otherUser?.first_name?.[0] || "?";

          return (
            <div key={session.id || session._id} className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4 hover:shadow-md transition ${isPending ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
                  {displayInitial}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{displayName}</h3>
                  <p className="text-sm text-gray-500 mb-2 font-medium">{session.topic}</p>
                  
                  <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                      <Calendar size={12} />
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded ${
                      session.status === 'completed' ? 'bg-green-50 text-green-700' :
                      session.status === 'active' ? 'bg-blue-50 text-blue-700' :
                      session.status === 'accepted' ? 'bg-indigo-50 text-indigo-700' :
                      session.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      <CheckCircle size={12} />
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                    {session.total_cost > 0 && (
                      <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                        <DollarSign size={12} />
                        ${session.total_cost.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-start md:self-center">
                {/* Consultant Actions for Pending */}
                {!isClient && isPending && (
                    <>
                        <button 
                            onClick={() => acceptMutation.mutate(session.id || session._id)}
                            disabled={acceptMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition shadow-sm"
                        >
                            <CheckCircle size={16} />
                            Accept
                        </button>
                        <button 
                            onClick={() => rejectMutation.mutate(session.id || session._id)}
                            disabled={rejectMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition"
                        >
                            <XCircle size={16} />
                            Decline
                        </button>
                    </>
                )}

                {/* Join Chat Logic */}
                {(session.status === 'active' || session.status === 'accepted') && (
                   <button 
                     onClick={() => navigate(`/session/${session.id || session._id}`)}
                     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition shadow-sm shadow-blue-200"
                   >
                     <MessageSquare size={16} />
                     Open Chat
                   </button>
                )}
                
                {/* Client waiting state */}
                {isClient && isPending && (
                    <button 
                        onClick={() => navigate(`/session/${session.id || session._id}/waiting`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-200 transition"
                    >
                        <Clock size={16} />
                        Waiting...
                    </button>
                )}
                
                {session.status === 'completed' && isClient && (
                  <button 
                    onClick={() => setReviewModal({ 
                      sessionId: session.id || session._id, 
                      consultantName: `${otherUser?.first_name} ${otherUser?.last_name}` 
                    })}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
                  >
                    <Star size={16} />
                    Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {displayedSessions.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-500">
            {activeTab === 'active' 
              ? "No active sessions. Check back later or browse consultants." 
              : "No session history found."}
          </div>
        )}
      </div>
      
      {reviewModal && (
        <ReviewModal 
          sessionId={reviewModal.sessionId} 
          consultantName={reviewModal.consultantName} 
          onClose={() => setReviewModal(null)} 
        />
      )}
    </div>
  );
};

const ReviewModal = ({ sessionId, consultantName, onClose }: { sessionId: string, consultantName: string, onClose: () => void }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/reviews/', {
        session_id: sessionId,
        rating,
        comment
      });
    },
    onSuccess: () => {
      alert("Review submitted!");
      onClose();
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to submit review");
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold mb-2">Review Session</h3>
        <p className="text-gray-600 text-sm mb-6">How was your experience with {consultantName}?</p>
        
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star} 
              onClick={() => setRating(star)}
              className={`transition transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
            >
              <Star size={32} fill="currentColor" />
            </button>
          ))}
        </div>
        
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your feedback..."
          className="w-full p-3 border border-gray-200 rounded-xl mb-4 h-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => mutation.mutate()}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};
