import { authFetch } from '@/lib/api'
import type { MissionWithProgress, RankingUser } from '@/types'

export const missionApi = {
  list: () => authFetch<MissionWithProgress[]>('/missions'),
  ranking: () => authFetch<{ ranking: RankingUser[]; myId: number }>('/missions/ranking'),
}
