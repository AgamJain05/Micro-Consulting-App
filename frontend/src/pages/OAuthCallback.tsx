import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

export const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const hasHandledCallback = useRef(false);

    useEffect(() => {
        // Only run once
        if (hasHandledCallback.current) return;
        hasHandledCallback.current = true;

        const handleCallback = async () => {
            // Check for error from OAuth
            const errorParam = searchParams.get('error');
            if (errorParam) {
                const errorMessages: Record<string, string> = {
                    invalid_state: 'Security validation failed. Please try again.',
                    no_email: 'Could not retrieve email from Google.',
                    oauth_failed: 'Authentication failed. Please try again.',
                };

                const message = errorMessages[errorParam] || 'Authentication failed.';
                toast.error(message);
                setError(message);
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            try {
                // Fetch user data using the HTTP-only cookie
                const response = await api.get('/api/v1/auth/me');

                if (response.data) {
                    const userData = response.data;
                    const userWithId = {
                        id: userData.id || userData._id,
                        email: userData.email,
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        role: userData.role,
                        credits: userData.credits || 0,
                        avatar_url: userData.avatar_url,
                    };

                    // Set auth state using getState() to avoid dependency
                    useAuthStore.getState().setAuth(userWithId, 'cookie-auth');

                    // Show welcome message
                    toast.success(`Welcome back, ${userWithId.first_name}!`);

                    // Redirect based on role
                    if (userWithId.role === 'consultant') {
                        navigate('/dashboard');
                    } else {
                        navigate('/consultants');
                    }
                }
            } catch (err: any) {
                console.error('OAuth callback error:', err);
                toast.error('Failed to complete authentication. Please try again.');
                setError('Authentication failed');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        handleCallback();
    }, []); // Empty dependency array - only run once

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#FF5A5F] mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h2>
                <p className="text-gray-600">Please wait while we set up your account...</p>
            </div>
        </div>
    );
};
