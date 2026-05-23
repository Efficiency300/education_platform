# AI-Mentor · Turonbank

Production-ready onboarding-платформа для новых сотрудников и стажёров Turonbank.
**Аутентификация · три роли · курсы → симулятор · HR-аналитика · admin-консоль.**

Apple-вдохновлённый UI · streaming AI-чат · сквозной progress tracking
по всем модулям · геймификация · AI-оценка компетенций · готовая интеграция с iSpring LMS.

> Полный текст ТЗ — в [`docs/SPEC.md`](docs/SPEC.md).

---

## Demo-аккаунты

Создаются автоматически при первом запуске бекенда (и пересоздаются с обновлением пароля при каждом старте — удобно для презентаций).

| Роль | Email | Пароль | Интерфейс |
|---|---|---|---|
| **User** | `user@turonbank.uz` | `user12345` | Дашборд, курсы, симулятор, AI-чат, прогресс |
| **HR** | `hr@turonbank.uz` | `hr12345` | Команда, лидерборд, аналитика, профили с AI-оценкой |
| **Admin** | `admin@turonbank.uz` | `admin12345` | Управление курсами, регламентами, пользователями |

Зарегистрироваться с правом `user` можно также самостоятельно на `/register`. Назначить роль `hr`/`admin` может только администратор.

## Что внутри

| Блок | Реализация |
|---|---|
| **Аутентификация** | bcrypt-пароли · JWT-токены · Bearer-авторизация · авто-логин по сохранённому токену |
| **Три роли** | `user` (обучается), `hr` (видит команду + AI-оценку), `admin` (управляет контентом) |
| **Учебный центр** | 3 встроенных курса + неограниченные пользовательские. Markdown-уроки, квиз ≥ 70%. |
| **AI-наставник** | RAG (BM25) поверх корпоративных регламентов · Claude · SSE-streaming · fallback в mock |
| **Симулятор АБС/CRM** | 3 сценария: открытие счёта, обработка жалобы, подозрительный перевод. Safe sandbox · dummy data. |
| **Progress Tracking** | Все действия (урок, квиз, сценарий, чат) → Progress + ActivityEvent. Глобальный фронт-провайдер. |
| **Геймификация** | XP · 6 уровней · 6 бейджей · toast при level-up и новых бейджах |
| **HR-консоль** | Обзор, таблица команды, лидерборд, аналитика (charts), профили сотрудников + **AI-оценка компетенций** |
| **Admin-консоль** | CRUD курсов, загрузка регламентов с автореиндексацией RAG, управление ролями, системная статистика |
| **iSpring LMS** | Выгрузка одним POST · mock / live |
| **Безопасность** | bcrypt + JWT · RBAC на эндпоинтах · правильные ответы квиза не утекают на фронт · DLP-метки |
| **UX** | Apple HIG · glassmorphism · spring-анимации · dark/light mode · адаптивный mobile |

## Стек

- **Backend**: Python 3.12 · FastAPI · SQLAlchemy 2 (async) · SQLite (dev) / PostgreSQL (prod) · Anthropic SDK · rank-bm25 · bcrypt · PyJWT
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
создаются 3 demo-аккаунта (user/hr/admin).

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

21 тест: health, chat, simulator, badges/ispring, hr-import, courses + activity, auth + HR + admin.

### Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Frontend — `http://localhost:5173`, backend — `http://localhost:8000`.

## Роли и интерфейсы

```
                       ┌──────────────────────────┐
                       │      JWT-токен           │
                       │  /api/auth/login         │
                       └────────────┬─────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
   ┌─────────┐               ┌────────────┐              ┌──────────┐
   │  user   │               │     hr     │              │  admin   │
   ├─────────┤               ├────────────┤              ├──────────┤
   │ /       │ Dashboard     │ /hr        │ Обзор        │ /admin   │
   │ /courses│ Курсы         │ /hr/team   │ Команда      │ /admin/  │
   │ /simu…  │ Симулятор     │ /hr/users/:id              │   courses
   │ /chat   │ AI-чат        │   профиль + AI-оценка     │   regulations
   │ /progress Прогресс      │ /hr/leaderboard            │   users
   │         │               │ /hr/analytics              │   settings
   └─────────┘               └────────────┘              └──────────┘
```

### HR-интерфейс

- **Обзор** — KPI команды, активность за 14 дней, top-5 сотрудников
- **Команда** — фильтрация по статусу (Не начал / Онбординг / В процессе / Готов / Образцовый), поиск, сортировка
- **Профиль сотрудника** — детальный прогресс по курсам и сценариям + **AI-оценка компетенций**: score 0–100, сильные стороны, зоны роста, рекомендация
- **Лидерборд** — топ по XP с подиумом
- **Аналитика** — bar/donut/sparkline графики, нативный SVG без сторонних библиотек

