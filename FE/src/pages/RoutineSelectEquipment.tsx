import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { equipmentApi } from '@/api/equipment'
import Header from '@/components/Header'
import EquipmentCard from '@/components/EquipmentCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRoutineStore } from '@/stores/routineStore'
import type { Equipment } from '@/types'

const CATEGORIES = ['전체', '즐겨찾기', '가슴', '등', '다리', '어깨', '팔', '유산소'] as const

export default function RoutineSelectEquipmentPage() {
  const navigate = useNavigate()
  const { exercises, addExercises } = useRoutineStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('전체')
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Equipment[]>([])

  const alreadyAdded = new Set(exercises.map((e) => e.equipmentId))

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
    const timer = setTimeout(fetchEquipments, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchEquipments, search])

  const handleFavoriteToggle = async (id: number) => {
    try {
      const { isFavorite } = await equipmentApi.toggleFavorite(id)
      setEquipments((prev) => prev.map((e) => (e.id === id ? { ...e, isFavorite } : e)))
      if (activeCategory === '즐겨찾기' && !isFavorite) {
        setEquipments((prev) => prev.filter((e) => e.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  function toggleSelect(eq: Equipment) {
    if (alreadyAdded.has(eq.id)) return
    setSelected((prev) =>
      prev.some((e) => e.id === eq.id) ? prev.filter((e) => e.id !== eq.id) : [...prev, eq],
    )
  }

  function handleAdd() {
    addExercises(selected)
    navigate(-1)
  }

  return (
    <motion.div className="select-equipment-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2, ease: 'easeInOut' }}>
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        title="기구 선택"
      />

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

      <section className={`select-equipment-page__list${selected.length > 0 ? ' select-equipment-page__list--with-cta' : ''}`}>
        {loading ? (
          <ul className="select-equipment-page__equipment-list" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <div className="equipment-card equipment-card-sk">
                  <Skeleton className="equipment-card-sk__image" />
                  <div className="equipment-card-sk__body">
                    <Skeleton className="equipment-card-sk__name" />
                    <Skeleton className="equipment-card-sk__status" />
                  </div>
                  <Skeleton className="equipment-card-sk__favorite" />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="select-equipment-page__error">
            <p className="select-equipment-page__error-msg">오류: {error}</p>
            <button type="button" className="select-equipment-page__retry" onClick={fetchEquipments}>
              다시 시도
            </button>
          </div>
        ) : equipments.length === 0 ? (
          <p className="select-equipment-page__empty">기구를 찾을 수 없어요</p>
        ) : (
          <ul className="select-equipment-page__equipment-list">
            {equipments.map((equipment) => {
              const isAdded = alreadyAdded.has(equipment.id)
              const isSelected = selected.some((e) => e.id === equipment.id)
              return (
                <li key={equipment.id} className={`routine-equip-select__item${isSelected ? ' routine-equip-select__item--selected' : ''}${isAdded ? ' routine-equip-select__item--added' : ''}`}>
                  <EquipmentCard
                    equipment={equipment}
                    onFavoriteToggle={handleFavoriteToggle}
                    onClick={() => toggleSelect(equipment)}
                  />
                  {isAdded && <span className="routine-equip-select__badge">추가됨</span>}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {selected.length > 0 && (
        <div className="btn-wrap">
          <button type="button" className="btn btn--white btn--full" onClick={handleAdd}>
            {selected.length}개 추가
          </button>
        </div>
      )}
    </motion.div>
  )
}
