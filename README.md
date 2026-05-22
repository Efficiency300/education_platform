# AI-Mentor · Turonbank

Интеллектуальный onboarding-симулятор для новых сотрудников и стажёров
Turonbank. MVP включает три ключевых компонента из ТЗ:

1. **AI-ассистент** — отвечает на вопросы по регламентам банка (RAG поверх
   корпоративных документов, LLM Anthropic Claude с fallback в mock-режим).
2. **Симулятор АБС** — интерактивный сценарий обслуживания виртуального
   клиента с системой баллов и пошаговой обратной связью.
3. **Прогресс и интеграция с iSpring** — учёт пройденных модулей, баллов
   геймификации и автоматическая выгрузка результатов в iSpring LMS.

> Полный текст ТЗ — в [`docs/SPEC.md`](docs/SPEC.md).

## Безопасность данных

* Все клиенты, документы и операции в симуляторе — **искусственные**.
* Система **не подключается** к реальной АБС или клиентской базе банка.
* Все регламенты в `backend/data/regulations/` — обезличенные демо-документы.

## Стек

* **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.x (SQLite по умолчанию,
  PostgreSQL для prod), Anthropic SDK, rank-bm25 для RAG.
* **Frontend**: React 18 + TypeScript + Vite, React Router.
* **Infra**: Docker Compose (frontend + backend + Postgres).

## Быстрый старт (локально, без Docker)

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # при желании заполните ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

API стартует на `http://localhost:8000`. Документация — `/docs`.
При первом запуске:
* создаётся SQLite-база в `backend/data/app.db`;
* индексируются регламенты из `backend/data/regulations/*.md`;
* создаётся демо-пользователь `DEMO-001 — Демо Стажёр`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте `http://localhost:5173`. Vite проксирует `/api` и `/health`
на backend.

## Быстрый старт (Docker Compose)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

* Frontend — `http://localhost:5173`
* Backend — `http://localhost:8000`
* PostgreSQL — `localhost:5432` (user/pass: `turon`/`turon`)

## Режимы работы

| Компонент | Без ключей | С ключами |
|---|---|---|
| AI-чатбот | mock: цитирует найденные фрагменты регламентов | Claude генерирует развёрнутый ответ |
| iSpring | mock: возвращает JSON, который был бы отправлен | реальный POST на `ISPRING_BASE_URL` |
| База | SQLite (`./data/app.db`) | PostgreSQL (через `DATABASE_URL`) |

В `/health` всегда видно текущий режим.

## Структура

```
backend/
  app/
    api/          # FastAPI роутеры: chat, simulator, progress, ispring, users
    ai/           # rag.py (BM25), llm.py (Claude + mock)
    db/           # SQLAlchemy модели и сессия
    schemas/      # Pydantic схемы
    simulator/    # Каталог сценариев (dummy data)
    core/         # settings
    main.py       # entry point + lifespan
  data/
    regulations/  # MD-файлы для RAG
frontend/
  src/
    pages/        # Dashboard, Chat, Simulator, Progress
    api.ts        # типизированный клиент
docs/SPEC.md      # исходное ТЗ
```

## Ключевые эндпоинты

* `GET /health` — статус сервиса и режимов
* `POST /api/chat` — задать вопрос AI-наставнику
* `GET /api/simulator/scenarios` — список сценариев
* `POST /api/simulator/sessions` — начать сценарий
* `POST /api/simulator/answer` — ответ в сценарии
* `GET /api/progress/{user_id}` — сводка прогресса
* `POST /api/ispring/sync` — выгрузка в iSpring

## Соответствие критериям приёмки

| Требование ТЗ | Реализация в MVP |
|---|---|
| Минимум 1 рабочий симулятор + AI-чатбот | `abs_customer_service` + RAG-чатбот |
| RAG из базы регламентов | BM25 поверх `data/regulations/*.md` |
| Геймификация (баллы) | Очки за каждый верный шаг, итоговый счёт |
| Progress tracking | Хранится в БД, агрегируется по модулям |
| Интеграция с iSpring | `POST /api/ispring/sync` (mock/live) |
| Адаптивность mobile/web | Адаптивная вёрстка (CSS media queries) |
| Время ответа ≤ 2 сек | RAG локально, mock ответ — мгновенно |
| Без реальных клиентских данных | Все данные сгенерированы, изолированная БД |

## Дальнейшее развитие

* Векторный поиск (pgvector / Qdrant) вместо BM25 для больших корпусов
* Telegram Mini App-обёртка
* SSO с корпоративным AD
* Дополнительные сценарии (кредитный конвейер, CRM, антифрод)
* Дашборд для HR с метриками по группе стажёров
