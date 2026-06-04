import { create } from 'zustand'

interface WorkoutState {
  waitingId: number | null
  equipmentName: string
  sets: number
  restSeconds: number
  currentSet: number
  startedAt: Date | null
  totalWorkMs: number
  totalRestMs: number
  start: (params: {
    waitingId: number
    equipmentName: string
    sets: number
    restSeconds: number
  }) => void
  completeSet: (workMs: number) => boolean
  addRestMs: (ms: number) => void
  reset: () => void
}

const initialState = {
  waitingId: null,
  equipmentName: '',
  sets: 0,
  restSeconds: 0,
  currentSet: 1,
  startedAt: null,
  totalWorkMs: 0,
  totalRestMs: 0,
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  ...initialState,

  start: (params) =>
    set({
      waitingId: params.waitingId,
      equipmentName: params.equipmentName,
      sets: params.sets,
      restSeconds: params.restSeconds,
      currentSet: 1,
      startedAt: new Date(),
      totalWorkMs: 0,
      totalRestMs: 0,
    }),

  // workMs: 이번 세트 운동 시간. true 반환 시 마지막 세트 완료
  completeSet: (workMs) => {
    const { currentSet, sets } = get()
    set((s) => ({ totalWorkMs: s.totalWorkMs + workMs }))
    if (currentSet >= sets) return true
    set((s) => ({ currentSet: s.currentSet + 1 }))
    return false
  },

  addRestMs: (ms) => set((s) => ({ totalRestMs: s.totalRestMs + ms })),

  reset: () => set(initialState),
}))
