import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { DollarSign, Clock, Calendar, TrendingUp } from 'lucide-react';

export const ClientProfile = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const { data: userProfile } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await api.get('/api/v1/auth/me');
            return res.data;
        }
    });

    const { data: sessions } = useQuery({
        queryKey: ['my-sessions'],
        queryFn: async () => {
            const res = await api.get('/api/v1/sessions/my-sessions');
            return res.data;
        }
    });

    // Calculate statistics
    const completedSessions = sessions?.filter((s: any) => s.status === 'completed') || [];
    const totalSessions = completedSessions.length;
    const totalSpent = completedSessions.reduce((sum: number, session: any) => {
        const duration = session.actual_end_time && session.actual_start_time
            ? (new Date(session.actual_end_time).getTime() - new Date(session.actual_start_time).getTime()) / 1000 / 60
            : 0;
        return sum + (duration * (session.cost_per_minute || 0));
    }, 0);

    const totalMinutes = completedSessions.reduce((sum: number, session: any) => {
        const duration = session.actual_end_time && session.actual_start_time
            ? (new Date(session.actual_end_time).getTime() - new Date(session.actual_start_time).getTime()) / 1000 / 60
            : 0;
        return sum + duration;
    }, 0);

    if (!user || user.role !== 'client') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">This page is only accessible to clients.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-[#FF5A5F] hover:underline font-bold"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random&size=200`}
                                alt={`${user.first_name} ${user.last_name}`}
                                className="w-32 h-32 rounded-3xl object-cover shadow-md"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-gray-600 mb-4">{user.email}</p>

                            {/* Credits */}
                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-full font-bold shadow-sm">
                                <DollarSign size={20} />
                                <span className="text-2xl">${Math.floor(userProfile?.credits || 0)}</span>
                                <span className="text-sm">Available Credits</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => navigate('/wallet')}
                                className="bg-[#FF5A5F] hover:bg-[#E04F54] text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95"
                            >
                                Add Credits
                            </button>
                            <button
                                onClick={() => navigate('/consultants')}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                            >
                                Find Consultants
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Total Sessions */}
                    <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
                        <div className="flex items-center gap-2 mb-3 text-gray-600">
                            <Calendar size={24} className="text-blue-500" />
                            <span className="text-sm font-bold uppercase tracking-wide">Total Sessions</span>
                        </div>
                        <div className="text-4xl font-extrabold text-gray-900">{totalSessions}</div>
                        <div className="text-xs text-gray-500 mt-1">Completed consultations</div>
                    </div>

                    {/* Total Time */}
                    <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
                        <div className="flex items-center gap-2 mb-3 text-gray-600">
                            <Clock size={24} className="text-purple-500" />
                            <span className="text-sm font-bold uppercase tracking-wide">Total Time</span>
                        </div>
                        <div className="text-4xl font-extrabold text-gray-900">{Math.floor(totalMinutes)}</div>
                        <div className="text-xs text-gray-500 mt-1">Minutes consulted</div>
                    </div>

                    {/* Total Spent */}
                    <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
                        <div className="flex items-center gap-2 mb-3 text-gray-600">
                            <TrendingUp size={24} className="text-green-500" />
                            <span className="text-sm font-bold uppercase tracking-wide">Total Spent</span>
                        </div>
                        <div className="text-4xl font-extrabold text-gray-900">${Math.floor(totalSpent)}</div>
                        <div className="text-xs text-gray-500 mt-1">Investment in expertise</div>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="material-icons-round text-[#FF5A5F]">history</span>
                        Recent Sessions
                    </h2>

                    {completedSessions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                                <Calendar size={48} className="text-gray-400" />
                            </div>
                            <p className="text-gray-600 mb-4">No completed sessions yet</p>
                            <button
                                onClick={() => navigate('/consultants')}
                                className="bg-[#FF5A5F] hover:bg-[#E04F54] text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95"
                            >
                                Book Your First Session
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {completedSessions.slice(0, 5).map((session: any) => {
                                const duration = session.actual_end_time && session.actual_start_time
                                    ? Math.floor((new Date(session.actual_end_time).getTime() - new Date(session.actual_start_time).getTime()) / 1000 / 60)
                                    : 0;
                                const cost = duration * (session.cost_per_minute || 0);

                                return (
                                    <div
                                        key={session.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-4 mb-3 md:mb-0">
                                            <img
                                                src={session.consultant?.avatar_url || `https://ui-avatars.com/api/?name=${session.consultant?.first_name}+${session.consultant?.last_name}&background=random`}
                                                alt={session.consultant?.first_name}
                                                className="w-12 h-12 rounded-xl object-cover shadow-sm"
                                            />
                                            <div>
                                                <h3 className="font-bold text-gray-900">
                                                    {session.consultant?.first_name} {session.consultant?.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">{session.topic}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="text-center">
                                                <p className="text-gray-500">Duration</p>
                                                <p className="font-bold text-gray-900">{duration} min</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Cost</p>
                                                <p className="font-bold text-gray-900">${cost.toFixed(2)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Date</p>
                                                <p className="font-bold text-gray-900">
                                                    {new Date(session.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {completedSessions.length > 5 && (
                                <button
                                    onClick={() => navigate('/my-sessions')}
                                    className="w-full text-center py-3 text-[#FF5A5F] hover:text-[#E04F54] font-bold transition"
                                >
                                    View All Sessions →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
