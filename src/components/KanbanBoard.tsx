"use client"

import React, { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'

type Stage = { id: string; name: string; position: number; deals_count?: number; color?: string }
type Contact = { id: string; first_name: string; last_name: string; full_name?: string }
type Deal = { 
  id: string
  title: string
  stage_id: string
  value: number
  company_name?: string
  contacts?: Contact[]
  responsible_user_name?: string
  created_at?: string
}

function DraggableCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="deal-card bg-slate-700 hover:bg-slate-600 rounded p-[6px] cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="font-medium text-white mb-1">{deal.title}</div>
      {deal.responsible_user_name && (
        <div className="text-sm text-slate-300 mb-1.5 font-medium">
          🔑 {deal.responsible_user_name}
        </div>
      )}
      
      {/* Контакт и компания в одной строке */}
      {(deal.contacts?.[0] || deal.company_name) && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
          <span>👤</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {deal.contacts?.[0] && (
              <span className="truncate">
                {deal.contacts[0].full_name || `${deal.contacts[0].first_name} ${deal.contacts[0].last_name}`.trim()}
              </span>
            )}
            {deal.company_name && (
              <span className="truncate text-slate-500">
                {deal.company_name}
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-600">
        <div className="text-sm font-semibold text-blue-400">
          {deal.value > 0 ? `${deal.value.toLocaleString()} ₽` : '—'}
        </div>
        <div className="text-xs font-medium text-slate-400">
          {deal.created_at ? new Date(deal.created_at).toLocaleString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
          }) : ''}
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ stage, deals, onDealClick }: { stage: Stage; deals: Deal[]; onDealClick: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="card flex-shrink-0" style={{ width: '316px', padding: 0 }}>
      <div className="rounded p-[3px] mb-2" style={{ backgroundColor: stage.color || '#3b82f6' }}>
        <div className="font-semibold text-white text-center mb-1">{stage.name}</div>
        <div className="text-center">
          <span className="text-xs text-white/80">
            {deals.length} {deals.length === 1 ? 'сделка' : deals.length < 5 ? 'сделки' : 'сделок'}:
          </span>
          <span className="text-sm font-semibold text-white ml-1">
            {deals.reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()} ₽
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[200px] rounded transition-colors mx-2 mb-2 mt-0 ${
          isOver ? 'bg-slate-700/50' : 'bg-slate-800/30'
        }`}
      >
        {deals.length === 0 && (
          <div className="text-slate-500 text-sm text-center py-4">Перетащите сюда</div>
        )}
        {deals.map((d) => (
          <DraggableCard key={d.id} deal={d} onClick={() => onDealClick(d.id)} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard({ pipelineId, onDealClick }: { pipelineId: string; onDealClick?: (dealId: string) => void }) {
  const [stages, setStages] = useState<Stage[]>([])
  const [dealsByStage, setDealsByStage] = useState<Record<string, Deal[]>>({})
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Horizontal scroll drag state
  const [isDraggingScroll, setIsDraggingScroll] = useState(false)
  const [scrollStartX, setScrollStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Один запрос вместо двух - получаем этапы + сделки сразу
        const res = await fetch(`/api/pipelines/${pipelineId}/deals`)
        if (!res.ok) {
          console.error('Failed to load pipeline data')
          return
        }
        const data = await res.json()
        
        setStages(data.stages || [])
        
        // Преобразуем в формат dealsByStage
        const grouped: Record<string, Deal[]> = {}
        for (const stage of data.stages || []) {
          grouped[stage.id] = stage.deals || []
        }
        setDealsByStage(grouped)
      } catch (e) {
        console.error('Failed to load pipeline data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pipelineId])

  // Слушаем обновления сделки из модалки (смена этапа после сохранения)
  useEffect(() => {
    function handleDealUpdated(e: any) {
      const { dealId, stage_id } = e.detail || {}
      if (!dealId || !stage_id) return
      setDealsByStage(prev => {
        // Найдём текущий этап сделки
        let currentStage: string | null = null
        let movingDeal: Deal | null = null
        for (const [sid, list] of Object.entries(prev)) {
          const found = list.find(d => d.id === dealId)
          if (found) {
            currentStage = sid
            movingDeal = found
            break
          }
        }
        if (!movingDeal || currentStage === stage_id) return prev
        const copy: Record<string, Deal[]> = {}
        for (const k of Object.keys(prev)) copy[k] = [...prev[k]]
        copy[currentStage!] = copy[currentStage!].filter(d => d.id !== dealId)
        if (!copy[stage_id]) copy[stage_id] = []
        copy[stage_id] = [...copy[stage_id], { ...movingDeal, stage_id }]
        return copy
      })
    }
    window.addEventListener('deal-updated', handleDealUpdated)
    return () => window.removeEventListener('deal-updated', handleDealUpdated)
  }, [])

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDeal(null)
    
    if (!over || active.id === over.id) return
    
    const dealId = active.id as string
    const toStageId = over.id as string
    
    // Find original stage
    let fromStageId = ''
    let deal: Deal | undefined
    for (const [stageId, deals] of Object.entries(dealsByStage)) {
      const found = deals.find(d => d.id === dealId)
      if (found) {
        fromStageId = stageId
        deal = found
        break
      }
    }
    
    if (!deal || fromStageId === toStageId) return

    // Optimistic update
    setDealsByStage((prev) => {
      const copy: Record<string, Deal[]> = {}
      for (const k of Object.keys(prev)) {
        copy[k] = [...prev[k]]
      }
      copy[fromStageId] = copy[fromStageId].filter((d) => d.id !== dealId)
      copy[toStageId] = [...copy[toStageId], { ...deal, stage_id: toStageId }]
      return copy
    })

    // API call
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, toStageId })
      })
      
      if (!res.ok) {
        // Rollback on error
        setDealsByStage((prev) => {
          const copy: Record<string, Deal[]> = {}
          for (const k of Object.keys(prev)) {
            copy[k] = [...prev[k]]
          }
          copy[toStageId] = copy[toStageId].filter((d) => d.id !== dealId)
          copy[fromStageId] = [...copy[fromStageId], deal!]
          return copy
        })
      }
    } catch (e) {
      console.error('Failed to update deal:', e)
    }
  }

  function handleDragStart(event: any) {
    const dealId = event.active.id as string
    for (const deals of Object.values(dealsByStage)) {
      const found = deals.find(d => d.id === dealId)
      if (found) {
        setActiveDeal(found)
        break
      }
    }
  }

  // Horizontal scroll drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking on a deal card
    const target = e.target as HTMLElement
    if (target.closest('.deal-card')) return
    
    const container = scrollContainerRef.current
    if (!container) return
    
    setIsDraggingScroll(true)
    setScrollStartX(e.pageX - container.offsetLeft)
    setScrollLeft(container.scrollLeft)
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll) return
    const container = scrollContainerRef.current
    if (!container) return
    
    e.preventDefault()
    const x = e.pageX - container.offsetLeft
    const walk = (x - scrollStartX) * 1.5 // Scroll speed multiplier
    container.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDraggingScroll(false)
  }

  const handleMouseLeave = () => {
    setIsDraggingScroll(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-lg">Загрузка сделок...</div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex justify-center w-full">
        <div 
          ref={scrollContainerRef}
          className={`overflow-x-auto hide-scrollbar ${isDraggingScroll ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ userSelect: isDraggingScroll ? 'none' : 'auto' }}
        >
          <div className="flex gap-2 w-fit mx-auto">
            {stages.map((s, index) => (
              <DroppableColumn
                key={s.id}
                stage={s}
                deals={dealsByStage[s.id] || []}
                onDealClick={(id) => onDealClick?.(id)}
                isFirst={false}
                isLast={false}
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDeal && (
          <div className="bg-slate-600 rounded p-3 shadow-lg opacity-90">
            <div className="font-medium text-white">{activeDeal.title}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
