import { useAuthStore } from '@/stores/authStore'
import { LogOut } from 'lucide-react'

export default function MyPage() {
  const { user, signOut } = useAuthStore()

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {user?.avatar && (
          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
        )}
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>

      <button
        onClick={signOut}
        className="flex items-center gap-2 text-red-400 text-sm mt-4"
      >
        <LogOut size={16} />
        로그아웃
      </button>
    </div>
  )
}
