import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from '../store/toastStore';

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

  if (isLoading) return <div className="p-8 text-center text-gray-600">Loading sessions...</div>;

  // Filter sessions
  const activeSessions = sessions?.filter((s: any) => s.status === 'active' || s.status === 'pending' || s.status === 'accepted') || [];
  const historySessions = sessions?.filter((s: any) => s.status === 'completed' || s.status === 'cancelled' || s.status === 'rejected') || [];

  const displayedSessions = activeTab === 'active' ? activeSessions : historySessions;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Sessions</h1>
          <p className="text-gray-600">Manage your consulting sessions and chat history</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'active'
              ? 'bg-[#FF5A5F] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span className="material-icons-round text-lg">inbox</span>
            Active & Pending
            {activeSessions.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'active' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                {activeSessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'history'
              ? 'bg-[#FF5A5F] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span className="material-icons-round text-lg">history</span>
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

            // Fallback if otherUser is null
            const displayName = otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : "Unknown User";
            const displayInitial = otherUser?.first_name?.[0] || "?";

            return (
              <div key={session.id || session._id} className={`bg-white rounded-2xl p-6 shadow-soft border transition-all hover:shadow-hover ${isPending ? 'border-[#FF5A5F]/30 bg-[#FF5A5F]/5' : 'border-gray-100'}`}>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#FF5A5F] to-[#E04F54] rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md">
                      {displayInitial}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{displayName}</h3>
                      <p className="text-sm text-gray-600 mb-3 font-medium">{session.topic}</p>

                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700">
                          <span className="material-icons-round text-sm">calendar_today</span>
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                        <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${session.status === 'completed' ? 'bg-green-100 text-green-700' :
                          session.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            session.status === 'accepted' ? 'bg-indigo-100 text-indigo-700' :
                              session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          <span className="material-icons-round text-sm">
                            {session.status === 'completed' ? 'check_circle' :
                              session.status === 'active' ? 'play_circle' :
                                session.status === 'pending' ? 'schedule' : 'info'}
                          </span>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                        {session.total_cost > 0 && (
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg">
                            <span className="material-icons-round text-sm">attach_money</span>
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
                          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition shadow-md active:scale-95"
                        >
                          <span className="material-icons-round text-lg">check_circle</span>
                          Accept
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(session.id || session._id)}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition active:scale-95"
                        >
                          <span className="material-icons-round text-lg">cancel</span>
                          Decline
                        </button>
                      </>
                    )}

                    {/* Join Chat Logic */}
                    {(session.status === 'active' || session.status === 'accepted') && (
                      <button
                        onClick={() => navigate(`/session/${session.id || session._id}`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5A5F] text-white rounded-xl font-bold text-sm hover:bg-[#E04F54] transition shadow-md active:scale-95"
                      >
                        <span className="material-icons-round text-lg">chat</span>
                        Open Chat
                      </button>
                    )}

                    {/* Client waiting state */}
                    {isClient && isPending && (
                      <button
                        onClick={() => navigate(`/session/${session.id || session._id}/waiting`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300 transition"
                      >
                        <span className="material-icons-round text-lg">schedule</span>
                        Waiting...
                      </button>
                    )}

                    {session.status === 'completed' && isClient && (
                      <button
                        onClick={() => setReviewModal({
                          sessionId: session.id || session._id,
                          consultantName: `${otherUser?.first_name} ${otherUser?.last_name}`
                        })}
                        className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition active:scale-95"
                      >
                        <span className="material-icons-round text-lg">star</span>
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {displayedSessions.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl text-gray-500 border border-gray-100 shadow-soft">
              <span className="material-icons-round text-6xl text-gray-300 mb-4">inbox</span>
              <p className="text-lg font-medium">
                {activeTab === 'active'
                  ? "No active sessions. Check back later or browse consultants."
                  : "No session history found."}
              </p>
            </div>
          )}
        </div>
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
      // Fix #5: Use toast instead of alert
      toast.success("Review submitted successfully!");
      onClose();
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
    },
    onError: (err: any) => {
      // Fix #5: Use toast instead of alert
      toast.error(err.response?.data?.detail || "Failed to submit review");
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
        <h3 className="text-2xl font-extrabold mb-2 text-gray-900">Review Session</h3>
        <p className="text-gray-600 text-sm mb-6">How was your experience with {consultantName}?</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`transition transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              <span className="material-icons-round text-4xl">
                {star <= rating ? 'star' : 'star_border'}
              </span>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your feedback..."
          className="w-full p-4 border border-gray-200 bg-white rounded-xl mb-6 h-32 text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none resize-none placeholder-gray-400"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            className="flex-1 py-3 bg-[#FF5A5F] text-white font-bold rounded-xl hover:bg-[#E04F54] transition shadow-md disabled:opacity-50 active:scale-95"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};
