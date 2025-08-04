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

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
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
          button: 'bg-orange-500 hover:bg-orange-600 text-white',
          border: 'border-orange-200',
          bg: 'bg-orange-50'
        }
      case 'error':
        return {
          button: 'bg-red-500 hover:bg-red-600 text-white',
          border: 'border-red-200',
          bg: 'bg-red-50'
        }
      case 'success':
        return {
          button: 'bg-green-500 hover:bg-green-600 text-white',
          border: 'border-green-200',
          bg: 'bg-green-50'
        }
      case 'info':
      default:
        return {
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          border: 'border-blue-200',
          bg: 'bg-blue-50'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className={`p-6 ${colors.bg} ${colors.border} border-b rounded-t-lg`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getIcon()}</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md transition-colors duration-200 font-medium ${colors.button}`}
          >
            {confirmText}
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
