"""Сценарии симулятора рабочего места.

ВНИМАНИЕ: все клиенты и счета — фиктивные (dummy data).
Никаких реальных персональных данных.
"""

SCENARIOS: dict[str, dict] = {
    "abs_customer_service": {
        "id": "abs_customer_service",
        "title": "АБС · Открытие текущего счёта",
        "description": (
            "В отделение приходит виртуальный клиент. "
            "Задача — корректно идентифицировать клиента, выбрать продукт "
            "и завершить операцию в АБС, не нарушив регламент."
        ),
        "icon": "wallet",
        "difficulty": "easy",
        "estimated_minutes": 5,
        "customer": {
            "name": "Алишер Каримов (виртуальный)",
            "document": "AB1234567",
            "purpose": "Открыть текущий счёт в UZS для получения зарплаты",
            "avatar": "AK",
        },
        "steps": [
            {
                "id": "s1_identify",
                "prompt": "Клиент подошёл к окну. С чего вы начнёте обслуживание?",
                "options": [
                    {"id": "a", "text": "Сразу открыть форму нового счёта в АБС",
                     "correct": False, "points": 0,
                     "feedback": "Сначала нужно идентифицировать клиента и проверить документ."},
                    {"id": "b", "text": "Поприветствовать, попросить документ и сверить личность по AML-чек-листу",
                     "correct": True, "points": 20,
                     "feedback": "Верно. Идентификация клиента — обязательный шаг по AML-регламенту."},
                    {"id": "c", "text": "Спросить устно ФИО и поверить на слово",
                     "correct": False, "points": 0,
                     "feedback": "Нарушение AML: личность клиента подтверждается документом."},
                ],
            },
            {
                "id": "s2_product",
                "prompt": "Документ проверен. Какой продукт выбрать?",
                "options": [
                    {"id": "a", "text": "Текущий счёт в UZS, тариф 'Зарплатный'",
                     "correct": True, "points": 20,
                     "feedback": "Корректный выбор по цели клиента."},
                    {"id": "b", "text": "Депозит в USD на 12 месяцев",
                     "correct": False, "points": 0,
                     "feedback": "Это не отвечает цели клиента и потребует доп. согласия."},
                    {"id": "c", "text": "Кредитная карта Visa Gold",
                     "correct": False, "points": 0,
                     "feedback": "Клиент не запрашивал кредитный продукт."},
                ],
            },
            {
                "id": "s3_kyc",
                "prompt": "В АБС всплыло окно KYC. Ваши действия?",
                "options": [
                    {"id": "a", "text": "Заполнить все поля KYC и приложить скан документа",
                     "correct": True, "points": 20,
                     "feedback": "Так и нужно — полный KYC обязателен для нового клиента."},
                    {"id": "b", "text": "Пропустить и заполнить позже",
                     "correct": False, "points": 0,
                     "feedback": "Регламент запрещает открывать счёт без полного KYC."},
                ],
            },
            {
                "id": "s4_confirm",
                "prompt": "Перед подтверждением операции в АБС вы:",
                "options": [
                    {"id": "a", "text": "Распечатываете договор, даёте клиенту прочитать, получаете подпись",
                     "correct": True, "points": 20,
                     "feedback": "Верно. Подпись клиента — обязательное условие."},
                    {"id": "b", "text": "Сразу подтверждаете операцию в АБС",
                     "correct": False, "points": 0,
                     "feedback": "Нельзя проводить операцию без подписанного договора."},
                ],
            },
            {
                "id": "s5_close",
                "prompt": "Счёт открыт. Что нужно выдать клиенту?",
                "options": [
                    {"id": "a", "text": "Реквизиты счёта, экземпляр договора и инструкцию по интернет-банку",
                     "correct": True, "points": 20,
                     "feedback": "Отлично. Это полный комплект."},
                    {"id": "b", "text": "Только устно сообщить номер счёта",
                     "correct": False, "points": 0,
                     "feedback": "Клиент должен получить документы на руки."},
                ],
            },
        ],
    },
    "crm_complaint_handling": {
        "id": "crm_complaint_handling",
        "title": "CRM · Обработка жалобы клиента",
        "description": (
            "Клиент обратился в чат с претензией: не прошёл платёж, "
            "а деньги списались. Зарегистрируйте обращение в CRM правильно."
        ),
        "icon": "headphones",
        "difficulty": "medium",
        "estimated_minutes": 6,
        "customer": {
            "name": "Зарина Юсупова (виртуальный)",
            "document": "CRM-A7821",
            "purpose": "Платёж 1 200 000 UZS не прошёл, средства списаны",
            "avatar": "ЗЮ",
        },
        "steps": [
            {
                "id": "c1_greet",
                "prompt": "Клиент в чате пишет на эмоциях. Ваш первый ответ:",
                "options": [
                    {"id": "a", "text": "«Здравствуйте! Понимаю ваше беспокойство, давайте разберёмся. Уточните, пожалуйста, номер операции.»",
                     "correct": True, "points": 20,
                     "feedback": "Эмпатия + конкретный вопрос — стандарт обслуживания."},
                    {"id": "b", "text": "«Это не наша проблема, обратитесь в банк-получатель.»",
                     "correct": False, "points": 0,
                     "feedback": "Нарушение стандарта: нельзя перекладывать ответственность без анализа."},
                    {"id": "c", "text": "«Ожидайте, я занят другими клиентами.»",
                     "correct": False, "points": 0,
                     "feedback": "Так общаться с клиентом нельзя — это нарушение Service Standard."},
                ],
            },
            {
                "id": "c2_category",
                "prompt": "Какую категорию обращения выбрать в CRM?",
                "options": [
                    {"id": "a", "text": "Финансовая претензия → Списание без зачисления",
                     "correct": True, "points": 20,
                     "feedback": "Верно. Это правильный код для SLA."},
                    {"id": "b", "text": "Технический вопрос → Интернет-банк",
                     "correct": False, "points": 0,
                     "feedback": "Категория повлияет на SLA — выберите правильную."},
                    {"id": "c", "text": "Жалоба на сотрудника",
                     "correct": False, "points": 0,
                     "feedback": "Клиент жалуется на операцию, а не на сотрудника."},
                ],
            },
            {
                "id": "c3_priority",
                "prompt": "Сумма — 1.2 млн UZS. Какой приоритет назначить?",
                "options": [
                    {"id": "a", "text": "High (по матрице — финансовый спор > 1 млн)",
                     "correct": True, "points": 20,
                     "feedback": "Правильно. По матрице приоритетов — High."},
                    {"id": "b", "text": "Low — потом разберёмся",
                     "correct": False, "points": 0,
                     "feedback": "Заниженный приоритет = нарушение SLA."},
                ],
            },
            {
                "id": "c4_action",
                "prompt": "Что делать дальше?",
                "options": [
                    {"id": "a", "text": "Запросить выписку, проверить статус в АБС и оформить запрос в отдел расчётов",
                     "correct": True, "points": 20,
                     "feedback": "Стандартный алгоритм. Молодец."},
                    {"id": "b", "text": "Сразу вернуть деньги из своего лимита",
                     "correct": False, "points": 0,
                     "feedback": "У оператора нет таких полномочий."},
                ],
            },
            {
                "id": "c5_followup",
                "prompt": "Закрытие обращения — что обязательно сделать?",
                "options": [
                    {"id": "a", "text": "Сообщить клиенту срок ответа, выдать номер обращения, поставить напоминание",
                     "correct": True, "points": 20,
                     "feedback": "Полный комплект завершения CRM-обращения."},
                    {"id": "b", "text": "Просто закрыть чат",
                     "correct": False, "points": 0,
                     "feedback": "Клиент должен получить номер обращения и срок."},
                ],
            },
        ],
    },
    "abs_money_transfer": {
        "id": "abs_money_transfer",
        "title": "АБС · Подозрительный перевод",
        "description": (
            "Виртуальный клиент просит перевести крупную сумму в другую страну. "
            "Проверьте операцию по AML-чек-листу и примите решение."
        ),
        "icon": "shield",
        "difficulty": "hard",
        "estimated_minutes": 7,
        "customer": {
            "name": "Бахтиёр Рахимов (виртуальный)",
            "document": "TR-9921",
            "purpose": "Перевести 150 000 USD физлицу в третью страну",
            "avatar": "БР",
        },
        "steps": [
            {
                "id": "t1_check_limit",
                "prompt": "Сумма — 150 000 USD. Это:",
                "options": [
                    {"id": "a", "text": "Выше порога обязательного AML-контроля — нужны доп. документы",
                     "correct": True, "points": 25,
                     "feedback": "Верно. Порог по регламенту — эквивалент 100 млн UZS."},
                    {"id": "b", "text": "Обычная сумма, проводим как стандартный перевод",
                     "correct": False, "points": 0,
                     "feedback": "Это нарушение AML-регламента."},
                ],
            },
            {
                "id": "t2_documents",
                "prompt": "Какие документы запросить?",
                "options": [
                    {"id": "a", "text": "Документ, подтверждающий источник средств, цель платежа, договор/инвойс",
                     "correct": True, "points": 25,
                     "feedback": "Полный пакет для крупного трансграничного перевода."},
                    {"id": "b", "text": "Только паспорт",
                     "correct": False, "points": 0,
                     "feedback": "Этого недостаточно для трансграничной операции."},
                ],
            },
            {
                "id": "t3_sanctions",
                "prompt": "В АБС всплыло предупреждение: получатель в watch-list. Действие?",
                "options": [
                    {"id": "a", "text": "Приостановить операцию и эскалировать в Compliance",
                     "correct": True, "points": 25,
                     "feedback": "Единственно верное действие. Решение принимает Compliance."},
                    {"id": "b", "text": "Игнорировать, клиент уважаемый",
                     "correct": False, "points": 0,
                     "feedback": "Грубейшее нарушение AML. Может привести к санкциям."},
                    {"id": "c", "text": "Уменьшить сумму и провести по частям",
                     "correct": False, "points": 0,
                     "feedback": "Структурирование — отдельное нарушение AML."},
                ],
            },
            {
                "id": "t4_report",
                "prompt": "Compliance подтвердил отказ. Что вы делаете с клиентом?",
                "options": [
                    {"id": "a", "text": "Вежливо сообщаете об отказе без раскрытия причин AML",
                     "correct": True, "points": 25,
                     "feedback": "Верно. Причины AML-отказа клиенту не раскрываются."},
                    {"id": "b", "text": "Подробно объясняете, что он в watch-list",
                     "correct": False, "points": 0,
                     "feedback": "Это раскрытие банковской тайны и нарушение AML."},
                ],
            },
        ],
    },
}


def get_scenario(scenario_id: str) -> dict | None:
    return SCENARIOS.get(scenario_id)


def list_scenarios() -> list[dict]:
    return [
        {
            "id": s["id"],
            "title": s["title"],
            "description": s["description"],
            "icon": s.get("icon", "book"),
            "difficulty": s.get("difficulty", "easy"),
            "estimated_minutes": s.get("estimated_minutes", 5),
        }
        for s in SCENARIOS.values()
    ]


def find_step(scenario: dict, step_id: str) -> dict | None:
    for step in scenario["steps"]:
        if step["id"] == step_id:
            return step
    return None


def next_step_id(scenario: dict, current_step_id: str) -> str | None:
    ids = [s["id"] for s in scenario["steps"]]
    try:
        i = ids.index(current_step_id)
    except ValueError:
        return None
    return ids[i + 1] if i + 1 < len(ids) else None


def max_score(scenario: dict) -> int:
    return sum(max(o["points"] for o in s["options"]) for s in scenario["steps"])
