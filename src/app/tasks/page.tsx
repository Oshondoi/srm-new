'use client'

import React, { useEffect, useState } from 'react'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

  useEffect(() => {
    loadTasks()
  }, [filter])

  async function loadTasks() {
    try {
      let url = '/api/tasks'
      if (filter === 'active') url += '?completed=false'
      if (filter === 'completed') url += '?completed=true'
      
      const res = await fetch(url)
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  async function toggleTaskComplete(taskId: string, completed: boolean) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      })
      if (!res.ok) throw new Error('Failed to update task')
      loadTasks()
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Удалить задачу?')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      loadTasks()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="text-white">Загрузка...</div>

  const overdueTasks = tasks.filter(t => !t.completed && t.due_at && new Date(t.due_at) < new Date())
  const todayTasks = tasks.filter(t => {
    if (!t.due_at || t.completed) return false
    const today = new Date().toDateString()
    return new Date(t.due_at).toDateString() === today
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Задачи</h1>
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {f === 'all' && 'Все'}
              {f === 'active' && 'Активные'}
              {f === 'completed' && 'Завершенные'}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {filter === 'active' && overdueTasks.length > 0 && (
        <div className="card bg-red-900/20 border border-red-800 mb-4">
          <div className="text-red-400 font-semibold mb-2">
            ⚠️ Просроченные задачи: {overdueTasks.length}
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div key={task.id} className="text-sm text-slate-300">
                • {task.title} (срок: {new Date(task.due_at).toLocaleDateString('ru-RU')})
              </div>
            ))}
          </div>
        </div>
      )}

      {filter === 'active' && todayTasks.length > 0 && (
        <div className="card bg-yellow-900/20 border border-yellow-800 mb-4">
          <div className="text-yellow-400 font-semibold mb-2">
            📅 Задачи на сегодня: {todayTasks.length}
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="text-slate-400 text-center py-8">
            {filter === 'active' && 'Нет активных задач'}
            {filter === 'completed' && 'Нет завершенных задач'}
            {filter === 'all' && 'Задач нет'}
          </div>
        )}

        {tasks.map((task: any) => {
          const isOverdue = !task.completed && task.due_at && new Date(task.due_at) < new Date()
          const isToday = task.due_at && new Date(task.due_at).toDateString() === new Date().toDateString()

          return (
            <div
              key={task.id}
              className={`card flex items-start gap-3 ${
                isOverdue ? 'border-l-4 border-red-600' : isToday ? 'border-l-4 border-yellow-600' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTaskComplete(task.id, task.completed)}
                className="mt-1 cursor-pointer"
              />
              <div className="flex-1">
                <div className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-sm text-slate-400 mt-1">{task.description}</div>
                )}
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  {task.deal_title && (
                    <span className="text-blue-400">💼 {task.deal_title}</span>
                  )}
                  {task.due_at && (
                    <span className={isOverdue ? 'text-red-400 font-semibold' : isToday ? 'text-yellow-400' : ''}>
                      📅 {new Date(task.due_at).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  {task.assigned_user_name && (
                    <span>🎯 {task.assigned_user_name}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
