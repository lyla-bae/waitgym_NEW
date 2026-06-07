import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Search, Star } from 'lucide-react'
import { equipmentApi, routineApi } from '@/lib/api'
import Header from '@/components/Header'
import EquipmentCard from '@/components/EquipmentCard'
import { useGlobalToastStore } from '@/stores/globalToastStore'
import type { Equipment } from '@/types'

const CATEGORIES = ['전체', '즐겨찾기', '가슴', '등', '다리', '어깨', '팔', '유산소'] as const

export default function SelectEquipmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routineId = searchParams.get('routineId')
  const routineName = searchParams.get('routineName')
  const parsedRoutineId = routineId ? parseInt(routineId) : null
  const isRoutineMode = !!parsedRoutineId && !isNaN(parsedRoutineId)

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('전체')
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useGlobalToastStore((s) => s.show)

  // 루틴모드: 루틴의 기구 목록만 표시
  const fetchRoutineEquipments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [routine, allEquipments] = await Promise.all([
        routineApi.detail(parsedRoutineId!),
        equipmentApi.list(),
      ])
      const equipmentMap = new Map(allEquipments.map((eq) => [eq.id, eq]))
      const ordered = routine.exercises
        .map((ex) => equipmentMap.get(ex.equipmentId))
        .filter((eq): eq is Equipment => !!eq)
      setEquipments(ordered)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [parsedRoutineId])

  // 일반모드: 전체 기구 목록
  const fetchEquipments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await equipmentApi.list({
        category: activeCategory !== '즐겨찾기' && activeCategory !== '전체' ? activeCategory : undefined,
        search: search || undefined,
        favorites: activeCategory === '즐겨찾기',
      })
      setEquipments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search])

  useEffect(() => {
    if (isRoutineMode) {
      fetchRoutineEquipments()
    }
  }, [isRoutineMode, fetchRoutineEquipments])

  useEffect(() => {
    if (isRoutineMode) return
    const timer = setTimeout(fetchEquipments, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [isRoutineMode, fetchEquipments, search])

  const handleFavoriteToggle = async (id: number) => {
    try {
      const { isFavorite } = await equipmentApi.toggleFavorite(id)
      setEquipments((prev) => prev.map((e) => (e.id === id ? { ...e, isFavorite } : e)))
      if (activeCategory === '즐겨찾기' && !isFavorite) {
        setEquipments((prev) => prev.filter((e) => e.id !== id))
      }
    } catch (e) {
      console.error(e)
      toast({ message: '즐겨찾기 변경에 실패했습니다.' })
    }
  }

  return (
    <div className="select-equipment-page">
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        title={isRoutineMode ? (routineName ?? '루틴') : '기구 선택'}
        rightContent={
          isRoutineMode ? (
            <button
              type="button"
              className="select-equipment-page__routine-edit"
              onClick={() => navigate(`/routine/${parsedRoutineId}/edit`)}
            >
              수정
            </button>
          ) : null
        }
      />

      {!isRoutineMode && (
        <>
          <div className="select-equipment-page__search">
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

          <div className="select-equipment-page__filter">
            <div className="category-filter">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-filter__tab${activeCategory === cat ? ' category-filter__tab--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === '즐겨찾기' && (
                    <span className="category-filter__tab-icon" aria-hidden="true">
                      <Star size={12} fill={activeCategory === '즐겨찾기' ? 'white' : 'none'} />
                    </span>
                  )}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <section className="select-equipment-page__list">
        {loading ? (
          <p className="select-equipment-page__empty">불러오는 중...</p>
        ) : error ? (
          <div className="select-equipment-page__error">
            <p className="select-equipment-page__error-msg">오류: {error}</p>
            <button type="button" className="select-equipment-page__retry" onClick={isRoutineMode ? fetchRoutineEquipments : fetchEquipments}>
              다시 시도
            </button>
          </div>
        ) : equipments.length === 0 ? (
          <p className="select-equipment-page__empty">기구를 찾을 수 없어요</p>
        ) : (
          <ul className="select-equipment-page__equipment-list">
            {equipments.map((equipment) => (
              <li key={equipment.id}>
                <EquipmentCard
                  equipment={equipment}
                  onFavoriteToggle={!isRoutineMode ? handleFavoriteToggle : undefined}
                  onClick={() =>
                    navigate(
                      `/reservation/goal-setting?equipmentId=${equipment.id}&name=${encodeURIComponent(equipment.name)}&imageUrl=${encodeURIComponent(equipment.imageUrl ?? '')}`,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
