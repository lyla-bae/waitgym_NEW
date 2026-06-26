import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { equipmentApi } from '@/api/equipment'
import Header from '@/components/Header'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGlobalToastStore } from '@/stores/globalToastStore'
import type { Equipment } from '@/types'

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useGlobalToastStore((s) => s.show)

  useEffect(() => {
    if (!id) return
    equipmentApi.detail(Number(id))
      .then(setEquipment)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleFavoriteToggle = async () => {
    if (!equipment) return
    try {
      const { isFavorite } = await equipmentApi.toggleFavorite(equipment.id)
      setEquipment((prev) => (prev ? { ...prev, isFavorite } : prev))
    } catch (e) {
      console.error(e)
      toast({ message: '즐겨찾기 변경에 실패했습니다.' })
    }
  }

  if (loading) {
    return (
      <div className="equipment-detail">
        <Header
          className="header--sub"
          leftContent={
            <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
              <ChevronLeft size={24} />
            </button>
          }
          title=""
        />
        <div className="detail-sk__image-section" aria-hidden="true">
          <Skeleton className="detail-sk__image" />
        </div>
        <div className="detail-sk__info-card" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="detail-sk__row">
              <Skeleton className="detail-sk__label" />
              <Skeleton className="detail-sk__value" />
            </div>
          ))}
        </div>
        <div className="equipment-detail__cta" aria-hidden="true">
          <Skeleton className="detail-sk__cta" style={{ width: '100%' }} />
        </div>
      </div>
    )
  }

  if (!equipment) return <p className="home-page__empty">기구를 찾을 수 없어요</p>

  const { name, imageUrl, category, isFavorite, currentUsage, waitingCount } = equipment
  const muscleGroup = (equipment as Equipment & { muscleGroup?: string }).muscleGroup

  return (
    <div className="equipment-detail">
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
            <ChevronLeft size={24} />
          </button>
        }
        title={name}
        rightContent={
          <button
            type="button"
            className={`equipment-card__favorite${isFavorite ? ' equipment-card__favorite--active' : ''}`}
            onClick={handleFavoriteToggle}
            aria-label={isFavorite ? '즐겨찾기 취소' : '즐겨찾기'}
            aria-pressed={isFavorite}
          >
            <Star size={22} />
          </button>
        }
      />

      <motion.div className="equipment-detail__image-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1, ease: 'easeInOut' }}>
        <div className="equipment-detail__image-wrap">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="equipment-detail__image" />
          ) : (
            <div className="equipment-detail__image-placeholder" />
          )}
        </div>
      </motion.div>

      <motion.div className="equipment-detail__info-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2, ease: 'easeInOut' }}>
        <div className="equipment-detail__info-row">
          <span className="equipment-detail__info-label">카테고리</span>
          <span className="equipment-detail__info-value">{category}</span>
        </div>
        {muscleGroup && (
          <div className="equipment-detail__info-row">
            <span className="equipment-detail__info-label">주요 근육</span>
            <span className="equipment-detail__info-value">{muscleGroup}</span>
          </div>
        )}
        <div className="equipment-detail__info-row">
          <span className="equipment-detail__info-label">현재 상태</span>
          <span className={currentUsage ? 'equipment-detail__status-in-use' : 'equipment-detail__status-available'}>
            {currentUsage ? '이용중' : '이용가능'}
          </span>
        </div>
        {waitingCount !== undefined && waitingCount > 0 && (
          <div className="equipment-detail__info-row">
            <span className="equipment-detail__info-label">대기 인원</span>
            <div className="equipment-detail__waiting-count">
              <Users size={14} />
              <span>{waitingCount}명</span>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div className="equipment-detail__cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3, ease: 'easeInOut' }}>
        <button
          type="button"
          className="btn btn--white btn--full"
          onClick={() =>
            navigate(
              `/reservation/goal-setting?equipmentId=${equipment.id}&name=${encodeURIComponent(equipment.name)}&imageUrl=${encodeURIComponent(equipment.imageUrl ?? '')}`,
            )
          }
        >
          {equipment.isBeingUsed || (equipment.waitingCount ?? 0) > 0 ? '대기하기' : '이용하기'}
        </button>
      </motion.div>
    </div>
  )
}
