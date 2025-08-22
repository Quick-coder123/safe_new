'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
  duration = 5000, // Збільшуємо час показу до 5 секунд
  onClose
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  
  // Оптимізований callback для закриття
  const handleClose = useCallback(() => {
    setTimeout(() => onClose(), 0)
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeLeft(duration)
      
      if (duration > 0) {
        // Оновлюємо лічильник кожні 100мс для плавної анімації
        const interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 100) {
              clearInterval(interval)
              // Використовуємо асинхронний callback
              handleClose()
              return 0
            }
            return prev - 100
          })
        }, 100)
        
        return () => clearInterval(interval)
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, handleClose])




  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2}
              d="M5 13l4 4L19 7"
              className="animate-checkmark"
              style={{
                strokeDasharray: '20',
                strokeDashoffset: '20',
                animation: 'drawCheck 0.8s ease-in-out forwards'
              }}
            />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd"
              className="animate-scaleIn"
            />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd"
              className="animate-bounce"
            />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clipRule="evenodd"
              className="animate-scaleIn"
            />
          </svg>
        )
    }
  }

  // Кольори
  const colors = (() => {
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
  })()

  // Анімаційні класи
  const animationClasses = `transition-all duration-500 ease-in-out transform ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isOpen ? 'animate-fadeIn' : ''}`

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`max-w-md w-full shadow-xl rounded-lg border-2 bg-white animate-scaleIn ${animationClasses}`}
        style={{
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Прогрес бар */}
        {duration > 0 && (
          <div className="h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div 
              className={`h-full transition-all duration-100 ease-linear ${
                type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(timeLeft / duration) * 100}%` }}
            />
          </div>
        )}
        <div className={`p-4 rounded-lg ${colors.bg}`}> 
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center animate-popIn ${
                type === 'success' ? 'bg-green-100' :
                type === 'error' ? 'bg-red-100' :
                type === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                {getIcon()}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h4 className={`text-base font-semibold ${colors.text} leading-tight`}>
                {title}
              </h4>
              <p className={`mt-2 text-sm ${colors.text} leading-relaxed break-words`}>
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className={`rounded-full p-1 transition-colors duration-200 ${colors.button} hover:bg-white hover:bg-opacity-20`}
                title="Закрити"
              >
                <span className="sr-only">Закрити</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
