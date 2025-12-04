'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Page() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-white">Загрузка статистики...</div>
  }

  if (!stats) {
    return <div className="text-red-400">Ошибка загрузки данных</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Рабочий стол</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Всего сделок</div>
          <div className="text-3xl font-bold text-white">{stats.totalDeals}</div>
        </div>

        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Сумма в воронке</div>
          <div className="text-3xl font-bold text-white">
            {(stats.totalValue || 0).toLocaleString()} ₽
          </div>
        </div>

        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Контакты</div>
          <div className="text-3xl font-bold text-white">{stats.totalContacts}</div>
        </div>

        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Компании</div>
          <div className="text-3xl font-bold text-white">{stats.totalCompanies}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Deals */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Последние сделки</h2>
            <Link href="/leads" className="text-sm text-blue-400 hover:text-blue-300">
              Все сделки →
            </Link>
          </div>
          <div className="space-y-2">
            {(!stats.recentDeals || stats.recentDeals.length === 0) && (
              <div className="text-slate-400 text-center py-4">Сделок нет</div>
            )}
            {stats.recentDeals?.map((deal: any) => (
              <div key={deal.id} className="bg-slate-700/50 rounded p-3 hover:bg-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-white">{deal.title}</div>
                  <div className="text-sm text-slate-300">
                    {deal.value?.toLocaleString()} {deal.currency}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {deal.company_name && <span>{deal.company_name} • </span>}
                  {deal.stage_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Мои задачи</h2>
            <Link href="/tasks" className="text-sm text-blue-400 hover:text-blue-300">
              Все задачи →
            </Link>
          </div>

          {stats.tasks?.overdue > 0 && (
            <div className="bg-red-900/30 border border-red-800 rounded p-3 mb-3">
              <div className="text-red-400 font-semibold">
                ⚠️ Просроченных: {stats.tasks.overdue}
              </div>
            </div>
          )}

          {stats.tasks?.today > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-800 rounded p-3 mb-3">
              <div className="text-yellow-400 font-semibold">
                📅 На сегодня: {stats.tasks.today}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {stats.recentTasks?.length === 0 && (
              <div className="text-slate-400 text-center py-4">Задач нет</div>
            )}
            {stats.recentTasks?.map((task: any) => {
              const isOverdue = task.due_at && new Date(task.due_at) < new Date()
              return (
                <div key={task.id} className="bg-slate-700/50 rounded p-3 hover:bg-slate-700 transition-colors">
                  <div className="font-medium text-white">{task.title}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {task.deal_title && <span>💼 {task.deal_title} • </span>}
                    {task.due_at && (
                      <span className={isOverdue ? 'text-red-400' : ''}>
                        📅 {new Date(task.due_at).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals by Stage */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Сделки по этапам</h2>
          <div className="space-y-3">
            {stats.dealsByStage?.map((stage: any) => (
              <div key={stage.stage_id || stage.stage_name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{stage.stage_name}</span>
                  <span className="text-white font-semibold">{stage.count}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: stats.totalDeals > 0 ? `${(stage.count / stats.totalDeals) * 100}%` : '0%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity placeholder */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Последняя активность</h2>
          <div className="text-slate-400 text-center py-8">
            Скоро здесь появится история действий
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/leads"
            className="card hover:bg-slate-700 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">💼</div>
            <div className="text-white font-medium">Создать сделку</div>
          </Link>
          <Link
            href="/contacts"
            className="card hover:bg-slate-700 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">👤</div>
            <div className="text-white font-medium">Добавить контакт</div>
          </Link>
          <Link
            href="/companies"
            className="card hover:bg-slate-700 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">🏢</div>
            <div className="text-white font-medium">Создать компанию</div>
          </Link>
          <Link
            href="/analytics"
            className="card hover:bg-slate-700 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-white font-medium">Аналитика</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

