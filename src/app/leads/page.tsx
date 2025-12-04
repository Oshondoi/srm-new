'use client'

import React, { useEffect, useState } from 'react'
import KanbanBoard from '../../components/KanbanBoard'
import DealModal from '../../components/DealModal'

export default function LeadsPage() {
  const [pipelines, setPipelines] = useState<any[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [pipelinesRes, activePipelineRes] = await Promise.all([
          fetch('/api/pipelines'),
          fetch('/api/account/active-pipeline')
        ])
        const pipelinesData = await pipelinesRes.json()
        const activePipelineData = await activePipelineRes.json()
        
        setPipelines(Array.isArray(pipelinesData) ? pipelinesData : [])
        
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
  
  // Сохраняем выбранную воронку в БД при смене
  useEffect(() => {
    if (selectedPipeline) {
      fetch('/api/account/active-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId: selectedPipeline })
      }).catch(err => console.error('Failed to save active pipeline:', err))
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
  
  function handleCreateDeal() {
    // Открываем пустое модальное окно для создания новой сделки
    setSelectedDealId('new')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Сделки</h1>
        <button
          onClick={handleCreateDeal}
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
        <DealModal dealId={selectedDealId} onClose={handleCloseModal} activePipelineId={selectedPipeline} />
      )}
    </div>
  )
}
