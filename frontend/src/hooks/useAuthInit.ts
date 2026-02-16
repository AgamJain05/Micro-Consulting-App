import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

/**
 * Hook to initialize auth state on app mount
 * Fetches user data if a valid auth cookie exists
 */
export function useAuthInit() {
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Only run once on mount
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initAuth = async () => {
            const { user, setAuth } = useAuthStore.getState();

            // Skip on auth pages (login, register, callback, select-role)
            const currentPath = window.location.pathname;
            const authPages = ['/login', '/register', '/auth/callback', '/auth/select-role'];
            if (authPages.includes(currentPath)) {
                return;
            }

            // If user already exists in store, we're done
            if (user) {
                return;
            }

            try {
                // Try to fetch user data using the HTTP-only cookie
                const response = await api.get('/api/v1/auth/me');

                if (response.data) {
                    // Populate auth store with user data
                    // Note: We don't have the token in localStorage, but the cookie handles auth
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

                    // Set auth with user data and a placeholder token (cookie is the real auth)
                    setAuth(userWithId, 'cookie-auth');
                }
            } catch (error: any) {
                // Silently handle errors - 401 means no active session
                // Other errors are not critical for app initialization
            }
        };

        initAuth();
    }, []); // Empty dependency array - only run once on mount
}
