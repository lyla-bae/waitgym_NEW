import { authFetch } from '@/lib/api'
import type { Equipment, WaitingQueue } from '@/types'

export const waitingApi = {
  register: (body: { equipmentId: number; sets: number; restSeconds: number }) =>
    authFetch<WaitingQueue & { waitingCount: number }>('/waiting', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  my: () => authFetch<(WaitingQueue & { waitingCount: number; equipment: Equipment })[]>('/waiting/my'),
  cancel: (id: number) =>
    authFetch<{ message: string }>(`/waiting/${id}`, { method: 'DELETE' }),
  request: (id: number) =>
    authFetch<{ myTurn: boolean }>(`/waiting/${id}/request`, { method: 'POST' }),
  start: (id: number) =>
    authFetch<WaitingQueue & { equipment: Equipment }>(`/waiting/${id}/start`, { method: 'PATCH' }),
  complete: (id: number, body?: { actualWorkMs?: number; actualRestMs?: number }) =>
    authFetch<{ message: string; completedMissions: { id: number; name: string; rewardPoints: number }[] }>(`/waiting/${id}/complete`, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  quickStart: (body: { equipmentId: number; sets: number; restSeconds: number }) =>
    authFetch<WaitingQueue & { equipment: Equipment }>('/waiting/quick-start', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
