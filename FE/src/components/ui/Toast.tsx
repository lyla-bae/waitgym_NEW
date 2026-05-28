import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  duration?: number
  onClose: () => void
}

export function Toast({ message, duration = 2000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`toast${visible ? ' toast--visible' : ''}`}>
      {message}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
  }

  function ToastComponent() {
    if (!toast) return null
    return <Toast message={toast} onClose={() => setToast(null)} />
  }

  return { showToast, ToastComponent }
}
