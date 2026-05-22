# AI-Mentor · Turonbank

Интеллектуальный onboarding-симулятор для новых сотрудников и стажёров Turonbank.
Apple-inspired UI · Streaming AI-чат · 3 сценария безопасного симулятора АБС/CRM.

> Полный текст ТЗ — в [`docs/SPEC.md`](docs/SPEC.md).

---

## Что внутри

| Блок | Реализация |
|---|---|
| **AI-ассистент** | RAG (BM25) поверх корпоративных регламентов · Anthropic Claude · SSE-streaming · fallback в mock-режим |
| **Симулятор АБС/CRM** | 3 сценария разной сложности (открытие счёта, обработка жалобы, подозрительный перевод) · safe sandbox · dummy data |
| **Геймификация** | XP-баллы · 6 уровней (Новичок → Магистр) · 5 бейджей-достижений |
| **Progress tracking** | Сводка по модулям · круговая шкала · кнопка выгрузки в iSpring |
| **HR-интеграция** | Импорт сотрудников из CSV или JSON · upsert по `employee_id` |
| **Безопасность** | Все данные — fictional · DLP-метки в UI · изолированная БД |
| **UX** | Apple HIG · glassmorphism · spring-анимации · dark/light mode · адаптивный mobile |

## Стек

- **Backend**: Python 3.12 · FastAPI · SQLAlchemy 2 · SQLite (dev) / PostgreSQL (prod) · Anthropic SDK · rank-bm25
- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Lucide React
- **Infra**: Docker Compose · Nginx (frontend) · Postgres

## Быстрый старт (локально)

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # опционально: ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

API на `http://localhost:8000`, документация — `/docs`.
При первом старте: создаётся `data/app.db`, индексируются регламенты, создаётся демо-пользователь `DEMO-001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173`. Vite проксирует `/api` и `/health` на backend.

### Запуск тестов

```bash
cd backend && .venv/bin/python -m pytest -q
```

### Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Frontend — `http://localhost:5173`, backend — `http://localhost:8000`.

## Дизайн

Apple HIG-вдохновлённый интерфейс:
- Цвета бренда: **navy `#0A1628`** + **gold `#C9A84C`** + `#F5F5F7` подложка
- Glassmorphism-карточки (`backdrop-blur` + полупрозрачность)
- Spring-анимации (Framer Motion), а не linear easing
- Inter / SF Pro Display, hero-typography с tracking‑tight
- Hover/focus/active состояния у каждого интерактивного элемента
- Dark mode синхронизирован с системным `prefers-color-scheme`, переключается из сайдбара

## Режимы работы

| Компонент | Без ключей | С ключами |
|---|---|---|
| AI-чатбот | mock: цитирует найденные фрагменты | Claude генерирует ответ + стриминг |
| iSpring | mock: возвращает JSON | реальный POST на `ISPRING_BASE_URL` |
| База | SQLite (`data/app.db`) | PostgreSQL через `DATABASE_URL` |

В `/health` всегда видно текущий режим.

## Ключевые эндпоинты

| Метод + Path | Назначение |
|---|---|
| `GET /health` | Статус системы и режимов |
| `POST /api/chat` | Синхронный ответ AI |
| `POST /api/chat/stream` | SSE-стрим ответа |
| `GET /api/chat/history/{user_id}` | История переписки |
| `GET /api/simulator/scenarios` | Список сценариев |
| `POST /api/simulator/sessions` | Старт сессии |
| `POST /api/simulator/answer` | Ответ на шаг |
| `GET /api/progress/{user_id}` | Сводка прогресса |
| `GET /api/badges/{user_id}` | XP-уровень + бейджи |
| `POST /api/ispring/sync` | Выгрузка в iSpring |
| `POST /api/hr/import/json` | Импорт сотрудников JSON |
| `POST /api/hr/import/csv` | Импорт сотрудников CSV |

## Структура

```
backend/
  app/
    api/          # chat (+stream), simulator, progress, ispring, badges, hr_import, users
    ai/           # rag.py (BM25), llm.py (Claude + streaming + mock)
    db/           # SQLAlchemy модели и сессия
    schemas/      # Pydantic схемы
    simulator/    # каталог сценариев
    core/         # config + logging
    main.py       # entry point + lifespan
  data/regulations/  # MD-файлы для RAG
  tests/        # pytest: health, chat, simulator, badges, ispring, hr-import
frontend/
  src/
    pages/      # Dashboard, Chat, Simulator, Progress
    components/ # GlassCard, CircularProgress, XPBar, BadgeGrid, Sidebar, MobileNav
    api.ts      # типизированный клиент + streamChat (SSE)
    theme.tsx   # ThemeProvider (dark/light)
    styles.css  # Tailwind + glassmorphism токены
  tailwind.config.js / postcss.config.js / vite.config.ts
docs/SPEC.md
docker-compose.yml
```

## Соответствие критериям приёмки ТЗ

| Требование | Реализация |
|---|---|
| Минимум 1 симулятор + AI-чатбот | **3** сценария + чатбот со стримингом |
| RAG из базы регламентов | BM25 поверх `data/regulations/*.md` |
| Геймификация | XP, 6 уровней, 5 бейджей-достижений, прогресс-бары |
| Progress tracking | Persistent в БД, агрегируется + красивый дашборд |
| Интеграция с iSpring | `POST /api/ispring/sync` (mock/live) |
| Адаптивность | Tailwind responsive, mobile-bottom-nav |
| Время ответа ≤ 2 сек | mock <50 мс; Claude Haiku ~1 сек; стриминг даёт first-token < 500 мс |
| Без реальных данных | Все клиенты virtual, БД изолирована, DLP-метки в UI |

## Что осталось вне MVP

- Реальный коннектор к HR-системе банка (есть только CSV/JSON-импорт — нужен формат вашей HR)
- Live-режим iSpring (есть код, нужен URL + токен)
- SSO с корпоративным AD
- Векторный поиск (BM25 достаточно для текущего объёма регламентов)
- Прометей-метрики и трейсинг
