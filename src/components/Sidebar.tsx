"use client"

import Link from "next/link"

export default function Sidebar() {
  const sections = [
    { href: '/', label: 'Рабочий стол' },
    { href: '/leads', label: 'Сделки' },
    { href: '/contacts', label: 'Контакты' },
    { href: '/companies', label: 'Компании' },
    { href: '/tasks', label: 'Задачи' },
    { href: '/lists', label: 'Списки' },
    { href: '/analytics', label: 'Аналитика' },
    { href: '/settings', label: 'Настройки' }
  ]

  return (
    <aside className="w-56 bg-slate-900 text-slate-100 min-h-screen p-4">
      <div className="text-2xl font-semibold mb-6">srm</div>
      <nav className="flex flex-col gap-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="px-3 py-2 rounded hover:bg-slate-800">
            {s.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
