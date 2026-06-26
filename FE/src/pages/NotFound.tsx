import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="not-found"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="not-found__body">
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">페이지를 찾을 수 없어요</h1>
        <p className="not-found__desc">주소가 잘못됐거나 삭제된 페이지예요.</p>
      </div>
      <div className="btn-wrap">
        <button
          type="button"
          className="btn btn--white btn--full"
          onClick={() => navigate('/', { replace: true })}
        >
          홈으로 돌아가기
        </button>
      </div>
    </motion.div>
  )
}
