/**
 * ============================================
 * stores/authStore.js - Authentication State
 * ============================================
 *
 * Gestión de estado de autenticación con Zustand.
 * Mantiene compatibilidad con window.* para código legacy.
 *
 * @author MindLoopIA
 * @version 1.0.0
 */

import { createStore } from 'zustand/vanilla';

/**
 * Auth Store - Estado de autenticación
 */
export const authStore = createStore((set, get) => ({
    // State
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    // Actions
    setUser: (user) => {
        set({ user, isAuthenticated: !!user, isLoading: false });
        // Sync with window for legacy compatibility
        if (typeof window !== 'undefined') {
            window.currentUser = user;
            window.isAuthenticated = !!user;
        }
    },

    setToken: (token) => {
        set({ token });
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
        // Sync with window
        if (typeof window !== 'undefined') {
            window.authToken = token;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error de autenticación');
            }

            const data = await response.json();
            get().setUser(data.user);
            get().setToken(data.token);

            return { success: true, user: data.user };
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
        }
    },

    logout: async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.warn('Logout API error:', e);
        }

        set({ user: null, token: null, isAuthenticated: false, error: null });
        localStorage.removeItem('token');

        // Clear window references
        if (typeof window !== 'undefined') {
            window.currentUser = null;
            window.isAuthenticated = false;
            window.authToken = null;
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const response = await fetch('/api/auth/verify', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                get().setUser(data.user);
                return true;
            } else {
                get().logout();
                return false;
            }
        } catch (error) {
            get().logout();
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null })
}));

// Getters for external use
export const getAuthState = () => authStore.getState();
export const getUser = () => authStore.getState().user;
export const isAuthenticated = () => authStore.getState().isAuthenticated;

// Subscribe helper
export const subscribeToAuth = (callback) => authStore.subscribe(callback);

// Initialize window compatibility layer
if (typeof window !== 'undefined') {
    window.authStore = authStore;
    window.getAuthState = getAuthState;
}

export default authStore;
