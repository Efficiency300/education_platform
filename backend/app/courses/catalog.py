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


# ---------------------------------------------------------------------------
# Кредитный специалист · Курс 1: Кредитование (заявки, решения, договоры)
# ---------------------------------------------------------------------------

COURSES["credit_loans_basics"] = {
    "slug": "credit_loans_basics",
    "title": "Кредитование · заявки, решения и договоры",
    "subtitle": "Кредитный специалист · полный путь от консультации до выдачи",
    "description": (
        "Полное понимание процесса кредитования от первого обращения клиента "
        "до подписания договора и выдачи средств. Принципы кредита, виды "
        "продуктов, корректное заполнение заявки, работа с одобрением/отказом, "
        "оформление договора и контроль первого платежа."
    ),
    "icon": "wallet",
    "difficulty": "medium",
    "estimated_minutes": 300,
    "target_scenario_id": "",
    "tags": ["кредит", "кредитный специалист", "заявки", "договоры", "onboarding"],
    "directions": ["Кредитный специалист"],
    "lessons": [
        {
            "slug": "loan_product_logic",
            "title": "1. Кредитный продукт: логика, виды, условия",
            "summary": "Принципы кредита, ключевые продукты банка и подбор под потребность клиента.",
            "duration_min": 50,
            "body_md": (
                "## Что такое кредит\n\n"
                "Кредит = передача денег на условиях **возвратности, срочности и платности**. "
                "Каждое из этих слов — конкретное правило: деньги нужно вернуть, в установленные "
                "сроки, с процентами.\n\n"
                "### Почему ставки разные\n"
                "Ставка отражает риск банка. Ипотека дешевле потребительского кредита, "
                "потому что обеспечена залогом — недвижимость можно реализовать в случае "
                "невозврата. Беззалоговый кредит несёт больше риска → ставка выше.\n\n"
                "### Категории продуктов\n"
                "- **Потребительский кредит** — любые цели, без залога (или с залогом при крупной сумме), "
                "срок 6 мес. – 5 лет.\n"
                "- **Ипотека** — на жильё, обязательный залог недвижимости, срок до 20–25 лет, "
                "низкая ставка, строгие требования к документам и оценке.\n"
                "- **Автокредит** — на автомобиль, залог — транспортное средство.\n"
                "- **МСБ-кредиты** — для ИП и юрлиц, требуется финансовая отчётность и бизнес-план.\n"
                "- **Кредитные карты и овердрафт** — возобновляемый лимит, ставки выше, но удобство.\n\n"
                "### Подбор продукта под клиента\n"
                "Не предлагай первый попавшийся продукт. Уточни:\n"
                "1. Цель (на что нужны деньги).\n"
                "2. Сумму и срок.\n"
                "3. Стабильность дохода.\n"
                "4. Наличие залога или поручителя.\n\n"
                "Клиент хочет «200 млн на 15 лет на ремонт» — это уже ближе к ипотеке "
                "под залог квартиры, а не к потребительскому. Неправильный продукт "
                "= отказ или ненужные задержки.\n\n"
                "### Главные правила консультации\n"
                "- Всегда показывай конкретный платёж через калькулятор — абстрактные "
                "проценты клиент не воспринимает.\n"
                "- Никогда не обещай одобрение до скоринга.\n"
                "- При паузе клиента — обязательно зафиксируй интерес в CRM с задачей на follow-up."
            ),
        },
        {
            "slug": "loan_application",
            "title": "2. Создание и заполнение кредитной заявки",
            "summary": "Все блоки заявки в системе, требования к данным и документам.",
            "duration_min": 55,
            "body_md": (
                "## Заявка — официальный документ\n\n"
                "Ошибка в заявке — это не опечатка, а потенциальный отказ или нарушение "
                "регуляторных требований. Заявка состоит из 6 ключевых блоков:\n\n"
                "### 1. Идентификация заёмщика\n"
                "ФИО полностью, дата рождения, ИНН, ПИНФЛ, серия/номер паспорта. "
                "**Расхождение хотя бы в одном символе** → ошибка автоматической проверки "
                "в госбазах. Сверяй с оригиналом документа.\n\n"
                "### 2. Занятость и доход\n"
                "Место работы, должность, стаж, тип занятости (наёмный/ИП/пенсионер), "
                "официальный доход. Наёмный → справка с работы или выписка по зарплатной карте. "
                "ИП → налоговая декларация или выписка по расчётному счёту.\n\n"
                "### 3. Параметры кредита\n"
                "Сумма, срок, цель (выбирай из списка — для отдельных целей есть "
                "льготные госпрограммы!), желаемая дата получения.\n\n"
                "### 4. Действующие обязательства\n"
                "Все кредиты клиента — в твоём банке и в других. Скрывать бессмысленно: "
                "система запросит БКИ. Если клиент сказал «нет кредитов» — ставь отметку "
                "«обязательства отсутствуют» + пометку «со слов заёмщика».\n\n"
                "### 5. Залог и поручительство\n"
                "Для залоговых кредитов: тип объекта, идентификаторы, оценочная стоимость. "
                "Для поручителей — отдельная проверка их финансовых данных.\n\n"
                "### 6. Документы\n"
                "Сканы/фото паспорта, справок, документов на залог. Требования к качеству "
                "строгие: всё читаемо, без обрезов, засветов и размытия.\n\n"
                "### Перед отправкой\n"
                "Жми **«Проверить заявку»** — система укажет на незаполненные обязательные "
                "поля. Только после исправления — «Отправить на рассмотрение». "
                "Зафиксируй номер заявки в CRM."
            ),
        },
        {
            "slug": "loan_decision",
            "title": "3. Этапы рассмотрения и виды кредитных решений",
            "summary": "Скоринг, СБ, комплаенс, кредитный комитет. Работа с одобрением, отказом, условным одобрением.",
            "duration_min": 50,
            "body_md": (
                "## Что происходит после отправки заявки\n\n"
                "Заявка проходит 5 этапов проверки:\n\n"
                "1. **Автоматический скоринг** — кредитная история (БКИ), DTI, "
                "возраст, стаж, просрочки. На основе балла → авто-одобрение для простых "
                "продуктов или переход дальше.\n"
                "2. **Служба безопасности** — подлинность документов, стоп-листы, "
                "санкционные списки, проверка работодателя. От нескольких часов до суток.\n"
                "3. **Комплаенс / AML** — проверка по законодательству о противодействии "
                "отмыванию денег.\n"
                "4. **Кредитный анализ** (крупные суммы, бизнес-кредиты) — ручной разбор "
                "финансового состояния заёмщика, формирование кредитного заключения.\n"
                "5. **Кредитный комитет** (для больших сумм) — коллегиальное решение.\n\n"
                "### 4 типа решения\n\n"
                "| Решение | Что делать |\n"
                "|---|---|\n"
                "| **Полное одобрение** | В течение часа позвони клиенту, назови условия, пригласи подписать договор |\n"
                "| **Условное одобрение** | Изучи изменения (сумма меньше / срок другой / нужен залог) → позвони, объясни, уточни согласие |\n"
                "| **Отказ** | Тактично сообщи без раскрытия конфиденциальных деталей. Предложи альтернативу: меньшую сумму, поручителя, другой продукт. Поставь задачу вернуться через 3–6 месяцев |\n"
                "| **Запрос документов** | Немедленно свяжись, объясни что нужно и срок. Контролируй дедлайн — иначе аннулирование |\n\n"
                "### Главные правила\n"
                "- Проверяй статус заявок минимум 2 раза в день.\n"
                "- При условном одобрении **обязательно** объясни разницу с запрошенными "
                "условиями. «Вам одобрили кредит» без уточнения, что сумма вдвое меньше "
                "= дезинформация.\n"
                "- Все разговоры с клиентом о решении — в CRM."
            ),
        },
        {
            "slug": "loan_contract",
            "title": "4. Оформление договора и выдача кредита",
            "summary": "Что обязательно объяснить клиенту, проверка договора, операция выдачи.",
            "duration_min": 45,
            "body_md": (
                "## Подписание договора\n\n"
                "Кредитный договор — юридически обязывающий документ. Центральный банк "
                "**требует**, чтобы клиент был ознакомлен с условиями до подписания. "
                "Нарушение → жалобы и регуляторные санкции.\n\n"
                "### 5 ключевых условий, которые ОБЯЗАТЕЛЬНО объяснить клиенту\n\n"
                "1. **Полная стоимость кредита** — ставка + все комиссии + страховки + "
                "итоговая переплата.\n"
                "2. **График платежей** — даты и суммы каждого платежа. Покажи первые и "
                "последние платежи — они часто отличаются от основных.\n"
                "3. **Условия досрочного погашения** — есть ли штраф, как подать "
                "заявление, минимальный срок до досрочного.\n"
                "4. **Последствия просрочки** — размер пени, с какого дня начисляется, "
                "что происходит при длительной просрочке.\n"
                "5. **Условия изменения ставки** (если плавающая) — при каких условиях "
                "может меняться.\n\n"
                "### Чек-лист оформления\n\n"
                "1. Проверь автосформированный договор: ФИО, сумма, ставка, срок, дата "
                "первого платежа, размер платежа, корректность графика. **Не печатай "
                "не проверив.**\n"
                "2. Печатай в двух экземплярах + сопутствующие документы (график, "
                "уведомление о полной стоимости, согласие на персональные данные).\n"
                "3. Проведи клиента по 5 ключевым условиям. Не торопи. Предложи задать "
                "вопросы.\n"
                "4. После подписания — зарегистрируй договор в системе, прикрепи скан.\n"
                "5. Проведи операцию выдачи: раздел «Выдача кредита» → счёт зачисления "
                "или касса → подтвердить. Проверь, что статус сменился на «Активен».\n"
                "6. Выдай клиенту его экземпляр и график.\n"
                "7. **Поставь задачу на контроль первого платежа** — звонок-напоминание "
                "за 3–5 дней до даты. Первый платёж — критическая зона риска просрочки."
            ),
        },
    ],
    "quiz": [
        {
            "id": "q1",
            "question": "Клиент просит кредит 400 млн сум на 20 лет на покупку квартиры. Какой продукт нужно предложить?",
            "options": [
                {"id": "a", "text": "Потребительский кредит", "correct": False},
                {"id": "b", "text": "Автокредит", "correct": False},
                {"id": "c", "text": "Ипотеку", "correct": True},
                {"id": "d", "text": "Кредитную карту", "correct": False},
            ],
            "explanation": "Крупная сумма, длительный срок, недвижимость — классическая ипотека с залогом приобретаемого объекта.",
        },
        {
            "id": "q2",
            "question": "Что означает «срочность» как принцип кредитования?",
            "options": [
                {"id": "a", "text": "Кредит выдаётся срочно, в день обращения", "correct": False},
                {"id": "b", "text": "Кредит должен быть возвращён в установленные сроки", "correct": True},
                {"id": "c", "text": "Срок рассмотрения заявки ограничен", "correct": False},
                {"id": "d", "text": "Кредит выдаётся только на короткий срок", "correct": False},
            ],
            "explanation": "Срочность — обязательность возврата в установленные договором сроки.",
        },
        {
            "id": "q3",
            "question": "Почему нельзя обещать клиенту одобрение до завершения скоринга?",
            "options": [
                {"id": "a", "text": "Потому что это нарушает регламент банка", "correct": False},
                {"id": "b", "text": "Менеджер не уполномочен принимать кредитное решение и не имеет полных данных", "correct": True},
                {"id": "c", "text": "Клиент может передумать", "correct": False},
                {"id": "d", "text": "Скоринг занимает много времени", "correct": False},
            ],
            "explanation": "Решение принимает система или кредитный комитет, а не менеджер.",
        },
        {
            "id": "q4",
            "question": "Клиент утверждает, что у него нет кредитов. Как заполнить блок «Действующие обязательства»?",
            "options": [
                {"id": "a", "text": "Оставить блок пустым", "correct": False},
                {"id": "b", "text": "Написать «нет данных»", "correct": False},
                {"id": "c", "text": "Поставить отметку «обязательства отсутствуют» с пометкой «со слов заёмщика»", "correct": True},
                {"id": "d", "text": "Не заполнять — система сама запросит в бюро", "correct": False},
            ],
            "explanation": "Пустой блок — ошибка оформления. Отметка «со слов заёмщика» защищает при расхождении с БКИ.",
        },
        {
            "id": "q5",
            "question": "Система запросила дополнительные документы. Сколько у клиента времени?",
            "options": [
                {"id": "a", "text": "Неограниченно — заявка будет ждать", "correct": False},
                {"id": "b", "text": "Уточнить регламентный срок в банке — просрочка может привести к аннулированию", "correct": True},
                {"id": "c", "text": "30 рабочих дней по закону", "correct": False},
                {"id": "d", "text": "3 дня — стандарт для всех банков", "correct": False},
            ],
            "explanation": "Срок устанавливается внутренним регламентом банка. Контроль — задача менеджера.",
        },
        {
            "id": "q6",
            "question": "Что такое «условное одобрение»?",
            "options": [
                {"id": "a", "text": "Банк отказал, но готов рассмотреть повторно", "correct": False},
                {"id": "b", "text": "Банк одобрил кредит на изменённых условиях", "correct": True},
                {"id": "c", "text": "Кредит одобрен, но выдача откладывается", "correct": False},
                {"id": "d", "text": "Заявка на рассмотрении", "correct": False},
            ],
            "explanation": "Условное одобрение = готовность выдать кредит, но с другими параметрами (сумма/срок/залог/поручитель).",
        },
        {
            "id": "q7",
            "question": "Какой документ обязательно выдать клиенту помимо договора?",
            "options": [
                {"id": "a", "text": "Справку о кредитной истории", "correct": False},
                {"id": "b", "text": "График платежей и уведомление о полной стоимости кредита", "correct": True},
                {"id": "c", "text": "Копию внутренней кредитной политики", "correct": False},
                {"id": "d", "text": "Выписку по счёту за 6 месяцев", "correct": False},
            ],
            "explanation": "График платежей и уведомление о полной стоимости — обязательные документы.",
        },
        {
            "id": "q8",
            "question": "Какую задачу нужно поставить в CRM сразу после выдачи кредита?",
            "options": [
                {"id": "a", "text": "Кросс-продажу следующего продукта", "correct": False},
                {"id": "b", "text": "Контроль первого платежа за 3–5 дней до даты", "correct": True},
                {"id": "c", "text": "Закрытие сделки через год", "correct": False},
                {"id": "d", "text": "Никакую — работа завершена", "correct": False},
            ],
            "explanation": "Первый платёж — зона высокого риска просрочки. Звонок-напоминание снижает риск.",
        },
        {
            "id": "q9",
            "question": "Клиент отказался от условного одобрения (40 млн вместо 80 млн). Что делать?",
            "options": [
                {"id": "a", "text": "Закрыть заявку и карточку клиента", "correct": False},
                {"id": "b", "text": "Объяснить, что другого варианта нет", "correct": False},
                {"id": "c", "text": "Предложить альтернативы (залог, поручитель, повторное рассмотрение) и поставить follow-up", "correct": True},
                {"id": "d", "text": "Повторно отправить заявку на ту же сумму", "correct": False},
            ],
            "explanation": "Отказ от условного одобрения — не конец. Сохраняй клиента для будущего сотрудничества.",
        },
        {
            "id": "q10",
            "question": "Почему данные в заявке должны точно совпадать с документами клиента?",
            "options": [
                {"id": "a", "text": "Для удобства хранения документов", "correct": False},
                {"id": "b", "text": "Система проверяет данные в госбазах — расхождение вызывает ошибку верификации", "correct": True},
                {"id": "c", "text": "Клиент может пожаловаться", "correct": False},
                {"id": "d", "text": "Это требование только для ипотеки", "correct": False},
            ],
            "explanation": "Автоверификация сверяет ИНН/ПИНФЛ/паспорт с государственными базами.",
        },
    ],
}


