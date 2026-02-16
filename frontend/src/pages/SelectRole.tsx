import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

export const SelectRole = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const tempToken = searchParams.get('token');

    useEffect(() => {
        if (!tempToken) {
            toast.error('Invalid access. Please try again.');
            navigate('/login');
        }
    }, [tempToken, navigate]);

    const selectRole = async (role: 'client' | 'consultant') => {
        setLoading(true);
        try {
            const res = await api.post('/api/v1/auth/google/complete', {
                role,
                temp_token: tempToken
            });

            setAuth(res.data.user, res.data.token);
            toast.success('Account created successfully!');

            // Redirect based on role
            if (role === 'consultant') {
                navigate('/dashboard');
            } else {
                navigate('/consultants');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to complete signup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-xl">
                <h2 className="text-3xl font-bold text-center mb-2">
                    Welcome! 👋
                </h2>
                <p className="text-gray-600 text-center mb-8">
                    How would you like to use Micro Consulting?
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Client Card */}
                    <button
                        onClick={() => selectRole('client')}
                        disabled={loading}
                        className="p-8 border-2 border-gray-200 rounded-2xl hover:border-[#FF5A5F] hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="text-6xl mb-4">👤</div>
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-[#FF5A5F]">
                            I'm a Client
                        </h3>
                        <p className="text-gray-600">
                            Find and book consultations with experts
                        </p>
                    </button>

                    {/* Consultant Card */}
                    <button
                        onClick={() => selectRole('consultant')}
                        disabled={loading}
                        className="p-8 border-2 border-gray-200 rounded-2xl hover:border-[#FF5A5F] hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="text-6xl mb-4">💼</div>
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-[#FF5A5F]">
                            I'm a Consultant
                        </h3>
                        <p className="text-gray-600">
                            Offer your expertise and help clients
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};
