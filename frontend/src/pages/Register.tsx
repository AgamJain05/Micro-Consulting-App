import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      await api.post('/api/v1/auth/register', data);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
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
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Join MicroConsult</h2>
          <p className="text-gray-600">Create your account to get started</p>
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
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  {...register('first_name', { required: true })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">Required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  {...register('last_name', { required: true })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">Required</p>
                )}
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
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

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="client"
                    {...register('role')}
                    defaultChecked
                    className="peer sr-only"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-xl peer-checked:border-[#FF5A5F] peer-checked:bg-[#FF5A5F]/5 transition-all hover:border-gray-300">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-icons-round text-2xl text-gray-600 peer-checked:text-[#FF5A5F]">
                        person_search
                      </span>
                      <span className="text-sm font-bold text-gray-700">Find Experts</span>
                    </div>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="consultant"
                    {...register('role')}
                    className="peer sr-only"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-xl peer-checked:border-[#FF5A5F] peer-checked:bg-[#FF5A5F]/5 transition-all hover:border-gray-300">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-icons-round text-2xl text-gray-600 peer-checked:text-[#FF5A5F]">
                        work
                      </span>
                      <span className="text-sm font-bold text-gray-700">Offer Services</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF5A5F] hover:bg-[#E04F54] text-white py-3 px-4 rounded-xl font-bold text-base transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-icons-round">person_add</span>
              Create Account
            </button>
          </form>

          {/* Google OAuth */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${API_URL}/api/v1/auth/google/login`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition font-medium text-gray-700"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5"
                />
                Sign up with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FF5A5F] hover:text-[#E04F54] font-bold">
                Sign in
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
