"use client"

import Link from "next/link"
import { logout } from "@/lib/auth"

export default function Sidebar() {
  const sections = [
    { href: '/', label: 'Рабочий стол', icon: '🏠' },
    { href: '/leads', label: 'Сделки', icon: '💼' },
    { href: '/contacts', label: 'Контакты', icon: '👤' },
    { href: '/companies', label: 'Компании', icon: '🏢' },
    { href: '/tasks', label: 'Задачи', icon: '✓' },
    { href: '/lists', label: 'Списки', icon: '📋' },
    { href: '/analytics', label: 'Аналитика', icon: '📊' },
    { href: '/settings', label: 'Настройки', icon: '⚙️' }
  ]

  return (
    <aside className="w-20 flex-shrink-0 bg-slate-900 text-slate-100 min-h-screen p-2 flex flex-col relative z-50">
      <div className="text-xl font-bold mb-6 text-center">S</div>
      <nav className="flex flex-col gap-1 flex-1">
        {sections.map((s) => (
          <Link 
            key={s.href} 
            href={s.href} 
            className="flex flex-col items-center justify-center p-2 rounded hover:bg-slate-800 transition-colors"
          >
            <span className="text-2xl mb-1">{s.icon}</span>
            <span className="text-xs text-center leading-tight">{s.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* Logout button at the bottom */}
      <button
        onClick={logout}
        className="mt-4 p-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition text-xs"
      >
        Выйти
      </button>
    </aside>
  )
}

