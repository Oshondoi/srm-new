'use client'

import React, { useEffect, useState } from 'react'

interface DealModalProps {
  dealId: string
  onClose: () => void
}

export default function DealModal({ dealId, onClose }: DealModalProps) {
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'notes' | 'activity'>('info')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    due_at: ''
  })
  const [editForm, setEditForm] = useState<any>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [dealContacts, setDealContacts] = useState<any[]>([])
  const [pendingContactChanges, setPendingContactChanges] = useState<{
    added: string[],
    removed: string[]
  }>({ added: [], removed: [] })
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [companySearch, setCompanySearch] = useState('')
  const [contactSearch, setContactSearch] = useState('')

  useEffect(() => {
    loadDeal()
    loadReferences()
    loadDealContacts()
  }, [dealId])
  
  useEffect(() => {
    if (deal) {
      setEditForm({
        title: deal.title || '',
        value: deal.value || '',
        currency: deal.currency || 'RUB',
        company_id: deal.company_id || '',
        contact_id: deal.contact_id || ''
      })
    }
  }, [deal])
  
  useEffect(() => {
    function handleClickOutside() {
      if (activeMenu) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeMenu])

  async function loadReferences() {
    try {
      const [companiesRes, contactsRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/contacts')
      ])
      setCompanies(await companiesRes.json())
      setContacts(await contactsRes.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function loadDealContacts() {
    try {
      const res = await fetch(`/api/deals/${dealId}/contacts`)
      if (res.ok) {
        const data = await res.json()
        setDealContacts(data)
      }
    } catch (e) {
      console.error('Failed to load deal contacts:', e)
    }
  }

  async function addContactToDeal(contactId: string) {
    // Добавляем в локальное состояние
    const contactToAdd = contacts.find(c => c.id === contactId)
    if (contactToAdd && !dealContacts.find(dc => dc.id === contactId)) {
      setDealContacts([...dealContacts, contactToAdd])
      setPendingContactChanges(prev => ({
        added: [...prev.added, contactId],
        removed: prev.removed.filter(id => id !== contactId)
      }))
      setHasChanges(true)
    }
  }

  async function removeContactFromDeal(contactId: string) {
    // Удаляем из локального состояния
    setDealContacts(dealContacts.filter(dc => dc.id !== contactId))
    setPendingContactChanges(prev => ({
      added: prev.added.filter(id => id !== contactId),
      removed: [...prev.removed, contactId]
    }))
    setHasChanges(true)
  }

  async function loadDeal() {
    try {
      const res = await fetch(`/api/deals/${dealId}`)
      if (!res.ok) throw new Error('Failed to load deal')
      const data = await res.json()
      setDeal(data)
      setHasChanges(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  
  function updateEditForm(field: string, value: any) {
    setEditForm((prev: any) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }
  
  async function handleSave() {
    try {
      // Сохраняем основные поля сделки
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          value: parseFloat(editForm.value) || 0,
          currency: editForm.currency,
          company_id: editForm.company_id || null,
          contact_id: editForm.contact_id || null
        })
      })
      if (!res.ok) throw new Error('Failed to save')

      // Сохраняем изменения контактов
      for (const contactId of pendingContactChanges.added) {
        await fetch(`/api/deals/${dealId}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_id: contactId })
        })
      }

      for (const contactId of pendingContactChanges.removed) {
        await fetch(`/api/deals/${dealId}/contacts?contact_id=${contactId}`, {
          method: 'DELETE'
        })
      }

      // Очищаем pending changes
      setPendingContactChanges({ added: [], removed: [] })
      setHasChanges(false)
      
      await loadDeal()
      await loadDealContacts()
      alert('Сохранено!')
    } catch (e) {
      console.error(e)
      alert('Ошибка при сохранении')
    }
  }
  
  async function handleDelete() {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      window.location.reload()
    } catch (e) {
      console.error(e)
      alert('Ошибка при удалении')
    }
  }
  
  function handleClose() {
    if (hasChanges) {
      setShowExitConfirm(true)
    } else {
      onClose()
    }
  }
  
  async function handleCreateCompany(name: string) {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error('Failed to create company')
      const newCompany = await res.json()
      setCompanies([...companies, newCompany])
      updateEditForm('company_id', newCompany.id)
      setEditingCompany(false)
      setCompanySearch('')
    } catch (e) {
      console.error(e)
      alert('Ошибка при создании компании')
    }
  }
  
  async function handleCreateContact(fullName: string, forNewContact: boolean = false) {
    try {
      const nameParts = fullName.trim().split(' ')
      const first_name = nameParts[0] || ''
      const last_name = nameParts.slice(1).join(' ') || ''
      
      // Если создаем контакт для сделки и у сделки есть компания, добавляем ее к контакту
      const company_id = forNewContact && editForm.company_id ? editForm.company_id : null
      
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          first_name, 
          last_name,
          company_id
        })
      })
      if (!res.ok) throw new Error('Failed to create contact')
      const newContact = await res.json()
      setContacts([...contacts, newContact])
      
      if (forNewContact) {
        await addContactToDeal(newContact.id)
      } else {
        updateEditForm('contact_id', newContact.id)
      }
      
      setEditingContact(null)
      setContactSearch('')
    } catch (e) {
      console.error(e)
      alert('Ошибка при создании контакта')
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskFormData,
          deal_id: dealId
        })
      })
      if (!res.ok) throw new Error('Failed to create task')
      
      setShowTaskForm(false)
      setTaskFormData({ title: '', description: '', due_at: '' })
      loadDeal() // Reload to get updated tasks
    } catch (e) {
      console.error(e)
      alert('Ошибка при создании задачи')
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
      loadDeal()
    } catch (e) {
      console.error(e)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8">
          <div className="text-white">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
        <div className="bg-slate-800 rounded-lg p-8">
          <div className="text-white">Сделка не найдена</div>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">
            Закрыть
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-start">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={editForm.title || ''}
              onChange={(e) => updateEditForm('title', e.target.value)}
              className="text-2xl font-bold text-white mb-2 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none w-full"
            />
            <div className="flex gap-4 text-sm text-slate-400">
              <span>{deal.pipeline_name} → {deal.stage_name}</span>
              {deal.company_name && <span>• {deal.company_name}</span>}
              {deal.contact_name && <span>• {deal.contact_name}</span>}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 border-b border-slate-700">
          {(['info', 'tasks', 'notes', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'info' && 'Информация'}
              {tab === 'tasks' && `Задачи (${deal.tasks?.length || 0})`}
              {tab === 'notes' && `Заметки (${deal.notes?.length || 0})`}
              {tab === 'activity' && 'История'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Общая информация */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Общая информация</h3>
                <div className="space-y-3">
                  {/* Ответственный */}
                  <div className="flex items-center py-2">
                    <div className="w-32 text-sm text-slate-400">Отв-ный</div>
                    <div className="flex-1 text-white">Элестет</div>
                  </div>

                  {/* Бюджет */}
                  <div className="flex items-center py-2">
                    <div className="w-32 text-sm text-slate-400">Бюджет</div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        value={editForm.value || ''}
                        onChange={(e) => updateEditForm('value', e.target.value)}
                        className="flex-1 text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                        placeholder="0"
                      />
                      <select
                        value={editForm.currency || 'RUB'}
                        onChange={(e) => updateEditForm('currency', e.target.value)}
                        className="text-white bg-transparent outline-none"
                      >
                        <option value="RUB">₽</option>
                        <option value="USD">$</option>
                        <option value="EUR">€</option>
                      </select>
                    </div>
                  </div>

                  {/* Встреча */}
                  <div className="flex items-center py-2">
                    <div className="w-32 text-sm text-slate-400">Встреча</div>
                    <div className="flex-1 text-white">
                      {new Date(deal.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Контакт */}
              <div className="pt-6 border-t border-slate-700/50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Контакт</h3>
                <div className="space-y-4">
                  {/* Список контактов сделки */}
                  {dealContacts.map((dealContact, index) => (
                    <div key={dealContact.id} className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      {/* Имя контакта */}
                      <div className="flex items-center py-2 relative">
                        <div className="w-32 text-sm text-slate-400">Контакт</div>
                        <div className="flex-1">
                          {editingContact !== dealContact.id ? (
                            <div 
                              onClick={() => {
                                setActiveMenu(activeMenu === `contact-${dealContact.id}` ? null : `contact-${dealContact.id}`)
                              }}
                              className="text-white cursor-pointer hover:bg-slate-700/50 px-2 py-1 rounded -mx-2"
                            >
                              {dealContact.first_name} {dealContact.last_name}
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                value={contactSearch}
                                onChange={(e) => setContactSearch(e.target.value)}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setEditingContact(null)
                                    setContactSearch('')
                                  }, 200)
                                }}
                                autoFocus
                                placeholder="Введите имя контакта..."
                                className="w-full text-white bg-slate-700 px-2 py-1 rounded border border-blue-500 outline-none"
                              />
                              {contactSearch && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                                  {contacts
                                    .filter(c => {
                                      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
                                      return fullName.includes(contactSearch.toLowerCase())
                                    })
                                    .map(c => (
                                      <button
                                        key={c.id}
                                        onClick={async () => {
                                          await removeContactFromDeal(dealContact.id)
                                          await addContactToDeal(c.id)
                                          setEditingContact(null)
                                          setContactSearch('')
                                        }}
                                        className="w-full text-left px-3 py-2 text-white hover:bg-slate-600"
                                      >
                                        {c.first_name} {c.last_name}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {activeMenu === `contact-${dealContact.id}` && (
                          <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg py-1 z-10 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setActiveMenu(null)
                                alert('Переход в карточку контакта (в разработке)')
                              }}
                              className="w-full text-left px-4 py-2 text-white hover:bg-slate-600 flex items-center gap-2"
                            >
                              <span>📋</span>
                              <span>Перейти в карточку</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenu(null)
                                setEditingContact(dealContact.id)
                                setContactSearch(`${dealContact.first_name} ${dealContact.last_name}`)
                              }}
                              className="w-full text-left px-4 py-2 text-white hover:bg-slate-600 flex items-center gap-2"
                            >
                              <span>✏️</span>
                              <span>Редактировать</span>
                            </button>
                            <button
                              onClick={async () => {
                                setActiveMenu(null)
                                await removeContactFromDeal(dealContact.id)
                              }}
                              className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-600 flex items-center gap-2"
                            >
                              <span>🗑️</span>
                              <span>Удалить</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Телефон */}
                      {dealContact.phone && (
                        <div className="flex items-center py-2">
                          <div className="w-32 text-sm text-slate-400">Телефон</div>
                          <div className="flex-1">
                            <a href={`tel:${dealContact.phone}`} className="text-blue-400 hover:text-blue-300">
                              {dealContact.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Email */}
                      {dealContact.email && (
                        <div className="flex items-center py-2">
                          <div className="w-32 text-sm text-slate-400">Email</div>
                          <div className="flex-1">
                            <a href={`mailto:${dealContact.email}`} className="text-blue-400 hover:text-blue-300">
                              {dealContact.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Должность */}
                      {dealContact.position && (
                        <div className="flex items-center py-2">
                          <div className="w-32 text-sm text-slate-400">Должность</div>
                          <div className="flex-1 text-white">
                            {dealContact.position}
                          </div>
                        </div>
                      )}

                      {/* Компания контакта */}
                      {dealContact.company_id && (
                        <div className="flex items-center py-2">
                          <div className="w-32 text-sm text-slate-400">Компания</div>
                          <div className="flex-1 text-white">
                            {companies.find(c => c.id === dealContact.company_id)?.name || 'Не найдена'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Кнопка добавления нового контакта */}
                  <div className="flex items-center py-2 relative">
                    <div className="w-32 text-sm text-slate-400">Контакт</div>
                    <div className="flex-1">
                      {editingContact !== 'new' ? (
                        <div 
                          onClick={() => {
                            setEditingContact('new')
                            setContactSearch('')
                          }}
                          className="text-slate-400 cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded -mx-2"
                        >
                          Не указано
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            onBlur={() => {
                              setTimeout(() => {
                                setEditingContact(null)
                                setContactSearch('')
                              }, 200)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && contactSearch.trim()) {
                                handleCreateContact(contactSearch.trim(), true)
                              }
                            }}
                            autoFocus
                            placeholder="Введите имя контакта..."
                            className="w-full text-white bg-slate-700 px-2 py-1 rounded border border-blue-500 outline-none"
                          />
                          {contactSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                              {contactSearch.trim() && (
                                <button
                                  onClick={() => handleCreateContact(contactSearch.trim(), true)}
                                  className="w-full text-left px-3 py-2 text-blue-400 hover:bg-slate-600 border-b border-slate-600"
                                >
                                  + Создать контакт "{contactSearch.trim()}"
                                </button>
                              )}
                              {contacts
                                .filter(c => {
                                  const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
                                  return fullName.includes(contactSearch.toLowerCase())
                                })
                                .map(c => (
                                  <button
                                    key={c.id}
                                    onClick={async () => {
                                      await addContactToDeal(c.id)
                                      setEditingContact(null)
                                      setContactSearch('')
                                    }}
                                    className="w-full text-left px-3 py-2 text-white hover:bg-slate-600"
                                  >
                                    {c.first_name} {c.last_name}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Компания */}
              <div className="pt-6 border-t border-slate-700/50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Компания</h3>
                <div className="space-y-3">
                  {/* Компания */}
                  <div className="flex items-center py-2 relative">
                    <div className="w-32 text-sm text-slate-400">Компания</div>
                    <div className="flex-1">
                      {!editingCompany ? (
                        <div 
                          onClick={() => {
                            if (!editForm.company_id) {
                              setEditingCompany(true)
                              setCompanySearch('')
                            } else {
                              setActiveMenu(activeMenu === 'company' ? null : 'company')
                            }
                          }}
                          className="text-white cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded -mx-2"
                        >
                          {companies.find(c => c.id === editForm.company_id)?.name || 'Не указано'}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={companySearch}
                            onChange={(e) => setCompanySearch(e.target.value)}
                            onBlur={() => {
                              setTimeout(() => {
                                setEditingCompany(false)
                                setCompanySearch('')
                              }, 200)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && companySearch.trim()) {
                                handleCreateCompany(companySearch.trim())
                              }
                            }}
                            autoFocus
                            placeholder="Введите название компании..."
                            className="w-full text-white bg-slate-700 px-2 py-1 rounded border border-blue-500 outline-none"
                          />
                          {companySearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                              {companySearch.trim() && (
                                <button
                                  onClick={() => handleCreateCompany(companySearch.trim())}
                                  className="w-full text-left px-3 py-2 text-blue-400 hover:bg-slate-600 border-b border-slate-600"
                                >
                                  + Создать "{companySearch.trim()}"
                                </button>
                              )}
                              {companies
                                .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                                .map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      updateEditForm('company_id', c.id)
                                      setEditingCompany(false)
                                      setCompanySearch('')
                                    }}
                                    className="w-full text-left px-3 py-2 text-white hover:bg-slate-600"
                                  >
                                    {c.name}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {activeMenu === 'company' && editForm.company_id && (
                      <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg py-1 z-10 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setActiveMenu(null)
                            alert('Переход в карточку компании (в разработке)')
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-slate-600 flex items-center gap-2"
                        >
                          <span>📋</span>
                          <span>Перейти в карточку</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenu(null)
                            setEditingCompany(true)
                            setCompanySearch(companies.find(c => c.id === editForm.company_id)?.name || '')
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-slate-600 flex items-center gap-2"
                        >
                          <span>✏️</span>
                          <span>Редактировать</span>
                        </button>
                      </div>
                    )}
                  </div>

              {/* Телефон компании */}
              {deal.company_phone && (
                <div className="flex items-center py-2">
                  <div className="w-32 text-sm text-slate-400">Тел. компании</div>
                  <div className="flex-1">
                    <a href={`tel:${deal.company_phone}`} className="text-blue-400 hover:text-blue-300">
                      + {deal.company_phone}
                    </a>
                  </div>
                </div>
              )}
                </div>
              </div>

              {/* Еще */}
              <button className="text-blue-500 hover:text-blue-400 text-sm py-2">
                еще
              </button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mb-3"
              >
                + Создать задачу
              </button>

              {showTaskForm && (
                <form onSubmit={handleCreateTask} className="card space-y-3 mb-3">
                  <input
                    type="text"
                    placeholder="Название задачи *"
                    required
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  />
                  <textarea
                    placeholder="Описание"
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                    rows={2}
                  />
                  <input
                    type="date"
                    value={taskFormData.due_at}
                    onChange={(e) => setTaskFormData({ ...taskFormData, due_at: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              {deal.tasks?.length === 0 && !showTaskForm && (
                <div className="text-slate-400 text-center py-8">Задач нет</div>
              )}
              {deal.tasks?.map((task: any) => (
                <div key={task.id} className="card flex items-start gap-3">
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
                      {task.due_at && (
                        <span className={new Date(task.due_at) < new Date() && !task.completed ? 'text-red-400' : ''}>
                          📅 {new Date(task.due_at).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {task.assigned_user_name && <span>👤 {task.assigned_user_name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              {deal.notes?.length === 0 && (
                <div className="text-slate-400 text-center py-8">Заметок нет</div>
              )}
              {deal.notes?.map((note: any) => (
                <div key={note.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-slate-400">{note.author_name}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(note.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-white whitespace-pre-wrap">{note.content}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2">
              {deal.activity?.length === 0 && (
                <div className="text-slate-400 text-center py-8">История пуста</div>
              )}
              {deal.activity?.map((log: any) => (
                <div key={log.id} className="border-l-2 border-slate-700 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-white font-medium">{log.user_name}</span>
                      <span className="text-slate-400 ml-2">{log.action}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {log.details && (
                    <div className="text-sm text-slate-400 mt-1">{log.details}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-between gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Удалить
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
            >
              Закрыть
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-4 py-2 rounded transition-colors ${
                hasChanges
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
      
      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Несохранённые изменения</h3>
            <p className="text-slate-300 mb-6">У вас есть несохранённые изменения. Вы уверены, что хотите закрыть?</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // Восстанавливаем исходное состояние
                  await loadDealContacts()
                  if (deal) {
                    setEditForm({
                      title: deal.title || '',
                      value: deal.value || '',
                      currency: deal.currency || 'RUB',
                      company_id: deal.company_id || '',
                      contact_id: deal.contact_id || ''
                    })
                  }
                  setPendingContactChanges({ added: [], removed: [] })
                  setShowExitConfirm(false)
                  setHasChanges(false)
                  onClose()
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Закрыть без сохранения
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Удаление сделки</h3>
            <p className="text-slate-300 mb-6">Вы уверены, что хотите удалить сделку "{deal.title}"? Это действие нельзя отменить.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
