'use client'

import React, { useEffect, useState, useRef } from 'react'

interface DealModalProps {
  dealId: string
  onClose: (needsRefresh?: boolean) => void
}

export default function DealModal({ dealId, onClose }: DealModalProps) {
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
  const [contactHeights, setContactHeights] = useState<Record<string, number>>({})
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(true)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [chatType, setChatType] = useState<'chat' | 'note' | 'task'>('chat')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedRecipient, setSelectedRecipient] = useState<any>({ name: 'Показать только участников', type: 'all' })
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)
  const [accountUsers, setAccountUsers] = useState<any[]>([])
  const [taskRelationType, setTaskRelationType] = useState<string>('meeting')
  const [showTaskRelationDropdown, setShowTaskRelationDropdown] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [showChatFilters, setShowChatFilters] = useState(false)
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
    loadDeal()
    loadDealContacts()
    loadChatMessages()
    loadAccountUsers()
    // Небольшая задержка перед показом контента (избегаем моргания при анимации открытия)
    setTimeout(() => setIsReady(true), 50)
    // Списки компаний/контактов загружаем лениво при редактировании
  }, [dealId])
  
  useEffect(() => {
    if (deal) {
      // Небольшая задержка чтобы избежать "моргания" при первом рендере
      requestAnimationFrame(() => {
        setEditForm({
          title: deal.title || '',
          value: deal.value || '',
          currency: deal.currency || 'RUB',
          company_id: deal.company_id || ''
        })
      })
      // Закрываем dropdown при загрузке новых данных
      setShowStageDropdown(false)
    }
  }, [deal])
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      
      // Закрываем панель фильтров чата при клике вне её
      if (showChatFilters && !target.closest('.chat-filters-panel') && !target.closest('button[title="Фильтры"]')) {
        setShowChatFilters(false)
        return
      }
      
      // Закрываем все dropdown'ы, если клик был вне них
      if (!target.closest('.dropdown-container') && !target.closest('.stage-dropdown-container') && !target.closest('.recipient-dropdown') && !target.closest('.task-relation-dropdown')) {
        setActiveMenu(null)
        setShowStageDropdown(false)
        setShowRecipientDropdown(false)
        setShowTaskRelationDropdown(false)
      } else {
        // Если клик внутри одного dropdown, закрываем остальные
        if (!target.closest('.dropdown-container')) {
          setActiveMenu(null)
        }
        if (!target.closest('.stage-dropdown-container')) {
          setShowStageDropdown(false)
        }
        if (!target.closest('.recipient-dropdown')) {
          setShowRecipientDropdown(false)
        }
        if (!target.closest('.task-relation-dropdown')) {
          setShowTaskRelationDropdown(false)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showChatFilters])

  // Измеряем высоты ВСЕХ контактов при загрузке и изменениях
  useEffect(() => {
    if (dealContacts.length > 0) {
      // Ждем следующий тик, чтобы контент отрендерился
      setTimeout(() => {
        const heights: Record<string, number> = {}
        dealContacts.forEach((contact) => {
          const contentEl = contentRefs.current[contact.id]
          if (contentEl) {
            // Измеряем полную высоту + добавляем padding (20px = 10px сверху + 10px снизу)
            heights[contact.id] = contentEl.scrollHeight + 20
          }
        })
        setContactHeights(heights)
      }, 0)
    }
  }, [dealContacts, editingContact, editingContactCompany])

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

  async function changeStage(newStageId: string) {
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, toStageId: newStageId })
      })
      if (res.ok) {
        await loadDeal()
        setShowStageDropdown(false)
      }
    } catch (e) {
      console.error('Failed to change stage:', e)
    }
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
      } else {
        console.error('Failed to load users, status:', res.status, await res.text())
      }
    } catch (e) {
      console.error('Failed to load account users:', e)
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
          company_id: editForm.company_id || null
        })
      })
      if (!res.ok) throw new Error('Failed to save')

      // 1. Создаём новые контакты в БД
      const createdContactIds: string[] = []
      for (const newContact of pendingContactChanges.newContacts) {
        const contactRes = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: newContact.first_name,
            last_name: newContact.last_name,
            company_id: newContact.company_id || null
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

      // 5. Сохраняем изменения в контактах
      for (const contact of dealContacts) {
        if (!contact.isNew) {
          await fetch(`/api/contacts/${contact.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: contact.phone,
              email: contact.email,
              position: contact.position,
              company_id: contact.company_id,
              budget2: contact.budget2,
              meeting_date: contact.meeting_date
            })
          })
        }
      }

      // 6. Создаём новую компанию если она временная
      let finalCompanyId = editForm.company_id
      if (editForm.company_id && editForm.company_id.startsWith('temp-company-')) {
        const company = companies.find(c => c.id === editForm.company_id)
        if (company) {
          const companyRes = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: company.name })
          })
          if (companyRes.ok) {
            const createdCompany = await companyRes.json()
            finalCompanyId = createdCompany.id
            // Обновляем список компаний
            setCompanies(prev => prev.map(c => 
              c.id === editForm.company_id ? createdCompany : c
            ))
            // Обновляем company_id в сделке
            await fetch(`/api/deals/${dealId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: editForm.title,
                value: parseFloat(editForm.value) || 0,
                currency: editForm.currency,
                company_id: finalCompanyId
              })
            })
          }
        }
      }
      
      // 7. Сохраняем изменения в компании (если она не новая)
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
      
      await loadDeal()
      await loadDealContacts()
      await loadReferences()
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
      // Через 300мс (длительность анимации) закрываем модалку
      setTimeout(() => {
        onClose(false)
      }, 300)
    }
  }
  
  function confirmClose(needsRefresh: boolean) {
    setIsClosing(true)
    setTimeout(() => {
      onClose(needsRefresh)
    }, 300)
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
  
  async function handleCreateContact(fullName: string, forNewContact: boolean = false) {
    try {
      const nameParts = fullName.trim().split(' ')
      const first_name = nameParts[0] || ''
      const last_name = nameParts.slice(1).join(' ') || ''
      
      if (forNewContact) {
        // Создаём временный контакт (НЕ сохраняем в БД)
        const tempContact = {
          id: `temp-${Date.now()}`,
          tempId: `temp-${Date.now()}`,
          first_name,
          last_name,
          company_id: editForm.company_id || null,
          isNew: true // маркер что это новый несохранённый контакт
        }
        
        // Добавляем в локальный список для отображения
        setDealContacts([...dealContacts, tempContact])
        
        // Сохраняем в pending для создания при сохранении карточки
        setPendingContactChanges(prev => ({
          ...prev,
          newContacts: [...prev.newContacts, {
            tempId: tempContact.tempId,
            first_name,
            last_name,
            company_id: editForm.company_id || undefined
          }]
        }))
        setHasChanges(true)
      } else {
        // Для старого функционала - создаём контакт сразу
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            first_name, 
            last_name,
            company_id: editForm.company_id || null
          })
        })
        if (!res.ok) throw new Error('Failed to create contact')
        const newContact = await res.json()
        setContacts([...contacts, newContact])
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

  return (
    <>
      {/* Backdrop только справа от sidebar, z-10 */}
      <div 
        className="fixed inset-0 bg-black/50 z-10 transition-opacity duration-300 ease-out"
        style={{ 
          animation: isClosing ? 'fadeOut 0.3s ease-out' : 'fadeIn 0.3s ease-out',
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
          transition: isOpening ? 'none' : 'transform 0.3s ease-out'
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
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Stage Selector - amoCRM style */}
          {!deal || stages.length === 0 || !isReady ? (
            /* Skeleton для этапов */
            <div className="relative stage-dropdown-container">
              <div className="group rounded px-2 py-1.5 -mx-2 animate-pulse">
                <div className="flex gap-1 mb-1.5">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded" />
                  <div className="flex-1 h-1.5 bg-slate-700 rounded" />
                  <div className="flex-1 h-1.5 bg-slate-700 rounded" />
                  <div className="flex-1 h-1.5 bg-slate-700 rounded" />
                  <div className="flex-1 h-1.5 bg-slate-700 rounded" />
                  <div className="flex-1 h-1.5 bg-slate-700 rounded" />
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
                  const currentIndex = stages.findIndex(s => s.id === deal?.stage_id)
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
                  {deal?.stage_name}
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
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {!deal ? (
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
            <div className="space-y-2">
              {/* Общая информация */}
              <div>
                <div className="space-y-1">
                  {/* Ответственный */}
                  <div className="flex items-center py-1">
                    <div className="w-40 text-sm text-slate-400">Отв-ный</div>
                    <div className="flex-1 text-white">Элестет</div>
                  </div>

                  {/* Бюджет */}
                  <div className="flex items-center py-1">
                    <div className="w-40 text-sm text-slate-400">Бюджет</div>
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
                </div>
              </div>

              {/* Контакт */}
              <div>
                <div className="flex flex-col gap-1.5">
                  {/* Список контактов сделки */}
                  {dealContacts.map((dealContact, index) => {
                    const isActive = activeContactIndex === index
                    const collapsedHeight = 60
                    const expandedHeight = contactHeights[dealContact.id]
                    
                    return (
                    <div 
                      key={dealContact.id} 
                      onClick={() => {
                        if (!isActive) {
                          setActiveContactIndex(index)
                          setActiveMenu(null)
                        }
                      }}
                      className={`bg-slate-700/30 rounded-lg overflow-hidden transition-all duration-500 ease-in-out ${!isActive ? 'cursor-pointer hover:bg-slate-700/50' : ''}`}
                      style={{
                        height: isActive ? (expandedHeight ? `${expandedHeight}px` : 'auto') : `${collapsedHeight}px`,
                        padding: '10px'
                      }}
                    >
                      <div ref={(el) => { contentRefs.current[dealContact.id] = el }}>
                      {/* Имя контакта */}
                      <div className="flex items-center py-2 relative">
                        <div className="w-40 text-sm text-slate-400">Контакт</div>
                        <div className="flex-1">
                          {editingContact !== dealContact.id ? (
                            <div 
                              onClick={(e) => {
                                if (isActive) {
                                  e.stopPropagation()
                                  setActiveMenu(activeMenu === `contact-${dealContact.id}` ? null : `contact-${dealContact.id}`)
                                }
                              }}
                              onDoubleClick={(e) => {
                                if (isActive) {
                                  e.stopPropagation()
                                  setEditingContact(dealContact.id)
                                  setContactSearch(`${dealContact.first_name} ${dealContact.last_name}`)
                                  setActiveMenu(null)
                                }
                              }}
                              className={`text-white ${isActive ? 'cursor-pointer hover:bg-slate-700/50 px-2 py-1 rounded -mx-2' : 'px-2 py-1 -mx-2'}`}
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

                      {isActive && (
                        <div className="space-y-2 mt-2">
                      {/* Компания контакта */}
                      <div className="flex items-center py-1 relative">
                        <div className="w-40 text-sm text-slate-400">Компания</div>
                        <div className="flex-1">
                          {editingContactCompany !== dealContact.id ? (
                            <div 
                              onClick={() => {
                                if (!dealContact.company_id) {
                                  setEditingContactCompany(dealContact.id)
                                  setContactCompanySearch('')
                                } else {
                                  setActiveMenu(activeMenu === `contact-company-${dealContact.id}` ? null : `contact-company-${dealContact.id}`)
                                }
                              }}
                              onDoubleClick={() => {
                                setEditingContactCompany(dealContact.id)
                                setContactCompanySearch(
                                  dealContact.company_id 
                                    ? companies.find(c => c.id === dealContact.company_id)?.name || ''
                                    : ''
                                )
                                setActiveMenu(null)
                              }}
                              className="text-white cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded -mx-2"
                            >
                              {dealContact.company_id 
                                ? companies.find(c => c.id === dealContact.company_id)?.name || 'Не найдена'
                                : 'Не указано'
                              }
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                value={contactCompanySearch}
                                onChange={(e) => setContactCompanySearch(e.target.value)}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setEditingContactCompany(null)
                                    setContactCompanySearch('')
                                  }, 200)
                                }}
                                autoFocus
                                placeholder="Введите название компании..."
                                className="w-full text-white bg-slate-700 px-2 py-1 rounded border border-blue-500 outline-none"
                              />
                              {contactCompanySearch && (
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
                          )}
                        </div>
                        {activeMenu === `contact-company-${dealContact.id}` && dealContact.company_id && (
                          <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg py-1 z-10 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setActiveMenu(null)
                                window.location.href = `/companies?openModal=${dealContact.company_id}`
                              }}
                              className="w-full text-left px-4 py-2 text-white hover:bg-slate-600 flex items-center gap-2"
                            >
                              <span>📋</span>
                              <span>Перейти в карточку</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenu(null)
                                setEditingContactCompany(dealContact.id)
                                setContactCompanySearch(companies.find(c => c.id === dealContact.company_id)?.name || '')
                              }}
                              className="w-full text-left px-4 py-2 text-white hover:bg-slate-600 flex items-center gap-2"
                            >
                              <span>✏️</span>
                              <span>Редактировать</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenu(null)
                                setDealContacts(dealContacts.map(dc => 
                                  dc.id === dealContact.id ? { ...dc, company_id: null } : dc
                                ))
                                setHasChanges(true)
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
                      <div className="flex items-center py-1">
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
                      <div className="flex items-center py-1">
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
                      <div className="flex items-center py-1">
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
                            className="w-full text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 outline-none px-1"
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
                      )}
                      </div>
                    </div>
                  )})}

                  {/* Кнопка добавления нового контакта */}
                  <div className="flex items-center relative" style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                    <div className="w-40 text-sm text-slate-400">Добавить контакт</div>
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
                        style={{ padding: '10px' }}
                      >
                        <div className="flex items-center py-2 relative">
                          <div className="w-40 text-sm text-slate-400">Контакт</div>
                          <div className="flex-1 text-white">{contact.first_name} {contact.last_name}</div>
                        </div>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center py-1">
                            <div className="w-40 text-sm text-slate-400">Компания</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-1">
                            <div className="w-40 text-sm text-slate-400">Раб. тел.</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-1">
                            <div className="w-40 text-sm text-slate-400">Email раб.</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-1">
                            <div className="w-40 text-sm text-slate-400">Должность</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-1">
                            <div className="w-40 text-sm text-slate-400">Бюджет 2</div>
                            <div className="flex-1 text-white">Placeholder</div>
                          </div>
                          <div className="flex items-center py-1">
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
                  <div className="bg-slate-700/30 rounded-lg overflow-hidden" style={{ padding: '10px' }}>
                    <div className="space-y-1">
                    {/* Компания */}
                    <div className="flex items-center py-1 relative">
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
                      
                      {activeMenu === 'company' && (
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
                          <button
                            onClick={() => {
                              setActiveMenu(null)
                              updateEditForm('company_id', '')
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
                  <div className="flex items-center py-1">
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
                  <div className="flex items-center py-1">
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
                  <div className="flex items-center py-1">
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
                  <div className="flex items-center py-1">
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
                  <div className="space-y-1">
                    <div className="flex items-center relative" style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                      <div className="w-40 text-sm text-slate-400">Добавить компанию</div>
                      <div className="flex-1">
                        {!editingCompany ? (
                          <div 
                            onClick={() => {
                              setEditingCompany(true)
                              setCompanySearch('')
                            }}
                            className="text-slate-400 cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded -mx-2"
                          >
                            Не указано
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
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
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
        className="fixed top-0 bottom-0 bg-slate-800 overflow-hidden flex flex-col z-20 border-l border-slate-700"
        style={{ 
          left: '660px', // 80px sidebar + 580px modal
          right: '0',
          transform: isClosing ? 'translateX(100%)' : (isOpening ? 'translateX(100%)' : 'translateX(0)'),
          transition: isOpening ? 'none' : 'transform 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search and Filters Header */}
        <div className="relative border-b border-slate-700 bg-slate-800">
          {/* Search Bar */}
          <div className="px-3 py-2 flex items-center gap-2 cursor-pointer" onClick={() => setShowChatFilters(!showChatFilters)}>
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

          {/* Active Filter Tags */}
          {(chatFilter !== 'all' || chatMessagesEnabled || relatedObjectsEnabled || selectedEventTypes.length > 0) && (
            <div className="px-3 pb-2 flex flex-wrap gap-2">
              {chatFilter === 'chats-only' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded">
                  Только чаты
                  <button onClick={() => setChatFilter('all')} className="hover:text-green-200">✕</button>
                </span>
              )}
              {chatFilter === 'chats-with-clients' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded">
                  Только чаты с клиентами
                  <button onClick={() => setChatFilter('all')} className="hover:text-green-200">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Filter Panel - Overlay */}
          {showChatFilters && (
            <div 
              className="absolute top-full left-0 right-0 bg-slate-800 border-b border-slate-700 shadow-lg z-40 flex chat-filters-panel"
              style={{ maxHeight: '400px' }}
            >
              {/* Левая панель - Быстрые фильтры */}
              <div className="w-60 border-r border-slate-700 p-3 space-y-1">
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
              <div className="flex-1 p-3 space-y-3">
                {/* Блок 1: Сообщения чатов */}
                <div className="relative">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
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
                    <div className="mt-2 ml-5">
                      <button
                        onClick={() => setShowChatMessagesDropdown(!showChatMessagesDropdown)}
                        className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
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
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
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
                    <div className="mt-2 ml-5">
                      <button
                        onClick={() => setShowRelatedObjectsDropdown(!showRelatedObjectsDropdown)}
                        className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
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
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
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
