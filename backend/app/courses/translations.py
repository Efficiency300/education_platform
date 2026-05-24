"""Built-in Uzbek (and English) translations for catalog courses.

Same idea as ``app.simulator.translations`` — we ship inline localizations so
free-form course text doesn't need an LLM round-trip for every render.
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Python Backend A→Z (slug: python_backend_az)
# ---------------------------------------------------------------------------

_PYTHON_AZ_UZ = {
    "title": "Python Backend · A dan Z gacha",
    "subtitle": "Pythonda backend boʻyicha toʻliq kurs (FastAPI, SQL, Docker, testlar)",
    "description": (
        "Boʻlajak backend dasturchilari uchun toʻliq kurs. Python sintaksisi va "
        "virtual muhitlardan FastAPI, SQLAlchemy, Docker, testlash va xizmatni "
        "produksiyaga tayyorlashgacha. Kursdan keyin haqiqiy servislarni olib "
        "borish va texnik suhbatlardan oʻta olasiz."
    ),
    "lessons": {
        "intro_environment": {
            "title": "1. Kirish va dasturchining muhiti",
            "summary": "Python 3.11+ oʻrnatish, virtual muhitlar va pip.",
            "body_md": (
                "## Backend nima\n\n"
                "Backend — bu ilovaning server qismi: biznes-mantiq, ma'lumotlar bazasi "
                "bilan ishlash, frontend va mobil mijozlar uchun API. Pythonda odatda "
                "**FastAPI**, **Django** yoki **Flask** ishlatiladi.\n\n"
                "### Oʻrnatish\n"
                "1. [python.org](https://www.python.org) saytidan Python ≥ 3.11 ni oʻrnating.\n"
                "2. Tekshiring: `python --version`.\n"
                "3. Muharrir oʻrnating — VS Code yoki PyCharm.\n\n"
                "### Virtual muhit\n"
                "```bash\n"
                "python -m venv .venv\n"
                "source .venv/bin/activate   # Linux/Mac\n"
                ".venv\\Scripts\\activate    # Windows\n"
                "pip install --upgrade pip\n"
                "```\n\n"
                "> Venv loyihaning bogʻliqliklarini izolyatsiya qiladi. Hech qachon paketlarni "
                "tizim Python-iga oʻrnatmang — bu versiya nizolariga olib keladi."
            ),
        },
        "python_basics": {
            "title": "2. Python asoslari: tiplar, funksiyalar, istisno­lar",
            "summary": "Sintaksis, ma'lumot tiplari, funksiyalar, istisnolarni qayta ishlash.",
            "body_md": (
                "## Asosiy tiplar\n\n"
                "```python\n"
                "name: str = \"Alice\"\n"
                "age: int = 30\n"
                "score: float = 4.7\n"
                "is_admin: bool = False\n"
                "tags: list[str] = [\"py\", \"backend\"]\n"
                "user: dict[str, int] = {\"id\": 1}\n"
                "```\n\n"
                "### Funksiyalar va tipizatsiya\n"
                "```python\n"
                "def add(a: int, b: int) -> int:\n"
                "    return a + b\n"
                "```\n\n"
                "### Istisnolar\n"
                "```python\n"
                "try:\n"
                "    value = int(payload)\n"
                "except ValueError as e:\n"
                "    log.warning(\"bad payload: %s\", e)\n"
                "    raise\n"
                "```\n\n"
                "### Roʻyxat ifodalari\n"
                "```python\n"
                "evens = [x for x in range(10) if x % 2 == 0]\n"
                "```\n\n"
                "Bu — asos, bu boʻlmasa keyingi misollarni tushunib boʻlmaydi."
            ),
        },
        "oop_modules": {
            "title": "3. OOP, modullar va loyiha tuzilishi",
            "summary": "Sinflar, dataclass, importlar, paket tuzilishi.",
            "body_md": (
                "## Sinflar\n\n"
                "```python\n"
                "from dataclasses import dataclass\n\n"
                "@dataclass\n"
                "class User:\n"
                "    id: int\n"
                "    email: str\n"
                "    is_active: bool = True\n"
                "```\n\n"
                "### Loyiha tuzilishi\n"
                "```\n"
                "myapp/\n"
                "├── app/\n"
                "│   ├── __init__.py\n"
                "│   ├── main.py        # kirish nuqtasi\n"
                "│   ├── api/           # marshrutlar\n"
                "│   ├── db/            # modellar va sessiya\n"
                "│   └── core/          # konfig, utilitalar\n"
                "├── tests/\n"
                "├── pyproject.toml\n"
                "└── requirements.txt\n"
                "```\n\n"
                "API-ni, domen mantiqini va MB bilan ishlashni alohida modullarga ajrating — "
                "testlash va qayta ishlatish osonroq boʻladi."
            ),
        },
        "async_io": {
            "title": "4. Asinxronlik: async/await, asyncio",
            "summary": "Nima uchun async — zamonaviy Python backend asosi.",
            "body_md": (
                "## async/await\n\n"
                "Zamonaviy veb-freymvorklar (FastAPI, Starlette) asinxron — "
                "bitta jarayon har bir soʻrov uchun bitta oqim oʻrniga minglab "
                "ulanishlarni ushlab turadi.\n\n"
                "```python\n"
                "import asyncio\n\n"
                "async def fetch_user(uid: int) -> dict:\n"
                "    await asyncio.sleep(0.1)   # I/O imitatsiyasi\n"
                "    return {\"id\": uid, \"name\": \"Alice\"}\n\n"
                "async def main():\n"
                "    users = await asyncio.gather(\n"
                "        fetch_user(1), fetch_user(2), fetch_user(3),\n"
                "    )\n"
                "    print(users)\n\n"
                "asyncio.run(main())\n"
                "```\n\n"
                "### Qoida\n"
                "Async-funksiya ichida **hech qachon** bloklovchi kod chaqirmang "
                "(time.sleep, requests.get, ogʻir hisob-kitoblar). Quyidagilarni ishlating: "
                "`await asyncio.sleep`, `httpx.AsyncClient`, `run_in_executor`."
            ),
        },
        "fastapi_basics": {
            "title": "5. FastAPI: birinchi HTTP-ilova",
            "summary": "Marshrutlar, Pydantic validatsiyasi, avtoma­tik hujjat.",
            "body_md": (
                "## Oʻrnatish\n\n"
                "```bash\n"
                "pip install fastapi uvicorn[standard]\n"
                "```\n\n"
                "### Minimal ilova\n"
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
                "Ishga tushirish: `uvicorn app.main:app --reload`.\n"
                "Swagger UI: http://localhost:8000/docs.\n\n"
                "### Pydantic\n"
                "Har qanday Pydantic modeli = kirishda validatsiya + chiqishda serializatsiya. "
                "Agar mijoz `email: 42` yuborsa — FastAPI avtomatik `422` qaytaradi."
            ),
        },
        "routing_deps": {
            "title": "6. Marshrutlash va Dependency Injection",
            "summary": "APIRouter, depends, token boʻyicha autentifikatsiya.",
            "body_md": (
                "## Marshrutlarni ajratish\n\n"
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
                "`Depends` — FastAPI-ning asosiy gʻoyasi: har qanday bogʻliqlik "
                "(MB ulanishi, joriy foydalanuvchi, soʻrov chegarasi) "
                "funksiya + `Depends(...)` orqali ifodalanadi."
            ),
        },
        "sql_sqlalchemy": {
            "title": "7. Ma'lumotlar bazasi: SQL va SQLAlchemy 2.x",
            "summary": "ORM, sessionmaker, async-sessiyalar, migratsiyalar.",
            "body_md": (
                "## Oʻrnatish\n\n"
                "```bash\n"
                "pip install sqlalchemy[asyncio] asyncpg alembic\n"
                "```\n\n"
                "### Model\n"
                "```python\n"
                "from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column\n\n"
                "class Base(DeclarativeBase):\n"
                "    pass\n\n"
                "class User(Base):\n"
                "    __tablename__ = \"users\"\n"
                "    id: Mapped[int] = mapped_column(primary_key=True)\n"
                "    email: Mapped[str] = mapped_column(unique=True, index=True)\n"
                "```\n\n"
                "### Sessiya + asinxron soʻrovlar\n"
                "```python\n"
                "from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine\n"
                "from sqlalchemy import select\n\n"
                "engine = create_async_engine(\"postgresql+asyncpg://user:pw@localhost/db\")\n"
                "Session = async_sessionmaker(engine, expire_on_commit=False)\n\n"
                "async def find_user(email: str) -> User | None:\n"
                "    async with Session() as s:\n"
                "        return await s.scalar(select(User).where(User.email == email))\n"
                "```\n\n"
                "### Migratsiyalar\n"
                "`alembic init alembic` → `alembic revision --autogenerate` → `alembic upgrade head`."
            ),
        },
        "auth_security": {
            "title": "8. Avtorizatsiya: JWT, OAuth2, parol xeshi",
            "summary": "Parollarni xavfsiz saqlash va tokenlar.",
            "body_md": (
                "## Parollar — bcrypt/argon2\n\n"
                "```bash\n"
                "pip install passlib[bcrypt] python-jose[cryptography]\n"
                "```\n\n"
                "```python\n"
                "from passlib.context import CryptContext\n\n"
                "pwd = CryptContext(schemes=[\"bcrypt\"], deprecated=\"auto\")\n"
                "hashed = pwd.hash(\"secret123\")\n"
                "assert pwd.verify(\"secret123\", hashed)\n"
                "```\n\n"
                "### JWT-token\n"
                "```python\n"
                "from jose import jwt\n"
                "from datetime import datetime, timedelta\n\n"
                "SECRET = \"change-me\"  # env-da saqlang\n\n"
                "def issue(user_id: int) -> str:\n"
                "    return jwt.encode(\n"
                "        {\"sub\": str(user_id), \"exp\": datetime.utcnow() + timedelta(hours=24)},\n"
                "        SECRET, algorithm=\"HS256\",\n"
                "    )\n"
                "```\n\n"
                "**Hech qachon** parollarni ochiq saqlamang, sirlarni Git-ga joylamang "
                "va prod-da HTTPS ishlating."
            ),
        },
        "errors_logging": {
            "title": "9. Loglash, xatoliklar va middleware",
            "summary": "structlog/logging, istisno qayta ishlovchilari, request id.",
            "body_md": (
                "## Loglash\n\n"
                "```python\n"
                "import logging\n"
                "logging.basicConfig(level=logging.INFO, format=\"%(levelname)s %(name)s %(message)s\")\n"
                "log = logging.getLogger(\"app\")\n"
                "log.info(\"user %s registered\", user.id)\n"
                "```\n\n"
                "### Global xato qayta ishlovchisi\n"
                "```python\n"
                "from fastapi import Request\n"
                "from fastapi.responses import JSONResponse\n\n"
                "@app.exception_handler(ValueError)\n"
                "async def handle_value_error(_: Request, exc: ValueError):\n"
                "    return JSONResponse(status_code=400, content={\"detail\": str(exc)})\n"
                "```\n\n"
                "### Middleware: request id\n"
                "Har bir soʻrovga noyob `X-Request-ID` qoʻshing — busiz "
                "loglarda insidentlarni izlash mumkin emas."
            ),
        },
        "testing": {
            "title": "10. Testlash: pytest + httpx + fiksturalar",
            "summary": "Yunit testlar, integratsion testlar, test MB-lari.",
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
                "Ishga tushirish: `pytest -q`. Qamrov: `pytest --cov=app`.\n\n"
                "Testlar — qoʻshimcha ish emas, balki kodni prodni buzmasdan "
                "oʻzgartirish vositasidir."
            ),
        },
        "docker_deploy": {
            "title": "11. Docker va deploy",
            "summary": "Dockerfile, docker-compose, atrof-muhit oʻzgaruvchilari.",
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
                "Prod: HTTPS bilan reverse-proxy (nginx/traefik) orqasida ishga tushiring."
            ),
        },
        "production_ready": {
            "title": "12. Produksiyaga tayyorlik",
            "summary": "Healthcheck, metrikalar, migratsiyalar, sirlar, monitoring.",
            "body_md": (
                "## Prod cheklist\n\n"
                "- [ ] `/health` endpoint liveness uchun va `/ready` readiness uchun.\n"
                "- [ ] Sirlar — faqat env/vault orqali, **hech qachon** Git-da emas.\n"
                "- [ ] Migratsiyalar API-ni ishga tushirishdan oldin avtomatik bajariladi.\n"
                "- [ ] Tuzilgan loglar (JSON) + request id.\n"
                "- [ ] Prometheus orqali metrikalar (`prometheus_fastapi_instrumentator`).\n"
                "- [ ] 5xx va sekin soʻrovlar uchun alertlar.\n"
                "- [ ] MB zaxiralari va tiklash rejasi.\n"
                "- [ ] CI/CD: testlar, linter (ruff), formatter (black), obraz qurish.\n\n"
                "Tabriklaymiz — siz Hello World-dan produksiya servisigacha boʻlgan yoʻlni bosib oʻtdingiz!"
            ),
        },
    },
    "quiz": {
        "q1": {
            "question": "Python virtual muhiti nima?",
            "options": [
                {"id": "a", "text": "Python.org dagi bulutli xizmat"},
                {"id": "b", "text": "pip va loyiha bogʻliqliklari boʻlgan izolyatsiyalangan papka"},
                {"id": "c", "text": "Docker konteyneri"},
            ],
            "explanation": "venv bitta loyihaning bogʻliqliklarini tizim Python-idan izolyatsiya qiladi.",
        },
        "q2": {
            "question": "Qaysi freymvork async/await ni qoʻllab-quvvatlaydi va Swagger-ni avtomatik yaratadi?",
            "options": [
                {"id": "a", "text": "Flask"},
                {"id": "b", "text": "FastAPI"},
                {"id": "c", "text": "Tornado"},
            ],
            "explanation": "FastAPI — OpenAPI orqali avtomatik hujjatga ega async-freymvork.",
        },
        "q3": {
            "question": "Async-funksiyada xato bilan time.sleep(2) chaqirdingiz. Nima boʻladi?",
            "options": [
                {"id": "a", "text": "Hech qanday muammo yoʻq — korutina shunchaki kutadi"},
                {"id": "b", "text": "Butun event loop bloklanadi, boshqa soʻrovlar 2 soniya kutadi"},
                {"id": "c", "text": "Python avtomatik chaqiriqni asyncio.sleep ga oʻzgartiradi"},
            ],
            "explanation": "Async kod ichida bloklovchi sleep butun loop-ni toʻxtatadi. await asyncio.sleep ishlating.",
        },
        "q4": {
            "question": "JWT uchun SECRET-ni qayerda saqlash kerak?",
            "options": [
                {"id": "a", "text": "Kodda # TODO almashtirish belgisi bilan"},
                {"id": "b", "text": "Atrof-muhit oʻzgaruvchilari / sir omborida"},
                {"id": "c", "text": ".gitignore ostidagi Git-da"},
            ],
            "explanation": "Sirlar — faqat env/vault orqali. Hech qachon kodda yoki Git-da emas.",
        },
        "q5": {
            "question": "SQLAlchemy loyihasida Alembic nima uchun kerak?",
            "options": [
                {"id": "a", "text": "Bu ORM alternativasi"},
                {"id": "b", "text": "Migratsiyalar orqali MB sxemasini versiyalash uchun"},
                {"id": "c", "text": "Redis-ga ulanish uchun"},
            ],
            "explanation": "Alembic migratsiyalarni boshqaradi: modelga har bir oʻzgartirish revisiya beradi.",
        },
        "q6": {
            "question": "Prodda /health nimani qaytarishi kerak?",
            "options": [
                {"id": "a", "text": "Barcha MB jadvallarining toʻliq JSON-yuklamasini"},
                {"id": "b", "text": "Servis tirik ekanligini tekshirish uchun yengil 200 OK javobini"},
                {"id": "c", "text": "Soʻnggi sutkadagi loglarni"},
            ],
            "explanation": "/health — orkestrator uchun liveness probe, u tez va yon ta'sirsiz boʻlishi kerak.",
        },
    },
}


_ABS_BASICS_UZ = {
    "title": "ABS · Mijozlarga xizmat asoslari",
    "subtitle": "Hisob ochish simulyatoriga tayyorgarlik",
    "description": (
        "Frontofis xodimlari uchun asosiy kurs. Mijoz identifikatsiyasi, mahsulot tanlash "
        "va korporativ ABS-da operatsiyani reglament boʻyicha rasmiylashtirishni oʻrganamiz."
    ),
}

_CRM_UZ = {
    "title": "CRM · Xizmat standarti va shikoyatlarni koʻrib chiqish",
    "subtitle": "Shikoyat simulyatoriga tayyorgarlik",
    "description": (
        "CRM-da mijoz murojaatlari bilan ishlashni oʻrganamiz: empatiya, "
        "kategoriyalash, SLA boʻyicha prioritetlash va toʻgʻri yopish."
    ),
}

_AML_UZ = {
    "title": "AML & Compliance · Shubhali operatsiyalar",
    "subtitle": "Shubhali oʻtkazma simulyatoriga tayyorgarlik",
    "description": (
        "AML pishiqligini oshirish uchun kurs: nazorat chegaralari, majburiy "
        "hujjatlar, watch-list va Compliance-ga eskalatsiya."
    ),
}


COURSE_TRANSLATIONS: dict[str, dict[str, dict]] = {
    "python_backend_az": {"uz": _PYTHON_AZ_UZ},
    "abs_basics": {"uz": _ABS_BASICS_UZ},
    "crm_service_standards": {"uz": _CRM_UZ},
    "aml_compliance": {"uz": _AML_UZ},
}


def localize_course_dict(course: dict, lang: str) -> dict:
    """Apply translations to a built-in course dict (the catalog shape).

    Returns a new dict; the original is not mutated. Falls back to the source
    strings whenever a translation field is missing.
    """
    if lang in (None, "", "ru"):
        return course
    tr = COURSE_TRANSLATIONS.get(course.get("slug", ""), {}).get(lang)
    if not tr:
        return course

    out = dict(course)
    for k in ("title", "subtitle", "description"):
        if k in tr:
            out[k] = tr[k]

    lessons_tr = tr.get("lessons", {})
    if lessons_tr and isinstance(course.get("lessons"), list):
        new_lessons = []
        for lesson in course["lessons"]:
            lt = lessons_tr.get(lesson.get("slug", ""), {})
            merged = {**lesson}
            for k in ("title", "summary", "body_md"):
                if k in lt:
                    merged[k] = lt[k]
            new_lessons.append(merged)
        out["lessons"] = new_lessons

    quiz_tr = tr.get("quiz", {})
    if quiz_tr and isinstance(course.get("quiz"), list):
        new_quiz = []
        for q in course["quiz"]:
            qt = quiz_tr.get(q.get("id", ""), {})
            merged = {**q}
            if "question" in qt:
                merged["question"] = qt["question"]
            if "explanation" in qt:
                merged["explanation"] = qt["explanation"]
            if "options" in qt and isinstance(q.get("options"), list):
                opt_map = {o["id"]: o for o in qt["options"]}
                merged["options"] = [
                    {**o, **({"text": opt_map[o["id"]]["text"]} if o["id"] in opt_map else {})}
                    for o in q["options"]
                ]
            new_quiz.append(merged)
        out["quiz"] = new_quiz
    return out


def localize_course_summary(item: dict, lang: str) -> dict:
    """Localize only the fields shown in the catalog grid."""
    if lang in (None, "", "ru"):
        return item
    tr = COURSE_TRANSLATIONS.get(item.get("slug", ""), {}).get(lang)
    if not tr:
        return item
    out = dict(item)
    for k in ("title", "subtitle", "description"):
        if k in tr:
            out[k] = tr[k]
    return out
