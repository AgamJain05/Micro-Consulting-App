import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
    const { user, logout } = useAuthStore();
    const queryClient = useQueryClient();
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

    useEffect(() => {
        if (userProfile) {
            setFormData({
                headline: userProfile.headline || '',
                bio: userProfile.bio || '',
                price_per_minute: userProfile.price_per_minute || 0,
                free_minutes: userProfile.free_minutes || 15,
                skills: userProfile.skills?.join(', ') || ''
            });
        }
    }, [userProfile]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.put('/api/v1/users/profile', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success('Profile updated successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Failed to update profile');
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Settings</h1>
                    <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-4 px-6 font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'profile'
                                    ? 'text-[#FF5A5F] border-b-2 border-[#FF5A5F] bg-white'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className="material-icons-round text-lg">person</span>
                            Profile Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`flex-1 py-4 px-6 font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'preferences'
                                    ? 'text-[#FF5A5F] border-b-2 border-[#FF5A5F] bg-white'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className="material-icons-round text-lg">tune</span>
                            Preferences
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {activeTab === 'profile' ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Headline (Title)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.headline}
                                        onChange={e => setFormData({ ...formData, headline: e.target.value })}
                                        className="w-full p-3 border border-gray-300 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none placeholder-gray-400"
                                        placeholder="e.g. Senior Python Developer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full p-3 border border-gray-300 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none h-32 resize-none placeholder-gray-400"
                                        placeholder="Describe your expertise..."
                                    />
                                </div>

                                {user?.role === 'consultant' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Rate per Minute ($)
                                            </label>
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    attach_money
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={formData.price_per_minute}
                                                    onChange={e =>
                                                        setFormData({ ...formData, price_per_minute: parseFloat(e.target.value) })
                                                    }
                                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Skills (comma separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.skills}
                                                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                                className="w-full p-3 border border-gray-300 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none placeholder-gray-400"
                                                placeholder="e.g. Python, React, AWS"
                                            />
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={handleProfileSave}
                                    disabled={updateProfileMutation.isPending}
                                    className="bg-[#FF5A5F] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#E04F54] transition disabled:opacity-50 shadow-md active:scale-95"
                                >
                                    <span className="material-icons-round">save</span>
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {user?.role === 'consultant' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Free Minutes
                                        </label>
                                        <p className="text-xs text-gray-500 mb-3">
                                            Number of free minutes you offer to new clients
                                        </p>
                                        <div className="relative">
                                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                timer
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={formData.free_minutes}
                                                onChange={e =>
                                                    setFormData({ ...formData, free_minutes: parseInt(e.target.value) })
                                                }
                                                className="w-full pl-10 pr-3 py-3 border border-gray-300 bg-white rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-icons-round text-blue-600">account_circle</span>
                                        <div className="text-sm text-blue-700 font-bold">Account Information</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm text-gray-700">
                                            <span className="font-semibold">Name:</span>{' '}
                                            <span className="font-bold text-gray-900">
                                                {user?.first_name} {user?.last_name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            <span className="font-semibold">Email:</span>{' '}
                                            <span className="text-gray-600">{user?.email}</span>
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            <span className="font-semibold">Role:</span>{' '}
                                            <span className="capitalize text-gray-600">{user?.role}</span>
                                        </div>
                                    </div>
                                </div>

                                {user?.role === 'consultant' && (
                                    <button
                                        onClick={handleProfileSave}
                                        disabled={updateProfileMutation.isPending}
                                        className="bg-[#FF5A5F] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#E04F54] transition disabled:opacity-50 shadow-md active:scale-95"
                                    >
                                        <span className="material-icons-round">save</span>
                                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                )}

                                <div className="pt-6 border-t border-gray-200">
                                    <button
                                        onClick={handleLogout}
                                        className="bg-white text-red-600 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-50 transition border-2 border-red-200 active:scale-95"
                                    >
                                        <span className="material-icons-round">logout</span>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
