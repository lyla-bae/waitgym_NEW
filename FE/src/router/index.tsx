import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/components/Layout'
import HomePage from '@/pages/Home'
import LoginPage from '@/pages/Login'
import AuthCallbackPage from '@/pages/AuthCallback'
import EquipmentDetailPage from '@/pages/EquipmentDetail'
import WaitingPage from '@/pages/Waiting'
import MissionPage from '@/pages/Mission'
import RoutinePage from '@/pages/Routine'
import MyPage from '@/pages/MyPage'
import NotificationPage from '@/pages/Notification'
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
          { path: '/routine', element: <RoutinePage /> },
          { path: '/mypage', element: <MyPage /> },
          { path: '/notifications', element: <NotificationPage /> },
          { path: '/reservation/select-equipment', element: <SelectEquipmentPage /> },
          { path: '/reservation/goal-setting', element: <GoalSettingPage /> },
          { path: '/reservation/wait-request', element: <WaitRequestPage /> },
          { path: '/workout/exercising', element: <ExercisingPage /> },
          { path: '/workout/complete', element: <CompletePage /> },
        ],
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
