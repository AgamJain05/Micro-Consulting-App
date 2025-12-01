import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ConsultantList } from './pages/ConsultantList'
import { SessionRoom } from './pages/SessionRoom'
import { MySessions } from './pages/MySessions'
import { WalletPage } from './pages/WalletPage'
import { ConsultantDashboard } from './pages/ConsultantDashboard'
import { WaitingRoom } from './pages/WaitingRoom'
import { useAuthStore } from './store/authStore'
import { api } from './lib/api'
import { Bell } from 'lucide-react'

const queryClient = new QueryClient()

function App() {
  const { user, logout } = useAuthStore()

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
              <Link to="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
                MicroConsult
              </Link>
              <div className="space-x-6 flex items-center text-sm font-medium">
                <Link to="/consultants" className="text-gray-600 hover:text-blue-600">Find Experts</Link>
                {user ? (
                  <>
                    {user.role === 'consultant' && (
                        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                    )}
                    <Link to="/my-sessions" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                      Sessions
                      <NotificationBadge />
                    </Link>
                    <Link to="/wallet" className="text-gray-600 hover:text-blue-600">Wallet</Link>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <span className="text-gray-900">{user.first_name}</span>
                    <button onClick={logout} className="text-gray-500 hover:text-red-600">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link>
                    <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Register</Link>
                  </>
                )}
              </div>
            </div>
          </nav>
          
          <main className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/consultants" element={<ConsultantList />} />
              <Route path="/my-sessions" element={<MySessions />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/dashboard" element={<ConsultantDashboard />} />
              <Route path="/session/:sessionId" element={<SessionRoom />} />
              <Route path="/session/:sessionId/waiting" element={<WaitingRoom />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

function NotificationBadge() {
  const { data: sessions } = useQuery({
    queryKey: ['my-sessions-notify'],
    queryFn: async () => {
      const res = await api.get('/api/v1/sessions/');
      return res.data;
    },
    refetchInterval: 5000 // Check every 5s
  });

  const pendingCount = sessions?.filter((s: any) => s.status === 'pending').length || 0;

  if (pendingCount === 0) return null;

  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
      {pendingCount}
    </span>
  );
}

function Home() {
  return (
    <div className="py-20 text-center">
      <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">Find Expert Consultants <span className="text-blue-600">Instantly</span></h2>
      <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Get help with your specific problems in minutes via metered video calls. No contracts, just results.</p>
      <Link to="/consultants" className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 hover:scale-105 transform inline-block">
        Browse Consultants
      </Link>
    </div>
  )
}

export default App
