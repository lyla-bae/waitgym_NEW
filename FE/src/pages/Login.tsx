import { useAuthStore } from '@/stores/authStore'
import logo from '@/assets/images/logo.svg'
import iconGoogle from '@/assets/images/icon-google.svg'

export default function LoginPage() {
  const { signInWithGoogle } = useAuthStore()

  return (
    <div className="login-page">
      <div className="login-page__brand">
        <img src={logo} alt="기다려짐" className="login-page__logo" />
        <p className="login-page__subtitle">헬스장 기구 대기를 스마트하게</p>
      </div>

      <div className="login-page__actions">
        <button
          type="button"
          className="login-page__google-btn"
          onClick={signInWithGoogle}
        >
          <img src={iconGoogle} alt="" aria-hidden="true" width={20} height={20} />
          Google로 로그인
        </button>
      </div>
    </div>
  )
}
