import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { adminApi } from '../lib/api/index';
import { toast } from '../store/toastStore';
import { 
  Users, 
  DollarSign, 
  Video, 
  Star, 
  TrendingUp,
  Search,
  RefreshCw,
  BarChart3,
  UserCheck,
  UserX,
  MoreVertical
} from 'lucide-react';
import type { AdminUser } from '../types';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sessions' | 'analytics'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // User action mutation
  const userActionMutation = useMutation({
    mutationFn: ({ userId, action, value }: { userId: string; action: string; value?: number }) => 
      adminApi.userAction(userId, action, value),
    onSuccess: (data: { message: string }) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUserId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Action failed');
    }
  });

  const handleUserAction = (userId: string, action: string, value?: number) => {
    userActionMutation.mutate({ userId, action, value });
  };

  // Platform Stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    enabled: !!user,
  });

  // Users List
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userSearch, userRoleFilter],
    queryFn: () => adminApi.getUsers({ 
      search: userSearch || undefined, 
      role: userRoleFilter || undefined,
      limit: 50 
    }),
    enabled: !!user && activeTab === 'users',
  });

  // Sessions List
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => adminApi.getSessions({ limit: 50 }),
    enabled: !!user && activeTab === 'sessions',
  });

  // Revenue Analytics
  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminApi.getRevenueAnalytics(30),
    enabled: !!user && activeTab === 'analytics',
  });

  // User Analytics
  const { data: userAnalytics } = useQuery({
    queryKey: ['admin-user-analytics'],
    queryFn: () => adminApi.getUserAnalytics(30),
    enabled: !!user && activeTab === 'analytics',
  });

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtext 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string;
    subtext?: string;
  }) => (
    <div className="bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-100 mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and management</p>
        </div>
        <button 
          onClick={() => refetchStats()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-800 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'sessions', label: 'Sessions', icon: Video },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeTab === tab.id
                ? 'bg-gray-900 text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {statsLoading ? (
            <div className="text-center py-20 text-gray-500">Loading stats...</div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Users"
                  value={stats.total_users}
                  icon={Users}
                  color="bg-purple-600"
                  subtext={`+${stats.users_today} today`}
                />
                <StatCard
                  title="Total Revenue"
                  value={`$${stats.total_revenue.toFixed(2)}`}
                  icon={DollarSign}
                  color="bg-green-600"
                />
                <StatCard
                  title="Total Sessions"
                  value={stats.total_sessions}
                  icon={Video}
                  color="bg-purple-500"
                  subtext={`${stats.completed_sessions} completed`}
                />
                <StatCard
                  title="Avg Rating"
                  value={stats.avg_rating.toFixed(1)}
                  icon={Star}
                  color="bg-yellow-500"
                  subtext={`${stats.total_reviews} reviews`}
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-800">
                  <h3 className="font-semibold text-gray-100 mb-4">User Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Clients</span>
                      <span className="font-semibold text-gray-200">{stats.total_clients}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Consultants</span>
                      <span className="font-semibold text-gray-200">{stats.total_consultants}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-800">
                  <h3 className="font-semibold text-gray-100 mb-4">Session Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-500">Pending</span>
                      <span className="font-semibold text-gray-200">{stats.pending_sessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400">Active</span>
                      <span className="font-semibold text-gray-200">{stats.active_sessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">Completed</span>
                      <span className="font-semibold text-gray-200">{stats.completed_sessions}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-800">
                  <h3 className="font-semibold text-gray-100 mb-4">Today's Activity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">New Users</span>
                      <span className="font-semibold text-green-400">+{stats.users_today}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Sessions</span>
                      <span className="font-semibold text-purple-400">{stats.sessions_today}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-500">Failed to load stats</div>
          )}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-800 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-500"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg"
            >
              <option value="">All Roles</option>
              <option value="client">Clients</option>
              <option value="consultant">Consultants</option>
            </select>
          </div>

          {/* Table */}
          {usersLoading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users?.map((u: AdminUser) => (
                  <tr key={u.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 font-bold">
                          {u.first_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-100">{u.first_name} {u.last_name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'consultant' ? 'bg-purple-900/50 text-purple-400' : 
                        u.role === 'admin' ? 'bg-orange-900/50 text-orange-400' : 'bg-purple-900/30 text-purple-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        !u.is_active ? 'bg-red-900/50 text-red-400' :
                        u.status === 'online' ? 'bg-green-900/50 text-green-400' :
                        u.status === 'busy' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {!u.is_active ? 'Deactivated' : u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-200">${u.credits.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.is_active ? (
                          <button 
                            onClick={() => handleUserAction(u.id, 'deactivate')}
                            className="p-1.5 text-red-400 hover:bg-red-900/50 rounded-lg transition"
                            title="Deactivate user"
                          >
                            <UserX size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUserAction(u.id, 'activate')}
                            className="p-1.5 text-green-400 hover:bg-green-900/50 rounded-lg transition"
                            title="Activate user"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedUserId(selectedUserId === u.id ? null : u.id)}
                          className="p-1.5 text-gray-500 hover:bg-gray-700 rounded-lg transition"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {selectedUserId === u.id && (
                          <div className="absolute right-8 mt-24 bg-gray-800 shadow-lg rounded-lg border border-gray-700 py-2 z-10">
                            <button 
                              onClick={() => handleUserAction(u.id, 'adjust_credits', 10)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
                            >
                              Add $10 Credits
                            </button>
                            <button 
                              onClick={() => handleUserAction(u.id, 'adjust_credits', -10)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
                            >
                              Remove $10 Credits
                            </button>
                            <button 
                              onClick={() => handleUserAction(u.id, 'set_offline')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
                            >
                              Force Offline
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
          {sessionsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading sessions...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Consultant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sessions?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-100">{s.topic}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{s.client_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{s.consultant_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                        s.status === 'active' ? 'bg-purple-900/50 text-purple-400' :
                        s.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-200">${(s.total_cost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-800">
            <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-500" />
              Revenue (Last 30 Days)
            </h3>
            {revenueData ? (
              <div>
                <p className="text-3xl font-bold text-gray-100 mb-4">
                  ${revenueData.total_revenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {revenueData.session_count} sessions completed
                </p>
                <div className="h-40 flex items-end gap-1">
                  {revenueData.daily_breakdown.slice(-14).map((day: { date: string; revenue: number }, i: number) => (
                    <div 
                      key={i}
                      className="flex-1 bg-green-600 rounded-t opacity-70 hover:opacity-100 transition"
                      style={{ 
                        height: `${Math.max(4, (day.revenue / Math.max(...revenueData.daily_breakdown.map((d: { revenue: number }) => d.revenue), 1)) * 100)}%` 
                      }}
                      title={`${day.date}: $${day.revenue.toFixed(2)}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </div>

          {/* User Growth Chart */}
          <div className="bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-800">
            <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-500" />
              User Growth (Last 30 Days)
            </h3>
            {userAnalytics ? (
              <div>
                <p className="text-3xl font-bold text-gray-100 mb-4">
                  +{userAnalytics.total_new_users}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {userAnalytics.new_clients} clients, {userAnalytics.new_consultants} consultants
                </p>
                <div className="h-40 flex items-end gap-1">
                  {userAnalytics.daily_breakdown.slice(-14).map((day: { date: string; signups: number }, i: number) => (
                    <div 
                      key={i}
                      className="flex-1 bg-purple-600 rounded-t opacity-70 hover:opacity-100 transition"
                      style={{ 
                        height: `${Math.max(4, (day.signups / Math.max(...userAnalytics.daily_breakdown.map((d: { signups: number }) => d.signups), 1)) * 100)}%` 
                      }}
                      title={`${day.date}: ${day.signups} signups`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
