import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Store, Search, Star } from 'lucide-react'
import Header from '@/components/Header'
import { authFetch } from '@/lib/api'

interface Gym {
  id: number
  kakaoId: string
  name: string
  address: string
  roadAddress?: string
}

interface KakaoGym {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
}

export default function GymFinderPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<KakaoGym[]>([])
  const [savedGyms, setSavedGyms] = useState<Gym[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    authFetch<Gym[]>('/api/users/gyms')
      .then(setSavedGyms)
      .catch(() => setSavedGyms([]))
  }, [])

  async function handleSearch() {
    if (!search.trim()) return
    setIsLoading(true)
    try {
      const data = await authFetch<{ gyms: KakaoGym[] }>(`/api/users/gyms/search?q=${encodeURIComponent(search)}`)
      setResults(data.gyms ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(gym: KakaoGym) {
    try {
      await authFetch('/api/users/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kakaoId: gym.id,
          name: gym.place_name,
          address: gym.address_name,
          roadAddress: gym.road_address_name,
        }),
      })
      const updated = await authFetch<Gym[]>('/api/users/gyms')
      setSavedGyms(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const isSaved = (kakaoId: string) => savedGyms.some((g) => g.kakaoId === kakaoId)

  const displayList = showSaved
    ? savedGyms.map((g) => ({ id: g.kakaoId, place_name: g.name, address_name: g.address, road_address_name: g.roadAddress ?? '' }))
    : results

  return (
    <div className="gym-finder">
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        title="헬스장 찾기"
      />

      <div className="content-scroll">
        <div className="select-equipment-page__search">
          <div className="search-bar">
            <input
              type="search"
              className="search-bar__input"
              placeholder="헬스장 이름을 검색해보세요"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-bar__icon" onClick={handleSearch} aria-label="검색">
              <Search size={20} />
            </button>
          </div>
        </div>

        <div className="select-equipment-page__filter">
          <div className="category-filter">
            <button
              type="button"
              className={`category-filter__tab${!showSaved ? ' category-filter__tab--active' : ''}`}
              onClick={() => setShowSaved(false)}
            >
              검색결과
            </button>
            <button
              type="button"
              className={`category-filter__tab${showSaved ? ' category-filter__tab--active' : ''}`}
              onClick={() => setShowSaved(true)}
            >
              <Star size={12} fill={showSaved ? 'white' : 'none'} />
              저장됨
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="gym-finder__empty">검색 중...</p>
        ) : displayList.length === 0 ? (
          <p className="gym-finder__empty">
            {showSaved ? '저장된 헬스장이 없어요' : '헬스장을 검색해보세요'}
          </p>
        ) : (
          <ul className="gym-finder__list">
            {displayList.map((gym) => (
              <li key={gym.id}>
                <button
                  type="button"
                  className={`gym-finder__item${isSaved(gym.id) ? ' gym-finder__item--saved' : ''}`}
                  onClick={() => !showSaved && handleSave(gym)}
                >
                  <div className="gym-finder__thumb">
                    <Store size={24} strokeWidth={1.5} />
                  </div>
                  <div className="gym-finder__info">
                    <p className="gym-finder__name">{gym.place_name}</p>
                    <p className="gym-finder__address">{gym.road_address_name || gym.address_name}</p>
                  </div>
                  <span className={`gym-finder__save-btn${isSaved(gym.id) ? ' gym-finder__save-btn--saved' : ''}`}>
                    <Star size={20} strokeWidth={1.5} fill={isSaved(gym.id) ? 'currentColor' : 'none'} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
