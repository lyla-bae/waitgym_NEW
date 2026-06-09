import { useState, useEffect } from 'react'
import LinearProgress from '@mui/material/LinearProgress'
import { CalendarClock } from 'lucide-react'
import Header from '@/components/Header'
import NotificationBell from '@/components/NotificationBell'
import { missionApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import motionStrong from '@/assets/images/motion-strong.png'
import motionTrophy from '@/assets/images/motion-trophy.png'
import type { MissionWithProgress, RankingUser } from '@/types'

type Tab = 'mission' | 'ranking'

export default function MissionPage() {
  const [tab, setTab] = useState<Tab>('mission')
  const { user } = useAuthStore()

  return (
    <div className="mission-page">
      <Header
        className="header--mission"
        leftContent={
          <nav className="mission-page__tabs">
            <button
              type="button"
              className={`mission-page__tab${tab === 'mission' ? ' mission-page__tab--active' : ''}`}
              onClick={() => setTab('mission')}
            >
              미션
            </button>
            <button
              type="button"
              className={`mission-page__tab${tab === 'ranking' ? ' mission-page__tab--active' : ''}`}
              onClick={() => setTab('ranking')}
            >
              랭킹
            </button>
          </nav>
        }
        rightContent={<NotificationBell />}
      />
      <div className="content-scroll">
        {tab === 'mission' ? (
          <MissionTab userName={user?.name ?? ''} />
        ) : (
          <RankingTab myId={user?.id} />
        )}
      </div>
    </div>
  )
}

function MissionTab({ userName }: { userName: string }) {
  const [missions, setMissions] = useState<MissionWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    missionApi.list()
      .then(setMissions)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mission-page__container">
      <div className="mission-page__greeting">
        <div className="mission-page__greeting-text">
          <h2 className="mission-page__greeting-msg">
            {userName}님, 미션달성을 위해<br />조금만 더 힘내세요!
          </h2>
        </div>
        <img src={motionStrong} alt="화이팅" className="mission-page__greeting-img" />
      </div>

      {isLoading ? (
        <p className="mission-page__loading">로딩 중...</p>
      ) : (
        <div className="mission-page__section">
          <p className="mission-page__count">총 {missions.length}개 미션</p>
          <ul className="mission-list">
            {missions.map((m) => (
              <li key={m.id} className={`mission-list__item${m.isCompleted ? ' mission-list__item--done' : ''}`}>
                <div className="mission-list__info">
                  <span className="mission-list__title">{m.name}</span>
                  <span className="mission-list__points">{m.rewardPoints}점</span>
                </div>
                <span className="mission-list__desc">{m.description}</span>
                <div className="mission-list__progress">
                  <LinearProgress
                    variant="determinate"
                    value={m.conditionValue > 0 ? Math.min((m.progress / m.conditionValue) * 100, 100) : 0}
                    className="mission-list__bar"
                  />
                  <span className="mission-list__fraction">
                    {Math.min(m.progress, m.conditionValue)}/{m.conditionValue}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RankingTab({ myId: _myId }: { myId?: number }) {
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    missionApi.ranking()
      .then((data) => setRanking(data.ranking))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

  return (
    <div className="mission-page__container">
      <div className="mission-page__greeting">
        <div className="mission-page__greeting-text">
          <h2 className="mission-page__greeting-msg">
            이번 주<br /><strong>챔피언은?</strong>
          </h2>
        </div>
        <img src={motionTrophy} alt="트로피" className="mission-page__greeting-img" />
      </div>

      {isLoading ? (
        <p className="mission-page__loading">로딩 중...</p>
      ) : (
        <div className="mission-page__section">
          <div className="mission-page__ranking-header">
            <div className="mission-page__date-wrap">
              <CalendarClock size={16} />
              <span className="mission-page__date-range">{fmt(monday)} ~ {fmt(sunday)}</span>
            </div>
            <span className="mission-page__count">참여자 {ranking.length}명</span>
          </div>
          {ranking.length === 0 ? (
            <p className="mission-page__empty">아직 이번 주 기록이 없어요</p>
          ) : (
            <ul className="ranking-list">
              {ranking.map((rankUser, i) => (
                <li
                  key={rankUser.id}
                  className={`ranking-list__item${i === 0 ? ' ranking-list__item--top1' : ''}`}
                >
                  <span className="ranking-list__rank">{i + 1}</span>
                  <div className="ranking-list__user">
                    <div className="ranking-list__avatar">
                      {rankUser.avatar ? (
                        <img src={rankUser.avatar} alt={rankUser.name} />
                      ) : (
                        <span className="ranking-list__avatar-placeholder">{rankUser.name[0]}</span>
                      )}
                    </div>
                    <span className="ranking-list__name">{rankUser.name}</span>
                  </div>
                  <span className="ranking-list__points">{rankUser.points.toLocaleString()}점</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
