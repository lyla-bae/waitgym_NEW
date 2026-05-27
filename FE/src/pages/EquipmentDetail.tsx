import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, Users } from 'lucide-react'
import { equipmentApi } from '@/lib/api'
import type { Equipment } from '@/types'

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)

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
    }
  }

  if (loading) return <p className="home-page__empty">불러오는 중...</p>
  if (!equipment) return <p className="home-page__empty">기구를 찾을 수 없어요</p>

  const { name, imageUrl, category, isFavorite, currentUsage, waitingCount } = equipment
  const muscleGroup = (equipment as Equipment & { muscleGroup?: string }).muscleGroup

  return (
    <div className="equipment-detail">
      <header className="header header--sub">
        <button className="header__back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
          <ChevronLeft size={28} />
        </button>
        <h1 className="header__title">{name}</h1>
        <button
          className={`equipment-card__favorite${isFavorite ? ' equipment-card__favorite--active' : ''}`}
          onClick={handleFavoriteToggle}
          aria-label={isFavorite ? '즐겨찾기 취소' : '즐겨찾기'}
          aria-pressed={isFavorite}
        >
          <Star size={22} />
        </button>
      </header>

      <div className="equipment-detail__image-section">
        <div className="equipment-detail__image-wrap">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="equipment-detail__image" />
          ) : (
            <div className="equipment-detail__image-placeholder" />
          )}
        </div>
      </div>

      <div className="equipment-detail__info-card">
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
      </div>

      <div className="equipment-detail__cta">
        <button
          type="button"
          className="btn btn--white btn--full"
          onClick={() => navigate(`/waiting/${equipment.id}`)}
        >
          {currentUsage ? '대기하기' : '이용하기'}
        </button>
      </div>
    </div>
  )
}
