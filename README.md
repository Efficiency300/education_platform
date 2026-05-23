# AI-Mentor · Turonbank

Production-ready onboarding-платформа для новых сотрудников и стажёров Turonbank.
**Курсы → проверка знаний → симулятор АБС/CRM → аналитика прогресса.**

Apple-вдохновлённый UI · streaming AI-чат · сквозной progress tracking
по всем модулям · геймификация · готовая интеграция с iSpring LMS.

> Полный текст ТЗ — в [`docs/SPEC.md`](docs/SPEC.md).

---

## Что внутри

| Блок | Реализация |
|---|---|
| **Учебный центр (Courses)** | 3 курса с уроками в markdown + финальный квиз на 70%. Привязан к симулятору. |
| **AI-наставник** | RAG (BM25) поверх корпоративных регламентов · Anthropic Claude · SSE streaming · fallback в mock |
| **Симулятор АБС/CRM** | 3 сценария разной сложности (открытие счёта, обработка жалобы, подозрительный перевод) · safe sandbox · dummy data |
| **Сквозной Progress Tracking** | Все действия (урок, квиз, сценарий, чат) пишутся в Progress + ActivityEvent. Глобальный `ProgressProvider` на фронте раздаёт состояние всем страницам и автоматически перетягивает после каждого действия. |
| **Геймификация** | XP · 6 уровней · 6 бейджей · детект level-up / новых бейджей с toast-уведомлениями |
| **HR-интеграция** | Импорт сотрудников из CSV или JSON · upsert по `employee_id` |
| **iSpring LMS** | Выгрузка результатов одним POST · mock / live |
| **Безопасность** | Все данные — fictional · DLP-метки в UI · изолированная БД · `correct`-флаги квиза не утекают на фронт |
| **UX** | Apple HIG · glassmorphism · spring-анимации · dark/light mode · адаптивный mobile · production toast-система |

## Стек

- **Backend**: Python 3.12 · FastAPI · SQLAlchemy 2 (async) · SQLite (dev) / PostgreSQL (prod) · Anthropic SDK · rank-bm25
- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · React Router · Lucide
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
При первом старте: создаётся `data/app.db`, индексируются регламенты,
создаётся демо-пользователь `DEMO-001`.

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

13 тестов: health, chat, simulator, badges/ispring, hr-import, courses + activity.

### Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Frontend — `http://localhost:5173`, backend — `http://localhost:8000`.

## Архитектура прогресса

```
                     ┌────────────────────────────────┐
                     │      ProgressProvider (FE)     │
                     │  user · gamification · courses │
                     │  scenarios · activity · toasts │
                     └───────────┬────────────────────┘
                                 │ refresh() после любого действия
       ┌──────────────┬──────────┼──────────┬────────────┐
       ▼              ▼          ▼          ▼            ▼
   Dashboard      Courses     Simulator    Chat       Progress
                                 │ │         │            │
                                 ▼ ▼         ▼            ▼
              POST /api/courses/lessons/complete
              POST /api/courses/quiz/submit
              POST /api/simulator/answer
              POST /api/chat[/stream]
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │   Backend: упорядоченные таблицы│
                 │  Progress · CourseProgress      │
                 │  LessonProgress · ActivityEvent │
                 │  SimulatorSession · ChatMessage │
                 └────────────────────────────────┘
```

- **Один источник правды** на фронте — `useProgress()`. Любая страница может вызвать `refresh()` после действия.
- **Журнал активности** строится из `ActivityEvent` одним SQL-запросом и отображается на Dashboard и Progress.
- **Level-up / новые бейджи** диффатся между снапшотами и поднимают toast.

## Учебный модуль

3 курса, каждый с 4 уроками (markdown) и квизом на 4 вопроса.
Порог прохождения квиза — 70%. Контент в [`backend/app/courses/catalog.py`](backend/app/courses/catalog.py).

| Slug | Подготовка к симулятору | Сложность |
|---|---|---|
| `abs_basics` | АБС · Открытие текущего счёта | базовый |
| `crm_service_standards` | CRM · Обработка жалобы | средний |
| `aml_compliance` | АБС · Подозрительный перевод | углублённый |

