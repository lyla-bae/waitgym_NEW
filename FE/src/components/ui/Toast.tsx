import { useEffect, useState } from 'react'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastProps {
  message: string
  duration?: number
  action?: ToastAction
  onClose: () => void
}

export function Toast({ message, duration = 2000, action, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`toast${visible ? ' toast--visible' : ''}${action ? ' toast--with-action' : ''}`}>
      <span className="toast__message">{message}</span>
      {action && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            action.onClick()
            onClose()
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface ToastOptions {
  message: string
  duration?: number
  action?: ToastAction
}

export function useToast() {
  const [toast, setToast] = useState<ToastOptions | null>(null)

  function showToast(message: string, options?: Omit<ToastOptions, 'message'>) {
    setToast({ message, ...options })
  }

  function ToastComponent() {
    if (!toast) return null
    return (
      <Toast
        message={toast.message}
        duration={toast.duration}
        action={toast.action}
        onClose={() => setToast(null)}
      />
    )
  }

  return { showToast, ToastComponent }
}
