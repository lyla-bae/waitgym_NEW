import { create } from 'zustand'

interface ToastAction {
  label: string
  onClick: () => void
}

export interface GlobalToastItem {
  id: string
  message: string
  duration?: number
  action?: ToastAction
  onClick?: () => void
}

interface GlobalToastState {
  toast: GlobalToastItem | null
  show: (item: Omit<GlobalToastItem, 'id'>) => void
  clear: () => void
}

export const useGlobalToastStore = create<GlobalToastState>((set) => ({
  toast: null,
  show: (item) => set({ toast: { id: Date.now().toString(), ...item } }),
  clear: () => set({ toast: null }),
}))
