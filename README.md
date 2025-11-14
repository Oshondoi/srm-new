# srm-new — amoCRM-like platform (skeleton)

Этот репозиторий содержит стартовый скелет для клона amoCRM: Next.js 15 (App Router) + TypeScript + Tailwind + Supabase + Drizzle.

Важно: не храните реальные секреты в репозитории. Используйте `.env.local` и добавьте его в `.gitignore`.

Быстрый старт

1. Скопируйте `.env.example` в `.env.local` и заполните переменные (SUPABASE ключи, DATABASE_URL).
2. Установите зависимости:

```bash
npm install
```

3. Запустите проект в режиме разработки:

```bash
npm run dev

Kanban и API

- Реализован компонент Kanban `src/components/KanbanBoard.tsx` (использует `@dnd-kit/core`).
- Добавлены серверные API: `src/app/api/pipelines/route.ts`, `src/app/api/contacts/route.ts`, `src/app/api/deals/route.ts`.
- Добавлена миграция `drizzle/migrations/0001_init.sql` и схема `drizzle/schema.ts`.

Запуск миграций

1. Заполните `DATABASE_URL` в `.env.local`.
2. Используйте `drizzle-kit` (установлен в devDependencies) для создания/применения миграций:

```bash
npx drizzle-kit generate --out ./drizzle/migrations
npx drizzle-kit push
```

Будьте осторожны: операция `push` изменит вашу базу данных.
```

Что уже сделано

- Базовый `package.json`, `tsconfig.json` и конфиги Next/Tailwind/PostCSS
- Начальная структура `src/app` с layout и простой боковой навигацией
- `src/lib/supabaseClient.ts` — минимум для создания клиентского и серверного Supabase клиента
- `README` и `.env.example`

Дальше (план)

1. Спроектировать полную модель данных (Drizzle) и миграции.
2. Реализовать аутентификацию и роли (Supabase Auth + server API using service role).
3. Реализовать CRM-сущности: сделки, контакты, компании, воронки, задачи, история.
4. Канбан с dnd-kit и сохранением позиций.
5. Отчёты/дашборд и аналитика.

Если нужно, могу автоматически применить ваши Supabase ключи локально (не коммитя их) и выполнить `npm install` / `npm run dev` в контейнере — скажите, хотите ли, чтобы я это сделал сейчас.
