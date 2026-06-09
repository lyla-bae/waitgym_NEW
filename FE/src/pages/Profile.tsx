import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Header from '@/components/Header'
import ConfirmDrawer from '@/components/ConfirmDrawer'
import { useAuthStore } from '@/stores/authStore'
import { authFetch } from '@/lib/api'
import thumbDefault from '@/assets/images/thumb-default.jpg'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleDeleteAccount() {
    try {
      await authFetch('/users/me', { method: 'DELETE' })
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      // 실패해도 로그아웃 처리
      await signOut()
      navigate('/login', { replace: true })
    }
  }


  return (
    <div className="profile-page">
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        title="개인정보 수정"
      />

      <div className="content-scroll">
        <div className="profile-page__container">
          <div className="profile-page__avatar-wrap">
            <img
              src={user?.avatar ?? thumbDefault}
              alt="프로필"
              className="profile-page__avatar"
              onError={(e) => { e.currentTarget.src = thumbDefault }}
            />
          </div>

          <div className="profile-page__fields">
            <div className="profile-page__field">
              <label htmlFor="profile-email" className="profile-page__label">아이디</label>
              <input
                id="profile-email"
                type="text"
                className="profile-page__input"
                value={user?.email ?? ''}
                readOnly
              />
            </div>
            <div className="profile-page__field">
              <label htmlFor="profile-name" className="profile-page__label">이름</label>
              <input
                id="profile-name"
                type="text"
                className="profile-page__input"
                value={user?.name ?? ''}
                readOnly
              />
            </div>
          </div>

          <button
            type="button"
            className="profile-page__withdraw"
            onClick={() => setShowDeleteConfirm(true)}
          >
            탈퇴하기
          </button>
        </div>
      </div>

      <ConfirmDrawer
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      >
        <p className="routine-confirm-drawer__title">정말 탈퇴하시겠어요?</p>
        <p className="routine-confirm-drawer__desc">탈퇴하면 모든 데이터가 삭제되며 복구할 수 없어요.</p>
      </ConfirmDrawer>
    </div>
  )
}
