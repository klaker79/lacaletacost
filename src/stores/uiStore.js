/**
 * ============================================
 * stores/uiStore.js - UI State Management
 * ============================================
 *
 * Gestión de estado de UI con Zustand.
 * Incluye: modales, toasts, loading, sidebar, tabs.
 *
 * @author MindLoopIA
 * @version 1.0.0
 */

import { createStore } from 'zustand/vanilla';

/**
 * UI Store - Estado de interfaz
 */
export const uiStore = createStore((set, get) => ({
    // State
    activeTab: 'ingredientes',
    isSidebarOpen: true,
    isLoading: false,
    loadingMessage: '',

    // Modals
    activeModal: null,
    modalData: null,

    // Toasts/Notifications
    toasts: [],

    // Theme
    theme: localStorage.getItem('theme') || 'light',

    // Actions - Tabs
    setActiveTab: (tab) => {
        set({ activeTab: tab });
        // Sync with window for legacy compatibility
        if (typeof window !== 'undefined') {
            window.tabActual = tab;
            // Dispatch event for legacy listeners
            window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab } }));
        }
    },

    // Actions - Sidebar
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    openSidebar: () => set({ isSidebarOpen: true }),
    closeSidebar: () => set({ isSidebarOpen: false }),

    // Actions - Loading
    setLoading: (isLoading, message = '') => {
        set({ isLoading, loadingMessage: message });
        // Sync with window
        if (typeof window !== 'undefined') {
            window.isLoading = isLoading;
        }
    },

    // Actions - Modals
    openModal: (modalId, data = null) => {
        set({ activeModal: modalId, modalData: data });
        // Dispatch event for legacy modal handlers
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('modalOpen', { detail: { modalId, data } }));
        }
    },

    closeModal: () => {
        const { activeModal } = get();
        set({ activeModal: null, modalData: null });
        // Dispatch event for legacy modal handlers
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('modalClose', { detail: { modalId: activeModal } }));
        }
    },

    // Actions - Toasts
    showToast: (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        const toast = { id, message, type, duration };

        set((state) => ({
            toasts: [...state.toasts, toast]
        }));

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                get().removeToast(id);
            }, duration);
        }

        return id;
    },

    showSuccess: (message, duration = 3000) => get().showToast(message, 'success', duration),
    showError: (message, duration = 5000) => get().showToast(message, 'error', duration),
    showWarning: (message, duration = 4000) => get().showToast(message, 'warning', duration),
    showInfo: (message, duration = 3000) => get().showToast(message, 'info', duration),

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }));
    },

    clearToasts: () => set({ toasts: [] }),

    // Actions - Theme
    setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
    },

    // Utilities
    isModalOpen: (modalId) => get().activeModal === modalId,
    getModalData: () => get().modalData
}));

// Getters for external use
export const getActiveTab = () => uiStore.getState().activeTab;
export const isLoading = () => uiStore.getState().isLoading;
export const getToasts = () => uiStore.getState().toasts;

// Convenience functions
export const showToast = (message, type, duration) => uiStore.getState().showToast(message, type, duration);
export const showSuccess = (message) => uiStore.getState().showSuccess(message);
export const showError = (message) => uiStore.getState().showError(message);
export const openModal = (modalId, data) => uiStore.getState().openModal(modalId, data);
export const closeModal = () => uiStore.getState().closeModal();

// Subscribe helper
export const subscribeToUI = (callback) => uiStore.subscribe(callback);

// Initialize window compatibility layer
if (typeof window !== 'undefined') {
    window.uiStore = uiStore;
    window.showToast = showToast;
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.openModal = openModal;
    window.closeModal = closeModal;
}

export default uiStore;