### Admin-интерфейс

- **Обзор** — KPI системы, состав ролей, режимы интеграций
- **Курсы** — встроенные (read-only) + пользовательские (создание модального редактора с уроками, квизом, привязкой к симулятору)
- **Регламенты** — загрузка `.md`, автоматическая переиндексация BM25
- **Пользователи** — поиск, изменение ролей (с защитой от self-демоут)
- **Система** — состояние интеграций (Claude / iSpring), счётчики, демо-аккаунты

## Архитектура прогресса

```
              ┌────────────────────────────────┐
              │      AuthProvider (FE)         │
              │  user (с ролью) + JWT-токен    │
              └──────────────┬─────────────────┘
                             │
              ┌──────────────▼─────────────────┐
              │      ProgressProvider (FE)     │
              │  scenarios · courses · activity│
              │  gamification · toasts         │
              └──────────────┬─────────────────┘
                             │ refresh() после любого действия
       ┌──────────────┬──────┼──────┬────────────┐
       ▼              ▼      ▼      ▼            ▼
   Dashboard      Courses  Simu   Chat        Progress
                  │ │       │       │            │
              POST /api/courses/lessons/complete
              POST /api/courses/quiz/submit
              POST /api/simulator/answer
              POST /api/chat[/stream]
                             │
                             ▼
            ┌──────────────────────────────────┐
            │  Backend: упорядоченные таблицы  │
            │  Progress · CourseProgress       │
            │  LessonProgress · ActivityEvent  │
            │  SimulatorSession · ChatMessage  │
            │  CustomCourse (admin-created)    │
            └──────────────────────────────────┘
```

## AI-оценка компетенций

HR видит на странице каждого сотрудника JSON-структурированную оценку:

```json
{
  "score": 78,
  "summary": "Алишер: 75% прогресса, 320 XP. Динамика хорошая, готов к боевым задачам.",
  "strengths": ["Завершено курсов: 2", "Сценариев со зачётом: 2", "Активно использует AI-наставника"],
  "gaps": ["Слабые сценарии: AML · Подозрительный перевод"],
  "recommendation": "Готов к боевым задачам — назначить наставника на первые 2 недели.",
  "mode": "live"
}
```

Без ключа Anthropic — детерминированный rule-based fallback на основе XP, прохождений и активности. С ключом — Claude Haiku 4.5 с принудительным JSON-выходом.

## Учебный модуль

**Встроенные курсы** в [backend/app/courses/catalog.py](backend/app/courses/catalog.py):

| Slug | Подготовка к симулятору | Сложность |
|---|---|---|
| `abs_basics` | АБС · Открытие текущего счёта | базовый |
| `crm_service_standards` | CRM · Обработка жалобы | средний |
| `aml_compliance` | АБС · Подозрительный перевод | углублённый |

**Пользовательские курсы** создаются админом через UI (`/admin/courses → Создать курс`) и сразу попадают в общий каталог. Структура хранится в `CustomCourse` как JSON, что даёт максимальную гибкость без миграций.

XP-расчёт: `10 XP × уроки + 60 XP за квиз` (≈ 100 XP за полный курс).

## Режимы работы

| Компонент | Без ключей | С ключами |
|---|---|---|
| AI-чатбот | mock: цитирует найденные фрагменты | Claude генерирует ответ + стриминг |
| AI-оценка компетенций | rule-based по метрикам | Claude в JSON-режиме |
| iSpring | mock: возвращает JSON | реальный POST на `ISPRING_BASE_URL` |
| База | SQLite (`data/app.db`) | PostgreSQL через `DATABASE_URL` |

`/health` и `/api/admin/stats` показывают текущий режим.

## Ключевые эндпоинты

