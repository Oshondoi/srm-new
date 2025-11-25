'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function CompaniesPage() {
  const searchParams = useSearchParams()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    phone: '',
    email: '',
    address: ''
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    website: '',
    phone: '',
    email: '',
    address: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const companyId = searchParams.get('openModal')
    if (companyId && companies.length > 0) {
      const company = companies.find(c => c.id === companyId)
      if (company) {
        openInfoModal(company)
      }
    }
  }, [searchParams, companies])

  async function loadData() {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      setCompanies(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openInfoModal(company: any) {
    setSelectedCompany(company)
    setEditForm({
      name: company.name || '',
      website: company.website || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || ''
    })
    setHasChanges(false)
    setShowModal(true)
  }

  function openCreateModalFunc() {
    setCreateFormData({
      name: '',
      website: '',
      phone: '',
      email: '',
      address: ''
    })
    setShowCreateModal(true)
  }

  function updateEditForm(field: string, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  function handleCloseModal() {
    if (hasChanges) {
      setShowExitConfirm(true)
    } else {
      setShowModal(false)
      setSelectedCompany(null)
      window.history.pushState({}, '', '/companies')
    }
  }

  async function handleSave() {
    if (!selectedCompany) return

    try {
      const res = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (!res.ok) throw new Error('Failed to update company')

      setShowModal(false)
      setSelectedCompany(null)
      setHasChanges(false)
      loadData()
      window.history.pushState({}, '', '/companies')
    } catch (e) {
      console.error(e)
      alert('Ошибка при сохранении компании')
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData)
      })
      if (!res.ok) throw new Error('Failed to create company')

      setShowCreateModal(false)
      loadData()
    } catch (e) {
      console.error(e)
      alert('Ошибка при создании компании')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить компанию?')) return

    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete company')
      loadData()
    } catch (e) {
      console.error(e)
      alert('Ошибка при удалении компании')
    }
  }

  if (loading) return <div className="text-white">Загрузка...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Компании</h1>
          
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
          onClick={openCreateModalFunc}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          + Создать компанию
        </button>
      </div>

      {viewMode === 'kanban' ? (
        /* Канбан вид - карточки */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(!companies || companies.length === 0) && (
          <div className="text-slate-400 col-span-full">Компании не найдены</div>
        )}
        {(companies || []).map((c: any) => (
          <div 
            key={c.id}
            className="card cursor-pointer hover:bg-slate-700/50 transition-colors h-[240px] flex flex-col"
            onClick={() => openInfoModal(c)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-white text-lg">{c.name}</div>
            </div>
            <div className="space-y-1 text-sm text-slate-400 mb-3 flex-1">
              <div className={c.website ? '' : 'invisible'} onClick={(e) => e.stopPropagation()}>
                🌐 {c.website ? (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">{c.website}</a>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className={c.email ? '' : 'invisible'}>
                ✉️ {c.email || '—'}
              </div>
              <div className={c.phone ? '' : 'invisible'}>
                📞 {c.phone || '—'}
              </div>
              <div className={c.address ? '' : 'invisible'}>
                📍 {c.address || '—'}
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
          {(!companies || companies.length === 0) && (
            <div className="text-slate-400">Компании не найдены</div>
          )}
          {(companies || []).map((c: any) => (
            <div 
              key={c.id} 
              className="bg-slate-800 hover:bg-slate-700 rounded p-4 transition-colors min-w-[900px] cursor-pointer"
              onClick={() => openInfoModal(c)}
            >
              <div className="flex items-center gap-4">
                {/* Название */}
                <div className="w-64 flex-shrink-0">
                  <div className="font-semibold text-white">{c.name}</div>
                </div>

                {/* Website */}
                <div className="w-56 flex-shrink-0">
                  <div className="text-slate-400 text-xs mb-0.5">Website</div>
                  <div className="text-white text-sm truncate">
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                        {c.website}
                      </a>
                    ) : '—'}
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

      {showModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Информация о компании</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Название</label>
                <input type="text" value={editForm.name} onChange={(e) => updateEditForm('name', e.target.value)} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Веб-сайт</label>
                <input type="url" value={editForm.website} onChange={(e) => updateEditForm('website', e.target.value)} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" placeholder="https://example.com" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => updateEditForm('email', e.target.value)} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Телефон</label>
                <input type="tel" value={editForm.phone} onChange={(e) => updateEditForm('phone', e.target.value)} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Адрес</label>
                <textarea value={editForm.address} onChange={(e) => updateEditForm('address', e.target.value)} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors">Закрыть</button>
                <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Несохраненные изменения</h3>
            <p className="text-slate-300 mb-6">У вас есть несохраненные изменения. Выйти без сохранения?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">Отмена</button>
              <button onClick={() => { setShowExitConfirm(false); setShowModal(false); setSelectedCompany(null); setHasChanges(false); window.history.pushState({}, '', '/companies') }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Выйти без сохранения</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Создать компанию</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Название *</label>
                <input type="text" required value={createFormData.name} onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Веб-сайт</label>
                <input type="url" value={createFormData.website} onChange={(e) => setCreateFormData({ ...createFormData, website: e.target.value })} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" placeholder="https://example.com" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input type="email" value={createFormData.email} onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Телефон</label>
                <input type="tel" value={createFormData.phone} onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Адрес</label>
                <textarea value={createFormData.address} onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })} className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
