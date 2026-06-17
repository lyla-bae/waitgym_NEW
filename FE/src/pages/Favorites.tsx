import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import EquipmentCard from '@/components/EquipmentCard'
import { equipmentApi } from '@/lib/api'
import { useGlobalToastStore } from '@/stores/globalToastStore'
import type { Equipment } from '@/types'

const ALL = '전체'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const toast = useGlobalToastStore((s) => s.show)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    equipmentApi.list({ favorites: true })
      .then(setEquipments)
      .catch(() => toast({ message: '즐겨찾기 목록을 불러오지 못했습니다.' }))
      .finally(() => setIsLoading(false))
  }, [])

  const categories = useMemo(() => {
    const unique = [...new Set(equipments.map(e => e.category))].sort()
    return [ALL, ...unique]
  }, [equipments])

  const filtered = useMemo(() =>
    activeCategory === ALL ? equipments : equipments.filter(e => e.category === activeCategory),
    [equipments, activeCategory]
  )

  async function handleFavoriteToggle(id: number) {
    try {
      const { isFavorite } = await equipmentApi.toggleFavorite(id)
      if (!isFavorite) {
        setEquipments(prev => prev.filter(e => e.id !== id))
      } else {
        setEquipments(prev => prev.map(e => e.id === id ? { ...e, isFavorite } : e))
      }
    } catch {
      toast({ message: '즐겨찾기 변경에 실패했습니다.' })
    }
  }

  return (
    <motion.div className="favorites-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2, ease: 'easeInOut' }}>
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        title="즐겨찾기한 기구"
      />

      {!isLoading && equipments.length > 0 && (
        <div className="favorites-page__filter">
          <div className="category-filter">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`category-filter__tab${activeCategory === cat ? ' category-filter__tab--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="favorites-page__list">
        {isLoading ? null : filtered.length === 0 ? (
          <p className="favorites-page__empty">
            {equipments.length === 0 ? '즐겨찾기한 기구가 없어요' : '해당 카테고리에 즐겨찾기한 기구가 없어요'}
          </p>
        ) : (
          <div className="favorites-page__equipment-list">
            {filtered.map(eq => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                onFavoriteToggle={handleFavoriteToggle}
                onClick={() => navigate(`/equipment/${eq.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
