import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToastStore } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';

export const SettingsDropdown = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // Profile Form State
  const [formData, setFormData] = useState({
    headline: '',
    bio: '',
    price_per_minute: 0,
    free_minutes: 15,
    skills: ''
  });

  const { data: userProfile } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/v1/auth/me');
      return res.data;
    },
    enabled: !!user
  });

  useState(() => {
    if (userProfile) {
      setFormData({
        headline: userProfile.headline || '',
        bio: userProfile.bio || '',
        price_per_minute: userProfile.price_per_minute || 0,
        free_minutes: userProfile.free_minutes || 15,
        skills: userProfile.skills?.join(', ') || ''
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/api/v1/users/profile', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      addToast('success', 'Profile updated successfully!');
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.detail || 'Failed to update profile');
    }
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
      headline: formData.headline,
      bio: formData.bio,
      price_per_minute: parseFloat(formData.price_per_minute.toString()),
      free_minutes: parseInt(formData.free_minutes.toString()),
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF5A5F] to-[#E04F54] p-5 text-white">
        <h3 className="text-xl font-extrabold">Settings</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'profile'
            ? 'text-[#FF5A5F] border-b-2 border-[#FF5A5F] bg-white'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <span className="material-icons-round text-lg">person</span>
          Edit Profile
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'settings'
            ? 'text-[#FF5A5F] border-b-2 border-[#FF5A5F] bg-white'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <span className="material-icons-round text-lg">tune</span>
          Preferences
        </button>
      </div>

      {/* Content */}
      <div className="p-5 max-h-96 overflow-y-auto">
        {activeTab === 'profile' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Headline (Title)</label>
              <input
                type="text"
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                className="w-full p-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none placeholder-gray-400"
                placeholder="e.g. Senior Python Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none h-20 resize-none placeholder-gray-400"
                placeholder="Describe your expertise..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Rate per Minute ($)</label>
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  attach_money
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={formData.price_per_minute}
                  onChange={e => setFormData({ ...formData, price_per_minute: parseFloat(e.target.value) })}
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Skills (comma separated)</label>
              <input
                type="text"
                value={formData.skills}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                className="w-full p-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none placeholder-gray-400"
                placeholder="e.g. Python, React, AWS"
              />
            </div>

            <button
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isPending}
              className="w-full bg-[#FF5A5F] text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#E04F54] transition disabled:opacity-50 shadow-md active:scale-95"
            >
              <span className="material-icons-round">save</span>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Free Minutes</label>
              <p className="text-xs text-gray-500 mb-2">Number of free minutes you offer to new clients</p>
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  timer
                </span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.free_minutes}
                  onChange={e => setFormData({ ...formData, free_minutes: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-icons-round text-blue-600">account_circle</span>
                <div className="text-xs text-blue-700 font-bold">Current Status</div>
              </div>
              <div className="text-sm text-gray-700">
                Logged in as <span className="font-bold text-gray-900">{user?.first_name} {user?.last_name}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">{user?.email}</div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isPending}
              className="w-full bg-[#FF5A5F] text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#E04F54] transition disabled:opacity-50 shadow-md active:scale-95"
            >
              <span className="material-icons-round">save</span>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-white text-gray-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition border-2 border-gray-200 active:scale-95"
            >
              <span className="material-icons-round">logout</span>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
