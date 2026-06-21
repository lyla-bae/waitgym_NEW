import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Search, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import Switch from '@mui/material/Switch'
import { equipmentApi, routineApi } from '@/lib/api'
import { socket } from '@/lib/socket'
import Header from '@/components/Header'
import EquipmentCard from '@/components/EquipmentCard'
import { Skeleton } from '@/components/ui/Skeleton'
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
  const [autoSuggest, setAutoSuggest] = useState(false)
  const toast = useGlobalToastStore((s) => s.show)

  // 루틴모드: 루틴의 기구 목록만 표시
  const fetchRoutineEquipments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
    }
  }, [parsedRoutineId])

  // 일반모드: 전체 기구 목록
  const fetchEquipments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
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

  // 소켓 equipment:list:updated 수신 시 목록 재조회 (debounce 300ms)
  const fetchRef = useRef<((silent?: boolean) => void) | null>(null)
  fetchRef.current = isRoutineMode ? fetchRoutineEquipments : fetchEquipments

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const pollTimer = setInterval(() => fetchRef.current?.(true), 60_000)

    function handleListUpdate() {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => fetchRef.current?.(true), 300)
    }

    socket.on('equipment:list:updated', handleListUpdate)
    return () => {
      socket.off('equipment:list:updated', handleListUpdate)
      if (debounceTimer) clearTimeout(debounceTimer)
      clearInterval(pollTimer)
    }
  }, [])

  const displayedEquipments = useMemo(() => {
    if (!autoSuggest) return equipments
    return [...equipments].sort((a, b) => {
      const aFree = !a.isBeingUsed && a.waitingCount === 0
      const bFree = !b.isBeingUsed && b.waitingCount === 0
      if (aFree && !bFree) return -1
      if (!aFree && bFree) return 1
      return (a.waitingCount ?? 0) - (b.waitingCount ?? 0)
    })
  }, [equipments, autoSuggest])

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
    <motion.div className="select-equipment-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2, ease: 'easeInOut' }}>
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => isRoutineMode ? navigate('/') : navigate(-1)} aria-label="뒤로가기">
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

      {!isRoutineMode && (
        <div className="select-equipment-page__toolbar">
          <label className="select-equipment-page__auto-suggest">
            <span>자동제안</span>
            <Switch
              checked={autoSuggest}
              size="small"
              onChange={(e) => setAutoSuggest(e.target.checked)}
              slotProps={{ input: { 'aria-label': '자동제안' } }}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#ef754d' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ef754d' },
              }}
            />
          </label>
        </div>
      )}

      <section className="select-equipment-page__list">
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
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="select-equipment-page__error">
            <p className="select-equipment-page__error-msg">오류: {error}</p>
            <button type="button" className="select-equipment-page__retry" onClick={isRoutineMode ? fetchRoutineEquipments : fetchEquipments}>
              다시 시도
            </button>
          </div>
        ) : displayedEquipments.length === 0 ? (
          <p className="select-equipment-page__empty">기구를 찾을 수 없어요</p>
        ) : (
          <ul className="select-equipment-page__equipment-list">
            {displayedEquipments.map((equipment) => (
              <li key={equipment.id}>
                <EquipmentCard
                  equipment={equipment}
                  onFavoriteToggle={!isRoutineMode ? handleFavoriteToggle : undefined}
                  onClick={() =>
                    navigate(
                      `/reservation/goal-setting?equipmentId=${equipment.id}&name=${encodeURIComponent(equipment.name)}&imageUrl=${encodeURIComponent(equipment.imageUrl ?? '')}${parsedRoutineId ? `&routineId=${parsedRoutineId}&routineName=${encodeURIComponent(routineName ?? '')}` : ''}`,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  )
}
