import { motion } from 'framer-motion'
import logo from '@/assets/images/logo.svg'
import iconGoogle from '@/assets/images/icon-google.svg'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const { signInWithGoogle } = useAuthStore()

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__text-wrap">
          <motion.h1
            className="login-page__greeting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeInOut' }}
          >
            어서오세요!<br />
            오늘도 운동시작 해볼까요?
          </motion.h1>
          <motion.img
            src={logo}
            className="login-page__logo"
            alt="기다려짐"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      <motion.div
        className="btn-wrap"
        style={{ x: '-50%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6, ease: 'easeInOut' }}
      >
        <button
          type="button"
          className="btn btn--white btn--full login-page__google-btn"
          onClick={signInWithGoogle}
        >
          <img src={iconGoogle} alt="" aria-hidden="true" className="login-page__google-icon" />
          구글아이디로 로그인
        </button>
      </motion.div>
    </div>
  )
}