# ---------------------------------------------------------------------------
# Кредитный специалист · Курс 2: Скоринг и портфель
# ---------------------------------------------------------------------------

COURSES["credit_scoring_portfolio"] = {
    "slug": "credit_scoring_portfolio",
    "title": "Скоринг, проверка заёмщика и отчётность по портфелю",
    "subtitle": "Кредитный специалист · оценка риска и работа с просрочкой",
    "description": (
        "Глубокое понимание скоринга, работы с бюро кредитных историй, "
        "анализа платёжеспособности (DTI, располагаемый доход, стресс-тест), "
        "работы с просроченной задолженностью и отчётности по кредитному портфелю."
    ),
    "icon": "shield",
    "difficulty": "medium",
    "estimated_minutes": 300,
    "target_scenario_id": "",
    "tags": ["скоринг", "DTI", "БКИ", "просрочка", "портфель"],
    "directions": ["Кредитный специалист"],
    "lessons": [
        {
            "slug": "scoring_basics",
            "title": "1. Скоринг: как банк оценивает заёмщика",
            "summary": "Логика скоринга, факторы балла, предварительная оценка до отправки заявки.",
            "duration_min": 50,
            "body_md": (
                "## Что такое скоринг\n\n"
                "Скоринг = математическая модель оценки кредитного риска. Система "
                "сравнивает клиента с тысячами заёмщиков с похожими характеристиками "
                "и присваивает балл — статистическую вероятность того, что клиент вернёт "
                "кредит без просрочек. Это **не** личное суждение о человеке.\n\n"
                "### Факторы скорингового балла\n\n"
                "1. **Кредитная история** (самый весомый фактор) — наличие/тяжесть "
                "просрочек, передача коллекторам, действующие просрочки.\n"
                "2. **Долговая нагрузка (DTI)** — все ежемесячные кредитные платежи / "
                "ежемесячный доход. Стандартный порог — 40–50%.\n"
                "3. **Социально-демографические факторы** — возраст, семейное положение, "
                "образование, стаж.\n"
                "4. **Поведенческие факторы** — использование банковских продуктов, "
                "история погашений.\n"
                "5. **Тип занятости и доход** — стабильность важнее размера.\n\n"
                "### Предварительная оценка ДО отправки заявки\n\n"
                "1. Спроси про историю кредитов (были ли, есть ли действующие).\n"
                "2. Уточни ежемесячный доход (подтверждённый).\n"
                "3. Рассчитай текущий DTI: сумма всех кредитных платежей / доход × 100%.\n"
                "4. Добавь предполагаемый платёж по новому кредиту → проверь порог.\n"
                "5. Используй кредитный калькулятор для расчёта платежа.\n"
                "6. Если DTI превышает порог — сразу обсуди уменьшение суммы, "
                "увеличение срока, привлечение созаёмщика.\n"
                "7. Уточни стаж на текущем месте: < 3 мес. — негативный сигнал.\n"
                "8. Спроси про залог/поручителя — компенсируют низкий балл.\n"
                "9. Дай честный прогноз: высокая / средняя вероятность или есть риски.\n"
                "10. Зафиксируй в CRM."
            ),
        },
        {
            "slug": "credit_bureau",
            "title": "2. Работа с бюро кредитных историй (БКИ)",
            "summary": "Разделы кредитного отчёта, чтение истории платежей, анализ рисков.",
            "duration_min": 55,
            "body_md": (
                "## БКИ — кредитный регистр\n\n"
                "В Узбекистане функцию БКИ выполняет Государственный кредитный реестр "
                "при Центральном банке. Каждый банк обязан передавать данные туда и "
                "имеет право запрашивать при рассмотрении заявок.\n\n"
                "### Структура кредитного отчёта\n\n"
                "1. **Идентификационные данные** — ФИО, дата рождения, ИНН.\n"
                "2. **Сводная информация** — количество кредитов (активных и закрытых), "
                "общая сумма обязательств, наличие просрочек, скоринговый балл БКИ.\n"
                "3. **Детальная информация по каждому кредиту** — банк, тип, дата открытия, "
                "сумма, остаток, ежемесячный платёж, статус, история платежей по месяцам.\n\n"
                "### История платежей по месяцам — самое важное\n\n"
                "| Код | Цвет | Значение |\n"
                "|---|---|---|\n"
                "| 0 | зелёный | вовремя |\n"
                "| 1 | жёлтый | просрочка до 30 дней |\n"
                "| 2 | оранжевый | 30–60 дней |\n"
                "| 3 | красный | 60–90 дней |\n"
                "| 4+ | тёмно-красный | >90 дней или коллекторы |\n\n"
                "### Алгоритм запроса и анализа\n\n"
                "1. Письменное согласие клиента на запрос — **обязательно** (закон о персональных данных).\n"
                "2. В разделе «Кредитное бюро» → ввод ИНН/ПИНФЛ → «Запросить отчёт».\n"
                "3. Сверь ФИО и дату рождения с клиентом.\n"
                "4. Изучи сводку: балл, активные кредиты, просрочки.\n"
                "5. По каждому активному кредиту: банк, остаток, платёж, статус.\n"
                "6. Сложи все ежемесячные платежи — это **фактическая** долговая нагрузка "
                "(сравни с тем, что сказал клиент).\n"
                "7. Изучи историю платежей: просрочки в последние 12 месяцев — особо важно.\n"
                "8. Если клиент не упомянул кредит из отчёта — уточни без обвинений.\n"
                "9. Прикрепи отчёт к заявке + краткий вывод в комментарии.\n\n"
                "**Важно:** данные БКИ обновляются с задержкой 1–5 рабочих дней. "
                "Если клиент закрыл кредит вчера — попроси справку о закрытии."
            ),
        },
        {
            "slug": "payment_capacity",
            "title": "3. Анализ платёжеспособности (DTI + стресс-тест)",
            "summary": "Расчёт DTI, располагаемого дохода, стресс-тест на снижение дохода.",
            "duration_min": 50,
            "body_md": (
                "## Платёжеспособность — больше чем DTI\n\n"
                "Недостаточно посмотреть на зарплату и скоринговый балл. Нужна "
                "комплексная оценка.\n\n"
                "### 5 шагов анализа\n\n"
                "**1. Верификация дохода.** Официальный доход = подтверждённый документально. "
                "Оклад стабилен; доход ИП — анализируй динамику за 12 месяцев, бери "
                "минимум или среднее.\n\n"
                "**2. Анализ расходной части.** Иждивенцы (дети, неработающий супруг), "
                "действующие кредиты, аренда жилья, регулярные обязательные платежи.\n\n"
                "**3. Расчёт располагаемого дохода:**\n"
                "```\n"
                "Располагаемый доход = Доход − Кредитные платежи − Иждивенцы − Аренда\n"
                "```\n"
                "Платёж по новому кредиту ≤ 50% располагаемого дохода (жёстче DTI).\n\n"
                "**4. Стресс-тест.** Что если доход снизится на 20–25%? Сможет ли клиент "
                "платить? Если да — кредит устойчив. Если нет — предупреди клиента.\n\n"
                "**5. Качественная оценка.** Накопления, поведение по счёту. Клиент с "
                "нулевым остатком к концу месяца — рискованнее клиента, который откладывает.\n\n"
                "### Пошаговый расчёт\n\n"
                "1. Подтверждённый доход (справка / выписка / декларация).\n"
                "2. Все действующие кредитные платежи (сверь с БКИ).\n"
                "3. Текущий DTI = платежи / доход × 100%.\n"
                "4. Платёж по новому кредиту через калькулятор.\n"
                "5. DTI с новым кредитом = (текущие платежи + новый) / доход × 100%.\n"
                "6. Сравни с порогом (40–50%).\n"
                "7. Располагаемый доход после всех платежей.\n"
                "8. Стресс-тест при −25% дохода.\n"
                "9. Качественные факторы.\n"
                "10. Вывод в CRM: «DTI 43%, располагаемый доход 4,2 млн, доход стабильный, "
                "стаж 4 года. Умеренный риск, рекомендую к одобрению»."
            ),
        },
        {
            "slug": "overdue_portfolio",
            "title": "4. Просрочка и отчётность по портфелю",
            "summary": "DPD-классификация, работа с ранней просрочкой, реструктуризация, ключевые отчёты.",
            "duration_min": 45,
            "body_md": (
                "## DPD — классификация просрочек\n\n"
                "DPD (Days Past Due) — количество дней просрочки.\n\n"
                "| DPD | Стадия | Действие |\n"
                "|---|---|---|\n"
                "| 1–30 | Ранняя | Звонок-напоминание, поддерживающий тон |\n"
                "| 30–60 | Средняя | Активный контакт, возможна реструктуризация |\n"
                "| 60–90 | Глубокая | Подключается спец-служба по задолженности |\n"
                "| >90 | Критическая | Передача в коллекшн / юридический департамент |\n\n"
                "### Ранняя просрочка — зона ответственности менеджера\n\n"
                "Прямая коммуникация + поддерживающий тон. «Я вижу, что платёж не "
                "поступил, хочу уточнить всё ли в порядке» работает лучше, чем «у вас "
                "просрочка, немедленно оплатите».\n\n"
                "### Реструктуризация\n"
                "Инструмент работы со средней/глубокой просрочкой. Варианты: пролонгация "
                "срока (меньший платёж), кредитные каникулы (отсрочка), изменение структуры "
                "платежа. Это не подарок клиенту — это снижение риска для банка: лучше "
                "получить позже, чем не получить вовсе.\n\n"
                "### Ключевые отчёты\n"
                "- **Просроченная задолженность** — список с DPD>0, сортировка по сроку.\n"
                "- **Структура портфеля** — разбивка по продуктам, суммам, срокам, сегментам.\n"
                "- **Истекающие сроки** — кредиты, приближающиеся к финальному платежу "
                "(горячие лиды для нового продукта).\n\n"
                "### Ежедневная рутина\n\n"
                "1. Утром — отчёт «Просроченная задолженность», сортировка по дате.\n"
                "2. Начинай с самых свежих (DPD 1–5).\n"
                "3. Открой карточку: история, прошлые контакты.\n"
                "4. Позвони нейтральным тоном.\n"
                "5. Зафиксируй причину просрочки.\n"
                "6. Временная причина (забыл, задержали зарплату) → напомни о способах "
                "оплаты, договорись о дате, поставь задачу-проверку через 2 дня.\n"
                "7. Серьёзная (потеря работы, болезнь) → реструктуризация, приглашение "
                "в отделение. **Не обещай конкретные условия без согласования.**\n"
                "8. Каждый контакт — в CRM (дата, разговор, договорённость, следующий шаг).\n"
                "9. Не берёт трубку → минимум 3 попытки в разное время за 2 дня, "
                "потом «не удалось установить контакт» + эскалация."
            ),
        },
    ],
    "quiz": [
        {
            "id": "q1",
            "question": "Что такое скоринговый балл?",
            "options": [
                {"id": "a", "text": "Личная оценка клиента кредитным специалистом", "correct": False},
                {"id": "b", "text": "Числовой показатель вероятности своевременного погашения на основе статистической модели", "correct": True},
                {"id": "c", "text": "Рейтинг клиента по сумме вкладов", "correct": False},
                {"id": "d", "text": "Балл по результатам собеседования", "correct": False},
            ],
            "explanation": "Скоринг — математическая модель, считающая статистическую вероятность возврата.",
        },
        {
            "id": "q2",
            "question": "Клиент зарабатывает 15 млн сум. Действующий платёж 3 млн, новый — 3,5 млн. Каков DTI с новым кредитом?",
            "options": [
                {"id": "a", "text": "20%", "correct": False},
                {"id": "b", "text": "35%", "correct": False},
                {"id": "c", "text": "43%", "correct": True},
                {"id": "d", "text": "55%", "correct": False},
            ],
            "explanation": "DTI = (3 + 3,5) / 15 × 100% = 43,3%.",
        },
        {
            "id": "q3",
            "question": "Что означает код просрочки «2» в кредитном отчёте?",
            "options": [
                {"id": "a", "text": "Просрочка до 30 дней", "correct": False},
                {"id": "b", "text": "Просрочка 30–60 дней", "correct": True},
                {"id": "c", "text": "Просрочка 60–90 дней", "correct": False},
                {"id": "d", "text": "Передача коллекторам", "correct": False},
            ],
            "explanation": "Код «2» в стандартной классификации БКИ — просрочка 30–60 дней.",
        },
        {
            "id": "q4",
            "question": "Зачем нужно письменное согласие клиента на запрос кредитной истории?",
            "options": [
                {"id": "a", "text": "Для внутренней статистики", "correct": False},
                {"id": "b", "text": "Кредитная история — персональные данные; запрос без согласия нарушает закон", "correct": True},
                {"id": "c", "text": "Чтобы клиент не мог оспорить скоринг", "correct": False},
                {"id": "d", "text": "Только для ипотечных заявок", "correct": False},
            ],
            "explanation": "Без письменного согласия запрос БКИ — нарушение закона о персональных данных.",
        },
        {
            "id": "q5",
            "question": "Что такое располагаемый доход?",
            "options": [
                {"id": "a", "text": "Весь ежемесячный доход клиента", "correct": False},
                {"id": "b", "text": "Доход минус налоги", "correct": False},
                {"id": "c", "text": "То, что остаётся после всех обязательных платежей (кредиты, аренда, иждивенцы)", "correct": True},
                {"id": "d", "text": "Средний доход за 12 месяцев", "correct": False},
            ],
            "explanation": "Располагаемый доход — реальная сумма, доступная клиенту после всех обязательств.",
        },
        {
            "id": "q6",
            "question": "Клиент с просрочкой DPD 5. Как начать разговор?",
            "options": [
                {"id": "a", "text": "«У вас просрочка, немедленно внесите платёж»", "correct": False},
                {"id": "b", "text": "«Добрый день, вижу что платёж не поступил. Всё ли в порядке?»", "correct": True},
                {"id": "c", "text": "«Вы должны банку деньги, это серьёзно»", "correct": False},
                {"id": "d", "text": "Не звонить — это небольшая просрочка", "correct": False},
            ],
            "explanation": "Поддерживающий тон на ранней стадии открывает диалог и решает большинство ситуаций.",
        },
        {
            "id": "q7",
            "question": "Клиент потерял работу и не может платить. Что сказать?",
            "options": [
                {"id": "a", "text": "«Это ваши проблемы»", "correct": False},
                {"id": "b", "text": "«Есть возможность реструктуризации — приходите в отделение, рассмотрим варианты»", "correct": True},
                {"id": "c", "text": "«Мы можем списать долг»", "correct": False},
                {"id": "d", "text": "«Передадим в суд»", "correct": False},
            ],
            "explanation": "Реструктуризация — законный инструмент. Не обещай конкретные условия без согласования.",
        },
        {
            "id": "q8",
            "question": "Для чего ежедневно просматривать отчёт по просроченной задолженности?",
            "options": [
                {"id": "a", "text": "Для отчёта руководству", "correct": False},
                {"id": "b", "text": "Для выявления ранних просрочек и работы до их углубления", "correct": True},
                {"id": "c", "text": "Для расчёта бонусов", "correct": False},
                {"id": "d", "text": "Делает автоматика, специалист не занимается", "correct": False},
            ],
            "explanation": "Ранняя просрочка решается звонком. Поздняя требует сложных процедур.",
        },
        {
            "id": "q9",
            "question": "После 3 безуспешных попыток дозвона до клиента с просрочкой — что делать?",
            "options": [
                {"id": "a", "text": "Подождать ещё несколько дней", "correct": False},
                {"id": "b", "text": "Закрыть задачу — клиент сам позвонит", "correct": False},
                {"id": "c", "text": "Зафиксировать «не удалось установить контакт» и эскалировать по регламенту", "correct": True},
                {"id": "d", "text": "Списать задолженность как безнадёжную", "correct": False},
            ],
            "explanation": "После установленного числа попыток ситуация эскалируется согласно регламенту.",
        },
        {
            "id": "q10",
            "question": "Для чего нужен отчёт по кредитам с истекающим сроком погашения?",
            "options": [
                {"id": "a", "text": "Для списания кредитов с баланса", "correct": False},
                {"id": "b", "text": "Для проактивного контакта и предложения нового продукта", "correct": True},
                {"id": "c", "text": "Для начисления финальных процентов", "correct": False},
                {"id": "d", "text": "Для передачи в БКИ", "correct": False},
            ],
            "explanation": "Клиент в конце кредита — горячий лид: доход освобождается, доверие есть.",
        },
    ],
}


