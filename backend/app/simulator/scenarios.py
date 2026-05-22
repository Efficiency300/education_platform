"""Сценарии симулятора АБС/CRM Turonbank.

ВНИМАНИЕ: все клиенты и счета — фиктивные (dummy data).
Никаких реальных персональных данных.
"""

SCENARIOS: dict[str, dict] = {
    "abs_customer_service": {
        "id": "abs_customer_service",
        "title": "АБС: Открытие текущего счёта новому клиенту",
        "description": (
            "В отделение приходит виртуальный клиент. "
            "Ваша задача — корректно идентифицировать клиента, выбрать продукт "
            "и завершить операцию в АБС, не нарушив регламент."
        ),
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
                    {
                        "id": "a",
                        "text": "Сразу открыть форму нового счёта в АБС",
                        "correct": False,
                        "points": 0,
                        "feedback": "Сначала нужно идентифицировать клиента и проверить документ.",
                    },
                    {
                        "id": "b",
                        "text": "Поприветствовать, попросить документ и сверить личность по AML-чек-листу",
                        "correct": True,
                        "points": 20,
                        "feedback": "Верно. Идентификация клиента — обязательный шаг по AML-регламенту.",
                    },
                    {
                        "id": "c",
                        "text": "Спросить устно ФИО и поверить на слово",
                        "correct": False,
                        "points": 0,
                        "feedback": "Нарушение AML: личность клиента подтверждается документом.",
                    },
                ],
            },
            {
                "id": "s2_product",
                "prompt": "Документ проверен. Какой продукт выбрать?",
                "options": [
                    {
                        "id": "a",
                        "text": "Текущий счёт в UZS, тариф 'Зарплатный'",
                        "correct": True,
                        "points": 20,
                        "feedback": "Корректный выбор по цели клиента.",
                    },
                    {
                        "id": "b",
                        "text": "Депозит в USD на 12 месяцев",
                        "correct": False,
                        "points": 0,
                        "feedback": "Это не отвечает цели клиента и потребует доп. согласия.",
                    },
                    {
                        "id": "c",
                        "text": "Кредитная карта Visa Gold",
                        "correct": False,
                        "points": 0,
                        "feedback": "Клиент не запрашивал кредитный продукт.",
                    },
                ],
            },
            {
                "id": "s3_kyc",
                "prompt": "В АБС всплыло окно KYC. Ваши действия?",
                "options": [
                    {
                        "id": "a",
                        "text": "Заполнить все поля KYC и приложить скан документа",
                        "correct": True,
                        "points": 20,
                        "feedback": "Так и нужно — полный KYC обязателен для нового клиента.",
                    },
                    {
                        "id": "b",
                        "text": "Пропустить и заполнить позже",
                        "correct": False,
                        "points": 0,
                        "feedback": "Регламент запрещает открывать счёт без полного KYC.",
                    },
                ],
            },
            {
                "id": "s4_confirm",
                "prompt": "Перед подтверждением операции в АБС вы:",
                "options": [
                    {
                        "id": "a",
                        "text": "Распечатываете договор, даёте клиенту прочитать, получаете подпись",
                        "correct": True,
                        "points": 20,
                        "feedback": "Верно. Подпись клиента — обязательное условие.",
                    },
                    {
                        "id": "b",
                        "text": "Сразу подтверждаете операцию в АБС",
                        "correct": False,
                        "points": 0,
                        "feedback": "Нельзя проводить операцию без подписанного договора.",
                    },
                ],
            },
            {
                "id": "s5_close",
                "prompt": "Счёт открыт. Что нужно выдать клиенту?",
                "options": [
                    {
                        "id": "a",
                        "text": "Реквизиты счёта, экземпляр договора и инструкцию по интернет-банку",
                        "correct": True,
                        "points": 20,
                        "feedback": "Отлично. Это полный комплект.",
                    },
                    {
                        "id": "b",
                        "text": "Только устно сообщить номер счёта",
                        "correct": False,
                        "points": 0,
                        "feedback": "Клиент должен получить документы на руки.",
                    },
                ],
            },
        ],
    },
}


def get_scenario(scenario_id: str) -> dict | None:
    return SCENARIOS.get(scenario_id)


def list_scenarios() -> list[dict]:
    return [
        {"id": s["id"], "title": s["title"], "description": s["description"]}
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
