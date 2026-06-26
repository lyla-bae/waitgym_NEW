import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import ConfirmDrawer from '@/components/ConfirmDrawer'
import { useAuthStore } from '@/stores/authStore'
import { useGlobalToastStore } from '@/stores/globalToastStore'
import { authFetch } from '@/lib/api'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'
import thumbDefault from '@/assets/images/thumb-default.jpg'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser, signOut } = useAuthStore()
  const toast = useGlobalToastStore((s) => s.show)
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  const isNameChanged = name.trim() !== (user?.name ?? '')

  async function handleSaveName() {
    if (!isNameChanged) return
    try {
      const updated = await authFetch<User>('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      setUser(updated)
      toast({ message: '이름이 변경되었습니다.' })
    } catch {
      toast({ message: '저장에 실패했습니다. 다시 시도해주세요.' })
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ message: 'jpg, png, webp 파일만 업로드할 수 있어요.' })
      return
    }
    if (file.size > MAX_SIZE) {
      toast({ message: '파일 크기는 5MB 이하여야 해요.' })
      return
    }
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const updated = await authFetch<User>('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: publicUrl }),
      })
      setUser(updated)
      toast({ message: '프로필 사진이 변경되었습니다.' })
    } catch {
      toast({ message: '업로드에 실패했습니다. 다시 시도해주세요.' })
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  async function handleDeleteAccount() {
    try {
      await authFetch('/users/me', { method: 'DELETE' })
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      // 실패해도 로그아웃 처리
      await signOut()
      navigate('/login', { replace: true })
    }
  }


  return (
    <motion.div className="profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2, ease: 'easeInOut' }}>
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        title="개인정보 수정"
      />

      <div className="content-scroll">
        <div className="profile-page__container">
          <div className="profile-page__avatar-wrap">
            <img
              src={user?.avatar ?? thumbDefault}
              alt="프로필"
              className="profile-page__avatar"
              onError={(e) => { e.currentTarget.src = thumbDefault }}
            />
            <button
              type="button"
              className="profile-page__avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="프로필 사진 변경"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="profile-page__avatar-input"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="profile-page__fields">
            <div className="profile-page__field">
              <label htmlFor="profile-email" className="profile-page__label">아이디</label>
              <input
                id="profile-email"
                type="text"
                className="profile-page__input profile-page__input--readonly"
                value={user?.email ?? ''}
                readOnly
              />
            </div>
            <div className="profile-page__field">
              <label htmlFor="profile-name" className="profile-page__label">이름</label>
              <input
                id="profile-name"
                type="text"
                className="profile-page__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="profile-page__save"
              onClick={handleSaveName}
              disabled={!isNameChanged}
            >
              저장
            </button>
          </div>

          <button
            type="button"
            className="profile-page__withdraw"
            onClick={() => setShowDeleteConfirm(true)}
          >
            탈퇴하기
          </button>
        </div>
      </div>

      <ConfirmDrawer
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      >
        <p className="routine-confirm-drawer__title">정말 탈퇴하시겠어요?</p>
        <p className="routine-confirm-drawer__desc">탈퇴하면 모든 데이터가 삭제되며 복구할 수 없어요.</p>
      </ConfirmDrawer>
    </motion.div>
  )
}
