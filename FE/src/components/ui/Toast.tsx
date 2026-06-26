import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastProps {
  message: string
  duration?: number
  action?: ToastAction
  onClick?: () => void
  onClose: () => void
}

export function Toast({ message, duration = 2000, action, onClick, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | null = null
    const timer = setTimeout(() => {
      setVisible(false)
      closeTimer = setTimeout(onClose, 300)
    }, duration)
    return () => {
      clearTimeout(timer)
      if (closeTimer) clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  function handleClick() {
    if (onClick) {
      onClick()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`toast${onClick ? ' toast--clickable' : ''}${action ? ' toast--with-action' : ''}`}
          style={{ x: '-50%' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onClick={handleClick}
        >
          <span className="toast__message">{message}</span>
          {action && (
            <button
              type="button"
              className="toast__action"
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
                onClose()
              }}
            >
              {action.label}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
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
