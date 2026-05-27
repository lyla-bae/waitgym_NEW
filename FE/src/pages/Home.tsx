import { useNavigate } from 'react-router-dom'
import { Plus, Bell } from 'lucide-react'
import Header from '@/components/Header'
import { useAuthStore } from '@/stores/authStore'
import logo from '@/assets/images/logo.svg'

export default function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const userName = session?.user?.user_metadata?.full_name ?? '회원'

  return (
    <div className="home-page">
      <main className="content-scroll">
        <Header
          className="header--home"
          leftContent={
            <img src={logo} alt="기다려짐" className="header__logo" />
          }
          rightContent={
            <button type="button" className="header__action" aria-label="알림" onClick={() => navigate('/notifications')}>
              <Bell size={22} />
            </button>
          }
        />

        <div className="home-page__greeting">
          <p><strong>{userName}님,</strong></p>
          <h1>오늘도 루틴대로 운동해볼까요?</h1>
        </div>

        <div className="home-page__container">
          <section>
            {/* 루틴 목록 - 5일차 구현 예정 */}
            <ul className="home-page__routine-list">
              <li>
                <button
                  type="button"
                  className="home-page__routine-item"
                  onClick={() => navigate('/routine')}
                >
                  <div className="home-page__routine-icon">
                    <Plus size={24} strokeWidth={1.5} />
                  </div>
                  <div className="home-page__routine-info">
                    <p className="home-page__routine-title">루틴을 등록해주세요</p>
                  </div>
                </button>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <div className="btn-wrap">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/reservation/select-equipment')}
        >
          바로 운동
        </button>
        <button
          type="button"
          className="btn btn--white"
          onClick={() => navigate('/routine')}
        >
          루틴 추가
        </button>
      </div>
    </div>
  )
}
