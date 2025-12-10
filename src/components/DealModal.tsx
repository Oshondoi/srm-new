'use client'

import React, { useEffect, useState, useRef } from 'react'

interface DealModalProps {
  dealId: string | 'new'
  onClose: (needsRefresh?: boolean) => void
  activePipelineId?: string | null
}

export default function DealModal({ dealId, onClose, activePipelineId }: DealModalProps) {
  const isNewDeal = dealId === 'new'
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
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
    removed: string[],
    newContacts: Array<{ tempId: string, first_name: string, last_name: string, company_id?: string }>
  }>({ added: [], removed: [], newContacts: [] })
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [companySearch, setCompanySearch] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [stages, setStages] = useState<any[]>([])
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [activeContactIndex, setActiveContactIndex] = useState(0)
  const [editingContactCompany, setEditingContactCompany] = useState<string | null>(null)
  const [contactCompanySearch, setContactCompanySearch] = useState('')
  const [editingNewContactCompany, setEditingNewContactCompany] = useState(false)
  const [newContactCompanySearch, setNewContactCompanySearch] = useState('')
  const [contactHeights, setContactHeights] = useState<Record<string, number>>({})
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(true)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [chatType, setChatType] = useState<'chat' | 'note' | 'task'>('chat')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedRecipient, setSelectedRecipient] = useState<any>({ name: 'Показать только участников', type: 'all' })
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false)
  const [accountUsers, setAccountUsers] = useState<any[]>([])
  const [taskRelationType, setTaskRelationType] = useState<string>('meeting')
  const [showTaskRelationDropdown, setShowTaskRelationDropdown] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [showChatFilters, setShowChatFilters] = useState(false)
  const [isClosingFilters, setIsClosingFilters] = useState(false)
  const [chatFilter, setChatFilter] = useState<'all' | 'chats-only' | 'chats-with-clients'>('all')
  
  // Детальные фильтры
  const [chatMessagesEnabled, setChatMessagesEnabled] = useState(false)
  const [chatMessagesType, setChatMessagesType] = useState<'all' | 'with-clients' | 'internal'>('all')
  const [showChatMessagesDropdown, setShowChatMessagesDropdown] = useState(false)
  
  const [relatedObjectsEnabled, setRelatedObjectsEnabled] = useState(false)
  const [selectedRelatedObjects, setSelectedRelatedObjects] = useState<string[]>([])
  const [showRelatedObjectsDropdown, setShowRelatedObjectsDropdown] = useState(false)
  const [relatedObjectsSearch, setRelatedObjectsSearch] = useState('')
  
  const [showEventTypesDropdown, setShowEventTypesDropdown] = useState(false)
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [eventTypesSearch, setEventTypesSearch] = useState('')
  
  // Subscription state
  const [userPlan, setUserPlan] = useState<'free' | 'professional' | 'business'>('free')
  const [hasSearchAccess, setHasSearchAccess] = useState(false)
  
  // Footer animation state
  const [isFooterClosing, setIsFooterClosing] = useState(false)
  
  // Initial state backup for cancel
  const [initialEditForm, setInitialEditForm] = useState<any>({})
  const [initialDealContacts, setInitialDealContacts] = useState<any[]>([])
  const [initialCompanies, setInitialCompanies] = useState<any[]>([])
  const [newContactDraft, setNewContactDraft] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    position: '',
    budget2: '',
    meeting_date: '',
    company_id: ''
  })
  const [initialNewContactDraft, setInitialNewContactDraft] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    position: '',
    budget2: '',
    meeting_date: '',
    company_id: ''
  })
  const [newCompanyDraft, setNewCompanyDraft] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: ''
  })
  const [initialNewCompanyDraft, setInitialNewCompanyDraft] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: ''
  })
  
  const relatedObjectTypes = [
    { id: 'contacts', label: 'Контакты' },
    { id: 'companies', label: 'Компании' },
    { id: 'deals', label: 'Сделки' },
    { id: 'tasks', label: 'Задачи' }
  ]
  
  const eventTypes = [
    { id: 'active-tasks', label: 'Активные задачи' },
    { id: 'incoming-sms', label: 'Входящее смс' },
    { id: 'incoming-call', label: 'Входящий звонок' },
    { id: 'completed-tasks', label: 'Выполненные задачи' },
    { id: 'pinned-notes', label: 'Закрепленные примечания' },
    { id: 'outgoing-sms', label: 'Исходящее смс' },
    { id: 'outgoing-call', label: 'Исходящий звонок' },
    { id: 'email', label: 'Письмо' },
    { id: 'notes', label: 'Примечания' }
  ]

  useEffect(() => {
    // Запускаем анимацию открытия
    requestAnimationFrame(() => {
      setIsOpening(false)
    })
    
    // Загружаем только критичные данные при открытии
    if (!isNewDeal) {
      // ОДИН запрос вместо 5 - получаем всё сразу
      fetch(`/api/deals/${dealId}/full`)
        .then(async res => {
          // Безопасная обработка статусов: 200 → данные, 401/404/500 → пустые структуры
          if (!res.ok) {
            console.warn(`Deal full API non-200: ${res.status}`)
            return { deal: null, contacts: [], stages: [], users: [] }
          }
          return res.json()
        })
        .then(data => {
          setDeal(data.deal || null)
          setDealContacts(data.contacts || [])
          setStages(data.stages || [])
          setAccountUsers(data.users || [])
          // Сохраняем начальное состояние для отмены
          setInitialDealContacts(JSON.parse(JSON.stringify(data.contacts || [])))
          // Устанавливаем isReady только ПОСЛЕ загрузки данных
          setIsReady(true)
        })
        .catch(e => {
          console.error('Failed to load deal data:', e)
          // Страховка: заполняем пустыми структурами, чтобы UI не был пустым
          setDeal(null)
          setDealContacts([])
          setStages([])
          setAccountUsers([])
          // Даже при ошибке разрешаем UI показаться
          setIsReady(true)
        })
      
      loadChatMessages()
      loadSubscription()
      loadReferences() // Для автокомплита (ленивая загрузка)
    } else {
      // Для новой сделки инициализируем пустую форму с активной воронкой
      setDeal(null)
      
      // Загружаем воронки и устанавливаем АКТИВНУЮ воронку
      fetch('/api/pipelines')
        .then(res => res.json())
        .then(pipelines => {
          if (pipelines && pipelines.length > 0) {
            // Находим активную воронку или берём первую
            const activePipeline = activePipelineId 
              ? pipelines.find((p: any) => p.id === activePipelineId) || pipelines[0]
              : pipelines[0]
            
            const firstStage = activePipeline.stages?.[0]
            setStages(activePipeline.stages || [])
            const initialForm = {
              title: '',
              value: '',
              company_id: '',
              stage_id: firstStage?.id || '',
              stage_name: firstStage?.name || '',
              responsible_user_id: '',
              pipeline_id: activePipeline.id
            }
            setEditForm(initialForm)
            const emptyContactDraft = createEmptyNewContactDraft(initialForm.company_id)
            const emptyCompanyDraft = createEmptyNewCompanyDraft()
            setInitialEditForm(JSON.parse(JSON.stringify(initialForm)))
            setNewContactDraft(emptyContactDraft)
            setInitialNewContactDraft(emptyContactDraft)
            setNewCompanyDraft(emptyCompanyDraft)
            setInitialNewCompanyDraft(emptyCompanyDraft)
          }
        })
        .catch(e => console.error('Failed to load pipelines:', e))
      
      setDealContacts([])
      loadAccountUsers()
      loadSubscription()
      loadReferences()
      setIsReady(true) // Для новой сделки сразу готовы
    }
  }, [dealId, isNewDeal])
  
  useEffect(() => {
    if (deal) {
      // Небольшая задержка чтобы избежать "моргания" при первом рендере
      requestAnimationFrame(() => {
        const formData = {
          title: deal.title || '',
          value: deal.value !== null && deal.value !== undefined ? String(Math.floor(Number(deal.value))) : '',
          company_id: deal.company_id || '',
          stage_id: deal.stage_id || '',
          stage_name: deal.stage_name || '',
          responsible_user_id: deal.responsible_user_id || ''
        }
        setEditForm(formData)
        // Сохраняем начальное состояние
        setInitialEditForm(JSON.parse(JSON.stringify(formData)))
        const emptyContactDraft = createEmptyNewContactDraft(formData.company_id)
        const emptyCompanyDraft = createEmptyNewCompanyDraft()
        setNewContactDraft(emptyContactDraft)
        setInitialNewContactDraft(emptyContactDraft)
        setNewCompanyDraft(emptyCompanyDraft)
        setInitialNewCompanyDraft(emptyCompanyDraft)
      })
      // Закрываем dropdown при загрузке новых данных
      setShowStageDropdown(false)
    }
  }, [deal])

  useEffect(() => {
    const targetCompanyId = editForm.company_id || ''
    setNewContactDraft(prev => {
      if (prev.company_id === targetCompanyId) {
        return prev
      }
      const updated = { ...prev, company_id: targetCompanyId }
      updateHasChangesState(undefined, undefined, undefined, undefined, updated)
      return updated
    })
  }, [editForm.company_id])
  
  // Функция для анимированного закрытия фильтров
  const closeChatFilters = () => {
    setIsClosingFilters(true)
    setTimeout(() => {
      setShowChatFilters(false)
      setIsClosingFilters(false)
    }, 200) // Длительность анимации
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      
      // Закрываем панель фильтров чата при клике вне её (НО НЕ при клике на поле поиска)
      if (showChatFilters && !target.closest('.chat-filters-panel') && !target.closest('.search-filter-toggle')) {
        closeChatFilters()
        return
      }
      
      // Закрываем все dropdown'ы, если клик был вне них
      if (!target.closest('.dropdown-container') && !target.closest('.stage-dropdown-container') && !target.closest('.recipient-dropdown') && !target.closest('.responsible-dropdown') && !target.closest('.task-relation-dropdown') && !target.closest('.context-menu') && !target.closest('.context-menu-trigger')) {
        setActiveMenu(null)
        setShowStageDropdown(false)
        setShowRecipientDropdown(false)
        setShowResponsibleDropdown(false)
        setShowTaskRelationDropdown(false)
      } else {
        // Если клик внутри одного dropdown, закрываем остальные
        if (!target.closest('.dropdown-container') && !target.closest('.context-menu') && !target.closest('.context-menu-trigger')) {
          setActiveMenu(null)
        }
        if (!target.closest('.stage-dropdown-container')) {
          setShowStageDropdown(false)
        }
        if (!target.closest('.recipient-dropdown')) {
          setShowRecipientDropdown(false)
        }
        if (!target.closest('.responsible-dropdown')) {
          setShowResponsibleDropdown(false)
        }
        if (!target.closest('.task-relation-dropdown')) {
          setShowTaskRelationDropdown(false)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showChatFilters])

  // Пересчёт высот аккордеона контактов (вынесено в функцию для ручного вызова)
  function recalcContactHeights() {
    // Ждем следующий кадр чтобы refs успели обновиться
    requestAnimationFrame(() => {
      const heights: Record<string, number> = {}
      // Существующие контакты
      for (const contact of dealContacts) {
        const el = contentRefs.current[contact.id]
        if (el) {
          heights[contact.id] = el.scrollHeight + 20 // учёт padding контейнера
        }
      }
      // КРИТ КОНТАКТ (форма создания) - часть гармошки
      const newContactEl = contentRefs.current['new']
      if (newContactEl) {
        heights['new'] = newContactEl.scrollHeight + 20
      }
      setContactHeights(heights)
    })
  }

  // Автоматический пересчёт при изменении списка/редактировании структуры
  useEffect(() => {
    recalcContactHeights()
  }, [dealContacts, editingContact, editingContactCompany, newContactDraft])

  // Дополнительный пересчёт при смене активного контакта (гарантия корректной высоты после клика)
  useEffect(() => {
    if (dealContacts.length > 0) {
      // Два кадра подряд для стабильности измерения после анимации
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          recalcContactHeights()
        })
      })
    }
  }, [activeContactIndex, dealContacts.length])

  // Автопрокрутка чата вниз при добавлении сообщений
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [chatMessages.length])

  async function loadReferences() {
    // Ленивая загрузка - вызывается только при необходимости
    if (companies.length > 0 && contacts.length > 0) return // Уже загружены
    
    try {
      const [companiesRes, contactsRes] = await Promise.all([
        fetch('/api/companies?limit=100'), // Лимит для производительности
        fetch('/api/contacts?limit=100')
      ])
      const loadedCompanies = await companiesRes.json()
      setCompanies(loadedCompanies)
      // Сохраняем начальное состояние компаний
      if (initialCompanies.length === 0) {
        setInitialCompanies(JSON.parse(JSON.stringify(loadedCompanies)))
      }
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

  async function loadPipelineStages(pipelineId?: string) {
    try {
      const res = await fetch('/api/pipelines')
      if (res.ok) {
        const pipelines = await res.json()
        // Найдём воронку по ID
        const currentPipeline = pipelines.find((p: any) => p.id === pipelineId)
        if (currentPipeline && currentPipeline.stages) {
          setStages(currentPipeline.stages.sort((a: any, b: any) => a.position - b.position))
        }
      }
    } catch (e) {
      console.error('Failed to load stages:', e)
    }
  }

  function changeStage(newStageId: string) {
    const selected = stages.find((s: any) => s.id === newStageId)
    if (!selected) return
    // Буферизуем изменение этапа до сохранения
    setEditForm((prev: any) => ({
      ...prev,
      stage_id: selected.id,
      stage_name: selected.name
    }))
    setHasChanges(true)
    setShowStageDropdown(false)
  }

  async function addContactToDeal(contactId: string) {
    // Добавляем в локальное состояние
    const contactToAdd = contacts.find(c => c.id === contactId)
    if (contactToAdd && !dealContacts.find(dc => dc.id === contactId)) {
      setDealContacts([...dealContacts, contactToAdd])
      setPendingContactChanges(prev => ({
        added: [...prev.added, contactId],
        removed: prev.removed.filter(id => id !== contactId),
        newContacts: prev.newContacts
      }))
      setHasChanges(true)
    }
  }

  async function removeContactFromDeal(contactId: string) {
    // Удаляем из локального состояния
    setDealContacts(dealContacts.filter(dc => dc.id !== contactId))
    setPendingContactChanges(prev => ({
      added: prev.added.filter(id => id !== contactId),
      removed: [...prev.removed, contactId],
      newContacts: prev.newContacts
    }))
    setHasChanges(true)
  }

  async function loadDeal() {
    if (isNewDeal) return // Для новой сделки не загружаем данные
    
    try {
      const res = await fetch(`/api/deals/${dealId}`)
      if (!res.ok) throw new Error('Failed to load deal')
      const data = await res.json()
      setDeal(data)
      setHasChanges(false)
      // Загружаем этапы параллельно (не блокируем)
      if (data.pipeline_id) {
        loadPipelineStages(data.pipeline_id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function loadAccountUsers() {
    try {
      const res = await fetch('/api/account/users', {
        credentials: 'include'
      })
      if (res.ok) {
        const users = await res.json()
        console.log('Loaded account users:', users)
        setAccountUsers(users)
        
        // Для новой сделки устанавливаем текущего пользователя как ответственного
        if (isNewDeal && users.length > 0) {
          // Получаем текущего пользователя из /api/auth/me
          fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
              if (data.user) {
                setEditForm(prev => ({
                  ...prev,
                  responsible_user_id: data.user.id
                }))
              }
            })
            .catch(e => console.error('Failed to get current user:', e))
        }
      } else {
        console.error('Failed to load users, status:', res.status, await res.text())
      }
    } catch (e) {
      console.error('Failed to load account users:', e)
    }
  }

  async function loadSubscription() {
    try {
      const res = await fetch('/api/account/subscription', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUserPlan(data.plan || 'free')
        // Проверяем доступ к поиску по сообщениям
        setHasSearchAccess(data.plan === 'professional' || data.plan === 'business')
      }
    } catch (e) {
      console.error('Failed to load subscription:', e)
      setUserPlan('free')
      setHasSearchAccess(false)
    }
  }

  async function loadChatMessages() {
    try {
      // Временная заглушка - данные из localStorage или можно добавить API endpoint
      const stored = localStorage.getItem(`deal-chat-${dealId}`)
      if (stored) {
        setChatMessages(JSON.parse(stored))
      } else {
        // Добавляем демо-сообщения при первой загрузке
        const demoMessages = [
          {
            id: '1',
            text: 'Здравствуйте! Интересуемся вашим предложением.',
            sender: 'Петр Петрович',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isOwn: false
          },
          {
            id: '2',
            text: 'Добрый день! Конечно, с удовольствием расскажу подробнее. Когда вам будет удобно созвониться?',
            sender: 'Элестет',
            timestamp: new Date(Date.now() - 3000000).toISOString(),
            isOwn: true
          }
        ]
        setChatMessages(demoMessages)
        localStorage.setItem(`deal-chat-${dealId}`, JSON.stringify(demoMessages))
      }
    } catch (e) {
      console.error('Failed to load chat:', e)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return
    
    const message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'Элестет',
      timestamp: new Date().toISOString(),
      isOwn: true,
      type: chatType
    }
    
    const updatedMessages = [...chatMessages, message]
    setChatMessages(updatedMessages)
    
    // Сохраняем в localStorage (можно заменить на API)
    localStorage.setItem(`deal-chat-${dealId}`, JSON.stringify(updatedMessages))
    
    setNewMessage('')
    setShowMentions(false)
    
    // Автоскролл вниз
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function handleMessageInput(text: string) {
    setNewMessage(text)
    
    // Проверяем на @ для упоминаний
    const lastAtIndex = text.lastIndexOf('@')
    if (lastAtIndex !== -1 && lastAtIndex === text.length - 1) {
      setShowMentions(true)
      setMentionSearch('')
    } else if (lastAtIndex !== -1) {
      const searchText = text.slice(lastAtIndex + 1)
      if (!searchText.includes(' ')) {
        setShowMentions(true)
        setMentionSearch(searchText)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  function insertMention(name: string) {
    const lastAtIndex = newMessage.lastIndexOf('@')
    const beforeAt = newMessage.slice(0, lastAtIndex)
    setNewMessage(beforeAt + '@' + name + ' ')
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  // Формируем список пользователей для упоминаний и фильтрации
  const userMentions = accountUsers.map(u => ({
    name: u.full_name || u.email,
    type: 'user',
    id: u.id
  }))

  const mentionList = [
    { name: 'Businessbot', type: 'bot' },
    { name: 'Salesbot', type: 'bot' },
    { name: 'ОТДЕЛ ПРОДАЖ', type: 'department' },
    ...userMentions
  ].filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase()))

  // Список получателей зависит от типа сообщения
  const recipientList: Array<{name: string, type: string, icon?: string, tag?: string, id?: string}> = chatType === 'task' 
    ? [
        { name: 'Показать только участников', type: 'all' },
        ...userMentions.map(u => ({ ...u, icon: '👤' }))
      ]
    : [
        { name: 'Показать только участников', type: 'all' },
        { name: 'Businessbot', type: 'bot', icon: '🤖' },
        { name: 'Salesbot', type: 'bot', icon: '🤖' },
        { name: 'ОТДЕЛ ПРОДАЖ', type: 'department', icon: '👥', tag: 'ВЕСЬ ОТДЕЛ' },
        ...userMentions.map(u => ({ ...u, icon: '👤' }))
      ]

  const taskRelationTypes = [
    { value: 'meeting', label: 'Встреча', icon: '📅' },
    { value: 'call', label: 'Звонок', icon: '📞' },
    { value: 'email', label: 'Письмо', icon: '✉️' },
    { value: 'other', label: 'Другой', icon: '⚙️' }
  ]

  function createEmptyNewContactDraft(baseCompanyId?: string | null) {
    return {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      position: '',
      budget2: '',
      meeting_date: '',
      company_id: baseCompanyId || ''
    }
  }

  function isNewContactDraftEmpty(draft: typeof newContactDraft) {
    return !draft.first_name && !draft.last_name && !draft.phone && !draft.email &&
      !draft.position && !draft.budget2 && !draft.meeting_date
  }

  function createEmptyNewCompanyDraft() {
    return {
      name: '',
      phone: '',
      email: '',
      website: '',
      address: ''
    }
  }

  function isNewCompanyDraftEmpty(draft: typeof newCompanyDraft) {
    return !draft.name && !draft.phone && !draft.email && !draft.website && !draft.address
  }

  function handleContactSearchChange(value: string) {
    setContactSearch(value)
    if (editingContact === 'new') {
      const trimmed = value.trim()
      if (!trimmed) {
        setNewContactDraft(prev => {
          const updated = { ...prev, first_name: '', last_name: '' }
          updateHasChangesState(undefined, undefined, undefined, undefined, updated)
          return updated
        })
        return
      }
      const parts = trimmed.split(/\s+/)
      const first = parts[0] || ''
      const last = parts.slice(1).join(' ')
      setNewContactDraft(prev => {
        const updated = { ...prev, first_name: first, last_name: last }
        updateHasChangesState(undefined, undefined, undefined, undefined, updated)
        return updated
      })
    }
  }

  function prepareNewContactDraftForSave(draft: typeof newContactDraft) {
    const first = draft.first_name.trim()
    const last = draft.last_name.trim()
    const hasName = first || last
    const hasDetails = draft.phone || draft.email || draft.position || draft.budget2 || draft.meeting_date
    if (!hasName && !hasDetails) {
      return null
    }
    if (!hasName) {
      return null
    }
    return {
      first_name: first,
      last_name: last,
      phone: draft.phone || undefined,
      email: draft.email || undefined,
      position: draft.position || undefined,
      budget2: draft.budget2 || undefined,
      meeting_date: draft.meeting_date || undefined,
      company_id: draft.company_id || ''
    }
  }

  function prepareNewCompanyDraftForSave(draft: typeof newCompanyDraft) {
    const name = draft.name.trim()
    const hasDetails = draft.phone || draft.email || draft.website || draft.address
    if (!name && !hasDetails) {
      return null
    }
    if (!name) {
      return null
    }
    return {
      name,
      phone: draft.phone || undefined,
      email: draft.email || undefined,
      website: draft.website || undefined,
      address: draft.address || undefined
    }
  }

  function normalizePrimitive(value: any) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return ''
      return value.toString()
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    return value
  }

  function deepEqualWithEmpty(left: any, right: any): boolean {
    const leftIsArray = Array.isArray(left)
    const rightIsArray = Array.isArray(right)

    if (leftIsArray || rightIsArray) {
      if (!leftIsArray || !rightIsArray) {
        const leftNormalized = leftIsArray ? left : []
        const rightNormalized = rightIsArray ? right : []
        if (leftNormalized.length === 0 && rightNormalized.length === 0) {
          return true
        }
        return false
      }

      if (left.length !== right.length) {
        return false
      }

      for (let i = 0; i < left.length; i += 1) {
        if (!deepEqualWithEmpty(left[i], right[i])) {
          return false
        }
      }
      return true
    }

    const leftIsObject = left && typeof left === 'object'
    const rightIsObject = right && typeof right === 'object'

    if (leftIsObject || rightIsObject) {
      if (!leftIsObject || !rightIsObject) {
        const leftKeys = leftIsObject ? Object.keys(left) : []
        const rightKeys = rightIsObject ? Object.keys(right) : []
        if (leftKeys.length === 0 && rightKeys.length === 0) {
          return true
        }
        return false
      }

      const keys = new Set<string>([...Object.keys(left), ...Object.keys(right)])
      for (const key of keys) {
        if (!deepEqualWithEmpty(left[key], right[key])) {
          return false
        }
      }
      return true
    }

    return normalizePrimitive(left) === normalizePrimitive(right)
  }
  
  // Проверка, совпадает ли текущее состояние с начальным
  function checkIfStateMatchesInitial(
    newEditForm?: any,
    newDealContacts?: any[],
    newCompanies?: any[],
    newPendingChanges?: any,
    newContactDraftOverride?: typeof newContactDraft,
    newCompanyDraftOverride?: typeof newCompanyDraft
  ) {
    const currentEditForm = newEditForm || editForm
    const currentDealContacts = newDealContacts || dealContacts
    const currentCompanies = newCompanies || companies
    const currentPendingChanges = newPendingChanges || pendingContactChanges
    const currentNewContactDraft = newContactDraftOverride || newContactDraft
    const currentNewCompanyDraft = newCompanyDraftOverride || newCompanyDraft
    
    // Сравниваем editForm
    const editFormMatches = deepEqualWithEmpty(currentEditForm, initialEditForm)
    
    // Сравниваем dealContacts
    const dealContactsMatch = deepEqualWithEmpty(currentDealContacts, initialDealContacts)
    
    // Сравниваем companies
    const companiesMatch = deepEqualWithEmpty(currentCompanies, initialCompanies)
    
    // Проверяем pendingContactChanges
    const noPendingChanges = currentPendingChanges.added.length === 0 && 
                            currentPendingChanges.removed.length === 0 && 
                            currentPendingChanges.newContacts.length === 0

    const newContactMatches = deepEqualWithEmpty(currentNewContactDraft, initialNewContactDraft)
    const newCompanyMatches = deepEqualWithEmpty(currentNewCompanyDraft, initialNewCompanyDraft)
    
    return editFormMatches && dealContactsMatch && companiesMatch && noPendingChanges && newContactMatches && newCompanyMatches
  }
  
  // Обновить hasChanges на основе сравнения с начальным состоянием
  function updateHasChangesState(
    newEditForm?: any,
    newDealContacts?: any[],
    newCompanies?: any[],
    newPendingChanges?: any,
    newContactDraftOverride?: typeof newContactDraft,
    newCompanyDraftOverride?: typeof newCompanyDraft
  ) {
    const matchesInitial = checkIfStateMatchesInitial(
      newEditForm,
      newDealContacts,
      newCompanies,
      newPendingChanges,
      newContactDraftOverride,
      newCompanyDraftOverride
    )
    setHasChanges(!matchesInitial)
  }
  
  function updateEditForm(field: string, value: any) {
    setEditForm((prev: any) => ({ ...prev, [field]: value }))
  }
  
  // useEffect для автоматического отслеживания изменений
  useEffect(() => {
    // Проверяем только если начальное состояние уже установлено
    if (!initialEditForm || Object.keys(initialEditForm).length === 0) {
      return
    }

    updateHasChangesState(undefined, undefined, undefined, undefined, newContactDraft, newCompanyDraft)
  }, [
    editForm,
    dealContacts,
    companies,
    pendingContactChanges,
    newContactDraft,
    newCompanyDraft,
    initialEditForm,
    initialDealContacts,
    initialCompanies,
    initialNewContactDraft,
    initialNewCompanyDraft
  ])
  
  async function handleSave() {
    if (isSaving) return // Защита от повторных вызовов
    
    setIsSaving(true)
    try {
      const combinedNewContacts = [...pendingContactChanges.newContacts]
      const draftContactPayload = prepareNewContactDraftForSave(newContactDraft)
      if (draftContactPayload) {
        combinedNewContacts.push(draftContactPayload)
      }
      const companyDraftPayload = prepareNewCompanyDraftForSave(newCompanyDraft)
      if (isNewDeal) {
        // 1. СНАЧАЛА создаём компанию если она временная
        let finalCompanyId = editForm.company_id
        if (editForm.company_id && editForm.company_id.startsWith('temp-company-')) {
          const company = companies.find(c => c.id === editForm.company_id)
          if (company) {
            // Сначала проверяем, существует ли уже такая компания
            const existingRes = await fetch(`/api/companies?limit=1000`)
            if (existingRes.ok) {
              const allCompanies = await existingRes.json()
              const existing = allCompanies.find((c: any) => 
                c.name.toLowerCase().trim() === company.name.toLowerCase().trim()
              )
              
              if (existing) {
                // Используем существующую компанию
                finalCompanyId = existing.id
                console.log('Using existing company:', existing.name)
              } else {
                // Создаём новую компанию
                const companyRes = await fetch('/api/companies', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: company.name })
                })
                if (companyRes.ok) {
                  const createdCompany = await companyRes.json()
                  finalCompanyId = createdCompany.id
                } else {
                  console.error('Failed to create company:', await companyRes.text())
                  finalCompanyId = null // Сделка без компании
                }
              }
            }
          }
        }
        if (!finalCompanyId && companyDraftPayload) {
          const companyRes = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyDraftPayload)
          })
          if (companyRes.ok) {
            const createdCompany = await companyRes.json()
            finalCompanyId = createdCompany.id
            setCompanies(prev => [...prev, createdCompany])
          }
        }
        
        // 2. ТЕПЕРЬ создаём сделку с реальным company_id
        const payload: any = {
          title: editForm.title || undefined, // Если пусто - бэкенд сгенерирует "Сделка #N"
          value: parseFloat(editForm.value) || 0,
          company_id: finalCompanyId || null,
          pipeline_id: editForm.pipeline_id, // Активная воронка
          stage_id: editForm.stage_id, // Первый этап активной воронки
          responsible_user_id: editForm.responsible_user_id || undefined
        }
        
        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const errorText = await res.text()
          console.error('Create deal failed:', res.status, errorText)
          throw new Error('Failed to create deal')
        }
        
        const newDeal = await res.json()
        
        // 2. Создаём новые контакты в БД (заменяем временный company_id на реальный)
        const createdContactIds: string[] = []
        for (const newContact of combinedNewContacts) {
          // Заменяем временный company_id на реальный
          const contactCompanyId = newContact.company_id && typeof newContact.company_id === 'string' && newContact.company_id.startsWith('temp-company-')
            ? finalCompanyId
            : newContact.company_id
            
          const contactRes = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: newContact.first_name,
              last_name: newContact.last_name,
              company_id: contactCompanyId || finalCompanyId || null,
              phone: newContact.phone,
              email: newContact.email,
              position: newContact.position,
              budget2: newContact.budget2,
              meeting_date: newContact.meeting_date
            })
          })
          if (contactRes.ok) {
            const created = await contactRes.json()
            createdContactIds.push(created.id)
          } else {
            console.error('Failed to create contact:', await contactRes.text())
          }
        }
        
        // 3. Привязываем новые контакты к сделке
        for (const contactId of createdContactIds) {
          await fetch(`/api/deals/${newDeal.id}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: contactId })
          })
        }
        
        // 4. Привязываем существующие контакты к новой сделке
        for (const contactId of pendingContactChanges.added) {
          await fetch(`/api/deals/${newDeal.id}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: contactId })
          })
        }
        
        // Очищаем pending changes
        setPendingContactChanges({ added: [], removed: [], newContacts: [] })
        setHasChanges(false)
        
        // Обновляем канбан доску
        window.dispatchEvent(new CustomEvent('deal-updated', { detail: { dealId: newDeal.id, stage_id: newDeal.stage_id } }))
        
        // Показываем статус сохранения
        setSaveSuccess(true)
        setTimeout(() => {
          setSaveSuccess(false)
          setIsSaving(false)
        }, 2500)
        const resetContactDraft = createEmptyNewContactDraft(finalCompanyId || '')
        const resetCompanyDraft = createEmptyNewCompanyDraft()
        setNewContactDraft(resetContactDraft)
        setInitialNewContactDraft(resetContactDraft)
        setNewCompanyDraft(resetCompanyDraft)
        setInitialNewCompanyDraft(resetCompanyDraft)
        setContactSearch('')
        setCompanySearch('')
        return
      }
      
      // 1. СНАЧАЛА создаём компанию если она временная
      let finalCompanyId = editForm.company_id
      if (editForm.company_id && editForm.company_id.startsWith('temp-company-')) {
        const company = companies.find(c => c.id === editForm.company_id)
        if (company) {
          // Сначала проверяем, существует ли уже такая компания
          const existingRes = await fetch(`/api/companies?limit=1000`)
          if (existingRes.ok) {
            const allCompanies = await existingRes.json()
            const existing = allCompanies.find((c: any) => 
              c.name.toLowerCase().trim() === company.name.toLowerCase().trim()
            )
            
            if (existing) {
              // Используем существующую компанию
              finalCompanyId = existing.id
              setCompanies(prev => [...prev.filter(c => c.id !== editForm.company_id), existing])
              console.log('Using existing company:', existing.name)
            } else {
              // Создаём новую компанию
              const companyRes = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: company.name })
              })
              if (companyRes.ok) {
                const createdCompany = await companyRes.json()
                finalCompanyId = createdCompany.id
                setCompanies(prev => [...prev.filter(c => c.id !== editForm.company_id), createdCompany])
              } else {
                console.error('Failed to create company:', await companyRes.text())
                finalCompanyId = null
              }
            }
          }
        }
      }
      if (!finalCompanyId && companyDraftPayload) {
        const companyRes = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyDraftPayload)
        })
        if (companyRes.ok) {
          const createdCompany = await companyRes.json()
          finalCompanyId = createdCompany.id
          setCompanies(prev => [...prev, createdCompany])
          updateEditForm('company_id', createdCompany.id)
        }
      }
      
      // 2. Сохраняем основные поля существующей сделки - все опционально
      const payload: any = {
        title: editForm.title || 'Сделка без названия',
        value: parseFloat(editForm.value) || 0,
        company_id: finalCompanyId || null
      }
      
      if (editForm.stage_id) {
        payload.stage_id = editForm.stage_id
      }
      
      if (editForm.responsible_user_id) {
        payload.responsible_user_id = editForm.responsible_user_id
      }
      
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save')

      // Если этап изменился относительно оригинального значения сделки — применяем через общий endpoint (единый источник логики)
      if (deal && editForm.stage_id && editForm.stage_id !== deal.stage_id) {
        const stageRes = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId, toStageId: editForm.stage_id })
        })
        if (!stageRes.ok) {
          console.error('Stage update failed, status:', stageRes.status)
        } else {
          // Сообщаем доске о перемещении сделки (не закрывая модалку)
          window.dispatchEvent(new CustomEvent('deal-updated', { detail: { dealId, stage_id: editForm.stage_id } }))
        }
      }

      // 1. Создаём новые контакты в БД (используем finalCompanyId если был temp)
      const createdContactIds: string[] = []
      for (const newContact of combinedNewContacts) {
        // Заменяем временный company_id на реальный
        const contactCompanyId = newContact.company_id && newContact.company_id.startsWith('temp-company-')
          ? finalCompanyId
          : newContact.company_id
          
        const contactRes = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: newContact.first_name,
            last_name: newContact.last_name,
            company_id: contactCompanyId || finalCompanyId || null,
            phone: newContact.phone,
            email: newContact.email,
            position: newContact.position,
            budget2: newContact.budget2,
            meeting_date: newContact.meeting_date
          })
        })
        if (contactRes.ok) {
          const created = await contactRes.json()
          createdContactIds.push(created.id)
          // Добавляем в общий список контактов
          setContacts(prev => [...prev, created])
        }
      }

      // 2. Привязываем новые контакты к сделке
      for (const contactId of createdContactIds) {
        await fetch(`/api/deals/${dealId}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_id: contactId })
        })
      }

      // 3. Привязываем существующие контакты
      for (const contactId of pendingContactChanges.added) {
        await fetch(`/api/deals/${dealId}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_id: contactId })
        })
      }

      // 4. Удаляем контакты
      for (const contactId of pendingContactChanges.removed) {
        await fetch(`/api/deals/${dealId}/contacts?contact_id=${contactId}`, {
          method: 'DELETE'
        })
      }

      // 5. Сохраняем изменения в контактах (используем finalCompanyId)
      for (const contact of dealContacts) {
        if (!contact.isNew) {
          // Заменяем временный company_id на реальный
          const contactCompanyId = contact.company_id && contact.company_id.startsWith('temp-company-')
            ? finalCompanyId
            : contact.company_id
            
          await fetch(`/api/contacts/${contact.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: contact.phone,
              email: contact.email,
              position: contact.position,
              company_id: contactCompanyId,
              budget2: contact.budget2,
              meeting_date: contact.meeting_date
            })
          })
        }
      }
      
      // 6. Сохраняем изменения в компании (если она не новая)
      if (finalCompanyId && !finalCompanyId.startsWith('temp-company-')) {
        const company = companies.find(c => c.id === finalCompanyId)
        if (company) {
          await fetch(`/api/companies/${finalCompanyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: company.phone,
              email: company.email,
              website: company.website,
              address: company.address
            })
          })
        }
      }

      // Очищаем pending changes
      setPendingContactChanges({ added: [], removed: [], newContacts: [] })
      setHasChanges(false)
      const resetContactDraft = createEmptyNewContactDraft(finalCompanyId || editForm.company_id || '')
      const resetCompanyDraft = createEmptyNewCompanyDraft()
      setNewContactDraft(resetContactDraft)
      setInitialNewContactDraft(resetContactDraft)
      setNewCompanyDraft(resetCompanyDraft)
      setInitialNewCompanyDraft(resetCompanyDraft)
      setContactSearch('')
      setCompanySearch('')
      
      await loadDeal()
      await loadDealContacts()
      await loadReferences()
      // Показываем статус сохранения
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
        setIsSaving(false)
      }, 2500)
    } catch (e) {
      console.error(e)
      alert('Ошибка при сохранении')
      setIsSaving(false)
    }
  }
  
  async function handleDelete() {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      // Закрываем модалку и обновляем доску
      confirmClose(true)
    } catch (e) {
      console.error(e)
      alert('Ошибка при удалении')
    }
  }
  
  function handleClose() {
    if (hasChanges) {
      setShowExitConfirm(true)
    } else {
      // Запускаем анимацию закрытия
      setIsClosing(true)
      // Через 200мс (длительность анимации) закрываем модалку
      setTimeout(() => {
        onClose(false)
      }, 200)
    }
  }
  
  function confirmClose(needsRefresh: boolean) {
    setIsClosing(true)
    setTimeout(() => {
      onClose(needsRefresh)
    }, 200)
  }
  
  async function handleCreateCompany(name: string) {
    // Создаём временную компанию (НЕ сохраняем в БД до нажатия "Сохранить")
    const tempCompany = {
      id: `temp-company-${Date.now()}`,
      name: name,
      isNew: true // маркер что это новая несохранённая компания
    }
    
    // Добавляем во временный список
    setCompanies([...companies, tempCompany])
    updateEditForm('company_id', tempCompany.id)
    setEditingCompany(false)
    setCompanySearch('')
    setHasChanges(true) // Отмечаем что есть изменения
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

  return (
    <>
      {/* Backdrop только справа от sidebar, z-10 */}
      <div 
        className="fixed inset-0 bg-black/50 z-10 transition-opacity duration-200 ease-out"
        style={{ 
          animation: isClosing ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.2s ease-out',
          left: '80px' // Начинается после sidebar
        }}
        onClick={handleBackdropClick}
      />
      
      {/* Модалка выезжает из-под sidebar, z-20 чтобы быть выше backdrop но ниже sidebar */}
      <div 
        className="fixed top-0 bottom-0 bg-slate-800 overflow-hidden flex flex-col z-20" 
        style={{ 
          width: '580px',
          left: '80px',
          transform: isClosing ? 'translateX(-100%)' : (isOpening ? 'translateX(-100%)' : 'translateX(0)'),
          transition: isOpening ? 'none' : 'transform 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal content without chat tab */}
        {/* Header */}
        <div className="px-4 py-2 border-b border-slate-700">
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex-1 mr-4">
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => updateEditForm('title', e.target.value)}
                className="text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none w-full"
                placeholder="Загрузка..."
              />
            </div>
            <div className="flex items-center gap-2">
              {!isNewDeal && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Удалить сделку"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white text-3xl leading-none p-1"
              >
                ×
              </button>
            </div>
          </div>

          {/* Stage Selector - amoCRM style */}
          {stages.length === 0 || (!isNewDeal && !isReady) ? (
            /* Skeleton для этапов - одна сплошная полоска */
            <div className="relative stage-dropdown-container">
              <div className="group rounded px-2 py-1.5 -mx-2 animate-pulse">
                <div className="mb-1.5">
                  <div className="w-full h-1.5 bg-slate-700 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    <span className="bg-slate-700 rounded inline-block" style={{ width: '160px', height: '14px' }}></span>
                  </span>
                  <span className="text-xs text-slate-400">▼</span>
                </div>
              </div>
            </div>
          ) : (
          <div className="relative stage-dropdown-container">
            {/* Current Stage Display - клик открывает dropdown */}
            <div 
              className="group cursor-pointer rounded px-2 py-1.5 -mx-2 hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation()
                setShowStageDropdown(!showStageDropdown)
              }}
            >
              {/* Полоски этапов */}
              <div className="flex gap-1 mb-1.5">
                {stages.map((stage, index) => {
                  const currentStageId = (editForm.stage_id || deal?.stage_id)
                  const currentIndex = stages.findIndex(s => s.id === currentStageId)
                  const isPassed = index <= currentIndex
                  
                  const stageColors: Record<string, string> = {
                    'Неразобранное': 'bg-yellow-400',
                    'Первичный контакт': 'bg-blue-400',
                    'Переговоры': 'bg-yellow-300',
                    'Принимают решение': 'bg-orange-400',
                    'Согласование договора': 'bg-pink-400',
                    'Успешно реализовано': 'bg-green-400',
                    'Закрыто и не реализовано': 'bg-gray-400'
                  }
                  const colorClass = stageColors[stage.name] || 'bg-blue-500'
                  
                  return (
                    <div 
                      key={stage.id}
                      className={`flex-1 h-1.5 rounded ${isPassed ? colorClass : 'bg-slate-600'}`}
                    />
                  )
                })}
              </div>

              {/* Название текущего этапа со стрелкой */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  {editForm.stage_name || deal?.stage_name}
                </span>
                <span className="text-xs text-slate-400">▼</span>
              </div>
            </div>

            {/* Stage Dropdown - список всех этапов */}
            {showStageDropdown && (
            <div 
              className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded shadow-lg z-20 overflow-hidden transition-all duration-200 ease-out origin-top opacity-100 scale-y-100"
            >
                {stages.map((stage) => {
                  const stageColors: Record<string, string> = {
                    'Неразобранное': 'bg-yellow-400',
                    'Первичный контакт': 'bg-blue-400',
                    'Переговоры': 'bg-yellow-300',
                    'Принимают решение': 'bg-orange-400',
                    'Согласование договора': 'bg-pink-400',
                    'Успешно реализовано': 'bg-green-400',
                    'Закрыто и не реализовано': 'bg-gray-400'
                  }
                  const colorClass = stageColors[stage.name] || 'bg-slate-500'
                  
                  return (
                    <button
                      key={stage.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        changeStage(stage.id)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors ${
                        stage.id === deal?.stage_id ? 'bg-slate-600' : ''
                      }`}
                    >
                      <div className={`w-full h-1.5 ${colorClass} rounded mb-2`} />
                      <div className={stage.id === deal?.stage_id ? 'text-white' : 'text-slate-300'}>
                        {stage.name}
                      </div>
                    </button>
                  )
                })}
            </div>
            )}
          </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 px-4 border-b border-slate-700">
          {(['info', 'tasks', 'notes', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 px-2 border-b-2 text-sm transition-colors relative ${
                activeTab === tab
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'info' && 'Информация'}
              {tab === 'tasks' && `Задачи (${deal?.tasks?.length || 0})`}
              {tab === 'notes' && `Заметки (${deal?.notes?.length || 0})`}
              {tab === 'activity' && 'История'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2 pb-24">
          {!isNewDeal && !deal ? (
            <div className="space-y-2 animate-pulse">
              {/* Skeleton для "Общая информация" */}
              <div className="space-y-1">
                <div className="flex items-center py-1">
                  <div className="w-40 h-4 bg-slate-700 rounded"></div>
                  <div className="flex-1 ml-2 h-4 bg-slate-700 rounded w-32"></div>
                </div>
                <div className="flex items-center py-1">
                  <div className="w-40 h-4 bg-slate-700 rounded"></div>
                  <div className="flex-1 ml-2 h-4 bg-slate-700 rounded w-24"></div>
                </div>
              </div>
              
              {/* Skeleton для контактов */}
              <div className="space-y-1.5">
                <div className="bg-slate-700/30 rounded-lg p-3 h-16"></div>
              </div>
              
              {/* Skeleton для компании */}
              <div className="space-y-1">
                <div className="flex items-center py-1">
                  <div className="w-40 h-4 bg-slate-700 rounded"></div>
                  <div className="flex-1 ml-2 h-4 bg-slate-700 rounded w-40"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
          {activeTab === 'info' && (
            <div className="space-y-1">
              {/* Общая информация */}
              <div>
                <div className="space-y-0.5">
                  {/* Ответственный */}
                  <div className="flex items-center py-0.5 relative">
                    <div className="w-40 text-sm text-slate-400">Ответственный</div>
                    <div className="flex-1 relative">
                      <button
                        type="button"
                        className="responsible-dropdown w-full block text-left text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowResponsibleDropdown(!showResponsibleDropdown)
                        }}
                      >
                        {(() => {
                          const current = accountUsers.find(u => u.id === (editForm.responsible_user_id || deal?.responsible_user_id))
                          return current ? (current.full_name || current.email) : 'Не указано'
                        })()}
                      </button>
                      {showResponsibleDropdown && (
                        <div className="absolute z-30 mt-1 bg-slate-700 rounded shadow-lg responsible-dropdown w-full">
                          <div className="p-2 text-xs text-slate-400">Выберите пользователя</div>
                          {accountUsers.length === 0 && (
                            <div className="px-3 py-2 text-slate-400">Пользователей нет</div>
                          )}
                          {accountUsers.map(u => (
                            <button
                              key={u.id}
                              className="w-full text-left px-3 py-2 hover:bg-slate-600 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateEditForm('responsible_user_id', u.id)
                                setShowResponsibleDropdown(false)
                              }}
                            >
                              {u.full_name || u.email}
                              <span className="text-xs text-slate-400 ml-2">{u.role}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Бюджет */}
                  <div className="flex items-center py-0.5">
                    <div className="w-40 text-sm text-slate-400">Бюджет</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={editForm.value || ''}
                        onChange={(e) => updateEditForm('value', e.target.value)}
                        className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Контакт */}
              <div>
                <div className="flex flex-col gap-1">
                  {/* Список контактов сделки */}
                  {dealContacts.map((dealContact, index) => {
                    const isActive = activeContactIndex === index
                    const collapsedHeight = 40
                    const expandedHeight = contactHeights[dealContact.id]
                    
                    return (
                    <div 
                      key={dealContact.id} 
                      data-deal-contact-accordion
                      data-contact-id={dealContact.id}
                      data-is-existing-contact="true"
                      onClick={() => {
                        if (!isActive) {
                          setActiveContactIndex(index)
                          setActiveMenu(null)
                        }
                      }}
                      className={`bg-slate-700/30 rounded-lg overflow-hidden deal-contact-accordion ${!isActive ? 'cursor-pointer hover:bg-slate-700/50 deal-contact-collapsed' : 'deal-contact-expanded'}`}
                      style={{
                        height: isActive ? (expandedHeight ? `${expandedHeight}px` : 'auto') : `${collapsedHeight}px`,
                        padding: '4px'
                      }}
                    >
                      <div ref={(el) => { contentRefs.current[dealContact.id] = el }}>
                      {/* Имя контакта */}
                      <div className="flex items-center py-0 relative">
                        <div className="w-40 text-sm text-slate-400">Контакт</div>
                        <div className="flex-1">
                          {editingContact !== dealContact.id ? (
                            <div 
                              data-contact-name-id={dealContact.id}
                              onClick={(e) => {
                                if (!isActive) return // в неактивном контакте ФИО не кликабельно
                                e.stopPropagation()
                                setActiveMenu(activeMenu === `contact-${dealContact.id}` ? null : `contact-${dealContact.id}`)
                              }}
                              onDoubleClick={(e) => {
                                if (!isActive) return // в неактивном контакте ФИО не кликабельно
                                e.stopPropagation()
                                setEditingContact(dealContact.id)
                                setContactSearch(`${dealContact.first_name} ${dealContact.last_name}`)
                                setActiveMenu(null)
                              }}
                              className={`context-menu-trigger text-white px-2 py-1 rounded -mx-2 ${isActive ? 'cursor-pointer hover:bg-slate-700/50' : ''}`}
                              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                            >
                              <span data-contact-name-trigger={dealContact.id}>{dealContact.first_name} {dealContact.last_name}</span>
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
                          <div 
                            className="context-menu fixed bg-slate-700 rounded shadow-xl py-1 z-[100] min-w-[200px] border border-slate-600" 
                            style={{
                              ...(typeof window !== 'undefined' ? (() => {
                                const trigger = document.querySelector(`[data-contact-name-trigger="${dealContact.id}"]`)
                                const rect = trigger?.getBoundingClientRect()
                                const menuWidth = 220
                                const menuHeightEstimate = 180
                                const gap = 6
                                if (!rect) return { top: '0px', left: '0px' }
                                const hasSpaceBelow = rect.bottom + gap + menuHeightEstimate <= window.innerHeight
                                const top = hasSpaceBelow ? (rect.bottom + gap) : Math.max(8, rect.top - menuHeightEstimate - gap)
                                // Прилегаем к левому краю строки ФИО
                                let left = rect.left
                                const maxLeft = window.innerWidth - menuWidth - 8
                                if (left > maxLeft) left = maxLeft
                                if (left < 8) left = 8
                                return { top: `${top}px`, left: `${left}px` }
                              })() : { top: '0px', left: '0px' })
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
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

                      <div className="space-y-0.5 mt-1" style={{ pointerEvents: isActive ? 'auto' : 'none' }}>
                      {/* Компания контакта */}
                      <div className="flex items-center py-0.5 relative">
                        <div className="w-40 text-sm text-slate-400">Компания</div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={editingContactCompany === dealContact.id 
                              ? contactCompanySearch 
                              : (dealContact.company_id ? companies.find(c => c.id === dealContact.company_id)?.name || '' : '')
                            }
                            onChange={(e) => {
                              setContactCompanySearch(e.target.value)
                            }}
                            onFocus={() => {
                              setEditingContactCompany(dealContact.id)
                              setContactCompanySearch(
                                dealContact.company_id 
                                  ? companies.find(c => c.id === dealContact.company_id)?.name || ''
                                  : ''
                              )
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setEditingContactCompany(null)
                                setContactCompanySearch('')
                              }, 200)
                            }}
                            placeholder="..."
                            className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                          />
                          {editingContactCompany === dealContact.id && contactCompanySearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                              {companies
                                .filter(c => c.name.toLowerCase().includes(contactCompanySearch.toLowerCase()))
                                .map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      setDealContacts(dealContacts.map(dc => 
                                        dc.id === dealContact.id ? { ...dc, company_id: c.id } : dc
                                      ))
                                      setEditingContactCompany(null)
                                      setContactCompanySearch('')
                                      setHasChanges(true)
                                    }}
                                    className="w-full text-left px-3 py-2 text-white hover:bg-slate-600"
                                  >
                                    {c.name}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Телефон */}
                      <div className="flex items-center py-0.5">
                        <div className="w-40 text-sm text-slate-400">Раб. тел.</div>
                        <div className="flex-1">
                          <input
                            type="tel"
                            value={dealContact.phone || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setDealContacts(dealContacts.map(dc => 
                                dc.id === dealContact.id ? { ...dc, phone: newValue } : dc
                              ))
                              setHasChanges(true)
                            }}
                            placeholder="..."
                            className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center py-0.5">
                        <div className="w-40 text-sm text-slate-400">Email раб.</div>
                        <div className="flex-1">
                          <input
                            type="email"
                            value={dealContact.email || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setDealContacts(dealContacts.map(dc => 
                                dc.id === dealContact.id ? { ...dc, email: newValue } : dc
                              ))
                              setHasChanges(true)
                            }}
                            placeholder="..."
                            className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                          />
                        </div>
                      </div>

                      {/* Должность */}
                      <div className="flex items-center py-0.5">
                        <div className="w-40 text-sm text-slate-400">Должность</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={dealContact.position || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setDealContacts(dealContacts.map(dc => 
                                dc.id === dealContact.id ? { ...dc, position: newValue } : dc
                              ))
                              setHasChanges(true)
                            }}
                            placeholder="..."
                            className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                          />
                        </div>
                      </div>

                      {/* Бюджет 2 */}
                      <div className="flex items-center py-1">
                        <div className="w-40 text-sm text-slate-400">Бюджет 2</div>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={dealContact.budget2 || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setDealContacts(dealContacts.map(dc => 
                                dc.id === dealContact.id ? { ...dc, budget2: newValue } : dc
                              ))
                              setHasChanges(true)
                            }}
                            placeholder="..."
                            className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      {/* Встреча */}
                      <div className="flex items-center py-1">
                        <div className="w-40 text-sm text-slate-400">Встреча</div>
                        <div className="flex-1">
                          <input
                            type="datetime-local"
                            value={dealContact.meeting_date ? new Date(dealContact.meeting_date).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setDealContacts(dealContacts.map(dc => 
                                dc.id === dealContact.id ? { ...dc, meeting_date: newValue } : dc
                              ))
                              setHasChanges(true)
                            }}
                            className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                          />
                        </div>
                      </div>
                      </div>
                      </div>
                    </div>
                  )})}

                  {/* КРИТ КОНТАКТ - форма создания, часть гармошки, БЕЗ HOVER */}
                  <div 
                    data-deal-contact-accordion
                    data-contact-id="new"
                    data-is-new-contact="true"
                    onClick={() => {
                      const newContactIndex = dealContacts.length
                      if (activeContactIndex !== newContactIndex) {
                        setActiveContactIndex(newContactIndex)
                        setActiveMenu(null)
                        if (editingContact !== 'new') {
                          setEditingContact('new')
                        }
                      }
                    }}
                    className={`rounded-lg overflow-hidden deal-contact-accordion ${
                      activeContactIndex !== dealContacts.length 
                        ? 'cursor-pointer deal-contact-collapsed' 
                        : 'deal-contact-expanded'
                    }`}
                    style={{
                      height: activeContactIndex === dealContacts.length 
                        ? (contactHeights['new'] ? `${contactHeights['new']}px` : 'auto') 
                        : '40px',
                      padding: '4px'
                    }}
                  >
                    <div ref={(el) => { contentRefs.current['new'] = el }}>
                    {/* Контакт с кругом + */}
                    <div className="flex items-center py-0 relative">
                      <svg className="w-6 h-6 text-slate-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={contactSearch}
                          onChange={(e) => handleContactSearchChange(e.target.value)}
                          onFocus={(e) => {
                            if (!editingContact) {
                              setEditingContact('new')
                            }
                          }}
                          placeholder="Добавить контакт"
                          className="w-full text-white bg-transparent border-b border-transparent focus:border-blue-500 outline-none px-1"
                        />
                        {contactSearch && editingContact === 'new' && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                            {contacts
                              .filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(contactSearch.toLowerCase()))
                              .map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    addContactToDeal(c.id)
                                    setContactSearch('')
                                    setEditingContact(null)
                                    const emptyDraft = createEmptyNewContactDraft(editForm.company_id)
                                    setNewContactDraft(emptyDraft)
                                    updateHasChangesState(undefined, undefined, undefined, undefined, emptyDraft)
                                  }}
                                  className="w-full text-left px-3 py-2 text-white hover:bg-slate-600"
                                >
                                  {c.first_name} {c.last_name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Раскрывающиеся поля как у существующей карточки */}
                    {editingContact === 'new' && activeContactIndex === dealContacts.length && (
                      <div className="space-y-0.5 mt-1">
                        {/* Компания */}
                        <div className="flex items-center py-0.5">
                          <div className="w-40 text-sm text-slate-400">Компания</div>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={editingNewContactCompany 
                                ? newContactCompanySearch 
                                : (newContactDraft.company_id ? companies.find(c => c.id === newContactDraft.company_id)?.name || '' : '')
                              }
                              onChange={(e) => {
                                setNewContactCompanySearch(e.target.value)
                              }}
                              onFocus={() => {
                                setEditingNewContactCompany(true)
                                setNewContactCompanySearch(
                                  newContactDraft.company_id 
                                    ? companies.find(c => c.id === newContactDraft.company_id)?.name || ''
                                    : ''
                                )
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  setEditingNewContactCompany(false)
                                  setNewContactCompanySearch('')
                                }, 200)
                              }}
                              placeholder="..."
                              className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                            />
                            {editingNewContactCompany && newContactCompanySearch && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                                {companies
                                  .filter(c => c.name.toLowerCase().includes(newContactCompanySearch.toLowerCase()))
                                  .map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => {
                                        setNewContactDraft(prev => {
                                          const updated = { ...prev, company_id: c.id }
                                          updateHasChangesState(undefined, undefined, undefined, undefined, updated)
                                          return updated
                                        })
                                        setEditingNewContactCompany(false)
                                        setNewContactCompanySearch('')
                                      }}
                                      className="w-full text-left px-3 py-2 text-white hover:bg-slate-600"
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Телефон */}
                        <div className="flex items-center py-0.5">
                          <div className="w-40 text-sm text-slate-400">Раб. тел.</div>
                          <div className="flex-1">
                            <input
                              type="tel"
                              value={newContactDraft.phone}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setNewContactDraft(prev => {
                                  const updated = { ...prev, phone: newValue }
                                  updateHasChangesState(undefined, undefined, undefined, undefined, updated)
                                  return updated
                                })
                              }}
                              placeholder="..."
                              className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center py-0.5">
                          <div className="w-40 text-sm text-slate-400">Email раб.</div>
                          <div className="flex-1">
                            <input
                              type="email"
                              value={newContactDraft.email}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setNewContactDraft(prev => {
                                  const updated = { ...prev, email: newValue }
                                  updateHasChangesState(undefined, undefined, undefined, undefined, updated)
                                  return updated
                                })
                              }}
                              placeholder="..."
                              className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                            />
                          </div>
                        </div>

                        {/* Должность */}
                        <div className="flex items-center py-0.5">
                          <div className="w-40 text-sm text-slate-400">Должность</div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={newContactDraft.position}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setNewContactDraft(prev => {
                                  const updated = { ...prev, position: newValue }
                                  updateHasChangesState(undefined, undefined, undefined, undefined, updated)
                                  return updated
                                })
                              }}
                              placeholder="..."
                              className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                            />
                          </div>
                        </div>

                        {/* Бюджет 2 */}
                        <div className="flex items-center py-0.5">
                          <div className="w-40 text-sm text-slate-400">Бюджет 2</div>
                          <div className="flex-1">
                            <input
                              type="number"
                              value={newContactDraft.budget2}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setNewContactDraft(prev => {
                                  const updated = { ...prev, budget2: newValue }
                                  updateHasChangesState(undefined, undefined, undefined, undefined, updated)
                                  return updated
                                })
                              }}
                              placeholder="..."
                              className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        {/* Встреча */}
                        <div className="flex items-center py-0.5">
                          <div className="w-40 text-sm text-slate-400">Встреча</div>
                          <div className="flex-1">
                            <input
                              type="datetime-local"
                              value={newContactDraft.meeting_date || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setNewContactDraft(prev => {
                                  const updated = { ...prev, meeting_date: newValue }
                                  updateHasChangesState(undefined, undefined, undefined, undefined, updated)
                                  return updated
                                })
                              }}
                              placeholder="..."
                              className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
                
                {/* Невидимый блок для измерения высот всех контактов */}
                {Object.keys(contactHeights).length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    zIndex: -1,
                    opacity: 0
                  }}>
                    {dealContacts.map((contact) => (
                      <div 
                        key={`measure-${contact.id}`}
                        ref={(el) => { contentRefs.current[contact.id] = el }}
                        style={{ padding: '8px' }}
                      >
                        <div className="flex items-center py-0.5 relative">
                          <div className="w-40 text-sm text-slate-400">Контакт</div>
                          <div className="flex-1 text-white">{contact.first_name} {contact.last_name}</div>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Компания</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Раб. тел.</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Email раб.</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Должность</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Бюджет 2</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Встреча</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Компания */}
              <div>
                {editForm.company_id ? (
                  <div className="bg-slate-700/30 rounded-lg overflow-hidden" style={{ padding: '8px' }} data-company-block>
                    <div className="space-y-0.5">
                    {/* Компания */}
                    <div className="flex items-center py-0.5 relative">
                      <div className="w-40 text-sm text-slate-400">Компания</div>
                      <div className="flex-1">
                        {!editingCompany ? (
                          <div 
                            onClick={() => {
                              setActiveMenu(activeMenu === 'company' ? null : 'company')
                            }}
                            onDoubleClick={() => {
                              setEditingCompany(true)
                              setCompanySearch(companies.find(c => c.id === editForm.company_id)?.name || '')
                              setActiveMenu(null)
                            }}
                            className="context-menu-trigger text-white cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded -mx-2"
                            data-company-name-trigger
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
                      
                      {activeMenu === 'company' && (
                          <div 
                            className="context-menu fixed bg-slate-700 rounded shadow-xl py-1 z-[100] min-w-[200px] border border-slate-600" 
                            style={{
                              ...(typeof window !== 'undefined' ? (() => {
                                const trigger = document.querySelector('[data-company-name-trigger]') as HTMLElement | null
                                const rect = trigger?.getBoundingClientRect()
                                const menuWidth = 220
                                const menuHeightEstimate = 160
                                const gap = 6
                                if (!rect) return { top: '0px', left: '0px' }
                                const hasSpaceBelow = rect.bottom + gap + menuHeightEstimate <= window.innerHeight
                                const top = hasSpaceBelow ? (rect.bottom + gap) : Math.max(8, rect.top - menuHeightEstimate - gap)
                                let left = rect.left
                                const maxLeft = window.innerWidth - menuWidth - 8
                                if (left > maxLeft) left = maxLeft
                                if (left < 8) left = 8
                                return { top: `${top}px`, left: `${left}px` }
                              })() : { top: '0px', left: '0px' })
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
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
                          <button
                            onClick={() => {
                              setActiveMenu(null)
                              updateEditForm('company_id', '')
                              const emptyDraft = createEmptyNewCompanyDraft()
                              setNewCompanyDraft(emptyDraft)
                              updateHasChangesState(undefined, undefined, undefined, undefined, undefined, emptyDraft)
                              setCompanySearch('')
                            }}
                            className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-600 flex items-center gap-2"
                          >
                            <span>🗑️</span>
                            <span>Удалить</span>
                          </button>
                        </div>
                      )}
                    </div>

                  {/* Раб. тел. */}
                  <div className="flex items-center py-0.5">
                    <div className="w-40 text-sm text-slate-400">Раб. тел.</div>
                    <div className="flex-1">
                      <input
                        type="tel"
                        value={companies.find(c => c.id === editForm.company_id)?.phone || ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setCompanies(companies.map(c => 
                            c.id === editForm.company_id ? { ...c, phone: newValue } : c
                          ))
                          setHasChanges(true)
                        }}
                        placeholder="..."
                        className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                      />
                    </div>
                  </div>

                  {/* Email раб. */}
                  <div className="flex items-center py-0.5">
                    <div className="w-40 text-sm text-slate-400">Email раб.</div>
                    <div className="flex-1">
                      <input
                        type="email"
                        value={companies.find(c => c.id === editForm.company_id)?.email || ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setCompanies(companies.map(c => 
                            c.id === editForm.company_id ? { ...c, email: newValue } : c
                          ))
                          setHasChanges(true)
                        }}
                        placeholder="..."
                        className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                      />
                    </div>
                  </div>

                  {/* Web */}
                  <div className="flex items-center py-0.5">
                    <div className="w-40 text-sm text-slate-400">Web</div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={companies.find(c => c.id === editForm.company_id)?.website || ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setCompanies(companies.map(c => 
                            c.id === editForm.company_id ? { ...c, website: newValue } : c
                          ))
                          setHasChanges(true)
                        }}
                        placeholder="..."
                        className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                      />
                    </div>
                  </div>

                  {/* Адрес */}
                  <div className="flex items-center py-0.5">
                    <div className="w-40 text-sm text-slate-400">Адрес</div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={companies.find(c => c.id === editForm.company_id)?.address || ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setCompanies(companies.map(c => 
                            c.id === editForm.company_id ? { ...c, address: newValue } : c
                          ))
                          setHasChanges(true)
                        }}
                        placeholder="..."
                        className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                      />
                    </div>
                  </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    data-deal-company-form
                    data-is-new-company="true"
                    className="rounded-lg overflow-hidden"
                    style={{ 
                      padding: '4px',
                      height: editingCompany ? 'auto' : '40px'
                    }}
                  >
                    {/* Компания с кругом + */}
                    <div className="space-y-0.5">
                      <div className="flex items-center py-0">
                        <svg className="w-6 h-6 text-slate-500 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="16"/>
                          <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                              value={companySearch}
                              onChange={(e) => {
                                const value = e.target.value
                                setCompanySearch(value)
                                setNewCompanyDraft(prev => {
                                  const updated = { ...prev, name: value }
                                  updateHasChangesState(undefined, undefined, undefined, undefined, undefined, updated)
                                  return updated
                                })
                              }}
                            onFocus={() => setEditingCompany(true)}
                            placeholder="Добавить компанию"
                            className="w-full text-white bg-transparent border-b border-transparent focus:border-blue-500 outline-none px-1"
                          />
                          {companySearch && editingCompany && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                              {companies
                                .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                                .map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      updateEditForm('company_id', c.id)
                                      setCompanySearch('')
                                      setEditingCompany(false)
                                      const resetDraft = createEmptyNewCompanyDraft()
                                      setNewCompanyDraft(resetDraft)
                                      updateHasChangesState(undefined, undefined, undefined, undefined, undefined, resetDraft)
                                    }}
                                    className="w-full text-left px-3 py-2 text-white hover:bg-slate-600"
                                  >
                                    {c.name}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Раскрывающиеся поля как у существующей компании */}
                      {editingCompany && (
                        <div className="space-y-0.5 mt-1">
                          {/* Раб. тел. */}
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Раб. тел.</div>
                            <div className="flex-1">
                              <input
                                type="tel"
                                value={newCompanyDraft.phone}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setNewCompanyDraft(prev => {
                                    const updated = { ...prev, phone: newValue }
                                    updateHasChangesState(undefined, undefined, undefined, undefined, undefined, updated)
                                    return updated
                                  })
                                }}
                                placeholder="..."
                                className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                              />
                            </div>
                          </div>

                          {/* Email раб. */}
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Email раб.</div>
                            <div className="flex-1">
                              <input
                                type="email"
                                value={newCompanyDraft.email}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setNewCompanyDraft(prev => {
                                    const updated = { ...prev, email: newValue }
                                    updateHasChangesState(undefined, undefined, undefined, undefined, undefined, updated)
                                    return updated
                                  })
                                }}
                                placeholder="..."
                                className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                              />
                            </div>
                          </div>

                          {/* Web */}
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Web</div>
                            <div className="flex-1">
                              <input
                                type="url"
                                value={newCompanyDraft.website}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setNewCompanyDraft(prev => {
                                    const updated = { ...prev, website: newValue }
                                    updateHasChangesState(undefined, undefined, undefined, undefined, undefined, updated)
                                    return updated
                                  })
                                }}
                                placeholder="..."
                                className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                              />
                            </div>
                          </div>

                          {/* Адрес */}
                          <div className="flex items-center py-0.5">
                            <div className="w-40 text-sm text-slate-400">Адрес</div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={newCompanyDraft.address}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setNewCompanyDraft(prev => {
                                    const updated = { ...prev, address: newValue }
                                    updateHasChangesState(undefined, undefined, undefined, undefined, undefined, updated)
                                    return updated
                                  })
                                }}
                                placeholder="..."
                                className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

              {deal?.tasks?.length === 0 && !showTaskForm && (
                <div className="text-slate-400 text-center py-8">Задач нет</div>
              )}
              {deal?.tasks?.map((task: any) => (
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
              {deal?.notes?.length === 0 && (
                <div className="text-slate-400 text-center py-8">Заметок нет</div>
              )}
              {deal?.notes?.map((note: any) => (
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

          {/* Chat tab removed - moved to separate panel */}
          
          {false && (
            <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
              {/* Type Selector & Recipient Filter */}
              <div className="mb-3 pb-3 border-b border-slate-700">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setChatType('chat')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      chatType === 'chat'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Чат
                  </button>
                  <button
                    onClick={() => setChatType('note')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      chatType === 'note'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Примечание
                  </button>
                  <button
                    onClick={() => setChatType('task')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      chatType === 'task'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Задача
                  </button>
                </div>

                {/* Recipient Selector */}
                <div className="relative recipient-dropdown">
                  <button
                    onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {selectedRecipient.icon && <span>{selectedRecipient.icon}</span>}
                      <span className="text-slate-300">Чат для:</span>
                      <span className="font-medium">{selectedRecipient.name}</span>
                      {selectedRecipient.tag && (
                        <span className="px-2 py-0.5 bg-yellow-600 text-xs rounded">
                          {selectedRecipient.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400">{showRecipientDropdown ? '▲' : '▼'}</span>
                  </button>

                  {showRecipientDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg shadow-lg border border-slate-600 max-h-60 overflow-y-auto z-20">
                      {recipientList.map((recipient, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedRecipient(recipient)
                            setShowRecipientDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors flex items-center justify-between ${
                            selectedRecipient.name === recipient.name ? 'bg-slate-600' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {recipient.icon && <span className="text-lg">{recipient.icon}</span>}
                            <div>
                              <div className="text-white text-sm">{recipient.name}</div>
                              {recipient.type === 'bot' && (
                                <div className="text-xs text-slate-400">Бот</div>
                              )}
                              {recipient.type === 'department' && (
                                <div className="text-xs text-slate-400">Отдел</div>
                              )}
                              {recipient.type === 'user' && (
                                <div className="text-xs text-slate-400">Пользователь</div>
                              )}
                            </div>
                          </div>
                          {recipient.tag && (
                            <span className="px-2 py-0.5 bg-yellow-600 text-xs rounded">
                              {recipient.tag}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 py-2 px-1">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">💬</div>
                    <div className="text-slate-400 text-sm">
                      Здесь будет переписка по сделке
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      Напишите первое сообщение ниже
                    </div>
                  </div>
                )}
                {chatMessages.map((msg: any) => {
                  const typeIcon = msg.type === 'note' ? '📝' : msg.type === 'task' ? '✓' : '💬'
                  const typeColor = msg.type === 'note' ? 'bg-yellow-600' : msg.type === 'task' ? 'bg-green-600' : 'bg-blue-600'
                  
                  return (
                    <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 shadow-md ${
                        msg.isOwn 
                          ? typeColor
                          : 'bg-slate-700'
                      } text-white`}>
                        {!msg.isOwn && (
                          <div className="text-xs text-slate-300 mb-1 font-medium">{msg.sender}</div>
                        )}
                        {msg.type && (
                          <div className="text-xs opacity-70 mb-1">{typeIcon} {msg.type === 'note' ? 'Примечание' : msg.type === 'task' ? 'Задача' : 'Сообщение'}</div>
                        )}
                        <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
                        <div className={`text-xs mt-1 ${
                          msg.isOwn ? 'opacity-70' : 'text-slate-400'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-slate-700 pt-3 pb-2 mt-2 flex-shrink-0 relative">
                {/* Mentions Dropdown */}
                {showMentions && mentionList.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 bg-slate-700 rounded-lg shadow-lg border border-slate-600 max-h-40 overflow-y-auto w-64 z-10">
                    {mentionList.map((mention, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertMention(mention.name)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors flex items-center gap-2"
                      >
                        <span className="text-lg">
                          {mention.type === 'bot' ? '🤖' : mention.type === 'department' ? '👥' : '👤'}
                        </span>
                        <div>
                          <div className="text-white text-sm">{mention.name}</div>
                          <div className="text-xs text-slate-400">
                            {mention.type === 'bot' ? 'Бот' : mention.type === 'department' ? 'Отдел' : 'Пользователь'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => handleMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={`Введите ${chatType === 'note' ? 'примечание' : chatType === 'task' ? 'задачу' : 'сообщение'}... (@ для упоминания)`}
                    className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    rows={3}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      newMessage.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {chatType === 'note' ? '📝' : chatType === 'task' ? '✓' : '✉️'}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-slate-500">
                    Enter - отправить, Shift+Enter - новая строка, @ - упомянуть
                  </div>
                  <div className="flex gap-2">
                    <button className="text-slate-400 hover:text-white transition-colors" title="Добавить дату">
                      📅
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors" title="Добавить эмодзи">
                      😊
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors" title="Прикрепить файл">
                      📎
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2">
              {deal?.activity?.length === 0 && (
                <div className="text-slate-400 text-center py-8">История пуста</div>
              )}
              {deal?.activity?.map((log: any) => (
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
            </>
          )}
        </div>

        {/* Footer - появляется только при изменениях */}
        {hasChanges && !isFooterClosing && (
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 bg-slate-700 border-t border-slate-600 shadow-lg z-30"
            style={{
              animation: 'slideUpFooter 0.3s ease-out'
            }}
          >
            <style jsx>{`
              @keyframes slideUpFooter {
                from {
                  transform: translateY(100%);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
              @keyframes slideDownFooter {
                from {
                  transform: translateY(0);
                  opacity: 1;
                }
                to {
                  transform: translateY(100%);
                  opacity: 0;
                }
              }
            `}</style>
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await handleSave()
                    setIsFooterClosing(true)
                    setTimeout(() => {
                      setHasChanges(false)
                      setIsFooterClosing(false)
                    }, 300)
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={() => {
                    // Анимируем закрытие
                    setIsFooterClosing(true)
                    setTimeout(() => {
                      // Полное восстановление из начального состояния
                      setEditForm(JSON.parse(JSON.stringify(initialEditForm)))
                      setDealContacts(JSON.parse(JSON.stringify(initialDealContacts)))
                      setCompanies(JSON.parse(JSON.stringify(initialCompanies)))
                      setPendingContactChanges({ added: [], removed: [], newContacts: [] })
                      setNewContactDraft(JSON.parse(JSON.stringify(initialNewContactDraft)))
                      setNewCompanyDraft(JSON.parse(JSON.stringify(initialNewCompanyDraft)))
                      // Очистка поисковых полей и состояний редактирования
                      setCompanySearch('')
                      setContactSearch('')
                      setEditingCompany(false)
                      setEditingContact(null)
                      setHasChanges(false)
                      setIsFooterClosing(false)
                    }, 300)
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                >
                  Отмена
                </button>
              </div>
              <button
                onClick={async () => {
                  await handleSave()
                  onClose(true)
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                Сохранить и выйти
              </button>
            </div>
          </div>
        )}
        {isFooterClosing && (
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 bg-slate-700 border-t border-slate-600 shadow-lg z-30"
            style={{
              animation: 'slideDownFooter 0.3s ease-out'
            }}
          >
            <style jsx>{`
              @keyframes slideDownFooter {
                from {
                  transform: translateY(0);
                  opacity: 1;
                }
                to {
                  transform: translateY(100%);
                  opacity: 0;
                }
              }
            `}</style>
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button disabled className="px-4 py-2 bg-green-600 text-white rounded opacity-50">
                  Сохранить
                </button>
                <button disabled className="px-4 py-2 bg-slate-600 text-white rounded opacity-50">
                  Отмена
                </button>
              </div>
              <button disabled className="px-4 py-2 bg-blue-600 text-white rounded opacity-50">
                Сохранить и выйти
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Несохранённые изменения</h3>
            <p className="text-slate-300 mb-6">У вас есть несохранённые изменения. Вы уверены, что хотите закрыть?</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // Сохраняем и выходим
                  await handleSave()
                  confirmClose(true)
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Сохранить и выйти
              </button>
              <button
                onClick={async () => {
                  // Восстанавливаем исходное состояние и выходим
                  await loadDealContacts()
                  if (deal) {
                    setEditForm({
                      title: deal.title || '',
                      value: deal.value || '',
                      company_id: deal.company_id || '',
                      contact_id: deal.contact_id || ''
                    })
                  }
                  setPendingContactChanges({ added: [], removed: [], newContacts: [] })
                  setShowExitConfirm(false)
                  setHasChanges(false)
                  confirmClose(false)
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
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
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

      {/* Chat Panel - Separate from modal, to the right */}
      <div 
        className="fixed top-0 bottom-0 bg-slate-800 overflow-hidden flex flex-col z-20 border-l border-slate-700 pt-11"
        style={{ 
          left: '660px', // 80px sidebar + 580px modal
          right: '0',
          transform: isClosing ? 'translateX(100%)' : (isOpening ? 'translateX(100%)' : 'translateX(0)'),
          transition: isOpening ? 'none' : 'transform 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header (fixed at top of chat panel) */}
        <div className="absolute top-0 left-0 right-0 z-50 border-b border-slate-700 bg-slate-800">
          {/* Search Bar - кликабельное поле */}
          <div 
            className="px-3 py-2 flex items-center gap-2 cursor-pointer search-filter-toggle z-50" 
            onClick={() => {
              if (!showChatFilters) setShowChatFilters(true)
            }}
          >
            <div className="flex-1 flex items-center gap-2 text-slate-400 text-sm px-3 py-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Поиск и фильтр</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Закрыть"
            >
              ✕
            </button>
          </div>

          {/* Filter Panel - Overlay (открывается по клику) */}
          {showChatFilters && (
            <div 
              className={`absolute top-full left-0 right-0 bg-slate-800 border-b border-slate-700 shadow-lg z-10 flex chat-filters-panel ${isClosingFilters ? 'animate-filters-close' : 'animate-filters-open'}`}
              style={{ maxHeight: '400px' }}
            >
              {/* Левая панель - Быстрые фильтры */}
              <div className="w-52 border-r border-slate-700 p-3 space-y-1">
                <button
                  onClick={() => setChatFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    chatFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Все события
                </button>
                <button
                  onClick={() => setChatFilter('chats-only')}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    chatFilter === 'chats-only' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Только чаты
                </button>
                <button
                  onClick={() => setChatFilter('chats-with-clients')}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    chatFilter === 'chats-with-clients' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Только чаты с клиентами
                </button>
              </div>

              {/* Правая панель - Детальные фильтры */}
              <div className="w-64 p-3 space-y-2">
                {/* Блок 1: Сообщения чатов */}
                <div className="relative">
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chatMessagesEnabled}
                      onChange={(e) => setChatMessagesEnabled(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-700 text-blue-600"
                    />
                    <span>Сообщения чатов:</span>
                    <span className="text-white">{chatMessagesType === 'all' ? 'Все' : chatMessagesType === 'with-clients' ? 'С клиентами' : 'Внутренние'}</span>
                  </label>
                  
                  {chatMessagesEnabled && (
                    <div className="mt-1.5 ml-5">
                      <button
                        onClick={() => setShowChatMessagesDropdown(!showChatMessagesDropdown)}
                        className="w-full flex items-center justify-between px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
                      >
                        <span>{chatMessagesType === 'all' ? 'Все' : chatMessagesType === 'with-clients' ? 'С клиентами' : 'Внутренние'}</span>
                        <span className="text-slate-400">{showChatMessagesDropdown ? '▲' : '▼'}</span>
                      </button>
                      
                      {showChatMessagesDropdown && (
                        <div className="absolute left-5 right-0 mt-1 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-30">
                          <button
                            onClick={() => { setChatMessagesType('all'); setShowChatMessagesDropdown(false) }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-600 text-xs text-slate-200"
                          >
                            Снять выделение
                          </button>
                          <button
                            onClick={() => { setChatMessagesType('with-clients'); setShowChatMessagesDropdown(false) }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-600 text-xs text-slate-200"
                          >
                            С клиентами
                          </button>
                          <button
                            onClick={() => { setChatMessagesType('internal'); setShowChatMessagesDropdown(false) }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-600 text-xs text-slate-200"
                          >
                            Внутренние
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Блок 2: Связанные объекты */}
                <div className="relative">
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={relatedObjectsEnabled}
                      onChange={(e) => setRelatedObjectsEnabled(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-700 text-blue-600"
                    />
                    <span>Связанные объекты:</span>
                    <span className="text-white">Все</span>
                  </label>
                  
                  {relatedObjectsEnabled && (
                    <div className="mt-1.5 ml-5">
                      <button
                        onClick={() => setShowRelatedObjectsDropdown(!showRelatedObjectsDropdown)}
                        className="w-full flex items-center justify-between px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
                      >
                        <span>Выбрано: {selectedRelatedObjects.length || 'Все'}</span>
                        <span className="text-slate-400">{showRelatedObjectsDropdown ? '▲' : '▼'}</span>
                      </button>
                      
                      {showRelatedObjectsDropdown && (
                        <div className="absolute left-5 right-0 mt-1 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-30 max-h-64 overflow-y-auto">
                          <div className="sticky top-0 bg-slate-700 p-2 border-b border-slate-600">
                            <div className="flex gap-1 mb-2">
                              <button
                                onClick={() => setSelectedRelatedObjects(relatedObjectTypes.map(t => t.id))}
                                className="flex-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-blue-400"
                              >
                                Выбрать все
                              </button>
                              <button
                                onClick={() => setSelectedRelatedObjects([])}
                                className="flex-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-blue-400"
                              >
                                Очистить
                              </button>
                            </div>
                            <input
                              type="text"
                              value={relatedObjectsSearch}
                              onChange={(e) => setRelatedObjectsSearch(e.target.value)}
                              placeholder="Поиск"
                              className="w-full px-2 py-1 bg-slate-600 text-white text-xs rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          
                          {relatedObjectTypes
                            .filter(type => type.label.toLowerCase().includes(relatedObjectsSearch.toLowerCase()))
                            .map((type) => (
                              <label
                                key={type.id}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-600 cursor-pointer text-xs text-slate-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRelatedObjects.includes(type.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRelatedObjects([...selectedRelatedObjects, type.id])
                                    } else {
                                      setSelectedRelatedObjects(selectedRelatedObjects.filter(id => id !== type.id))
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-600 text-blue-600"
                                />
                                {type.label}
                              </label>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Блок 3: Типы событий */}
                <div className="relative">
                  <button
                    onClick={() => setShowEventTypesDropdown(!showEventTypesDropdown)}
                    className="w-full flex items-center justify-between px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
                  >
                    <span className="text-slate-300">Типы событий:</span>
                    <span className="text-slate-400">{showEventTypesDropdown ? '▲' : '▼'}</span>
                  </button>
                  
                  {showEventTypesDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-30">
                      <div className="p-2 border-b border-slate-600">
                        <input
                          type="text"
                          value={eventTypesSearch}
                          onChange={(e) => setEventTypesSearch(e.target.value)}
                          placeholder="Поиск"
                          className="w-full px-2 py-1 bg-slate-600 text-white text-xs rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto">
                        {eventTypes
                          .filter(type => type.label.toLowerCase().includes(eventTypesSearch.toLowerCase()))
                          .map((type) => (
                            <label
                              key={type.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-600 cursor-pointer text-xs text-slate-200"
                            >
                              <input
                                type="checkbox"
                                checked={selectedEventTypes.includes(type.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEventTypes([...selectedEventTypes, type.id])
                                  } else {
                                    setSelectedEventTypes(selectedEventTypes.filter(id => id !== type.id))
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-600 text-blue-600"
                              />
                              {type.label}
                            </label>
                          ))}
                      </div>
                      
                      <div className="flex gap-2 p-2 border-t border-slate-600">
                        <button
                          onClick={() => setShowEventTypesDropdown(false)}
                          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEventTypes([])
                            setShowEventTypesDropdown(false)
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Блок с текстом про тариф - отдельно справа */}
              {!hasSearchAccess && (
                <div className="w-80 p-4 flex items-start justify-center">
                  <div className="p-3 bg-slate-700/50 rounded text-xs text-slate-300 text-center">
                    Поиск по сообщениям и событиям доступен в тарифе{' '}
                    <a 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        alert('Переход на страницу тарифов')
                      }}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      «Профессиональный»
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Type Selector & Recipient Filter */}
        <div className="px-4 pt-3 pb-3 border-b border-slate-700">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setChatType('chat')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                chatType === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Чат
            </button>
            <button
              onClick={() => setChatType('note')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                chatType === 'note'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Примечание
            </button>
            <button
              onClick={() => setChatType('task')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                chatType === 'task'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Задача
            </button>
          </div>

          {/* Recipient Selector */}
          <div className="relative recipient-dropdown">
            <button
              onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                {selectedRecipient.icon && <span>{selectedRecipient.icon}</span>}
                <span className="text-slate-300">Чат для:</span>
                <span className="font-medium">{selectedRecipient.name}</span>
                {selectedRecipient.tag && (
                  <span className="px-2 py-0.5 bg-yellow-600 text-xs rounded">
                    {selectedRecipient.tag}
                  </span>
                )}
              </div>
              <span className="text-slate-400">{showRecipientDropdown ? '▲' : '▼'}</span>
            </button>

            {showRecipientDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg shadow-lg border border-slate-600 max-h-60 overflow-y-auto z-20">
                {recipientList.map((recipient, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedRecipient(recipient)
                      setShowRecipientDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors flex items-center justify-between ${
                      selectedRecipient.name === recipient.name ? 'bg-slate-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {recipient.icon && <span className="text-lg">{recipient.icon}</span>}
                      <div>
                        <div className="text-white text-sm">{recipient.name}</div>
                        {recipient.type === 'bot' && (
                          <div className="text-xs text-slate-400">Бот</div>
                        )}
                        {recipient.type === 'department' && (
                          <div className="text-xs text-slate-400">Отдел</div>
                        )}
                        {recipient.type === 'user' && (
                          <div className="text-xs text-slate-400">Пользователь</div>
                        )}
                      </div>
                    </div>
                    {recipient.tag && (
                      <span className="px-2 py-0.5 bg-yellow-600 text-xs rounded">
                        {recipient.tag}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Task Relation Type (показывается только для задач) */}
          {chatType === 'task' && (
            <div className="relative mt-3 task-relation-dropdown">
              <button
                onClick={() => setShowTaskRelationDropdown(!showTaskRelationDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>{taskRelationTypes.find(t => t.value === taskRelationType)?.icon}</span>
                  <span className="text-slate-300">Связаться:</span>
                  <span className="font-medium">{taskRelationTypes.find(t => t.value === taskRelationType)?.label}</span>
                </div>
                <span className="text-slate-400">{showTaskRelationDropdown ? '▲' : '▼'}</span>
              </button>

              {showTaskRelationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-20">
                  {taskRelationTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setTaskRelationType(type.value)
                        setShowTaskRelationDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors flex items-center gap-2 ${
                        taskRelationType === type.value ? 'bg-slate-600' : ''
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-white text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 px-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <div className="text-slate-400 text-sm">
                Здесь будет переписка по сделке
              </div>
              <div className="text-slate-500 text-xs mt-1">
                Напишите первое сообщение ниже
              </div>
            </div>
          )}
          {chatMessages
            .filter(msg => {
              // Применяем фильтр
              if (chatFilter === 'chats-only') {
                return !msg.type || msg.type === 'chat' // Показываем только сообщения чата
              }
              return true // Все события - показываем всё
            })
            .map((msg: any) => {
            const typeIcon = msg.type === 'note' ? '📝' : msg.type === 'task' ? '✓' : '💬'
            const typeColor = msg.type === 'note' ? 'bg-yellow-600' : msg.type === 'task' ? 'bg-green-600' : 'bg-blue-600'
            
            return (
              <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 shadow-md ${
                  msg.isOwn 
                    ? typeColor
                    : 'bg-slate-700'
                } text-white`}>
                  {!msg.isOwn && (
                    <div className="text-xs text-slate-300 mb-1 font-medium">{msg.sender}</div>
                  )}
                  {msg.type && (
                    <div className="text-xs opacity-70 mb-1">{typeIcon} {msg.type === 'note' ? 'Примечание' : msg.type === 'task' ? 'Задача' : 'Сообщение'}</div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
                  <div className={`text-xs mt-1 ${
                    msg.isOwn ? 'opacity-70' : 'text-slate-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-slate-700 pt-3 pb-3 px-4 flex-shrink-0 relative">
          {/* Mentions Dropdown */}
          {showMentions && mentionList.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 bg-slate-700 rounded-lg shadow-lg border border-slate-600 max-h-40 overflow-y-auto w-64 z-10">
              {mentionList.map((mention, idx) => (
                <button
                  key={idx}
                  onClick={() => insertMention(mention.name)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">
                    {mention.type === 'bot' ? '🤖' : mention.type === 'department' ? '👥' : '👤'}
                  </span>
                  <div>
                    <div className="text-white text-sm">{mention.name}</div>
                    <div className="text-xs text-slate-400">
                      {mention.type === 'bot' ? 'Бот' : mention.type === 'department' ? 'Отдел' : 'Пользователь'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => handleMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={`Введите ${chatType === 'note' ? 'примечание' : chatType === 'task' ? 'задачу' : 'сообщение'}... (@ для упоминания)`}
              className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={3}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                newMessage.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {chatType === 'note' ? '📝' : chatType === 'task' ? '✓' : '✉️'}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-slate-500">
              Enter - отправить, Shift+Enter - новая строка, @ - упомянуть
            </div>
            <div className="flex gap-2">
              <button className="text-slate-400 hover:text-white transition-colors" title="Добавить дату">
                📅
              </button>
              <button className="text-slate-400 hover:text-white transition-colors" title="Добавить эмодзи">
                😊
              </button>
              <button className="text-slate-400 hover:text-white transition-colors" title="Прикрепить файл">
                📎
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
