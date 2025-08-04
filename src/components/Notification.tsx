'use client'

import { useState, useEffect } from 'react'

export interface NotificationProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  duration?: number
  onClose: () => void
}

export default function Notification({
  isOpen,
  title,
  message,
  type = 'info',
  duration = 4000,
  onClose
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose()
        }, duration)
        return () => clearTimeout(timer)
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          button: 'text-green-500 hover:text-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          button: 'text-red-500 hover:text-red-700'
        }
      case 'warning':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          button: 'text-orange-500 hover:text-orange-700'
        }
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          button: 'text-blue-500 hover:text-blue-700'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`max-w-sm w-full shadow-lg rounded-lg border transform transition-all duration-300 ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${colors.bg}`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-xl">{getIcon()}</span>
            </div>
            <div className="ml-3 w-0 flex-1">
              <h4 className={`text-sm font-semibold ${colors.text}`}>
                {title}
              </h4>
              <p className={`mt-1 text-sm ${colors.text}`}>
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={onClose}
                className={`rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${colors.button}`}
              >
                <span className="sr-only">Закрити</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Хук для використання notifications
export function useNotification() {
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
    duration?: number
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const showNotification = (options: {
    title: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
    duration?: number
  }) => {
    setNotification({
      ...options,
      isOpen: true
    })
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  const NotificationComponent = () => (
    <Notification
      isOpen={notification.isOpen}
      title={notification.title}
      message={notification.message}
      type={notification.type}
      duration={notification.duration}
      onClose={hideNotification}
    />
  )

  return { showNotification, NotificationComponent, hideNotification }
}