# ---------------------------------------------------------------------------
# Клиентский менеджер · Курс 1: Клиентская база и CRM
# ---------------------------------------------------------------------------

COURSES["client_manager_crm"] = {
    "slug": "client_manager_crm",
    "title": "Клиентская база и CRM",
    "subtitle": "Клиентский менеджер · ежедневная работа в системе",
    "description": (
        "Системное понимание CRM-системы банка: создание и ведение карточек, "
        "сегментация базы, постановка задач, фиксация контактов. "
        "Превращение CRM из «записной книжки» в инструмент проактивной работы."
    ),
    "icon": "book",
    "difficulty": "easy",
    "estimated_minutes": 240,
    "target_scenario_id": "",
    "tags": ["CRM", "клиентский менеджер", "база", "задачи"],
    "directions": ["Клиентский менеджер"],
    "lessons": [
        {
            "slug": "crm_basics",
            "title": "1. Что такое CRM и зачем она нужна",
            "summary": "Логика системы, её место в работе менеджера, почему это важнее блокнота.",
            "duration_min": 35,
            "body_md": (
                "## CRM = Customer Relationship Management\n\n"
                "За сухим определением — конкретная идея: **всё, что ты знаешь о клиенте, "
                "должно храниться в одном месте и не зависеть от твоей памяти**.\n\n"
                "### Зачем это менеджеру\n"
                "- **Хранилище данных** — контакты, продукты, обращения, заметки, документы.\n"
                "- **Планировщик** — задачи, напоминания, видишь кому звонить сегодня.\n"
                "- **Аналитика** — твоя воронка, конверсия, активные клиенты.\n\n"
                "### Это инструмент, а не слежка\n"
                "Менеджер с аккуратной CRM тратит меньше времени на подготовку, реже "
                "забывает follow-up и закрывает больше сделок — просто потому что ничего "
                "не теряется.\n\n"
                "### Данные — собственность банка\n"
                "Не твоя личная база. Уйдёшь — клиенты остаются. Переходит клиент от "
                "другого менеджера — вся история уже в системе. Это делает работу команды "
                "непрерывной.\n\n"
                "### Первый вход\n"
                "1. Открой внутренний портал → раздел «CRM».\n"
                "2. Логин = твои учётные данные.\n"
                "3. Изучи 4 основных раздела: **Мои клиенты, Задачи, Сделки, Отчёты**.\n"
                "4. Открой любого клиента — изучи структуру карточки.\n"
                "5. Включи уведомления в настройках профиля.\n\n"
                "### Главное правило\n"
                "**Данные вносятся СРАЗУ после контакта**, пока всё свежо. Максимум — "
                "1 час. «Внесу потом» = детали потеряны."
            ),
        },
        {
            "slug": "crm_card",
            "title": "2. Создание и ведение карточки клиента",
            "summary": "Все ключевые блоки карточки и правила заполнения.",
            "duration_min": 40,
            "body_md": (
                "## Карточка — цифровой паспорт клиента\n\n"
                "Если карточка плохо заполнена, клиент будет объяснять свою ситуацию "
                "с нуля при каждом контакте. Это раздражает.\n\n"
                "### Ключевые блоки\n\n"
                "1. **Идентификация** — ФИО, дата рождения, ИНН, паспорт. Сверяй с "
                "оригиналом символ за символом — ошибка в ИНН = неправильный человек "
                "в госбазе = комплаенс-риск.\n\n"
                "2. **Контакты** — основной телефон, дополнительный, email, **предпочтительный "
                "канал**. Обязательно уточни: звонок, SMS или мессенджер. Если не "
                "берёт трубку, но отвечает в Telegram — ты должен знать заранее.\n\n"
                "3. **Профессиональные и финансовые данные** — место работы, должность, "
                "доход, семейное положение, наличие других кредитов. Нужно для подбора "
                "продукта (ИП с нестабильным доходом → продукты с гибким графиком).\n\n"
                "4. **Продукты и история** — формируется автоматически по мере работы. "
                "Фиксируй каждый контакт вручную там, где система не делает.\n\n"
                "5. **Сегмент/Категория** — массовый / верхний массовый / affluent / "
                "private. Влияет на KPI и тип предложений.\n\n"
                "6. **Следующий шаг** — у каждой карточки всегда должна быть активная "
                "задача. Без неё клиент «зависает» в базе.\n\n"
                "### Чек-лист создания карточки\n\n"
                "1. **Сначала найди** по телефону → потом по ИНН. Дубликаты ломают историю.\n"
                "2. «Создать клиента» → заполни «Основные данные» (ФИО полностью, без "
                "сокращений).\n"
                "3. «Документы» → паспорт, ИНН (двойная проверка цифр).\n"
                "4. «Контакты» → телефон в формате +998XXXXXXXXX (единый стандарт), email, "
                "предпочтительный канал.\n"
                "5. «Занятость» → работодатель, должность, тип занятости.\n"
                "6. **«Источник»** → откуда клиент: входящий, рекомендация, исходящий, "
                "реклама. Важно для маркетинговой аналитики.\n"
                "7. «Менеджер» → твоё имя.\n"
                "8. «Сохранить» → **сразу** создай первую задачу-следующий шаг."
            ),
        },
        {
            "slug": "crm_segmentation",
            "title": "3. Сегментация клиентской базы",
            "summary": "Деление базы на группы для приоритизации работы.",
            "duration_min": 40,
            "body_md": (
                "## Сегментация — не маркетинговая абстракция\n\n"
                "Это инструмент, который помогает понять: кому звонить сегодня, кому "
                "предложить какой продукт, на кого тратить больше времени.\n\n"
                "### Уровни сегментации\n\n"
                "**1. По доходу:** массовый → верхний массовый → affluent → private. "
                "Чем выше сегмент, тем шире продуктовое предложение и выше ожидания от сервиса.\n\n"
                "**2. По продуктовому профилю:**\n"
                "- *Монопродуктовый* — одна карта. Потенциал для кросс-продаж.\n"
                "- *Мультипродуктовый* — карта + вклад + страховка. Лояльная база, удерживать.\n\n"
                "**3. По стадии жизненного цикла:**\n"
                "- *Новый* (< 3 мес) — онбординг.\n"
                "- *Активный* (3 мес – 2 года) — регулярный контакт.\n"
                "- *Зрелый* (> 2 лет) — программы лояльности.\n"
                "- *Отток* — возвращать!\n\n"
                "**4. По поведению:** часто ли пользуется картой, активен ли в "
                "мобильном банке. «Спящие» (90 дней без транзакций) — кандидаты на звонок.\n\n"
                "### Практика: фильтры и теги в CRM\n\n"
                "Примеры готовых сегментов:\n"
                "- «Все клиенты с вкладом, истекающим в следующие 30 дней» → готовый "
                "список для обзвона.\n"
                "- «Все клиенты без кредита с доходом выше среднего» → целевой сегмент "
                "для кредитной кампании.\n\n"
                "### Алгоритм\n\n"
                "1. «Мои клиенты» → панель фильтров.\n"
                "2. Выбери параметры (Сегмент → Верхний массовый, Продукты → нет кредита).\n"
                "3. «Применить» → получи список.\n"
                "4. **Сохрани фильтр** с понятным названием («Потенциал кредит — верхний "
                "массовый»). Это экономит 5–10 минут каждый день.\n"
                "5. Для тегов: открой карточку → «Теги» → добавь («VIP», «Потенциал ипотека»).\n"
                "6. **Регулярно пересматривай теги** — устаревшие дезориентируют."
            ),
        },
        {
            "slug": "crm_tasks",
            "title": "4. Задачи, напоминания и история контактов",
            "summary": "Личный планировщик в CRM и правильная фиксация контактов.",
            "duration_min": 35,
            "body_md": (
                "## Задачи — основа проактивной работы\n\n"
                "Менеджер ведёт 50–200 клиентов. Удерживать в голове кому звонить, "
                "кто ждёт документы, у кого истекает вклад — невозможно.\n\n"
                "### Главный принцип\n\n"
                "**У каждого клиента всегда должна быть одна активная задача.** "
                "Выполнил — сразу создай следующую. Клиент без активной задачи = клиент "
                "выпал из поля зрения.\n\n"
                "### Хорошая задача vs плохая\n\n"
                "Плохо: «связаться с клиентом».\n"
                "Хорошо: «Позвонить Алишеру Кадырову 15 мая в 14:00, уточнить решение "
                "по кредиту, обсудить условия страховки».\n\n"
                "### История контактов\n\n"
                "Каждый контакт фиксируется с **кратким содержанием**. Не «позвонил» — "
                "а «обсудили условия ипотеки до 200 млн на 20 лет, ждёт одобрения "
                "супруги, перезвонить 20 мая».\n\n"
                "Фиксируй всё: звонки, письма, встречи, сообщения в мессенджерах.\n\n"
                "### Трёхшаговый ритуал завершения\n\n"
                "1. Отметить задачу выполненной.\n"
                "2. Добавить итоговый комментарий с результатом.\n"
                "3. **Сразу** создать следующую задачу.\n\n"
                "### Чек-лист создания задачи\n\n"
                "1. Карточка клиента → «Задачи» → «Создать задачу».\n"
                "2. Тип: Звонок / Встреча / Письмо / Другое.\n"
                "3. Описание — конкретная цель.\n"
                "4. Дата и время (учитывай удобство клиента).\n"
                "5. Напоминание за 30–60 минут.\n"
                "6. Сохранить.\n\n"
                "### Управление рабочим днём\n"
                "Утро = просмотр задач на сегодня + расстановка приоритетов. Срочное "
                "и важное (клиент ждёт ответа по решению) — в первую очередь."
            ),
        },
    ],
    "quiz": [
        {
            "id": "q1",
            "question": "Клиент звонит и говорит, что обращался полгода назад. Ваши первые действия?",
            "options": [
                {"id": "a", "text": "Попросить рассказать ситуацию заново", "correct": False},
                {"id": "b", "text": "Открыть CRM, найти карточку и ознакомиться с историей до продолжения разговора", "correct": True},
                {"id": "c", "text": "Создать новую карточку", "correct": False},
                {"id": "d", "text": "Перевести на другого менеджера", "correct": False},
            ],
            "explanation": "История уже в системе. Знакомство с ней до разговора экономит время клиента и показывает профессионализм.",
        },
        {
            "id": "q2",
            "question": "Перед созданием новой карточки необходимо проверить наличие клиента по:",
            "options": [
                {"id": "a", "text": "ФИО и дате рождения", "correct": False},
                {"id": "b", "text": "Номеру телефона и ИНН", "correct": True},
                {"id": "c", "text": "Адресу и месту работы", "correct": False},
                {"id": "d", "text": "Email и серии паспорта", "correct": False},
            ],
            "explanation": "Телефон и ИНН — уникальные идентификаторы. Проверка предотвращает дублирование.",
        },
        {
            "id": "q3",
            "question": "Клиент сказал «подумаю и перезвоню сам». Что нужно сделать в CRM?",
            "options": [
                {"id": "a", "text": "Ничего — клиент перезвонит сам", "correct": False},
                {"id": "b", "text": "Закрыть карточку как неактивную", "correct": False},
                {"id": "c", "text": "Договориться о конкретной дате и поставить задачу на звонок", "correct": True},
                {"id": "d", "text": "Удалить карточку", "correct": False},
            ],
            "explanation": "«Перезвонит сам» = риск потери клиента. Менеджер берёт инициативу.",
        },
        {
            "id": "q4",
            "question": "Какой комментарий к звонку является правильным?",
            "options": [
                {"id": "a", "text": "«Позвонил, поговорил»", "correct": False},
                {"id": "b", "text": "«Клиент не берёт трубку»", "correct": False},
                {"id": "c", "text": "«Обсудили потребительский кредит 50 млн, клиент сравнивает с другим банком, интересует ставка, перезвонить 25 мая»", "correct": True},
                {"id": "d", "text": "«Клиент думает»", "correct": False},
            ],
            "explanation": "Только конкретика имеет практическую ценность при следующем контакте.",
        },
        {
            "id": "q5",
            "question": "Что такое «монопродуктовый» клиент?",
            "options": [
                {"id": "a", "text": "Клиент с одним визитом в банк", "correct": False},
                {"id": "b", "text": "Клиент, пользующийся только одним продуктом банка", "correct": True},
                {"id": "c", "text": "Клиент из одного сегмента", "correct": False},
                {"id": "d", "text": "Клиент с одним менеджером", "correct": False},
            ],
            "explanation": "Монопродуктовый = потенциал для кросс-продаж.",
        },
        {
            "id": "q6",
            "question": "Клиент перестал пользоваться продуктами банка последние 4 месяца. К какой стадии относится?",
            "options": [
                {"id": "a", "text": "Новый", "correct": False},
                {"id": "b", "text": "Активный", "correct": False},
                {"id": "c", "text": "Зрелый", "correct": False},
                {"id": "d", "text": "Отток", "correct": True},
            ],
            "explanation": "Отток. Требует проактивного звонка для возврата.",
        },
        {
            "id": "q7",
            "question": "Как правильно завершить выполненную задачу в CRM?",
            "options": [
                {"id": "a", "text": "Просто закрыть карточку", "correct": False},
                {"id": "b", "text": "Отметить выполненной + комментарий с результатом + создать следующую задачу", "correct": True},
                {"id": "c", "text": "Удалить задачу из списка", "correct": False},
                {"id": "d", "text": "Перенести на следующую неделю", "correct": False},
            ],
            "explanation": "Трёхшаговый ритуал удерживает работу с клиентом в движении.",
        },
        {
            "id": "q8",
            "question": "Зачем указывать источник клиента при создании карточки?",
            "options": [
                {"id": "a", "text": "Обязательное поле, иначе не сохранится", "correct": False},
                {"id": "b", "text": "Для анализа эффективности каналов привлечения", "correct": True},
                {"id": "c", "text": "Чтобы передать клиента другому менеджеру", "correct": False},
                {"id": "d", "text": "Для расчёта бонусов менеджера", "correct": False},
            ],
            "explanation": "Источник помогает банку понять, какие каналы работают и куда направлять маркетинговый бюджет.",
        },
        {
            "id": "q9",
            "question": "У клиента вклад истекает через 25 дней. Как быстро найти всех таких клиентов?",
            "options": [
                {"id": "a", "text": "Просматривать карточки вручную", "correct": False},
                {"id": "b", "text": "Использовать фильтры: тип «Вклад» + дата окончания «Следующие 30 дней»", "correct": True},
                {"id": "c", "text": "Запросить список у руководителя", "correct": False},
                {"id": "d", "text": "Позвонить в IT-отдел", "correct": False},
            ],
            "explanation": "Фильтры CRM мгновенно дают список для проактивного обзвона.",
        },
        {
            "id": "q10",
            "question": "Почему данные клиентов в CRM — собственность банка, а не менеджера?",
            "options": [
                {"id": "a", "text": "Менеджер не платил за систему", "correct": False},
                {"id": "b", "text": "Чтобы база оставалась в банке при смене или уходе менеджера, обеспечивая непрерывность обслуживания", "correct": True},
                {"id": "c", "text": "Так написано в договоре с клиентом", "correct": False},
                {"id": "d", "text": "Менеджер не может просматривать все данные", "correct": False},
            ],
            "explanation": "Принцип институциональной базы: клиент принадлежит банку, не сотруднику.",
        },
    ],
}