| Метод + Path | Назначение | Auth |
|---|---|---|
| `GET  /health` | Статус системы и режимов | — |
| `POST /api/auth/register` | Регистрация (роль user) | — |
| `POST /api/auth/login` | Вход (email + password) | — |
| `GET  /api/auth/me` | Текущий пользователь | Bearer |
| `POST /api/chat[/stream]` | AI-чат (SSE) | Bearer (user) |
| `GET  /api/courses?user_id=` | Каталог курсов с overlay | Bearer |
| `GET  /api/courses/{slug}` | Курс с уроками и квизом | Bearer |
| `POST /api/courses/lessons/complete` | Зачёт урока (идемпотентно) | Bearer |
| `POST /api/courses/quiz/submit` | Сдача квиза | Bearer |
| `GET  /api/simulator/scenarios` | Список сценариев | Bearer |
| `POST /api/simulator/answer` | Ответ на шаг | Bearer |
| `GET  /api/progress/{user_id}` | Сводный прогресс | Bearer |
| `GET  /api/activity/{user_id}` | Журнал активности | Bearer |
| `GET  /api/badges/{user_id}` | XP-уровень + бейджи | Bearer |
| `GET  /api/hr/team` | Команда + статусы | hr/admin |
| `GET  /api/hr/users/{id}` | Профиль + AI-оценка | hr/admin |
| `GET  /api/hr/leaderboard` | Лидерборд | hr/admin |
| `GET  /api/hr/analytics` | Метрики для графиков | hr/admin |
| `GET  /api/admin/courses` | Все курсы (built-in + custom) | admin |
| `POST /api/admin/courses` | Создать кастомный курс | admin |
| `DELETE /api/admin/courses/{id}` | Удалить курс | admin |
| `GET  /api/admin/regulations` | Список регламентов | admin |
| `POST /api/admin/regulations/upload` | Загрузить .md + переиндексировать RAG | admin |
| `GET  /api/admin/users` | Все пользователи | admin |
| `PATCH /api/admin/users/{id}/role` | Изменить роль | admin |
| `GET  /api/admin/stats` | Системная статистика | admin |
| `POST /api/ispring/sync` | Выгрузка в iSpring | Bearer |
| `POST /api/hr/import/{json,csv}` | Импорт сотрудников | — (legacy) |

## Структура

```
backend/
  app/
    api/          # auth, users, chat, simulator, progress, ispring, badges,
                  # hr_import, courses, activity, hr, admin
    ai/           # rag.py (BM25), llm.py (Claude streaming + competency assessment)
    courses/      # catalog.py — встроенные курсы
    core/         # config, logging, security (bcrypt + JWT), deps (RBAC)
    db/           # SQLAlchemy модели, async session, activity log
    schemas/      # Pydantic схемы
    simulator/    # каталог сценариев
    main.py       # entry point + lifespan + demo accounts seed
  data/regulations/  # MD-файлы для RAG (admin может загружать)
  tests/        # pytest — 21 тест
frontend/
  src/
    state/      # AuthProvider · ProgressProvider
    pages/      # Login, Register
              # user:  Dashboard, Courses, CourseDetail, Chat, Simulator, Progress
              # hr/    HRDashboard, HRTeam, HRUserProfile, HRLeaderboard, HRAnalytics
              # admin/ AdminDashboard, AdminCourses, AdminRegulations, AdminUsers, AdminSettings
    components/ # RoleSidebar, MobileNav, Toaster, ActivityFeed, Markdown, Charts,
                # GlassCard, CircularProgress, XPBar, BadgeGrid
    api.ts      # типизированный клиент с JWT + streamChat (SSE)
    App.tsx     # RoleGuard + role-based routing
    main.tsx    # ThemeProvider → AuthProvider → ProgressProvider
```

## Соответствие критериям приёмки ТЗ

| Требование | Реализация |
|---|---|
| Аутентификация | bcrypt + JWT, register/login/me, 3 demo-аккаунта |
| Ролевая модель | user / hr / admin с разными интерфейсами и RBAC на API |
| Минимум 1 симулятор + AI-чатбот | 3 сценария + чатбот со стримингом |
| Курсы подготовки | 3 встроенных + неограниченные пользовательские |
| RAG из базы регламентов | BM25 поверх `data/regulations/*.md` + загрузка из UI |
| Геймификация | XP, 6 уровней, 6 бейджей, toast level-up |
| Progress tracking | Persistent в БД, единый ProgressProvider, журнал активности |
| HR-аналитика | Команда, лидерборд, графики, AI-оценка компетенций |
| Admin-управление | CRUD курсов, загрузка регламентов, управление ролями |
| Интеграция с iSpring | `POST /api/ispring/sync` (mock/live) |
| Адаптивность | Tailwind responsive, mobile bottom-nav |
| Безопасность | bcrypt + JWT + RBAC, dummy-data, DLP-метки, правильные ответы квиза скрыты |

## Что осталось вне MVP

- SSO с корпоративным AD (есть локальный bcrypt + JWT)
- Реальный коннектор HR-системы (CSV/JSON-импорт работает)
- Live iSpring (код есть, нужен URL + токен)
- Векторный поиск (BM25 достаточен для текущего объёма)
- Prometheus-метрики и трейсинг
