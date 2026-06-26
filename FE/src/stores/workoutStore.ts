import { create } from 'zustand'

interface WorkoutState {
  waitingId: number | null
  equipmentId: number | null
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
  restEndAt: number | null
  restStartedAt: number | null
  completedEquipmentIds: number[]
  completedRoutineId: number | null
  start: (params: {
    waitingId: number
    equipmentId: number
    equipmentName: string
    sets: number
    restSeconds: number
    routineId?: number | null
    routineName?: string
  }) => void
  completeSet: (workMs: number) => boolean
  addRestMs: (ms: number) => void
  setCompletedMissions: (missions: { id: number; name: string; rewardPoints: number }[]) => void
  setRestEndAt: (endAt: number | null) => void
  setRestStartedAt: (at: number | null) => void
  markCompleted: () => void
  reset: () => void
}

const initialState = {
  waitingId: null,
  equipmentId: null,
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
  restEndAt: null,
  restStartedAt: null,
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  ...initialState,
  completedEquipmentIds: [],
  completedRoutineId: null,

  start: (params) => {
    const { completedRoutineId } = get()
    const newRoutineId = params.routineId ?? null
    // 루틴이 바뀌면 완료 목록 초기화
    const shouldClear = newRoutineId !== completedRoutineId
    set({
      waitingId: params.waitingId,
      equipmentId: params.equipmentId,
      equipmentName: params.equipmentName,
      sets: params.sets,
      restSeconds: params.restSeconds,
      currentSet: 1,
      startedAt: new Date(),
      totalWorkMs: 0,
      totalRestMs: 0,
      routineId: newRoutineId,
      routineName: params.routineName ?? '',
      restEndAt: null,
      restStartedAt: null,
      ...(shouldClear && { completedEquipmentIds: [], completedRoutineId: newRoutineId }),
    })
  },

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

  setRestEndAt: (endAt) => set({ restEndAt: endAt }),

  setRestStartedAt: (at) => set({ restStartedAt: at }),

  markCompleted: () => {
    const { equipmentId, completedEquipmentIds } = get()
    if (equipmentId && !completedEquipmentIds.includes(equipmentId)) {
      set({ completedEquipmentIds: [...completedEquipmentIds, equipmentId] })
    }
  },

  reset: () => set(initialState),
}))
