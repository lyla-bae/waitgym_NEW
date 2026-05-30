import logo from '@/assets/images/logo.svg'
import iconGoogle from '@/assets/images/icon-google.svg'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const { signInWithGoogle } = useAuthStore()

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__text-wrap">
          <h1 className="login-page__greeting">
            어서오세요!<br />
            오늘도 운동시작 해볼까요?
          </h1>
          <img src={logo} className="login-page__logo" alt="기다려짐" />
        </div>
      </div>

      <div className="btn-wrap">
        <button
          type="button"
          className="btn btn--white btn--full login-page__google-btn"
          onClick={signInWithGoogle}
        >
          <img src={iconGoogle} alt="" aria-hidden="true" className="login-page__google-icon" />
          구글아이디로 로그인
        </button>
      </div>
    </div>
  )
}
