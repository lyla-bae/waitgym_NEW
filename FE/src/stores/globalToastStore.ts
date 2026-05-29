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
}

interface GlobalToastState {
  toast: GlobalToastItem | null
  show: (item: Omit<GlobalToastItem, 'id'>) => void
  clear: () => void
}

export const useGlobalToastStore = create<GlobalToastState>((set, get) => ({
  toast: null,
  show: (item) => {
    // action이 있는 토스트(YOUR_TURN)는 이미 떠 있으면 덮어쓰지 않음
    const current = get().toast
    if (current?.action && !item.action) return
    set({ toast: { id: Date.now().toString(), ...item } })
  },
  clear: () => set({ toast: null }),
}))
