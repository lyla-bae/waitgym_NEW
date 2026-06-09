import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import Layout from '@/components/Layout'
import HomePage from '@/pages/Home'
import LoginPage from '@/pages/Login'
import AuthCallbackPage from '@/pages/AuthCallback'
import EquipmentDetailPage from '@/pages/EquipmentDetail'
import WaitingPage from '@/pages/Waiting'
import MissionPage from '@/pages/Mission'
import RoutineEditPage from '@/pages/RoutineEdit'
import RoutineSelectEquipmentPage from '@/pages/RoutineSelectEquipment'
import MyPage from '@/pages/MyPage'
import ProfilePage from '@/pages/Profile'
import FavoritesPage from '@/pages/Favorites'
import NotificationPage from '@/pages/Notification'
import GymFinderPage from '@/pages/GymFinder'
import SelectEquipmentPage from '@/pages/SelectEquipment'
import GoalSettingPage from '@/pages/GoalSetting'
import WaitRequestPage from '@/pages/WaitRequest'
import ExercisingPage from '@/pages/Exercising'
import CompletePage from '@/pages/Complete'

function ProtectedRoute() {
  const { session, isLoading } = useAuthStore()
  if (isLoading) return <div className="flex items-center justify-center h-dvh">로딩 중...</div>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function WorkoutRoute() {
  const { waitingId } = useWorkoutStore()
  if (!waitingId) return <Navigate to="/reservation/select-equipment" replace />
  return <Outlet />
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/equipment/:id', element: <EquipmentDetailPage /> },
          { path: '/waiting/:id', element: <WaitingPage /> },
          { path: '/mission', element: <MissionPage /> },
          { path: '/routine/new', element: <RoutineEditPage /> },
          { path: '/routine/:id/edit', element: <RoutineEditPage /> },
          { path: '/routine/select-equipment', element: <RoutineSelectEquipmentPage /> },
          { path: '/mypage', element: <MyPage /> },
          { path: '/mypage/profile', element: <ProfilePage /> },
          { path: '/mypage/favorites', element: <FavoritesPage /> },
          { path: '/notifications', element: <NotificationPage /> },
          { path: '/gym-finder', element: <GymFinderPage /> },
          { path: '/reservation/select-equipment', element: <SelectEquipmentPage /> },
          { path: '/reservation/goal-setting', element: <GoalSettingPage /> },
          { path: '/reservation/wait-request', element: <WaitRequestPage /> },
          {
            element: <WorkoutRoute />,
            children: [
              { path: '/workout/exercising', element: <ExercisingPage /> },
              { path: '/workout/complete', element: <CompletePage /> },
            ],
          },
        ],
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
