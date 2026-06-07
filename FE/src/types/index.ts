export interface User {
  id: number
  email: string
  name: string
  avatar?: string
  googleId?: string
  createdAt: string
}

export interface Equipment {
  id: number
  name: string
  imageUrl?: string
  category: string
  muscleGroup?: string
  createdAt: string
  isFavorite?: boolean
  currentUsage?: EquipmentUsage | null
  waitingCount?: number
  isBeingUsed?: boolean
}

export type EquipmentCategory =
  | '가슴'
  | '등'
  | '다리'
  | '어깨'
  | '팔'
  | '유산소'
  | '전체'

export interface EquipmentUsage {
  id: number
  equipmentId: number
  userId: number
  startedAt: string
  endedAt?: string
  estimatedEndAt?: string
  totalSets: number
  restSeconds: number
  status: 'IN_USE' | 'COMPLETED'
  currentSet: number
  setStatus: 'EXERCISING' | 'RESTING' | 'COMPLETED' | 'STOPPED' | 'FORCE_COMPLETED'
  currentSetStartedAt?: string
  restStartedAt?: string
}

export interface WaitingQueue {
  id: number
  equipmentId: number
  userId: number
  queuePosition: number
  status: 'WAITING' | 'USING' | 'COMPLETED' | 'CANCELLED'
  sets: number
  restSeconds: number
  startedAt?: string
  createdAt: string
  notifiedAt?: string
}

export interface WorkoutRoutine {
  id: number
  userId: number
  name: string
  isActive: boolean
  exercises: RoutineExercise[]
  createdAt: string
  updatedAt: string
}

export interface RoutineExercise {
  id: number
  routineId: number
  equipmentId: number
  order: number
  targetSets: number
  targetReps?: string
  restSeconds: number
  notes?: string
  equipment?: Equipment
}

export interface Notification {
  id: number
  userId: number
  type: string
  category: 'queue' | 'workout' | 'eta' | 'other'
  priority: number
  title: string
  message: string
  isRead: boolean
  equipmentId?: number
  equipmentName?: string
  queueId?: number
  usageId?: number
  createdAt: string
  readAt?: string
}

export interface Mission {
  id: number
  name: string
  description: string
  condition: string
  conditionValue: number
  rewardPoints: number
}

export interface MissionWithProgress extends Mission {
  progress: number
  isCompleted: boolean
  completedAt?: string | null
}

export interface RankingUser {
  id: number
  name: string
  avatar?: string
  points: number
}

export interface UserMission {
  id: number
  userId: number
  missionId: number
  progress: number
  isCompleted: boolean
  completedAt?: string
  mission: Mission
}

export interface Gym {
  id: string
  name: string
  address: string
  roadAddress?: string
  phone?: string
  latitude?: number
  longitude?: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  message: string
  statusCode: number
}
