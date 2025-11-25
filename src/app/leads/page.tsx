'use client'

import React, { useEffect, useState } from 'react'
import KanbanBoard from '../../components/KanbanBoard'
import DealModal from '../../components/DealModal'

export default function LeadsPage() {
  const [pipelines, setPipelines] = useState<any[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [createForm, setCreateForm] = useState({
    title: '',
    value: '',
    currency: 'RUB',
    company_id: '',
    contact_id: '',
    pipeline_id: '',
    stage_id: ''
  })

  useEffect(() => {
    async function load() {
      try {
        const [pipelinesRes, companiesRes, contactsRes, activePipelineRes] = await Promise.all([
          fetch('/api/pipelines'),
          fetch('/api/companies'),
          fetch('/api/contacts'),
          fetch('/api/account/active-pipeline')
        ])
        const pipelinesData = await pipelinesRes.json()
        const companiesData = await companiesRes.json()
        const contactsData = await contactsRes.json()
        const activePipelineData = await activePipelineRes.json()
        
        setPipelines(Array.isArray(pipelinesData) ? pipelinesData : [])
        setCompanies(Array.isArray(companiesData) ? companiesData : [])
        setContacts(Array.isArray(contactsData) ? contactsData : [])
        
        const pipelines = Array.isArray(pipelinesData) ? pipelinesData : []
        if (pipelines.length > 0) {
          // Восстанавливаем последнюю активную воронку из БД (привязано к аккаунту)
          const savedPipelineId = activePipelineData.pipelineId
          const pipelineExists = savedPipelineId && pipelines.find(p => p.id === savedPipelineId)
          const pipelineToSelect = pipelineExists ? savedPipelineId : pipelines[0].id
          
          setSelectedPipeline(pipelineToSelect)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  
  // Обновляем форму при смене активной воронки
  useEffect(() => {
    if (selectedPipeline) {
      // Сохраняем выбранную воронку в БД (привязано к аккаунту)
      fetch('/api/account/active-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId: selectedPipeline })
      }).catch(err => console.error('Failed to save active pipeline:', err))
      
      const pipeline = pipelines.find(p => p.id === selectedPipeline)
      if (pipeline) {
        setStages(pipeline.stages || [])
        setCreateForm(prev => ({ 
          ...prev, 
          pipeline_id: selectedPipeline,
          stage_id: pipeline.stages?.[0]?.id || ''
        }))
      }
    }
  }, [selectedPipeline, pipelines])
  


  function handleDealClick(dealId: string) {
    setSelectedDealId(dealId)
  }

  function handleCloseModal(needsRefresh = false) {
    setSelectedDealId(null)
    // Обновляем доску только если были изменения
    if (needsRefresh) {
      setRefreshKey(prev => prev + 1)
    }
  }
  
  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          value: parseFloat(createForm.value) || 0,
          currency: createForm.currency,
          company_id: createForm.company_id || null,
          contact_id: createForm.contact_id || null,
          pipeline_id: createForm.pipeline_id,
          stage_id: createForm.stage_id,
          closed: false
        })
      })
      if (res.ok) {
        setShowCreateModal(false)
        setCreateForm({
          title: '',
          value: '',
          currency: 'RUB',
          company_id: '',
          contact_id: '',
          pipeline_id: selectedPipeline || '',
          stage_id: stages[0]?.id || ''
        })
        // Обновляем KanbanBoard без перезагрузки страницы
        setRefreshKey(prev => prev + 1)
      }
    } catch (err) {
      console.error('Failed to create deal:', err)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Сделки</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          Создать сделку
        </button>
      </div>
      
      {pipelines.length > 0 && (
        <div className="mb-4 flex gap-2">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPipeline(p.id)}
              className={`px-4 py-2 rounded transition-colors ${
                selectedPipeline === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {selectedPipeline && (
        <div className="flex justify-center">
          <KanbanBoard key={`${selectedPipeline}-${refreshKey}`} pipelineId={selectedPipeline} onDealClick={handleDealClick} />
        </div>
      )}

      {selectedDealId && (
        <DealModal dealId={selectedDealId} onClose={handleCloseModal} />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Создать сделку</h2>
            
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Название*</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Сумма</label>
                  <input
                    type="number"
                    value={createForm.value}
                    onChange={e => setCreateForm(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Валюта</label>
                  <select
                    value={createForm.currency}
                    onChange={e => setCreateForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                  >
                    <option value="RUB">RUB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Компания</label>
                <select
                  value={createForm.company_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, company_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                >
                  <option value="">Не выбрано</option>
                  {(companies || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Контакт</label>
                <select
                  value={createForm.contact_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, contact_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                >
                  <option value="">Не выбрано</option>
                  {(contacts || []).map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Воронка*</label>
                <select
                  required
                  value={createForm.pipeline_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, pipeline_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                >
                  {(pipelines || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Этап*</label>
                <select
                  required
                  value={createForm.stage_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, stage_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                >
                  {(stages || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
