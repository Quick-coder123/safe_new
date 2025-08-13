"use client"
import { useState } from 'react'
import PasswordChangeModal from '@/components/PasswordChangeModal'

export default function ProfilePage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Профіль</h1>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md mb-6"
        onClick={() => setIsOpen(true)}
      >
        Змінити пароль
      </button>
      <PasswordChangeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      {/* Додайте тут інші елементи профілю */}
    </div>
  )
}
