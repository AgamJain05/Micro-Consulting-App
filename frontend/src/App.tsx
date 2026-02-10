import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ConsultantList } from './pages/ConsultantList'
import { ConsultantProfile } from './pages/ConsultantProfile'
import { ClientProfile } from './pages/ClientProfile'
import { SessionRoom } from './pages/SessionRoom'
import { MySessions } from './pages/MySessions'
import { WalletPage } from './pages/WalletPage'
import { ConsultantDashboard } from './pages/ConsultantDashboard'
import { WaitingRoom } from './pages/WaitingRoom'
import { AdminDashboard } from './pages/AdminDashboard'
import { useAuthStore } from './store/authStore'
import { sessionsApi } from './lib/api/index'
import { ToastContainer } from './components/Toast'
import { Shield, LogIn, UserPlus, LogOut, Menu, X, Settings, User, ChevronDown } from 'lucide-react'
import type { Session } from './types'
import { useState, useRef, useEffect } from 'react'

const queryClient = new QueryClient()

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function NavBar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    const { logout } = useAuthStore.getState();
    logout();
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Get user profile for credits
  const { data: userProfile } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await (await import('./lib/api')).api.get('/api/v1/auth/me');
      return res.data;
    },
    enabled: !!user
  });

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <span className="material-icons-round text-primary text-2xl">diversity_3</span>
            </div>
            <span className="text-2xl font-extrabold text-primary tracking-tight">MicroConsult</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-primary"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/consultants" className="text-gray-600 hover:text-[#FF5A5F] font-bold text-sm flex items-center gap-1 transition-colors">
              <span className="material-icons-round text-lg">search</span> Find Experts
            </Link>
            {user && (
              <Link to="/my-sessions" className="text-gray-600 hover:text-[#FF5A5F] font-bold text-sm flex items-center gap-1 transition-colors">
                <span className="material-icons-round text-lg">videocam</span> Sessions
                <NotificationBadge />
              </Link>
            )}
            {user && user.role !== 'consultant' && (
              <Link to="/wallet" className="text-gray-600 hover:text-[#FF5A5F] font-bold text-sm flex items-center gap-1 transition-colors">
                <span className="material-icons-round text-lg">account_balance_wallet</span> Wallet
              </Link>
            )}
            {user && user.role === 'consultant' && (
              <Link to="/dashboard" className="text-gray-600 hover:text-[#FF5A5F] font-bold text-sm flex items-center gap-1 transition-colors">
                <span className="material-icons-round text-lg">dashboard</span> Dashboard
              </Link>
            )}
            {user && user.role === 'admin' && (
              <Link to="/admin" className="text-gray-600 hover:text-[#FF5A5F] font-bold text-sm flex items-center gap-1 transition-colors">
                <Shield size={18} /> Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {user.role !== 'consultant' && (
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-bold border border-gray-200 flex items-center gap-2 transition-all">
                    <span className="material-icons-round text-[#FF5A5F]">savings</span>
                    ${Math.floor(userProfile?.credits || 0)} Credits
                  </button>
                )}
                {/* Fix #12: Profile Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-2 transition"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                      <img
                        alt="User Profile"
                        className="h-full w-full object-cover"
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`}
                      />
                    </div>
                    <ChevronDown size={16} className="text-gray-600" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          // Fix #18 & #19: Navigate based on user role
                          if (user.role === 'consultant') {
                            navigate('/dashboard');
                          } else if (user.role === 'client') {
                            navigate('/profile');
                          } else {
                            navigate('/consultants');
                          }
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition"
                      >
                        <User size={18} />
                        <span className="font-medium">View Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          // Fix #19: Navigate based on user role
                          if (user.role === 'consultant') {
                            navigate('/dashboard');
                          } else if (user.role === 'client') {
                            navigate('/profile');
                          } else {
                            navigate('/consultants');
                          }
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition"
                      >
                        <Settings size={18} />
                        <span className="font-medium">Settings</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-red-600 transition"
                      >
                        <LogOut size={18} />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-[#FF5A5F] font-bold text-sm">
                  Login
                </Link>
                <Link to="/register" className="bg-[#FF5A5F] hover:bg-[#E04F54] text-white px-6 py-2 rounded-full font-bold text-sm transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 space-y-2 px-4">
          <Link
            to="/consultants"
            onClick={() => setMobileMenuOpen(false)}
            className="flex text-gray-600 dark:text-gray-300 hover:text-primary py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center gap-3"
          >
            <span className="material-icons-round">search</span>
            <span>Find Experts</span>
          </Link>
          {user ? (
            <>
              {user.role === 'consultant' && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex text-gray-600 dark:text-gray-300 hover:text-primary py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center gap-3"
                >
                  <span className="material-icons-round">dashboard</span>
                  <span>Dashboard</span>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex text-gray-600 dark:text-gray-300 hover:text-primary py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center gap-3"
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                to="/my-sessions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex text-gray-600 dark:text-gray-300 hover:text-primary py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center gap-3"
              >
                <span className="material-icons-round">videocam</span>
                <span className="flex items-center gap-2">
                  Sessions
                  <NotificationBadge />
                </span>
              </Link>
              {user.role !== 'consultant' && (
                <Link
                  to="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex text-gray-600 dark:text-gray-300 hover:text-primary py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center gap-3"
                >
                  <span className="material-icons-round">account_balance_wallet</span>
                  <span>Wallet</span>
                </Link>
              )}
              <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>
              <div className="py-2 px-4 text-gray-900 dark:text-gray-100 font-medium">{user.first_name} {user.last_name}</div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-gray-400 hover:text-red-400 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-3"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex text-gray-600 dark:text-gray-300 hover:text-primary py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center gap-3"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex bg-primary text-white py-2 px-4 rounded-lg hover:bg-red-500 transition items-center gap-3"
              >
                <UserPlus size={18} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <NavBar />

          <main className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/consultants" element={<ConsultantList />} />
              <Route path="/consultant/:consultantId" element={<ConsultantProfile />} />
              <Route path="/profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
              <Route path="/my-sessions" element={<ProtectedRoute><MySessions /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><ConsultantDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/session/:sessionId" element={<ProtectedRoute><SessionRoom /></ProtectedRoute>} />
              <Route path="/session/:sessionId/waiting" element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
            </Routes>
          </main>

          {/* Global Toast Container */}
          <ToastContainer />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

function NotificationBadge() {
  const { data: sessions } = useQuery({
    queryKey: ['my-sessions-notify'],
    queryFn: () => sessionsApi.getAll(),
    refetchInterval: 5000 // Check every 5s
  });

  const pendingCount = sessions?.filter((s: Session) => s.status === 'pending').length || 0;

  if (pendingCount === 0) return null;

  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
      {pendingCount}
    </span>
  );
}

function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fix #14: Improved mobile responsiveness */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
            Find Expert Consultants
            <br className="hidden sm:block" />
            <span className="text-[#FF5A5F]"> Instantly</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Get help with your specific problems in minutes via metered video calls. No contracts, just results.
          </p>
          <Link
            to="/consultants"
            className="inline-block bg-[#FF5A5F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-[#E04F54] transition shadow-xl shadow-[#FF5A5F]/30 hover:scale-105 transform"
          >
            Browse Consultants
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App
