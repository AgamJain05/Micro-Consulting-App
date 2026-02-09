import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { SettingsDropdown } from '../components/SettingsDropdown';

export const ConsultantDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const res = await api.get('/api/v1/sessions/');
      return res.data;
    },
    enabled: !!user
  });

  // Calculate Stats
  const completedSessions = sessions?.filter((s: any) => s.status === 'completed') || [];
  const totalEarnings = completedSessions.reduce((sum: number, s: any) => sum + (s.total_cost || 0), 0);
  const totalMinutes = completedSessions.reduce((sum: number, s: any) => {
    if (s.actual_start_time && s.actual_end_time) {
      const dur = (new Date(s.actual_end_time).getTime() - new Date(s.actual_start_time).getTime()) / 60000;
      return sum + dur;
    }
    return sum;
  }, 0);

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/v1/auth/me');
      return res.data;
    },
    enabled: !!user
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await api.put('/api/v1/users/profile', { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const isOnline = userProfile?.status === 'online';

  if (isLoading) return <div className="text-center py-20 text-gray-600">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-1">Consultant Dashboard</h1>
            <p className="text-gray-600">Manage your sessions and track your earnings</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Online/Offline Toggle */}
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-soft border border-gray-100">
              <span className={`text-sm font-bold ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                {isOnline ? 'Available' : 'Offline'}
              </span>
              <button
                onClick={() => toggleStatusMutation.mutate(isOnline ? 'offline' : 'online')}
                className={`relative w-14 h-7 rounded-full transition-all ${isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isOnline ? 'translate-x-8' : 'translate-x-1'
                  }`}></div>
              </button>
            </div>

            <SettingsDropdown />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-[#FF5A5F] to-[#E04F54] p-6 rounded-3xl shadow-soft text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <span className="material-icons-round text-2xl">trending_up</span>
                <span className="text-sm font-bold uppercase tracking-wide">Total Earnings</span>
              </div>
              <div className="text-4xl font-extrabold">${totalEarnings.toFixed(2)}</div>
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-600">
              <span className="material-icons-round text-2xl text-blue-500">groups</span>
              <span className="text-sm font-bold uppercase tracking-wide">Sessions</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900">{completedSessions.length}</div>
            <div className="text-xs text-gray-500 mt-1">Completed</div>
          </div>

          {/* Minutes Talked */}
          <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-600">
              <span className="material-icons-round text-2xl text-purple-500">schedule</span>
              <span className="text-sm font-bold uppercase tracking-wide">Time Talked</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900">{Math.round(totalMinutes)}m</div>
            <div className="text-xs text-gray-500 mt-1">Total minutes</div>
          </div>

          {/* Rating */}
          <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-600">
              <span className="material-icons-round text-2xl text-yellow-500">star</span>
              <span className="text-sm font-bold uppercase tracking-wide">Rating</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900">{userProfile?.rating?.toFixed(1) || "5.0"}</div>
            <div className="text-xs text-gray-500 mt-1">{userProfile?.review_count || 0} reviews</div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 md:p-8">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
            <span className="material-icons-round text-[#FF5A5F]">history</span>
            Recent Sessions
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {sessions?.slice(0, 10).map((s: any) => (
              <div key={s.id || s._id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">{s.topic}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="material-icons-round text-xs">person</span>
                    with {s.client?.first_name}
                    <span className="text-gray-400">•</span>
                    <span className="material-icons-round text-xs">calendar_today</span>
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <div className={`px-4 py-1.5 rounded-xl text-xs font-bold ${s.status === 'completed' ? 'bg-green-100 text-green-700' :
                      s.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                    }`}>
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </div>
                  {s.total_cost > 0 && (
                    <div className="text-lg font-extrabold text-green-600">${s.total_cost.toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))}
            {(!sessions || sessions.length === 0) && (
              <div className="text-center text-gray-500 py-16">
                <span className="material-icons-round text-6xl text-gray-300 mb-4">inbox</span>
                <p className="text-lg font-medium">No sessions yet</p>
                <p className="text-sm text-gray-400 mt-1">Your completed sessions will appear here</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/my-sessions')}
            className="mt-6 w-full bg-[#FF5A5F] text-white font-bold py-3 rounded-xl hover:bg-[#E04F54] transition shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-icons-round">visibility</span>
            View Full History
          </button>
        </div>
      </div>
    </div>
  );
};