XP-расчёт курса: `10 XP × уроки + 60 XP за квиз` (≈ 100 XP за полный курс).

## Режимы работы

| Компонент | Без ключей | С ключами |
|---|---|---|
| AI-чатбот | mock: цитирует найденные фрагменты | Claude генерирует ответ + стриминг |
| iSpring | mock: возвращает JSON | реальный POST на `ISPRING_BASE_URL` |
| База | SQLite (`data/app.db`) | PostgreSQL через `DATABASE_URL` |

`/health` всегда показывает текущий режим.

## Ключевые эндпоинты

| Метод + Path | Назначение |
|---|---|
| `GET  /health` | Статус системы и режимов |
| `POST /api/chat` | Синхронный ответ AI |
| `POST /api/chat/stream` | SSE-стрим ответа |
| `GET  /api/chat/history/{user_id}` | История переписки |
| `GET  /api/courses?user_id=` | Каталог курсов с overlay-прогрессом |
| `GET  /api/courses/{slug}?user_id=` | Курс с уроками и квизом |
| `POST /api/courses/lessons/complete` | Зачёт урока (идемпотентно) |
| `POST /api/courses/quiz/submit` | Сдача финального квиза |
| `GET  /api/simulator/scenarios` | Список сценариев |
| `POST /api/simulator/sessions` | Старт сессии |
| `POST /api/simulator/answer` | Ответ на шаг |
| `GET  /api/progress/{user_id}` | Сводный прогресс (courses + simulator) |
| `GET  /api/activity/{user_id}` | Журнал активности |
| `GET  /api/badges/{user_id}` | XP-уровень + бейджи |
| `POST /api/ispring/sync` | Выгрузка в iSpring |
| `POST /api/hr/import/json` | Импорт сотрудников JSON |
| `POST /api/hr/import/csv` | Импорт сотрудников CSV |

## Структура

```
backend/
  app/
    api/          # chat (+stream), simulator, progress, ispring, badges, hr_import,
                  # users, courses, activity
    ai/           # rag.py (BM25), llm.py (Claude + streaming + mock)
    courses/      # catalog.py — контент уроков + квизов
    db/           # SQLAlchemy модели, сессия, activity log helper
    schemas/      # Pydantic схемы (users, chat, simulator, progress, courses)
    simulator/    # каталог сценариев
    core/         # config + logging
    main.py       # entry point + lifespan
  data/regulations/  # MD-файлы для RAG
  tests/        # pytest: health, chat, simulator, badges, ispring, hr, courses+activity
frontend/
  src/
    state/      # ProgressProvider — глобальный контекст user/progress/activity/toasts
    pages/      # Dashboard, Courses, CourseDetail, Chat, Simulator, Progress
    components/ # GlassCard, CircularProgress, XPBar, BadgeGrid, Sidebar,
                # MobileNav, Toaster, ActivityFeed, Markdown
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
| Курсы подготовки | **3** курса с уроками + квизами, привязка к симулятору |
| RAG из базы регламентов | BM25 поверх `data/regulations/*.md` |
| Геймификация | XP, 6 уровней, 6 бейджей, прогресс-бары, toast level-up |
| Progress tracking | Persistent в БД, единый ProgressProvider на фронте, журнал активности |
| Интеграция с iSpring | `POST /api/ispring/sync` (mock/live) |
| Адаптивность | Tailwind responsive, mobile bottom-nav |
| Время ответа ≤ 2 сек | mock <50 мс; Claude Haiku ~1 сек; стриминг даёт first-token < 500 мс |
| Без реальных данных | Все клиенты virtual, БД изолирована, DLP-метки в UI |

## Что осталось вне MVP

- Реальный коннектор к HR-системе банка (есть только CSV/JSON-импорт)
- Live-режим iSpring (есть код, нужен URL + токен)
- SSO с корпоративным AD
- Векторный поиск (BM25 достаточен для текущего объёма)
- Prometheus-метрики и трейсинг
