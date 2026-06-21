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
  completedMissions: { id: number; name: string; rewardPoints: number }[]
  routineId: number | null
  routineName: string
  start: (params: {
    waitingId: number
    equipmentName: string
    sets: number
    restSeconds: number
    routineId?: number | null
    routineName?: string
  }) => void
  completeSet: (workMs: number) => boolean
  addRestMs: (ms: number) => void
  setCompletedMissions: (missions: { id: number; name: string; rewardPoints: number }[]) => void
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
  completedMissions: [] as { id: number; name: string; rewardPoints: number }[],
  routineId: null,
  routineName: '',
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
      routineId: params.routineId ?? null,
      routineName: params.routineName ?? '',
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

  setCompletedMissions: (missions) => set({ completedMissions: missions }),

  reset: () => set(initialState),
}))