# ---------------------------------------------------------------------------
# Клиентский менеджер · Курс 2: Обращения, продукты, история клиента
# ---------------------------------------------------------------------------

COURSES["client_manager_requests"] = {
    "slug": "client_manager_requests",
    "title": "Работа с обращениями, продуктами и историей клиента",
    "subtitle": "Клиентский менеджер · обращения, портфель, кросс-продажи",
    "description": (
        "Профессиональная обработка обращений, работа с продуктовым портфелем в CRM, "
        "анализ истории клиента для подготовки к контакту и поиск возможностей "
        "кросс-продаж на основе данных."
    ),
    "icon": "headphones",
    "difficulty": "easy",
    "estimated_minutes": 240,
    "target_scenario_id": "crm_complaint_handling",
    "tags": ["обращения", "CRM", "клиентский менеджер", "кросс-продажи", "продукты"],
    "directions": ["Клиентский менеджер"],
    "lessons": [
        {
            "slug": "request_types",
            "title": "1. Обращения клиентов: типы, регистрация, обработка",
            "summary": "4 типа обращений и регламент регистрации каждого.",
            "duration_min": 40,
            "body_md": (
                "## Что такое обращение\n\n"
                "Любой контакт клиента с банком, требующий реакции: вопрос, заявка, "
                "жалоба, претензия, предложение. **Каждое обращение должно быть "
                "зарегистрировано, обработано и закрыто с фиксацией результата.**\n\n"
                "### 4 типа обращений\n\n"
                "1. **Информационный запрос** — условия продукта, статус заявки, размер "
                "комиссии. Ответил → зафиксировал → закрыл.\n\n"
                "2. **Заявка на продукт** — клиент хочет оформить карту/вклад/кредит. "
                "Переходит в сделку, имеет свой статус и срок обработки.\n\n"
                "3. **Жалоба / претензия** — самый чувствительный тип. Срок ответа "
                "1–5 рабочих дней в зависимости от типа. Недовольный клиент, которому "
                "быстро помогли → лояльный. Проигнорированный → уходит и рассказывает.\n\n"
                "4. **Консультация по сложной ситуации** — реструктуризация, спор по "
                "транзакции. Маршрутизируй в профильное подразделение, не пытайся "
                "решить вне своих полномочий.\n\n"
                "### Регуляторная ответственность\n\n"
                "Банк несёт ответственность за **соблюдение сроков** ответа. Жалоба "
                "зарегистрирована, но ответ не дан в срок → нарушение → претензия со "
                "стороны Центрального банка.\n\n"
                "### Алгоритм регистрации\n\n"
                "1. Карточка клиента → вкладка «Обращения» → «Создать обращение».\n"
                "2. Тип: Информационный / Заявка / Жалоба / Претензия / Консультация.\n"
                "3. Канал: Лично / Звонок / Email / Мессенджер / Другое.\n"
                "4. Дата и время (проверь, что проставилось).\n"
                "5. **Описание** — кратко и **конкретно**. Не «клиент недоволен», а "
                "«клиент оспаривает списание комиссии 15 000 сум за SMS-уведомление "
                "за март, считает что услуга была отключена».\n"
                "6. Для жалоб — приоритет: Обычный / Высокий / Критический.\n"
                "7. Ответственный — себя или коллегу.\n"
                "8. Срок согласно регламенту банка.\n"
                "9. Сохранить + **поставить задачу-напоминание на дату срока**.\n"
                "10. После обработки — закрой с фиксацией результата."
            ),
        },
        {
            "slug": "product_portfolio",
            "title": "2. Работа с продуктовым портфелем клиента в CRM",
            "summary": "Чтение портфеля, «спящие» продукты, проактивный контакт.",
            "duration_min": 35,
            "body_md": (
                "## Продуктовый портфель\n\n"
                "Совокупность всех продуктов клиента: карты, счета, кредиты, вклады, "
                "страховки, инвестиции. Перед звонком ты должен знать: что есть, как "
                "давно, в каком состоянии, чего не хватает.\n\n"
                "### Что смотреть по каждому продукту\n\n"
                "- **Кредиты:** сумма, остаток, ежемесячный платёж, дата следующего "
                "платежа, наличие просрочки.\n"
                "- **Вклады:** сумма, ставка, дата открытия, **дата окончания**, "
                "условия пролонгации. Вклад через 2–4 недели → прямой повод для звонка.\n"
                "- **Карты:** тип, статус, последняя транзакция, доступный лимит, "
                "задолженность.\n\n"
                "### «Спящие» продукты\n\n"
                "- Карта без транзакций 60 дней → клиент ушёл к конкуренту? Активирующий звонок.\n"
                "- Вклад на минимальных условиях → клиент не знает о более выгодных. Покажи.\n\n"
                "### Важно: данные могут отставать\n\n"
                "CRM подтягивает данные из банковских систем с задержкой. Если "
                "клиент говорит одно, а CRM другое — уточняй в операционной системе "
                "напрямую. Не опирайся на устаревшие данные.\n\n"
                "### Алгоритм работы\n\n"
                "1. Карточка → вкладка «Продукты»/«Портфель».\n"
                "2. Активные продукты: тип, дата открытия, параметры.\n"
                "3. Статус каждого: Активен / Просрочен / Истекает / Закрыт.\n"
                "4. Для кредитов — дата следующего платежа, просрочки.\n"
                "5. Для вкладов — дата окончания, автопролонгация.\n"
                "6. Для карт — дата последней транзакции. Нет 60 дней — «спящий».\n"
                "7. **Раздел «Рекомендации»/«Предложения»** — CRM сама подсвечивает "
                "кросс-продажные возможности. Используй — это аналитика на готовых данных.\n"
                "8. Заметка о планируемом предложении — в комментарий к карточке."
            ),
        },
        {
            "slug": "client_history",
            "title": "3. Анализ истории клиента — подготовка к контакту",
            "summary": "Чтение истории CRM для персонализации контакта.",
            "duration_min": 35,
            "body_md": (
                "## История — живая летопись отношений\n\n"
                "Не просто лог звонков. Чем интересовался клиент, что его остановило, "
                "как реагировал на предложения, какие были проблемы. **Подготовка по "
                "истории за 3–5 минут до звонка отличает зрелого менеджера от среднего.**\n\n"
                "### Что смотреть\n\n"
                "1. **Последний разговор** — что обсуждали, договорённости. Если "
                "обещал перезвонить сегодня — начни с этого.\n"
                "2. **История жалоб** — решены ли. Если 3 месяца назад жаловался — "
                "спроси в начале: «Всё ли сейчас работает корректно?» Меняет тон "
                "разговора полностью.\n"
                "3. **История предложений** — что предлагал раньше, почему отказался. "
                "Если 4 месяца назад отказался от кредита из-за ставки, а ставки "
                "снизились → прямой повод вернуться. Если сказал «у меня стройка» и "
                "прошло полгода → стройка завершена.\n"
                "4. **Тон предыдущих контактов** — короткие чёткие разговоры или "
                "детальные? Реагирует на цифры или на истории? Подстраивай стиль.\n"
                "5. **Жизненные события** — смена работы, свадьба, дети. **Записывай "
                "всё, что клиент рассказывает о жизни** — это лучшие триггеры для "
                "будущих предложений.\n\n"
                "### Алгоритм подготовки за 5 минут до звонка\n\n"
                "1. Карточка → «История» → последний контакт прочитать полностью.\n"
                "2. Договорённости: о чём говорили, что обещали.\n"
                "3. Прокрути на 2–3 контакта назад — незакрытые темы?\n"
                "4. Раздел «Обращения» — есть жалобы? Решены?\n"
                "5. Вкладка «Продукты» — что изменилось.\n"
                "6. Сформулируй цель звонка.\n"
                "7. Подготовь 1–2 точечных вопроса/предложения.\n"
                "8. Позвони. Начни с отсылки к прошлому: «Алишер, мы последний раз "
                "говорили о кредите в апреле...» — клиент видит, что ты помнишь.\n"
                "9. После звонка — **немедленно** зафиксируй результат и поставь "
                "следующую задачу."
            ),
        },
        {
            "slug": "cross_selling",
            "title": "4. Кросс-продажи через CRM",
            "summary": "Поиск возможностей в данных, уместность предложений.",
            "duration_min": 30,
            "body_md": (
                "## Кросс-продажа — не «продать любой ценой»\n\n"
                "Это «предложить то, что действительно полезно». Уместное предложение "
                "укрепляет отношения, давление с ненужным продуктом — разрушает доверие.\n\n"
                "### 5 паттернов в CRM\n\n"
                "**1. Кредит без страховки.** Объясни конкретно: «Если что-то случится, "
                "страховка закроет долг — семья не будет нести нагрузку».\n\n"
                "**2. Карта без мобильного банкинга.** Активные пользователи приложения "
                "используют больше продуктов. Помощь в подключении = забота, не продажа.\n\n"
                "**3. Вклад у клиента с кредитом.** Возможен разговор об оптимизации: "
                "погасить кредит частично из вклада и снизить нагрузку.\n\n"
                "**4. Высокий оборот по карте без кешбэк-программы.** Очевидная выгода "
                "без затрат для клиента.\n\n"
                "**5. Клиент с детьми без накопительного счёта.** Накопительные продукты "
                "для образования = долгосрочный разговор, который показывает заботу о будущем.\n\n"
                "### Уместность по времени\n\n"
                "Только что одобренный кредит — **не лучший момент** предлагать ещё "
                "один. Клиент пережил стресс решения. Через 2–4 недели — другое дело.\n\n"
                "### Алгоритм\n\n"
                "1. Перед контактом — карточка → «Продукты». Что есть / чего нет.\n"
                "2. «Рекомендации»/«Предложения» — система подсвечивает возможности.\n"
                "3. Оцени уместность: профиль + ситуация + момент.\n"
                "4. **Максимум 1 дополнительное предложение** за контакт. Не «засыпай».\n"
                "5. Подготовь аргументацию: почему именно этот продукт именно этому клиенту.\n"
                "6. В разговоре: сначала закрой основную тему, потом органично: «Кстати, "
                "я заметил что у тебя нет страховки к кредиту. Хочу рассказать об одном "
                "варианте — думаю, тебя заинтересует».\n"
                "7. Реакция → в CRM. **С причиной отказа.** Через 2 месяца условия "
                "могут измениться — вернёшься с нужным аргументом.\n"
                "8. Согласился → сразу оформляй или задача на оформление."
            ),
        },
    ],
    "quiz": [
        {
            "id": "q1",
            "question": "Клиент позвонил и спросил, почему с его карты списали комиссию. Это какой тип обращения?",
            "options": [
                {"id": "a", "text": "Заявка на продукт", "correct": False},
                {"id": "b", "text": "Информационный запрос", "correct": False},
                {"id": "c", "text": "Жалоба или претензия", "correct": True},
                {"id": "d", "text": "Консультация по сложной ситуации", "correct": False},
            ],
            "explanation": "Оспаривание списания = претензия, требующая приоритетной обработки.",
        },
        {
            "id": "q2",
            "question": "Почему устные обращения нужно регистрировать так же, как письменные?",
            "options": [
                {"id": "a", "text": "Чтобы накапливать статистику звонков", "correct": False},
                {"id": "b", "text": "Система автоматически считает звонки", "correct": False},
                {"id": "c", "text": "Чтобы в случае спора иметь зафиксированное подтверждение содержания разговора", "correct": True},
                {"id": "d", "text": "Это необязательно для устных", "correct": False},
            ],
            "explanation": "Зарегистрированное обращение — единственное доказательство содержания разговора.",
        },
        {
            "id": "q3",
            "question": "Вклад клиента истекает через 28 дней. Что должен сделать менеджер?",
            "options": [
                {"id": "a", "text": "Подождать, пока клиент сам обратится", "correct": False},
                {"id": "b", "text": "Позвонить заблаговременно и предложить перевложить на актуальных условиях", "correct": True},
                {"id": "c", "text": "Автоматически продлить вклад без звонка", "correct": False},
                {"id": "d", "text": "Уведомить за 3 дня до окончания", "correct": False},
            ],
            "explanation": "Проактивный звонок = и сервис, и удержание средств в банке.",
        },
        {
            "id": "q4",
            "question": "CRM показывает, что задолженности нет, но клиент говорит, что внёс платёж только вчера. Что делать?",
            "options": [
                {"id": "a", "text": "Настаивать на данных CRM", "correct": False},
                {"id": "b", "text": "Пояснить о задержке синхронизации и уточнить в операционной системе", "correct": True},
                {"id": "c", "text": "Попросить квитанцию", "correct": False},
                {"id": "d", "text": "Внести изменения вручную в CRM", "correct": False},
            ],
            "explanation": "CRM синхронизируется с задержкой. При расхождении — уточняй в первоисточнике.",
        },
        {
            "id": "q5",
            "question": "Что нужно проверить в первую очередь перед звонком клиенту, у которого 3 месяца назад была жалоба?",
            "options": [
                {"id": "a", "text": "Продуктовый портфель", "correct": False},
                {"id": "b", "text": "Статус жалобы — закрыта ли она и каков результат", "correct": True},
                {"id": "c", "text": "Дату последней транзакции по карте", "correct": False},
                {"id": "d", "text": "Сегментацию клиента", "correct": False},
            ],
            "explanation": "Нельзя предлагать новый продукт клиенту с нерешённой жалобой.",
        },
        {
            "id": "q6",
            "question": "Клиент оформил крупный кредит сегодня. Когда лучше предложить страховку?",
            "options": [
                {"id": "a", "text": "Сразу, пока тема финансов актуальна", "correct": False},
                {"id": "b", "text": "Никогда — если бы хотел, спросил бы сам", "correct": False},
                {"id": "c", "text": "Через 2–4 недели, когда клиент освоился", "correct": True},
                {"id": "d", "text": "Только если клиент сам упомянет", "correct": False},
            ],
            "explanation": "Сразу после крупного продукта — неподходящий момент. Дай клиенту время.",
        },
        {
            "id": "q7",
            "question": "Клиент пользуется картой, но не подключён к мобильному банку. Как предложить?",
            "options": [
                {"id": "a", "text": "«Вам нужно подключить мобильный банк»", "correct": False},
                {"id": "b", "text": "«У нас акция — бесплатное подключение»", "correct": False},
                {"id": "c", "text": "«Многие наши клиенты пользуются мобильным банком для удобства — могу помочь подключить прямо сейчас, это займёт 3 минуты»", "correct": True},
                {"id": "d", "text": "Не предлагать — сам попросит когда нужно", "correct": False},
            ],
            "explanation": "Через удобство и конкретику («3 минуты») — органично, без давления.",
        },
        {
            "id": "q8",
            "question": "Что зафиксировать, если клиент отказался от предложенного продукта?",
            "options": [
                {"id": "a", "text": "Ничего — раз отказал, тема закрыта", "correct": False},
                {"id": "b", "text": "Дату, суть предложения и причину отказа", "correct": True},
                {"id": "c", "text": "Только дату звонка", "correct": False},
                {"id": "d", "text": "Пометку «не заинтересован» без деталей", "correct": False},
            ],
            "explanation": "Причина отказа = ценные данные. Через 2 месяца условия могут измениться.",
        },
        {
            "id": "q9",
            "question": "Какой паттерн в CRM сигнализирует о возможности предложить страховку?",
            "options": [
                {"id": "a", "text": "Клиент не пользуется мобильным банком", "correct": False},
                {"id": "b", "text": "У клиента есть кредит, но нет страховки", "correct": True},
                {"id": "c", "text": "Высокий оборот по карте", "correct": False},
                {"id": "d", "text": "Несколько вкладов", "correct": False},
            ],
            "explanation": "Кредит без страховки — классическая кросс-продажная возможность.",
        },
        {
            "id": "q10",
            "question": "Сколько дополнительных предложений допустимо за один контакт?",
            "options": [
                {"id": "a", "text": "Столько, сколько возможностей выявлено", "correct": False},
                {"id": "b", "text": "Не более трёх, если клиент активен", "correct": False},
                {"id": "c", "text": "Не более одного — чтобы не создавать ощущение давления", "correct": True},
                {"id": "d", "text": "Зависит от сегмента", "correct": False},
            ],
            "explanation": "Один контакт = одно дополнительное предложение. Больше создаёт давление и снижает конверсию.",
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
