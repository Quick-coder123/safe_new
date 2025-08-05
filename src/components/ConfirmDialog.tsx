'use client'

import { useState, useEffect } from 'react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Підтвердити',
  cancelText = 'Скасувати',
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showShake, setShowShake] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
      
      // Додаємо звуковий ефект при відкритті
      if (typeof window !== 'undefined') {
        try {
          // Створюємо простий звуковий ефект через Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Різні тони для різних типів
          switch (type) {
            case 'warning':
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
              break
            case 'error':
              oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
              break
            case 'success':
              oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
              break
            case 'info':
            default:
              oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
              break
          }
          
          oscillator.type = 'sine'
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        } catch (error) {
          // Ігноруємо помилки з аудіо на старих браузерах
          console.log('Audio not supported')
        }
      }
    } else {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsClosing(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, type])

  const handleAnimatedClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onCancel()
    }, 300)
  }

  const handleConfirm = () => {
    // Додаємо ефект натискання
    setShowShake(true)
    setTimeout(() => {
      setShowShake(false)
      onConfirm()
    }, 200)
  }

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️'
      case 'error':
        return '🚨'
      case 'success':
        return '✅'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'warning':
        return {
          button: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl',
          border: 'border-orange-200',
          bg: 'bg-gradient-to-r from-orange-50 to-yellow-50',
          iconClass: 'warning'
        }
      case 'error':
        return {
          button: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl',
          border: 'border-red-200',
          bg: 'bg-gradient-to-r from-red-50 to-pink-50',
          iconClass: 'error'
        }
      case 'success':
        return {
          button: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl',
          border: 'border-green-200',
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          iconClass: 'success'
        }
      case 'info':
      default:
        return {
          button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl',
          border: 'border-blue-200',
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          iconClass: 'info'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 confirm-overlay ${isClosing ? 'closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleAnimatedClose()
        }
      }}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform confirm-content ${
          isClosing ? 'closing' : ''
        } ${showShake ? 'shake' : ''}`}
      >
        {/* Header */}
        <div className={`confirm-header p-6 ${colors.bg} ${colors.border} border-b rounded-t-lg`}>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <span className={`text-3xl confirm-icon ${colors.iconClass}`}>
                {getIcon()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {type === 'warning' && 'Дія потребує підтвердження'}
                {type === 'error' && 'Увага! Незворотна дія'}
                {type === 'success' && 'Підтвердіть операцію'}
                {type === 'info' && 'Інформаційне повідомлення'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="confirm-body p-6">
          <p className="text-gray-700 leading-relaxed text-base">
            {message}
          </p>
          
          {/* Додаткова інформація для критичних дій */}
          {type === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slideInLeft">
              <p className="text-sm text-red-800 flex items-center">
                <span className="mr-2">🔔</span>
                <strong>Ця дія не може бути скасована!</strong>
              </p>
            </div>
          )}
          
          {type === 'warning' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-slideInLeft">
              <p className="text-sm text-yellow-800 flex items-center">
                <span className="mr-2">💡</span>
                Переконайтеся, що ви розумієте наслідки цієї дії.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="confirm-footer px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={handleAnimatedClose}
            className="confirm-button px-6 py-2 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md transition-all duration-300 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <span className="flex items-center">
              <span className="mr-2">✕</span>
              {cancelText}
            </span>
          </button>
          <button
            onClick={handleConfirm}
            className={`confirm-button px-6 py-2 rounded-md transition-all duration-300 font-medium transform hover:scale-105 ${colors.button}`}
          >
            <span className="flex items-center">
              <span className="mr-2">
                {type === 'warning' && '⚠️'}
                {type === 'error' && '🚨'}
                {type === 'success' && '✅'}
                {type === 'info' && 'ℹ️'}
              </span>
              {confirmText}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Хук для використання confirm dialog
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'info' | 'warning' | 'error' | 'success'
    onConfirm?: () => void
    onCancel?: () => void
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const showConfirm = (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'info' | 'warning' | 'error' | 'success'
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        isOpen: true,
        onConfirm: () => {
          setDialog(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setDialog(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      title={dialog.title}
      message={dialog.message}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      type={dialog.type}
      onConfirm={dialog.onConfirm || (() => {})}
      onCancel={dialog.onCancel || (() => {})}
    />
  )

  return { showConfirm, ConfirmDialogComponent }
}
