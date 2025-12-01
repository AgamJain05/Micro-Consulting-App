import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Star, 
  Clock, 
  ToggleLeft, 
  ToggleRight,
  Edit2,
  Save
} from 'lucide-react';
import { useState, useEffect } from 'react';

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/api/v1/users/profile', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      alert("Profile updated successfully!");
    },
    onError: (err: any) => {
        alert("Failed to update profile: " + err.response?.data?.detail || err.message);
    }
  });

  // Profile Form State
  const [formData, setFormData] = useState({
    headline: '',
    bio: '',
    price_per_minute: 0,
    skills: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        headline: userProfile.headline || '',
        bio: userProfile.bio || '',
        price_per_minute: userProfile.price_per_minute || 0,
        skills: userProfile.skills?.join(', ') || ''
      });
    }
  }, [userProfile]);

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
        headline: formData.headline,
        bio: formData.bio,
        price_per_minute: parseFloat(formData.price_per_minute.toString()),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
    });
  };

  const isOnline = userProfile?.status === 'online';

  if (isLoading) return <div className="text-center py-20">Loading dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consultant Dashboard</h1>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <span className={`text-sm font-semibold ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                {isOnline ? 'Available for Calls' : 'Offline'}
            </span>
            <button 
                onClick={() => toggleStatusMutation.mutate(isOnline ? 'offline' : 'online')}
                className="focus:outline-none transition transform active:scale-95"
            >
                {isOnline ? (
                    <ToggleRight size={40} className="text-green-500" />
                ) : (
                    <ToggleLeft size={40} className="text-gray-300" />
                )}
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2 text-gray-500">
                <BarChart3 size={20} />
                <span className="text-sm font-medium">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2 text-gray-500">
                <Users size={20} />
                <span className="text-sm font-medium">Sessions</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{completedSessions.length}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2 text-gray-500">
                <Clock size={20} />
                <span className="text-sm font-medium">Minutes Talked</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{Math.round(totalMinutes)}m</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2 text-gray-500">
                <Star size={20} />
                <span className="text-sm font-medium">Rating</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{userProfile?.rating?.toFixed(1) || "5.0"}</div>
            <div className="text-xs text-gray-400 mt-1">{userProfile?.review_count || 0} reviews</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          {/* Edit Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Edit2 size={20} className="text-blue-600" />
                      Edit Public Profile
                  </h3>
                  <button 
                    onClick={handleProfileSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save size={16} />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
              </div>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Headline (Title)</label>
                      <input 
                        type="text" 
                        value={formData.headline}
                        onChange={e => setFormData({...formData, headline: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Senior Python Developer"
                      />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea 
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        placeholder="Describe your expertise..."
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Minute ($)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={formData.price_per_minute}
                            onChange={e => setFormData({...formData, price_per_minute: parseFloat(e.target.value)})}
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <div className="p-3 bg-gray-50 rounded-xl text-sm font-semibold text-gray-500 flex justify-between items-center">
                              {isOnline ? 'Online' : 'Offline'}
                              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                      <input 
                        type="text" 
                        value={formData.skills}
                        onChange={e => setFormData({...formData, skills: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Python, React, AWS"
                      />
                  </div>
              </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Sessions</h3>
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2">
                  {sessions?.slice(0, 10).map((s: any) => (
                      <div key={s.id || s._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                              <div className="font-semibold text-gray-900">{s.topic}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                  with {s.client?.first_name} • {new Date(s.created_at).toLocaleDateString()}
                              </div>
                          </div>
                          <div className="text-right">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold mb-1 inline-block ${
                                  s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                  {s.status}
                              </div>
                              {s.total_cost > 0 && (
                                  <div className="text-sm font-bold text-gray-700">${s.total_cost.toFixed(2)}</div>
                              )}
                          </div>
                      </div>
                  ))}
                  {(!sessions || sessions.length === 0) && (
                      <div className="text-center text-gray-500 py-8">No sessions yet</div>
                  )}
              </div>
              
              <button onClick={() => navigate('/my-sessions')} className="mt-6 w-full bg-gray-50 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition border border-gray-200">
                  View Full History
              </button>
          </div>
      </div>
    </div>
  );
};
