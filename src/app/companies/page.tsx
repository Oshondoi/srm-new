'use client'

import React, { useEffect, useState } from 'react'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    phone: '',
    email: '',
    address: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      setCompanies(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingCompany(null)
    setFormData({
      name: '',
      website: '',
      phone: '',
      email: '',
      address: ''
    })
    setShowModal(true)
  }

  function openEditModal(company: any) {
    setEditingCompany(company)
    setFormData({
      name: company.name || '',
      website: company.website || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingCompany) {
        const res = await fetch(`/api/companies/${editingCompany.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to update company')
      } else {
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to create company')
      }

      setShowModal(false)
      loadData()
    } catch (e) {
      console.error(e)
      alert('Ошибка при сохранении компании')
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
        <h1 className="text-2xl font-bold text-white">Компании</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          + Создать компанию
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.length === 0 && (
          <div className="text-slate-400 col-span-full">Компании не найдены</div>
        )}
        {companies.map((c: any) => (
          <div key={c.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-white text-lg">{c.name}</div>
            </div>
            <div className="space-y-1 text-sm text-slate-400 mb-3">
              {c.website && (
                <div>🌐 <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">{c.website}</a></div>
              )}
              {c.email && <div>✉️ {c.email}</div>}
              {c.phone && <div>📞 {c.phone}</div>}
              {c.address && <div>📍 {c.address}</div>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(c)}
                className="flex-1 px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm"
              >
                Редактировать
              </button>
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

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingCompany ? 'Редактировать компанию' : 'Создать компанию'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Название *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Веб-сайт</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Телефон</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Адрес</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {editingCompany ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
