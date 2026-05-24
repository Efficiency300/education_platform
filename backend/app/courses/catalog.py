"""Каталог обучающих курсов.

Каждый курс — это последовательность уроков (markdown-контент)
и финальный квиз. По завершении курса разблокируется соответствующий
сценарий симулятора и начисляется XP.

Курсы спроектированы как подготовка к симулятору АБС/CRM:
теория → проверка знаний → практика в симуляторе.
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Каталог курсов
# ---------------------------------------------------------------------------

COURSES: dict[str, dict] = {
    "abs_basics": {
        "slug": "abs_basics",
        "title": "АБС · Основы обслуживания клиентов",
        "subtitle": "Подготовка к симулятору открытия счёта",
        "description": (
            "Базовый курс для новых сотрудников фронт-офиса. "
            "Разбираем идентификацию клиента, выбор продукта и оформление "
            "операции в корпоративный АБС по регламенту."
        ),
        "icon": "wallet",
        "difficulty": "easy",
        "estimated_minutes": 25,
        "target_scenario_id": "abs_customer_service",
        "tags": ["onboarding", "АБС", "розничный блок"],
        "lessons": [
            {
                "slug": "welcome",
                "title": "Приветствие и роль фронт-офиса",
                "summary": "Зачем нужен корректный onboarding клиента и как его построить.",
                "duration_min": 4,
                "body_md": (
                    "## Роль фронт-офиса\n\n"
                    "Вы — лицо банка. От корректной работы оператора зависит "
                    "и впечатление клиента, и соответствие операции регламенту.\n\n"
                    "### Что должен помнить оператор\n"
                    "- **Идентификация** клиента — обязательный первый шаг.\n"
                    "- **Цель обращения** определяет продукт, а не наоборот.\n"
                    "- **Документы** на руки клиенту — каждый раз.\n\n"
                    "> ⚠️ Любое отклонение от регламента фиксируется службой "
                    "внутреннего контроля и влияет на показатели подразделения."
                ),
            },
            {
                "slug": "kyc",
                "title": "KYC и AML: что обязательно",
                "summary": "Минимальный набор KYC-проверок при открытии счёта.",
                "duration_min": 7,
                "body_md": (
                    "## KYC при открытии счёта\n\n"
                    "Перед тем как открыть счёт, оператор обязан:\n\n"
                    "1. Проверить документ, удостоверяющий личность.\n"
                    "2. Заполнить полный KYC-профиль (адрес, источник дохода, цель).\n"
                    "3. Прогнать клиента по watch-list через АБС.\n"
                    "4. Приложить скан документа в карточку клиента.\n\n"
                    "### Чего делать нельзя\n"
                    "- Пропускать KYC «оформим позже».\n"
                    "- Принимать ФИО на слово, без документа.\n"
                    "- Открывать счёт, если есть совпадение по санкционному списку — "
                    "это компетенция Compliance."
                ),
            },
            {
                "slug": "product",
                "title": "Выбор продукта под цель клиента",
                "summary": "Как сопоставить продукт АБС с реальной потребностью.",
                "duration_min": 6,
                "body_md": (
                    "## Алгоритм выбора\n\n"
                    "Цель → продукт → тариф. Не наоборот.\n\n"
                    "| Цель клиента | Продукт |\n"
                    "|---|---|\n"
                    "| Получение зарплаты в UZS | Текущий счёт, тариф «Зарплатный» |\n"
                    "| Накопить в USD на год | Депозит USD 12М |\n"
                    "| Оперативные траты | Дебетовая карта Visa Classic |\n\n"
                    "Кредитные продукты предлагаются только по явному запросу клиента "
                    "и после скоринга."
                ),
            },
            {
                "slug": "closing",
                "title": "Завершение операции и выдача документов",
                "summary": "Что обязательно выдать клиенту на руки.",
                "duration_min": 4,
                "body_md": (
                    "## Чек-лист завершения\n\n"
                    "- [ ] Подписанный договор (1 экз. клиенту, 1 — в архив).\n"
                    "- [ ] Реквизиты счёта (печатная форма).\n"
                    "- [ ] Памятка по подключению интернет-банка.\n"
                    "- [ ] Контакт службы поддержки.\n\n"
                    "Без полного комплекта операция считается **незавершённой**."
                ),
            },
        ],
        "quiz": [
            {
                "id": "q1",
                "question": "Первое действие при подходе нового клиента к окну:",
                "options": [
                    {"id": "a", "text": "Открыть форму нового счёта в АБС", "correct": False},
                    {"id": "b", "text": "Поприветствовать и попросить документ", "correct": True},
                    {"id": "c", "text": "Спросить, какой продукт ему нужен", "correct": False},
                ],
                "explanation": "Идентификация клиента — обязательный первый шаг по AML.",
            },
            {
                "id": "q2",
                "question": "Можно ли открыть счёт, отложив заполнение KYC?",
                "options": [
                    {"id": "a", "text": "Да, если клиент торопится", "correct": False},
                    {"id": "b", "text": "Нет — KYC обязателен до открытия счёта", "correct": True},
                ],
                "explanation": "Регламент запрещает открывать счёт без полного KYC.",
            },
            {
                "id": "q3",
                "question": "Клиент хочет получать зарплату в UZS. Какой продукт?",
                "options": [
                    {"id": "a", "text": "Депозит USD 12М", "correct": False},
                    {"id": "b", "text": "Текущий счёт UZS, тариф «Зарплатный»", "correct": True},
                    {"id": "c", "text": "Кредитная карта", "correct": False},
                ],
                "explanation": "Продукт выбирается под цель клиента, а не наоборот.",
            },
            {
                "id": "q4",
                "question": "Что выдаём клиенту по итогу открытия счёта?",
                "options": [
                    {"id": "a", "text": "Только номер счёта устно", "correct": False},
                    {"id": "b", "text": "Договор, реквизиты, памятку по ДБО", "correct": True},
                ],
                "explanation": "Клиент должен получить полный комплект документов на руки.",
            },
        ],
    },
    "crm_service_standards": {
        "slug": "crm_service_standards",
        "title": "CRM · Стандарт обслуживания и обработка жалоб",
        "subtitle": "Подготовка к симулятору обработки жалобы",
        "description": (
            "Учимся работать с обращениями клиентов в CRM: эмпатия, "
            "категоризация, приоритизация по SLA и корректное закрытие."
        ),
        "icon": "headphones",
        "difficulty": "medium",
        "estimated_minutes": 30,
        "target_scenario_id": "crm_complaint_handling",
        "tags": ["CRM", "клиентский опыт", "SLA"],
        "lessons": [
            {
                "slug": "service_standard",
                "title": "Service Standard",
                "summary": "Тон, эмпатия и обязательные элементы коммуникации.",
                "duration_min": 6,
                "body_md": (
                    "## Принципы общения\n\n"
                    "- **Эмпатия в первом сообщении.** Признайте чувства клиента "
                    "до того, как переходить к решению.\n"
                    "- **Один конкретный вопрос за раз.** Не «закидываем» клиента анкетой.\n"
                    "- **Никакого переключения вины.** Даже если виноват провайдер — "
                    "ответственность перед клиентом несёт банк.\n\n"
                    "### Запрещённые формулировки\n"
                    "- «Это не наша проблема»\n"
                    "- «Ожидайте, я занят»\n"
                    "- «У нас всегда так»"
                ),
            },
            {
                "slug": "categorization",
                "title": "Категоризация обращений",
                "summary": "Дерево категорий CRM и как от него зависит SLA.",
                "duration_min": 8,
                "body_md": (
                    "## Дерево категорий\n\n"
                    "```\n"
                    "├── Финансовая претензия\n"
                    "│   ├── Списание без зачисления   ← SLA 4ч\n"
                    "│   ├── Двойное списание          ← SLA 4ч\n"
                    "│   └── Спорная комиссия          ← SLA 24ч\n"
                    "├── Технический вопрос\n"
                    "│   ├── Интернет-банк             ← SLA 8ч\n"
                    "│   └── Карта/банкомат            ← SLA 8ч\n"
                    "└── Жалоба на сотрудника          ← SLA 48ч\n"
                    "```\n\n"
                    "Неправильная категория → неверный SLA → нарушение KPI."
                ),
            },
            {
                "slug": "priority",
                "title": "Матрица приоритетов",
                "summary": "Как назначить приоритет по сумме и риску.",
                "duration_min": 6,
                "body_md": (
                    "## Приоритеты\n\n"
                    "| Приоритет | Условие |\n"
                    "|---|---|\n"
                    "| **Critical** | Спор > 10 млн UZS или VIP-клиент |\n"
                    "| **High** | Финансовый спор > 1 млн UZS |\n"
                    "| **Medium** | Финансовый спор < 1 млн UZS |\n"
                    "| **Low** | Консультация, информационный запрос |\n\n"
                    "Занижение приоритета — самое частое нарушение."
                ),
            },
            {
                "slug": "closing_ticket",
                "title": "Закрытие обращения",
                "summary": "Что обязательно сделать перед закрытием тикета.",
                "duration_min": 5,
                "body_md": (
                    "## Чек-лист закрытия\n\n"
                    "1. Сообщить клиенту срок решения.\n"
                    "2. Выдать **номер обращения** (формат `TB-YYYYMMDD-NNNN`).\n"
                    "3. Поставить себе **напоминание** на дату SLA.\n"
                    "4. Зафиксировать действия в timeline тикета.\n\n"
                    "> Закрытие тикета без номера обращения = претензия на повторный обзвон."
                ),
            },
        ],
        "quiz": [
            {
                "id": "q1",
                "question": "Клиент в чате на эмоциях. Первая фраза:",
                "options": [
                    {"id": "a", "text": "«Это не наша проблема»", "correct": False},
                    {"id": "b", "text": "«Понимаю беспокойство, давайте разберёмся. Уточните номер операции.»", "correct": True},
                ],
                "explanation": "Эмпатия + один конкретный вопрос — стандарт.",
            },
            {
                "id": "q2",
                "question": "«Списание без зачисления» — это:",
                "options": [
                    {"id": "a", "text": "Финансовая претензия", "correct": True},
                    {"id": "b", "text": "Технический вопрос", "correct": False},
                    {"id": "c", "text": "Жалоба на сотрудника", "correct": False},
                ],
                "explanation": "Это финансовая претензия с SLA 4 часа.",
            },
            {
                "id": "q3",
                "question": "Спор на 1.2 млн UZS — приоритет:",
                "options": [
                    {"id": "a", "text": "Low", "correct": False},
                    {"id": "b", "text": "Medium", "correct": False},
                    {"id": "c", "text": "High", "correct": True},
                ],
                "explanation": "По матрице — спор > 1 млн ⇒ High.",
            },
            {
                "id": "q4",
                "question": "Что обязательно сделать при закрытии тикета?",
                "options": [
                    {"id": "a", "text": "Просто закрыть чат", "correct": False},
                    {"id": "b", "text": "Выдать номер обращения и срок ответа", "correct": True},
                ],
                "explanation": "Без номера обращения клиент не сможет вернуться к диалогу.",
            },
        ],
    },
    "aml_compliance": {
        "slug": "aml_compliance",
        "title": "AML & Compliance · Подозрительные операции",
        "subtitle": "Подготовка к симулятору подозрительного перевода",
        "description": (
            "Курс для повышения AML-зрелости: пороги контроля, обязательные "
            "документы, watch-list и эскалация в Compliance."
        ),
        "icon": "shield",
        "difficulty": "hard",
        "estimated_minutes": 35,
        "target_scenario_id": "abs_money_transfer",
        "tags": ["AML", "Compliance", "санкции"],
        "lessons": [
            {
                "slug": "thresholds",
                "title": "Пороги обязательного контроля",
                "summary": "Когда операция требует расширенной проверки.",
                "duration_min": 6,
                "body_md": (
                    "## Пороги\n\n"
                    "- Разовая операция ≥ **100 млн UZS** (эквивалент) — расширенная проверка.\n"
                    "- Трансграничный перевод физлица ≥ **10 000 USD** — обязательный AML-чек.\n"
                    "- Серия операций «дроблением» — структурирование, всегда подозрительно.\n\n"
                    "> 150 000 USD = 1.8 млрд UZS — заведомо выше всех порогов."
                ),
            },
            {
                "slug": "documents",
                "title": "Документы для крупного перевода",
                "summary": "Полный пакет, без которого операция не проводится.",
                "duration_min": 8,
                "body_md": (
                    "## Обязательный пакет\n\n"
                    "1. Документ, удостоверяющий личность.\n"
                    "2. **Подтверждение источника средств** (договор, справка о доходах, "
                    "договор купли-продажи).\n"
                    "3. **Цель платежа** в свободной форме + подкрепляющий документ "
                    "(инвойс, договор оказания услуг, договор займа).\n"
                    "4. Сведения о получателе (полные реквизиты, отношения с плательщиком).\n\n"
                    "Только паспорт = не пройдёт AML."
                ),
            },
            {
                "slug": "watchlist",
                "title": "Работа с watch-list",
                "summary": "Что делать при срабатывании санкционного списка.",
                "duration_min": 7,
                "body_md": (
                    "## Алгоритм\n\n"
                    "1. **Приостановить** операцию в АБС.\n"
                    "2. Уведомить Compliance через тикет `AML-ESCALATION`.\n"
                    "3. Не сообщать клиенту причину задержки — это разглашение.\n"
                    "4. Решение о проведении/отказе принимает **только Compliance**.\n\n"
                    "### Чего делать НЕЛЬЗЯ\n"
                    "- Игнорировать совпадение.\n"
                    "- Дробить сумму на несколько переводов.\n"
                    "- Сообщать клиенту, что он в watch-list."
                ),
            },
            {
                "slug": "communication",
                "title": "Коммуникация отказа клиенту",
                "summary": "Как отказать корректно, не нарушая закон.",
                "duration_min": 5,
                "body_md": (
                    "## Скрипт отказа\n\n"
                    "> «К сожалению, операция не может быть проведена. "
                    "Подробности уточняйте у вашего менеджера / в офисе банка.»\n\n"
                    "**Запрещено** называть причину (AML, watch-list, sanctions). "
                    "Это раскрытие банковской тайны и нарушение FATF."
                ),
            },
        ],
        "quiz": [
            {
                "id": "q1",
                "question": "Перевод 150 000 USD — это:",
                "options": [
                    {"id": "a", "text": "Обычная сумма", "correct": False},
                    {"id": "b", "text": "Выше порога обязательного AML-контроля", "correct": True},
                ],
                "explanation": "Любая сумма > 100 млн UZS требует расширенной проверки.",
            },
            {
                "id": "q2",
                "question": "Достаточно ли паспорта для крупного трансграничного перевода?",
                "options": [
                    {"id": "a", "text": "Да", "correct": False},
                    {"id": "b", "text": "Нет — нужен источник средств, цель и подтверждающие документы", "correct": True},
                ],
                "explanation": "Только паспорт = неполный пакет = отказ AML.",
            },
            {
                "id": "q3",
                "question": "АБС выдала alert: получатель в watch-list. Действие:",
                "options": [
                    {"id": "a", "text": "Игнорировать", "correct": False},
                    {"id": "b", "text": "Раздробить на 3 перевода", "correct": False},
                    {"id": "c", "text": "Приостановить и эскалировать в Compliance", "correct": True},
                ],
                "explanation": "Решение по watch-list — компетенция Compliance.",
            },
            {
                "id": "q4",
                "question": "Можно ли сказать клиенту, что он в санкционном списке?",
                "options": [
                    {"id": "a", "text": "Да, чтобы он понимал отказ", "correct": False},
                    {"id": "b", "text": "Нет — это разглашение, отказ без раскрытия причин", "correct": True},
                ],
                "explanation": "Раскрытие AML-причин — нарушение FATF и банковской тайны.",
            },
        ],
    },
}


COURSES["python_backend_az"] = {
    "slug": "python_backend_az",
    "title": "Python Backend · от А до Я",
    "subtitle": "Полный курс по бэкенду на Python (FastAPI, SQL, Docker, тесты)",
    "description": (
        "Полный курс для будущих backend-разработчиков. Идём от синтаксиса Python "
        "и виртуальных окружений до FastAPI, SQLAlchemy, Docker, тестирования "
        "и подготовки сервиса к продакшену. После курса вы готовы вести "
        "реальные сервисы и проходить технические собеседования."
    ),
    "icon": "book",
    "difficulty": "medium",
    "estimated_minutes": 240,
    "target_scenario_id": "abs_customer_service",
    "tags": ["python", "backend", "fastapi", "sql", "docker", "onboarding"],
    # Empty directions = visible to everyone; the mascot routes users straight
    # to this course on demand regardless of their team.
    "directions": [],
    "lessons": [
        {
            "slug": "intro_environment",
            "title": "1. Введение и окружение разработчика",
            "summary": "Установка Python 3.11+, виртуальные окружения и pip.",
            "duration_min": 12,
            "body_md": (
                "## Что такое backend\n\n"
                "Backend — это серверная часть приложения: бизнес-логика, работа с БД, "
                "API для фронта и мобильных клиентов. На Python обычно пишут на "
                "**FastAPI**, **Django** или **Flask**.\n\n"
                "### Установка\n"
                "1. Установите Python ≥ 3.11 с [python.org](https://www.python.org).\n"
                "2. Проверьте: `python --version`.\n"
                "3. Установите редактор — VS Code или PyCharm.\n\n"
                "### Виртуальное окружение\n"
                "```bash\n"
                "python -m venv .venv\n"
                "source .venv/bin/activate   # Linux/Mac\n"
                ".venv\\Scripts\\activate    # Windows\n"
                "pip install --upgrade pip\n"
                "```\n\n"
                "> Венв изолирует зависимости проекта. Никогда не ставьте пакеты в "
                "системный Python — это путь к конфликтам версий."
            ),
        },
        {
            "slug": "python_basics",
            "title": "2. Основы Python: типы, функции, исключения",
            "summary": "Синтаксис, типы данных, функции, обработка исключений.",
            "duration_min": 18,
            "body_md": (
                "## Базовые типы\n\n"
                "```python\n"
                "name: str = \"Alice\"\n"
                "age: int = 30\n"
                "score: float = 4.7\n"
                "is_admin: bool = False\n"
                "tags: list[str] = [\"py\", \"backend\"]\n"
                "user: dict[str, int] = {\"id\": 1}\n"
                "```\n\n"
                "### Функции и типизация\n"
                "```python\n"
                "def add(a: int, b: int) -> int:\n"
                "    return a + b\n"
                "```\n\n"
                "### Исключения\n"
                "```python\n"
                "try:\n"
                "    value = int(payload)\n"
                "except ValueError as e:\n"
                "    log.warning(\"bad payload: %s\", e)\n"
                "    raise\n"
                "```\n\n"
                "### Списковые включения\n"
                "```python\n"
                "evens = [x for x in range(10) if x % 2 == 0]\n"
                "```\n\n"
                "Это основа — без неё не понять примеры дальше."
            ),
        },
        {
            "slug": "oop_modules",
            "title": "3. ООП, модули и структура проекта",
            "summary": "Классы, dataclass, импорты, package layout.",
            "duration_min": 15,
            "body_md": (
                "## Классы\n\n"
                "```python\n"
                "from dataclasses import dataclass\n\n"
                "@dataclass\n"
                "class User:\n"
                "    id: int\n"
                "    email: str\n"
                "    is_active: bool = True\n"
                "```\n\n"
                "### Структура проекта\n"
                "```\n"
                "myapp/\n"
                "├── app/\n"
                "│   ├── __init__.py\n"
                "│   ├── main.py        # точка входа\n"
                "│   ├── api/           # роуты\n"
                "│   ├── db/            # модели и сессия\n"
                "│   └── core/          # конфиг, утилиты\n"
                "├── tests/\n"
                "├── pyproject.toml\n"
                "└── requirements.txt\n"
                "```\n\n"
                "Разделяйте API, доменную логику и работу с БД в разные модули — "
                "тестировать и переиспользовать проще."
            ),
        },
        {
            "slug": "async_io",
            "title": "4. Асинхронность: async/await, asyncio",
            "summary": "Почему async — основа современного Python-бэкенда.",
            "duration_min": 20,
            "body_md": (
                "## async/await\n\n"
                "Современные веб-фреймворки (FastAPI, Starlette) асинхронные — "
                "один процесс держит тысячи соединений вместо одного потока на запрос.\n\n"
                "```python\n"
                "import asyncio\n\n"
                "async def fetch_user(uid: int) -> dict:\n"
                "    await asyncio.sleep(0.1)   # имитация I/O\n"
                "    return {\"id\": uid, \"name\": \"Alice\"}\n\n"
                "async def main():\n"
                "    users = await asyncio.gather(\n"
                "        fetch_user(1), fetch_user(2), fetch_user(3),\n"
                "    )\n"
                "    print(users)\n\n"
                "asyncio.run(main())\n"
                "```\n\n"
                "### Правило\n"
                "Внутри async-функции **никогда** не вызывайте блокирующий код "
                "(time.sleep, requests.get, тяжёлые расчёты). Используйте "
                "`await asyncio.sleep`, `httpx.AsyncClient`, `run_in_executor`."
            ),
        },
        {
            "slug": "fastapi_basics",
            "title": "5. FastAPI: первое HTTP-приложение",
            "summary": "Роуты, валидация Pydantic, автодокументация.",
            "duration_min": 22,
            "body_md": (
                "## Установка\n\n"
                "```bash\n"
                "pip install fastapi uvicorn[standard]\n"
                "```\n\n"
                "### Минимальное приложение\n"
                "```python\n"
                "from fastapi import FastAPI\n"
                "from pydantic import BaseModel\n\n"
                "app = FastAPI()\n\n"
                "class UserIn(BaseModel):\n"
                "    email: str\n"
                "    full_name: str\n\n"
                "@app.post(\"/users\")\n"
                "async def create_user(payload: UserIn):\n"
                "    return {\"ok\": True, \"email\": payload.email}\n"
                "```\n\n"
                "Запуск: `uvicorn app.main:app --reload`.\n"
                "Swagger UI: http://localhost:8000/docs.\n\n"
                "### Pydantic\n"
                "Любая модель Pydantic = валидация на входе + сериализация на выходе. "
                "Если клиент отправит `email: 42` — FastAPI вернёт `422` автоматически."
            ),
        },
        {
            "slug": "routing_deps",
            "title": "6. Роутинг и Dependency Injection",
            "summary": "APIRouter, depends, аутентификация по токену.",
            "duration_min": 18,
            "body_md": (
                "## Разделение на роутеры\n\n"
                "```python\n"
                "from fastapi import APIRouter, Depends, HTTPException\n\n"
                "router = APIRouter(prefix=\"/users\", tags=[\"users\"])\n\n"
                "async def get_current_user(token: str) -> dict:\n"
                "    if token != \"secret\":\n"
                "        raise HTTPException(401, \"unauthorized\")\n"
                "    return {\"id\": 1}\n\n"
                "@router.get(\"/me\")\n"
                "async def me(user = Depends(get_current_user)):\n"
                "    return user\n"
                "```\n\n"
                "`Depends` — главная идея FastAPI: любая зависимость "
                "(подключение к БД, текущий пользователь, лимит запросов) "
                "выражается через функцию + `Depends(...)`."
            ),
        },
        {
            "slug": "sql_sqlalchemy",
            "title": "7. Базы данных: SQL и SQLAlchemy 2.x",
            "summary": "ORM, sessionmaker, async-сессии, миграции.",
            "duration_min": 25,
            "body_md": (
                "## Установка\n\n"
                "```bash\n"
                "pip install sqlalchemy[asyncio] asyncpg alembic\n"
                "```\n\n"
                "### Модель\n"
                "```python\n"
                "from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column\n\n"
                "class Base(DeclarativeBase):\n"
                "    pass\n\n"
                "class User(Base):\n"
                "    __tablename__ = \"users\"\n"
                "    id: Mapped[int] = mapped_column(primary_key=True)\n"
                "    email: Mapped[str] = mapped_column(unique=True, index=True)\n"
                "```\n\n"
                "### Сессия + асинхронные запросы\n"
                "```python\n"
                "from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine\n"
                "from sqlalchemy import select\n\n"
                "engine = create_async_engine(\"postgresql+asyncpg://user:pw@localhost/db\")\n"
                "Session = async_sessionmaker(engine, expire_on_commit=False)\n\n"
                "async def find_user(email: str) -> User | None:\n"
                "    async with Session() as s:\n"
                "        return await s.scalar(select(User).where(User.email == email))\n"
                "```\n\n"
                "### Миграции\n"
                "`alembic init alembic` → `alembic revision --autogenerate` → `alembic upgrade head`."
            ),
        },
        {
            "slug": "auth_security",
            "title": "8. Авторизация: JWT, OAuth2, хеш пароля",
            "summary": "Безопасное хранение паролей и токены.",
            "duration_min": 20,
            "body_md": (
                "## Пароли — bcrypt/argon2\n\n"
                "```bash\n"
                "pip install passlib[bcrypt] python-jose[cryptography]\n"
                "```\n\n"
                "```python\n"
                "from passlib.context import CryptContext\n\n"
                "pwd = CryptContext(schemes=[\"bcrypt\"], deprecated=\"auto\")\n"
                "hashed = pwd.hash(\"secret123\")\n"
                "assert pwd.verify(\"secret123\", hashed)\n"
                "```\n\n"
                "### JWT-токен\n"
                "```python\n"
                "from jose import jwt\n"
                "from datetime import datetime, timedelta\n\n"
                "SECRET = \"change-me\"  # храните в env\n\n"
                "def issue(user_id: int) -> str:\n"
                "    return jwt.encode(\n"
                "        {\"sub\": str(user_id), \"exp\": datetime.utcnow() + timedelta(hours=24)},\n"
                "        SECRET, algorithm=\"HS256\",\n"
                "    )\n"
                "```\n\n"
                "**Никогда** не храните пароли в открытом виде, не коммитьте секреты в Git, "
                "и используйте HTTPS на проде."
            ),
        },
        {
            "slug": "errors_logging",
            "title": "9. Логирование, ошибки и middleware",
            "summary": "structlog/logging, обработчики исключений, request id.",
            "duration_min": 14,
            "body_md": (
                "## Логирование\n\n"
                "```python\n"
                "import logging\n"
                "logging.basicConfig(level=logging.INFO, format=\"%(levelname)s %(name)s %(message)s\")\n"
                "log = logging.getLogger(\"app\")\n"
                "log.info(\"user %s registered\", user.id)\n"
                "```\n\n"
                "### Глобальный обработчик ошибок\n"
                "```python\n"
                "from fastapi import Request\n"
                "from fastapi.responses import JSONResponse\n\n"
                "@app.exception_handler(ValueError)\n"
                "async def handle_value_error(_: Request, exc: ValueError):\n"
                "    return JSONResponse(status_code=400, content={\"detail\": str(exc)})\n"
                "```\n\n"
                "### Middleware: request id\n"
                "Добавляйте уникальный `X-Request-ID` каждому запросу — без него "
                "невозможно искать инциденты в логах."
            ),
        },
        {
            "slug": "testing",
            "title": "10. Тестирование: pytest + httpx + фикстуры",
            "summary": "Юнит-тесты, интеграционные тесты, тестовые БД.",
            "duration_min": 22,
            "body_md": (
                "## pytest\n\n"
                "```bash\n"
                "pip install pytest pytest-asyncio httpx\n"
                "```\n\n"
                "```python\n"
                "# tests/test_users.py\n"
                "import pytest\n"
                "from httpx import AsyncClient, ASGITransport\n"
                "from app.main import app\n\n"
                "@pytest.mark.asyncio\n"
                "async def test_create_user():\n"
                "    async with AsyncClient(transport=ASGITransport(app=app), base_url=\"http://t\") as c:\n"
                "        r = await c.post(\"/users\", json={\"email\": \"a@b.c\", \"full_name\": \"A\"})\n"
                "        assert r.status_code == 200\n"
                "        assert r.json()[\"email\"] == \"a@b.c\"\n"
                "```\n\n"
                "Запуск: `pytest -q`. Покрытие: `pytest --cov=app`.\n\n"
                "Тесты — не дополнительная работа, а способ менять код, "
                "не ломая прод."
            ),
        },
        {
            "slug": "docker_deploy",
            "title": "11. Docker и деплой",
            "summary": "Dockerfile, docker-compose, переменные окружения.",
            "duration_min": 18,
            "body_md": (
                "## Dockerfile\n\n"
                "```dockerfile\n"
                "FROM python:3.12-slim\n"
                "WORKDIR /app\n"
                "COPY requirements.txt .\n"
                "RUN pip install --no-cache-dir -r requirements.txt\n"
                "COPY . .\n"
                "EXPOSE 8000\n"
                "CMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n"
                "```\n\n"
                "### docker-compose\n"
                "```yaml\n"
                "services:\n"
                "  api:\n"
                "    build: .\n"
                "    ports: [\"8000:8000\"]\n"
                "    environment:\n"
                "      DB_URL: postgresql+asyncpg://app:pw@db/app\n"
                "    depends_on: [db]\n"
                "  db:\n"
                "    image: postgres:16\n"
                "    environment:\n"
                "      POSTGRES_USER: app\n"
                "      POSTGRES_PASSWORD: pw\n"
                "      POSTGRES_DB: app\n"
                "```\n\n"
                "Прод: запускайте за reverse-proxy (nginx/traefik) с HTTPS."
            ),
        },
        {
            "slug": "production_ready",
            "title": "12. Готовность к продакшену",
            "summary": "Healthcheck, метрики, миграции, секреты, мониторинг.",
            "duration_min": 16,
            "body_md": (
                "## Чек-лист прода\n\n"
                "- [ ] Endpoint `/health` для liveness и `/ready` для readiness.\n"
                "- [ ] Секреты — только через env / vault, **никогда** в Git.\n"
                "- [ ] Миграции запускаются автоматически перед стартом API.\n"
                "- [ ] Структурированные логи (JSON) + request id.\n"
                "- [ ] Метрики через Prometheus (`prometheus_fastapi_instrumentator`).\n"
                "- [ ] Алёрты на 5xx и медленные запросы.\n"
                "- [ ] Бэкапы БД и план восстановления.\n"
                "- [ ] CI/CD: тесты, линтер (ruff), форматтер (black), сборка образа.\n\n"
                "Поздравляем — вы прошли путь от Hello World до продакшен-сервиса!"
            ),
        },
    ],
    "quiz": [
        {
            "id": "q1",
            "question": "Что такое виртуальное окружение Python?",
            "options": [
                {"id": "a", "text": "Облачный сервис от Python.org", "correct": False},
                {"id": "b", "text": "Изолированная папка с pip и зависимостями проекта", "correct": True},
                {"id": "c", "text": "Docker-контейнер", "correct": False},
            ],
            "explanation": "venv изолирует зависимости одного проекта от системного Python.",
        },
        {
            "id": "q2",
            "question": "Какой фреймворк поддерживает async/await и автогенерирует Swagger?",
            "options": [
                {"id": "a", "text": "Flask", "correct": False},
                {"id": "b", "text": "FastAPI", "correct": True},
                {"id": "c", "text": "Tornado", "correct": False},
            ],
            "explanation": "FastAPI — async-фреймворк с автодокументацией через OpenAPI.",
        },
        {
            "id": "q3",
            "question": "В async-функции вы случайно вызвали time.sleep(2). Что произойдёт?",
            "options": [
                {"id": "a", "text": "Ничего страшного — корутина просто подождёт", "correct": False},
                {"id": "b", "text": "Заблокируется весь event loop, другие запросы встанут на 2 секунды", "correct": True},
                {"id": "c", "text": "Python автоматически переведёт вызов в asyncio.sleep", "correct": False},
            ],
            "explanation": "Внутри async кода блокирующий sleep останавливает весь loop. Используйте await asyncio.sleep.",
        },
        {
            "id": "q4",
            "question": "Где хранить SECRET для JWT?",
            "options": [
                {"id": "a", "text": "В коде с пометкой # TODO заменить", "correct": False},
                {"id": "b", "text": "В переменных окружения / секрет-хранилище", "correct": True},
                {"id": "c", "text": "В Git под .gitignore", "correct": False},
            ],
            "explanation": "Секреты — только через env/vault. Никогда в коде или Git.",
        },
        {
            "id": "q5",
            "question": "Зачем нужен Alembic в проекте на SQLAlchemy?",
            "options": [
                {"id": "a", "text": "Это ORM-альтернатива", "correct": False},
                {"id": "b", "text": "Для версионирования схемы БД через миграции", "correct": True},
                {"id": "c", "text": "Для подключения к Redis", "correct": False},
            ],
            "explanation": "Alembic управляет миграциями: каждая правка модели даёт ревизию.",
        },
        {
            "id": "q6",
            "question": "Что должен возвращать /health в продакшене?",
            "options": [
                {"id": "a", "text": "Полную JSON-выгрузку всех таблиц БД", "correct": False},
                {"id": "b", "text": "Лёгкий ответ 200 OK для проверки, что сервис жив", "correct": True},
                {"id": "c", "text": "Логи за последние сутки", "correct": False},
            ],
            "explanation": "/health — это liveness-проба для оркестратора, она должна быть быстрой и без побочных эффектов.",
        },
    ],
}


def list_courses() -> list[dict]:
    # Built-in courses default to the Call Center department, but a course can
    # set ``directions`` explicitly (including an empty list) to opt out — an
    # empty list means "visible to everyone" per ``_course_visible_to``.
    DEFAULT_BUILTIN_DIRECTIONS = ["Call Center"]

    def _resolve_directions(c: dict) -> list[str]:
        if "directions" in c:
            return list(c["directions"])
        return list(DEFAULT_BUILTIN_DIRECTIONS)

    return [
        {
            "slug": c["slug"],
            "title": c["title"],
            "subtitle": c["subtitle"],
            "description": c["description"],
            "icon": c["icon"],
            "difficulty": c["difficulty"],
            "estimated_minutes": c["estimated_minutes"],
            "target_scenario_id": c["target_scenario_id"],
            "tags": c["tags"],
            "directions": _resolve_directions(c),
            "lessons_count": len(c["lessons"]),
            "quiz_count": len(c["quiz"]),
        }
        for c in COURSES.values()
    ]


def get_course(slug: str) -> dict | None:
    return COURSES.get(slug)


def get_lesson(course: dict, lesson_slug: str) -> dict | None:
    for l in course["lessons"]:
        if l["slug"] == lesson_slug:
            return l
    return None


def course_xp_reward(course: dict) -> int:
    """XP начисляются за курс: 10 XP за урок + 20 XP за квиз."""
    return len(course["lessons"]) * 10 + 20
