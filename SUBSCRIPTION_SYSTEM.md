# Subscription System - Тарифная система

## Обзор

Система управления подписками и доступом к функциям CRM. Позволяет ограничивать доступ к премиум функциям в зависимости от тарифного плана аккаунта.

## Архитектура

### База данных

**3 основные таблицы:**

1. **subscriptions** - подписки аккаунтов
   - `account_id` - привязка к аккаунту
   - `plan_name` - название тарифа (free/professional/business)
   - `status` - статус (active/cancelled/expired)
   - `expires_at` - дата окончания (NULL для free)

2. **features** - функции системы
   - `name` - машинное имя (`chat_search`, `api_access`)
   - `display_name` - название для UI ("Поиск по сообщениям")
   - `description` - описание функции

3. **subscription_features** - матрица доступа
   - `plan_name` - тариф
   - `feature_name` - функция
   - Определяет какие функции доступны в каких тарифах

### Тарифные планы

| План | Цена | Функции |
|------|------|---------|
| **Free** | 0₽ | Базовый функционал CRM |
| **Professional** | 1,990₽/мес | + Поиск, фильтры, API, аналитика, кастомные поля |
| **Business** | 4,990₽/мес | + Массовые операции, автоматизация, email, white-label |

### Доступные функции

| Функция | Free | Professional | Business |
|---------|------|--------------|----------|
| chat_search | ❌ | ✅ | ✅ |
| advanced_filters | ❌ | ✅ | ✅ |
| api_access | ❌ | ✅ | ✅ |
| custom_fields | ❌ | ✅ | ✅ |
| advanced_analytics | ❌ | ✅ | ✅ |
| bulk_operations | ❌ | ❌ | ✅ |
| automation | ❌ | ❌ | ✅ |
| email_integration | ❌ | ❌ | ✅ |
| priority_support | ❌ | ❌ | ✅ |
| white_label | ❌ | ❌ | ✅ |

## Использование

### В компонентах (Frontend)

```typescript
import { useState, useEffect } from 'react'

function MyComponent() {
  const [hasSearchAccess, setHasSearchAccess] = useState(false)
  const [userPlan, setUserPlan] = useState<'free' | 'professional' | 'business'>('free')

  useEffect(() => {
    // Загрузка информации о тарифе
    async function loadSubscription() {
      const res = await fetch('/api/account/subscription')
      const data = await res.json()
      setUserPlan(data.plan)
      setHasSearchAccess(data.plan !== 'free')
    }
    loadSubscription()
  }, [])

  return (
    <div>
      {hasSearchAccess ? (
        <SearchInput />
      ) : (
        <div>
          Поиск доступен в тарифе{' '}
          <a href="/pricing">«Профессиональный»</a>
        </div>
      )}
    </div>
  )
}
```

### В API routes (Backend)

```typescript
import { getUserFromRequest } from '@/lib/auth'
import { hasFeatureAccess } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  
  // Проверка доступа к функции
  const hasAccess = await hasFeatureAccess(user.accountId, 'chat_search')
  
  if (!hasAccess) {
    return NextResponse.json({
      error: 'Upgrade required',
      requiredPlan: 'professional',
      feature: 'chat_search'
    }, { status: 403 })
  }

  // Продолжаем выполнение
  // ...
}
```

### Helper функции

**Файл:** `/src/lib/subscription.ts`

```typescript
// Проверить доступ к функции
const hasAccess = await hasFeatureAccess(accountId, 'chat_search')

// Получить текущий тариф аккаунта
const plan = await getAccountPlan(accountId) // 'free' | 'professional' | 'business'

// Получить все доступные функции
const features = await getAccountFeatures(accountId) // ['chat_search', 'api_access', ...]

// Получить информацию о всех тарифах
const plans = getAllPlans() // [{ name, price, features }, ...]
```

## API Endpoints

### GET /api/account/subscription
Получить информацию о подписке текущего аккаунта.

**Response:**
```json
{
  "plan": "free",
  "accountId": "uuid"
}
```

### POST /api/account/check-feature
Проверить доступ к конкретной функции.

**Request:**
```json
{
  "feature": "chat_search"
}
```

**Response:**
```json
{
  "hasAccess": false,
  "feature": "chat_search"
}
```

## Миграция

**Файл:** `drizzle/migrations/0004_subscriptions.sql`

При применении миграции:
1. Создаются таблицы subscriptions, features, subscription_features
2. Добавляются 10 функций системы
3. Настраивается матрица доступа для всех тарифов
4. Все существующие аккаунты получают FREE подписку

**Применение:**
```bash
docker exec -i srm-postgres psql -U postgres -d srm < drizzle/migrations/0004_subscriptions.sql
```

## Добавление новой функции

1. **Добавить в БД:**
```sql
INSERT INTO features (name, display_name, description) VALUES
  ('new_feature', 'Новая функция', 'Описание функции');

-- Добавить в нужные тарифы
INSERT INTO subscription_features (plan_name, feature_name) VALUES
  ('professional', 'new_feature'),
  ('business', 'new_feature');
```

2. **Добавить тип в TypeScript:**
```typescript
// src/lib/subscription.ts
export type FeatureName = 
  | 'chat_search'
  | 'new_feature' // <-- новая функция
  | ...
```

3. **Использовать в коде:**
```typescript
const hasAccess = await hasFeatureAccess(accountId, 'new_feature')
```

## Переход на другой тариф

```sql
-- Обновить подписку аккаунта
UPDATE subscriptions 
SET plan_name = 'professional',
    started_at = NOW(),
    expires_at = NOW() + INTERVAL '30 days'
WHERE account_id = 'uuid' AND status = 'active';
```

## Отмена подписки

```sql
-- Вернуть на FREE план
UPDATE subscriptions 
SET plan_name = 'free',
    status = 'active',
    expires_at = NULL
WHERE account_id = 'uuid';
```

## Безопасность

- ✅ Проверка доступа выполняется на сервере (в API routes)
- ✅ Frontend проверки только для UX (показать/скрыть элементы)
- ✅ Нельзя обойти ограничения через DevTools
- ✅ При ошибке доступ запрещен по умолчанию

## Расширение

Система спроектирована для легкого добавления:
- Новых тарифов
- Новых функций
- Временных акций/скидок
- Пробных периодов
- Корпоративных тарифов

Все изменения в БД, никакого хардкода в коде!
