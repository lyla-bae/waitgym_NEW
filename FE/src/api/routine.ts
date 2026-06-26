import { authFetch } from '@/lib/api'
import type { WorkoutRoutine } from '@/types'

export const routineApi = {
  list: () => authFetch<WorkoutRoutine[]>('/routines'),
  detail: (id: number) => authFetch<WorkoutRoutine>(`/routines/${id}`),
  create: (body: { name: string; exercises: { equipmentId: number; targetSets: number; restSeconds: number }[] }) =>
    authFetch<WorkoutRoutine>('/routines', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: { name: string; exercises: { equipmentId: number; targetSets: number; restSeconds: number }[] }) =>
    authFetch<WorkoutRoutine>(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => authFetch<{ message: string }>(`/routines/${id}`, { method: 'DELETE' }),
}
