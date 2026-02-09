import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const res = await api.post('/api/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = res.data.access_token;

      // Get User details
      const userRes = await api.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend returns _id, we need to normalize to id
      const userData = userRes.data;

      // Build the auth user with proper id field
      const authUser = {
        id: userData.id || userData._id, // Handle both cases
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        credits: userData.credits || 0,
      };

      setAuth(authUser, token);

      // Show success toast
      toast.success(`Welcome back, ${authUser.first_name}!`);

      // Redirect based on role
      if (authUser.role === 'consultant') {
        navigate('/dashboard');
      } else if (authUser.role === 'client') {
        navigate('/consultants');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-[#FF5A5F] p-3 rounded-2xl">
              <span className="material-icons-round text-white text-3xl">diversity_3</span>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Sign in to continue to MicroConsult</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-soft p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3">
              <span className="material-icons-round text-red-500">error</span>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  email
                </span>
                <input
                  type="email"
                  {...register('email', { required: true })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">Email is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  lock
                </span>
                <input
                  type="password"
                  {...register('password', { required: true })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">Password is required</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF5A5F] hover:bg-[#E04F54] text-white py-3 px-4 rounded-xl font-bold text-base transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-icons-round">login</span>
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#FF5A5F] hover:text-[#E04F54] font-bold">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <span className="material-icons-round text-green-500 text-sm">verified_user</span>
            Your data is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
};
