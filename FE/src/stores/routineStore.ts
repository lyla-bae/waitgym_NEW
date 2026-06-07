import { create } from 'zustand'
import type { Equipment } from '@/types'

export type RoutineExerciseItem = {
  equipmentId: number
  equipment: Equipment
  targetSets: number
  restSeconds: number
}

interface RoutineStore {
  name: string
  exercises: RoutineExerciseItem[]
  setName: (name: string) => void
  setExercises: (exercises: RoutineExerciseItem[]) => void
  addExercises: (equipments: Equipment[]) => void
  removeExercise: (equipmentId: number) => void
  updateExercise: (equipmentId: number, field: 'targetSets' | 'restSeconds', delta: number) => void
  reset: () => void
}

export const useRoutineStore = create<RoutineStore>((set) => ({
  name: '',
  exercises: [],
  setName: (name) => set({ name }),
  setExercises: (exercises) => set({ exercises }),
  addExercises: (equipments) =>
    set((state) => {
      const existing = new Set(state.exercises.map((e) => e.equipmentId))
      const newItems = equipments
        .filter((eq) => !existing.has(eq.id))
        .map((eq) => ({ equipmentId: eq.id, equipment: eq, targetSets: 3, restSeconds: 60 }))
      return { exercises: [...state.exercises, ...newItems] }
    }),
  removeExercise: (equipmentId) =>
    set((state) => ({ exercises: state.exercises.filter((e) => e.equipmentId !== equipmentId) })),
  updateExercise: (equipmentId, field, delta) =>
    set((state) => ({
      exercises: state.exercises.map((e) => {
        if (e.equipmentId !== equipmentId) return e
        if (field === 'targetSets') {
          const sets = Math.max(1, Math.min(8, e.targetSets + delta))
          const rest = sets < 2 ? 0 : e.restSeconds < 10 ? 10 : e.restSeconds
          return { ...e, targetSets: sets, restSeconds: rest }
        }
        const rest = Math.max(0, Math.min(300, e.restSeconds + delta))
        return { ...e, restSeconds: e.targetSets < 2 ? 0 : Math.max(10, rest) }
      }),
    })),
  reset: () => set({ name: '', exercises: [] }),
}))
