import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star } from 'lucide-react'
import { equipmentApi } from '@/lib/api'
import EquipmentCard from '@/components/EquipmentCard'
import type { Equipment } from '@/types'

const CATEGORIES = ['즐겨찾기', '전체', '가슴', '등', '다리', '어깨', '팔', '유산소'] as const

export default function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('전체')
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEquipments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await equipmentApi.list({
        category: activeTab !== '즐겨찾기' ? activeTab : undefined,
        search: search || undefined,
        favorites: activeTab === '즐겨찾기',
      })
      setEquipments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search])

  useEffect(() => {
    const timer = setTimeout(fetchEquipments, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchEquipments, search])

  const handleFavoriteToggle = async (id: number) => {
    try {
      const { isFavorite } = await equipmentApi.toggleFavorite(id)
      setEquipments((prev) => prev.map((e) => (e.id === id ? { ...e, isFavorite } : e)))
      if (activeTab === '즐겨찾기' && !isFavorite) {
        setEquipments((prev) => prev.filter((e) => e.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="home-page">
      <div className="home-page__search">
        <div className="search-bar">
          <input
            type="search"
            className="search-bar__input"
            placeholder="기구명, 부위를 검색해보세요"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="기구 검색"
          />
          <span className="search-bar__icon" aria-hidden="true">
            <Search size={20} />
          </span>
        </div>
      </div>

      <div className="home-page__filter">
        <div className="category-filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-filter__tab${activeTab === cat ? ' category-filter__tab--active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat === '즐겨찾기' && (
                <span className="category-filter__tab-icon" aria-hidden="true">
                  <Star size={12} fill={activeTab === '즐겨찾기' ? 'white' : 'none'} />
                </span>
              )}
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="home-page__list">
        {loading ? (
          <p className="home-page__empty">불러오는 중...</p>
        ) : error ? (
          <div className="home-page__error">
            <p className="home-page__error-msg">오류: {error}</p>
            <button type="button" className="home-page__retry" onClick={fetchEquipments}>
              다시 시도
            </button>
          </div>
        ) : equipments.length === 0 ? (
          <p className="home-page__empty">기구를 찾을 수 없어요</p>
        ) : (
          <ul className="home-page__equipment-list">
            {equipments.map((equipment) => (
              <li key={equipment.id}>
                <EquipmentCard
                  equipment={equipment}
                  onFavoriteToggle={handleFavoriteToggle}
                  onClick={() => navigate(`/equipment/${equipment.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
