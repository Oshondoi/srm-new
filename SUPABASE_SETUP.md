# 🚨 КРИТИЧНО: Настройка Supabase PostgreSQL

## Проблема
Сейчас используется локальный Docker PostgreSQL (`localhost:5432`), но нужно работать **ТОЛЬКО с Supabase**.

## Что нужно сделать

### 1. Получить правильный Connection String из Supabase Dashboard

1. Открой https://supabase.com/dashboard
2. Выбери проект `nywsibcnngcexjbotsaq`
3. Перейди в **Project Settings** → **Database**
4. Найди секцию **Connection String**
5. Выбери **"Direct connection"** (не Transaction mode)
6. Скопируй строку подключения, она будет вида:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 2. Обнови `.env.local`

Замени в файле `/workspaces/srm-new/.env.local`:

```env
DATABASE_URL=postgresql://postgres.nywsibcnngcexjbotsaq:[YOUR-PASSWORD]@db.nywsibcnngcexjbotsaq.supabase.co:5432/postgres
```

На правильный connection string из п.1 (с реальным паролем).

### 3. Перезапусти Dev Server

```bash
# Останови текущий (если запущен)
pkill -f "next dev"

# Запусти заново
cd /workspaces/srm-new && npm run dev
```

### 4. Проверь подключение

```bash
# Тест подключения к Supabase (замени [PASSWORD])
PGPASSWORD='[YOUR-PASSWORD]' psql -h db.nywsibcnngcexjbotsaq.supabase.co -U postgres.nywsibcnngcexjbotsaq -d postgres -c "SELECT current_database();"
```

Должно вывести: `postgres`

---

## ✅ После настройки

- Все данные будут браться из Supabase
- Логины, воронки, сделки появятся на сайте
- Локальный Docker больше не нужен

---

## 📝 Документация обновлена

- ✅ `README.md` - добавлено правило "БАЗА ДАННЫХ ТОЛЬКО SUPABASE"
- ✅ `memory-bank/activeContext.md` - обновлена секция проверок при старте
- ✅ `.env.local` - комментарии с инструкциями

---

## ⚠️ ВАЖНО

**НИКОГДА не используй `localhost:5432`** без явного указания. Supabase - единственный источник правды для данных.
