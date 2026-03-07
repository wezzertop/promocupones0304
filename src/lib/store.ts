import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  description?: string
  duration?: number
}

interface UIState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  isHeaderVisible: boolean
  setHeaderVisible: (visible: boolean) => void
  
  // Toast System
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  isHeaderVisible: true,
  setHeaderVisible: (visible) => set({ isHeaderVisible: visible }),
  
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    
    // Auto remove
    if (toast.duration !== 0) {
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
        }, toast.duration || 4000)
    }
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
