'use client'

import React, { useEffect, useState } from 'react'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    company_id: ''
  })
  const [initialFormData, setInitialFormData] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [contactsRes, companiesRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/companies')
      ])

      // Безопасный парсинг JSON чтобы избежать "Unexpected end of JSON input"
      async function safeJson(res: Response) {
        try {
          if (!res.ok) {
            // Попытка прочитать текст ошибки
            const txt = await res.text()
            console.error('Ошибка ответа', res.status, txt)
            return []
          }
          const txt = await res.text()
          if (!txt) return []
          return JSON.parse(txt)
        } catch (err) {
          console.error('JSON parse error', err)
          return []
        }
      }

      const contactsData = await safeJson(contactsRes)
      const companiesData = await safeJson(companiesRes)
      setContacts(Array.isArray(contactsData) ? contactsData : [])
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingContact(null)
    const emptyData = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      company_id: ''
    }
    setFormData(emptyData)
    setInitialFormData(emptyData)
    setHasChanges(false)
    setShowModal(true)
  }

  function openEditModal(contact: any) {
    setEditingContact(contact)
    const initialData = {
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      company_id: contact.company_id || ''
    }
    setFormData(initialData)
    setInitialFormData(initialData)
    setHasChanges(false)
    setShowModal(true)
  }

  function updateFormData(field: string, value: string) {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    setHasChanges(JSON.stringify(newData) !== JSON.stringify(initialFormData))
  }

  function handleCloseModal() {
    if (hasChanges) {
      setShowExitConfirm(true)
    } else {
      setShowModal(false)
      setEditingContact(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingContact) {
        // Update
        // Нормализация company_id чтобы пустая строка не мешала
        const payload = { ...formData, company_id: formData.company_id || '' }
        const res = await fetch(`/api/contacts/${editingContact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          let reason = 'Failed to update contact'
          try {
            const txt = await res.text()
            if (txt) {
              reason += `: ${txt}`
            }
          } catch {}
          throw new Error(reason)
        }
      } else {
        // Create
        const payload = { ...formData, company_id: formData.company_id || '' }
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          let reason = 'Failed to create contact'
            try {
              const txt = await res.text()
              if (txt) reason += `: ${txt}`
            } catch {}
          throw new Error(reason)
        }
      }

      setShowModal(false)
      setHasChanges(false)
      loadData()
    } catch (e) {
      console.error(e)
      alert('Ошибка при сохранении контакта')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить контакт?')) return

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete contact')
      loadData()
    } catch (e) {
      console.error(e)
      alert('Ошибка при удалении контакта')
    }
  }

  if (loading) return <div className="text-white">Загрузка...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Контакты</h1>
          
          {/* View Switcher */}
          <div className="flex gap-1 bg-slate-800 rounded p-1">
            <button
              onClick={() => {
                if (viewMode !== 'table') {
                  if (document.startViewTransition) {
                    document.startViewTransition(() => {
                      setViewMode('table')
                    })
                  } else {
                    setViewMode('table')
                  }
                }
              }}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Табличный вид"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="4" />
                <rect x="3" y="10" width="18" height="4" />
                <rect x="3" y="17" width="18" height="4" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (viewMode !== 'kanban') {
                  if (document.startViewTransition) {
                    document.startViewTransition(() => {
                      setViewMode('kanban')
                    })
                  } else {
                    setViewMode('kanban')
                  }
                }
              }}
              className={`p-2 rounded transition-colors ${
                viewMode === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Канбан вид"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" />
                <rect x="14" y="3" width="7" height="18" />
              </svg>
            </button>
          </div>
        </div>
        
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          + Создать контакт
        </button>
      </div>

      {viewMode === 'kanban' ? (
        /* Канбан вид - карточки как на странице компаний */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(!contacts || contacts.length === 0) && (
            <div className="text-slate-400 col-span-full">Контакты не найдены</div>
          )}
          {(contacts || []).map((c: any) => (
            <div 
              key={c.id}
              className="card cursor-pointer hover:bg-slate-700/50 transition-colors h-[240px] flex flex-col"
              onClick={() => openEditModal(c)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-white text-lg">
                  {c.first_name} {c.last_name}
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-400 mb-3 flex-1">
                <div className={c.position ? '' : 'invisible'}>
                  💼 {c.position || '—'}
                </div>
                <div className={c.company_name ? '' : 'invisible'}>
                  🏢 {c.company_name || '—'}
                </div>
                <div className={c.email ? '' : 'invisible'}>
                  ✉️ {c.email || '—'}
                </div>
                <div className={c.phone ? '' : 'invisible'}>
                  📞 {c.phone || '—'}
                </div>
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Табличный вид */
        <div className="space-y-2 overflow-x-auto">
          {(!contacts || contacts.length === 0) && (
            <div className="text-slate-400">Контакты не найдены</div>
          )}
          {(contacts || []).map((c: any) => (
            <div 
              key={c.id} 
              className="bg-slate-800 hover:bg-slate-700 rounded p-4 transition-colors min-w-[900px] cursor-pointer"
              onClick={() => openEditModal(c)}
            >
              <div className="flex items-center gap-4">
              {/* ФИО */}
              <div className="w-64 flex-shrink-0">
                <div className="font-semibold text-white">
                  {c.first_name} {c.last_name}
                </div>
                <div className="text-slate-400 text-sm mt-0.5">
                  {c.position || '—'}
                </div>
              </div>

              {/* Компания */}
              <div className="w-48 flex-shrink-0">
                <div className="text-slate-400 text-xs mb-0.5">Компания</div>
                <div className="text-white text-sm truncate">
                  {c.company_name || '—'}
                </div>
              </div>

              {/* Email */}
              <div className="w-56 flex-shrink-0">
                <div className="text-slate-400 text-xs mb-0.5">Email</div>
                <div className="text-white text-sm truncate">
                  {c.email || '—'}
                </div>
              </div>

              {/* Телефон */}
              <div className="w-40 flex-shrink-0">
                <div className="text-slate-400 text-xs mb-0.5">Телефон</div>
                <div className="text-white text-sm">
                  {c.phone || '—'}
                </div>
              </div>

              {/* Кнопка */}
              <div className="flex-1 flex justify-end min-w-[100px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(c.id)
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors whitespace-nowrap"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingContact ? 'Редактировать контакт' : 'Создать контакт'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Имя *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => updateFormData('first_name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Фамилия *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => updateFormData('last_name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Телефон</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Должность</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Компания</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => updateFormData('company_id', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                >
                  <option value="">Не выбрано</option>
                  {(companies || []).map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {editingContact ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">Несохраненные изменения</h3>
            <p className="text-slate-300 mb-4">У вас есть несохраненные изменения. Вы уверены, что хотите выйти?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false)
                  setShowModal(false)
                  setHasChanges(false)
                  setEditingContact(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Выйти без сохранения
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
