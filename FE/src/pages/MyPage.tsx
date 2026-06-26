import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Star, Headset, Settings, FileCheck2 } from 'lucide-react'
import Header from '@/components/Header'
import NotificationBell from '@/components/NotificationBell'
import thumbDefault from '@/assets/images/thumb-default.jpg'
import { useAuthStore } from '@/stores/authStore'
import { useGlobalToastStore } from '@/stores/globalToastStore'

export default function MyPage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const toast = useGlobalToastStore((s) => s.show)

  const comingSoon = () => toast({ message: '준비중입니다.' })

  const MENU_ITEMS = [
    { icon: User,       label: '개인정보 수정',    action: () => navigate('/mypage/profile') },
    { icon: Star,       label: '즐겨찾기한 기구',   action: () => navigate('/mypage/favorites') },
    { icon: Headset,    label: '고객센터',          action: comingSoon },
    { icon: Settings,   label: '앱 설정',           action: comingSoon },
    { icon: FileCheck2, label: '서비스 약관',        action: comingSoon },
  ]

  return (
    <motion.div className="mypage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2, ease: 'easeInOut' }}>
      <Header
        className="header--sub"
        title="내 정보"
        rightContent={
          <NotificationBell />
        }
      />

      <div className="content-scroll">
        <div className="mypage__container">
          <div className="mypage__greeting">
            <div className="mypage__greeting-msg">
              <p>안녕하세요</p>
              <span>{user?.name}</span>님
            </div>
            <div className="mypage__greeting-avatar">
              <img
                src={user?.avatar ?? thumbDefault}
                alt={user?.name ?? '프로필'}
                onError={(e) => { e.currentTarget.src = thumbDefault }}
              />
            </div>
          </div>

          <ul className="mypage__menu-list">
            {MENU_ITEMS.map(({ icon: Icon, label, action }) => (
              <li key={label}>
                <button type="button" className="mypage__menu" onClick={action}>
                  <Icon size={20} strokeWidth={1.5} />
                  {label}
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="mypage__logout" onClick={signOut}>
            로그아웃
          </button>
        </div>
      </div>
    </motion.div>
  )
}
