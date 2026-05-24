"""Built-in Uzbek translations for the simulator scenarios.

We ship UZ strings inline so the simulator doesn't depend on an LLM being
reachable — the Gemini quota was burning out and users were stuck on RU.

Structure mirrors ``SCENARIOS`` in ``scenarios.py``; only the human-visible
fields are translated. IDs, point values and ``correct`` flags stay the same so
scoring works regardless of locale.
"""
from __future__ import annotations

SCENARIO_TRANSLATIONS: dict[str, dict[str, dict]] = {
    "abs_customer_service": {
        "uz": {
            "title": "ABS · Joriy hisob ochish",
            "description": (
                "Boʻlimga virtual mijoz keladi. Vazifa — mijozni toʻgʻri "
                "identifikatsiya qilish, mahsulotni tanlash va ABS tizimida "
                "operatsiyani reglament asosida yakunlash."
            ),
            "customer": {
                "name": "Alisher Karimov (virtual)",
                "purpose": "Ish haqi olish uchun UZS-da joriy hisob ochish",
            },
            "steps": {
                "s1_identify": {
                    "prompt": "Mijoz oynaga yaqinlashdi. Xizmatni nimadan boshlaysiz?",
                    "options": {
                        "a": {
                            "text": "Darhol ABS-da yangi hisob shaklini ochaman",
                            "feedback": "Avval mijozni identifikatsiya qilish va hujjatni tekshirish kerak.",
                        },
                        "b": {
                            "text": "Salomlashib, hujjat soʻrayman va AML cheklist boʻyicha shaxsini tasdiqlayman",
                            "feedback": "Toʻgʻri. Mijoz identifikatsiyasi — AML reglamenti boʻyicha majburiy qadam.",
                        },
                        "c": {
                            "text": "Ogʻzaki F.I.SH. soʻrayman va soʻziga ishonaman",
                            "feedback": "AML buzilishi: mijoz shaxsi hujjat bilan tasdiqlanadi.",
                        },
                    },
                },
                "s2_product": {
                    "prompt": "Hujjat tekshirildi. Qaysi mahsulot tanlanadi?",
                    "options": {
                        "a": {
                            "text": "UZS-da joriy hisob, «Ish haqi» tarifi",
                            "feedback": "Mijoz maqsadiga mos toʻgʻri tanlov.",
                        },
                        "b": {
                            "text": "USD-da 12 oylik depozit",
                            "feedback": "Mijoz maqsadiga mos emas va qoʻshimcha rozilik talab qiladi.",
                        },
                        "c": {
                            "text": "Visa Gold kredit kartasi",
                            "feedback": "Mijoz kredit mahsuloti soʻramagan.",
                        },
                    },
                },
                "s3_kyc": {
                    "prompt": "ABS-da KYC oynasi paydo boʻldi. Sizning amalingiz?",
                    "options": {
                        "a": {
                            "text": "Barcha KYC maydonlarini toʻldiraman va hujjat skanini ilova qilaman",
                            "feedback": "Aynan shunday — yangi mijoz uchun toʻliq KYC majburiy.",
                        },
                        "b": {
                            "text": "Oʻtkazib yuboraman va keyinroq toʻldiraman",
                            "feedback": "Reglament KYC-siz hisob ochishni taqiqlaydi.",
                        },
                    },
                },
                "s4_confirm": {
                    "prompt": "ABS-da operatsiyani tasdiqlashdan oldin siz:",
                    "options": {
                        "a": {
                            "text": "Shartnomani chop etib, mijozga oʻqitaman va imzo olaman",
                            "feedback": "Toʻgʻri. Mijoz imzosi majburiy shart.",
                        },
                        "b": {
                            "text": "Toʻgʻridan-toʻgʻri ABS-da operatsiyani tasdiqlayman",
                            "feedback": "Imzolanmagan shartnomasiz operatsiya oʻtkazib boʻlmaydi.",
                        },
                    },
                },
                "s5_close": {
                    "prompt": "Hisob ochildi. Mijozga nima berish kerak?",
                    "options": {
                        "a": {
                            "text": "Hisob rekvizitlari, shartnoma nusxasi va internet-bank yoʻriqnomasi",
                            "feedback": "Aʼlo. Bu toʻliq toʻplam.",
                        },
                        "b": {
                            "text": "Faqat ogʻzaki hisob raqamini aytaman",
                            "feedback": "Mijoz hujjatlarni qoʻliga olishi kerak.",
                        },
                    },
                },
            },
        },
        "en": {
            "title": "Core Banking · Opening a current account",
            "description": (
                "A virtual customer walks into the branch. Your job is to "
                "identify them, pick the right product and complete the "
                "operation in the core banking system without breaking policy."
            ),
            "customer": {
                "name": "Alisher Karimov (virtual)",
                "purpose": "Open a UZS current account for salary deposits",
            },
            "steps": {
                "s1_identify": {
                    "prompt": "The customer is at your window. How do you start?",
                    "options": {
                        "a": {
                            "text": "Open the new-account form in the core system right away",
                            "feedback": "Identify the customer and verify the ID first.",
                        },
                        "b": {
                            "text": "Greet them, ask for ID and run the AML checklist",
                            "feedback": "Correct. Customer identification is mandatory under AML policy.",
                        },
                        "c": {
                            "text": "Ask their name verbally and take their word for it",
                            "feedback": "AML violation: identity must be verified by document.",
                        },
                    },
                },
                "s2_product": {
                    "prompt": "ID verified. Which product do you select?",
                    "options": {
                        "a": {
                            "text": "UZS current account, 'Salary' tariff",
                            "feedback": "Right choice for the customer's stated goal.",
                        },
                        "b": {
                            "text": "12-month USD deposit",
                            "feedback": "Doesn't match the goal and needs extra consent.",
                        },
                        "c": {
                            "text": "Visa Gold credit card",
                            "feedback": "The customer didn't ask for a credit product.",
                        },
                    },
                },
                "s3_kyc": {
                    "prompt": "A KYC dialog pops up in the core system. What do you do?",
                    "options": {
                        "a": {
                            "text": "Fill the full KYC profile and attach a scan of the ID",
                            "feedback": "Exactly — a full KYC is required for every new customer.",
                        },
                        "b": {
                            "text": "Skip it and fill it in later",
                            "feedback": "Policy forbids opening an account without full KYC.",
                        },
                    },
                },
                "s4_confirm": {
                    "prompt": "Before confirming the transaction, you:",
                    "options": {
                        "a": {
                            "text": "Print the contract, let the customer read it, get a signature",
                            "feedback": "Correct. A signature is mandatory.",
                        },
                        "b": {
                            "text": "Just confirm the transaction right away",
                            "feedback": "You cannot proceed without a signed contract.",
                        },
                    },
                },
                "s5_close": {
                    "prompt": "Account is open. What do you hand the customer?",
                    "options": {
                        "a": {
                            "text": "Account details, contract copy and digital-banking instructions",
                            "feedback": "Perfect — that's the full handoff.",
                        },
                        "b": {
                            "text": "Just tell them the account number verbally",
                            "feedback": "The customer must walk away with documents in hand.",
                        },
                    },
                },
            },
        },
    },
    "crm_complaint_handling": {
        "uz": {
            "title": "CRM · Mijoz shikoyatini koʻrib chiqish",
            "description": (
                "Mijoz chatda shikoyat yozdi: toʻlov oʻtmadi, lekin pul yechib olindi. "
                "Murojaatni CRM-da toʻgʻri roʻyxatga oling."
            ),
            "customer": {
                "name": "Zarina Yusupova (virtual)",
                "purpose": "1 200 000 UZS toʻlov oʻtmadi, mablagʻ yechib olindi",
            },
            "steps": {
                "c1_greet": {
                    "prompt": "Mijoz hayajonda yozmoqda. Birinchi javobingiz:",
                    "options": {
                        "a": {
                            "text": "«Salom! Tashvishingizni tushunaman, birga koʻrib chiqamiz. Iltimos, operatsiya raqamini ayting.»",
                            "feedback": "Empatiya + aniq savol — xizmat standarti.",
                        },
                        "b": {
                            "text": "«Bu bizning muammomiz emas, qabul qiluvchi bankka murojaat qiling.»",
                            "feedback": "Standart buzilishi: tahlilsiz mas'uliyatni o‘tkazish mumkin emas.",
                        },
                        "c": {
                            "text": "«Kutib turing, men boshqa mijozlar bilan bandman.»",
                            "feedback": "Mijoz bilan bunday muomala qilish mumkin emas — Service Standard buzilishi.",
                        },
                    },
                },
                "c2_category": {
                    "prompt": "CRM-da qaysi murojaat kategoriyasini tanlash kerak?",
                    "options": {
                        "a": {
                            "text": "Moliyaviy daʼvo → Yechib olingan, lekin hisobga oʻtkazilmagan",
                            "feedback": "Toʻgʻri. Bu SLA uchun toʻgʻri kod.",
                        },
                        "b": {
                            "text": "Texnik savol → Internet-bank",
                            "feedback": "Kategoriya SLA-ga taʼsir qiladi — toʻgʻrisini tanlang.",
                        },
                        "c": {
                            "text": "Xodimga shikoyat",
                            "feedback": "Mijoz operatsiyaga, xodimga emas, shikoyat qilmoqda.",
                        },
                    },
                },
                "c3_priority": {
                    "prompt": "Summa — 1.2 mln UZS. Qaysi prioritet beriladi?",
                    "options": {
                        "a": {
                            "text": "High (matritsa boʻyicha — moliyaviy nizolar > 1 mln)",
                            "feedback": "Toʻgʻri. Prioritetlar matritsasi boʻyicha — High.",
                        },
                        "b": {
                            "text": "Low — keyin koʻramiz",
                            "feedback": "Pasaytirilgan prioritet = SLA buzilishi.",
                        },
                    },
                },
                "c4_action": {
                    "prompt": "Keyin nima qilish kerak?",
                    "options": {
                        "a": {
                            "text": "Bayonnoma soʻrayman, ABS-da holatni tekshiraman va hisob-kitob boʻlimiga soʻrov yuboraman",
                            "feedback": "Standart algoritm. Yaxshi.",
                        },
                        "b": {
                            "text": "Oʻz limitimdan darhol pulni qaytaraman",
                            "feedback": "Operatorda bunday vakolat yoʻq.",
                        },
                    },
                },
                "c5_followup": {
                    "prompt": "Murojaatni yopish — nimani majburiy bajarish kerak?",
                    "options": {
                        "a": {
                            "text": "Mijozga javob muddatini aytaman, murojaat raqamini beraman, eslatma qoʻyaman",
                            "feedback": "CRM-murojaatni toʻliq yakunlash toʻplami.",
                        },
                        "b": {
                            "text": "Shunchaki chatni yopaman",
                            "feedback": "Mijoz murojaat raqami va muddatini olishi kerak.",
                        },
                    },
                },
            },
        },
    },
    "abs_money_transfer": {
        "uz": {
            "title": "ABS · Shubhali pul oʻtkazma",
            "description": (
                "Virtual mijoz boshqa davlatga katta summani oʻtkazishni soʻraydi. "
                "Operatsiyani AML cheklist boʻyicha tekshiring va qaror qabul qiling."
            ),
            "customer": {
                "name": "Baxtiyor Rahimov (virtual)",
                "purpose": "Uchinchi davlatdagi jismoniy shaxsga 150 000 USD oʻtkazma",
            },
            "steps": {
                "t1_check_limit": {
                    "prompt": "Summa — 150 000 USD. Bu:",
                    "options": {
                        "a": {
                            "text": "Majburiy AML-nazorat chegarasidan yuqori — qoʻshimcha hujjatlar kerak",
                            "feedback": "Toʻgʻri. Reglament boʻyicha chegara — 100 mln UZS ekvivalenti.",
                        },
                        "b": {
                            "text": "Oddiy summa, standart oʻtkazma sifatida amalga oshiramiz",
                            "feedback": "Bu AML reglamentining buzilishi.",
                        },
                    },
                },
                "t2_documents": {
                    "prompt": "Qanday hujjatlar soʻrash kerak?",
                    "options": {
                        "a": {
                            "text": "Mablagʻ manbasini tasdiqlovchi hujjat, toʻlov maqsadi, shartnoma/invoys",
                            "feedback": "Katta transchegaraviy oʻtkazma uchun toʻliq toʻplam.",
                        },
                        "b": {
                            "text": "Faqat pasport",
                            "feedback": "Transchegaraviy operatsiya uchun yetarli emas.",
                        },
                    },
                },
                "t3_sanctions": {
                    "prompt": "ABS ogohlantirish berdi: qabul qiluvchi watch-list-da. Amalingiz?",
                    "options": {
                        "a": {
                            "text": "Operatsiyani toʻxtatib, Compliance-ga eskalatsiya qilaman",
                            "feedback": "Yagona toʻgʻri amal. Qaror Compliance tomonidan qabul qilinadi.",
                        },
                        "b": {
                            "text": "Eʼtibor bermayman, mijoz hurmatli",
                            "feedback": "AML-ning eng qoʻpol buzilishi. Sanksiyalarga olib kelishi mumkin.",
                        },
                        "c": {
                            "text": "Summani kichraytirib, qismlarga boʻlib oʻtkazaman",
                            "feedback": "Strukturalashtirish — alohida AML buzilishi.",
                        },
                    },
                },
                "t4_report": {
                    "prompt": "Compliance rad etishni tasdiqladi. Mijoz bilan nima qilasiz?",
                    "options": {
                        "a": {
                            "text": "AML sabablarini ochmasdan, xushmuomalalik bilan rad etish haqida xabar beraman",
                            "feedback": "Toʻgʻri. AML rad etish sabablari mijozga ochilmaydi.",
                        },
                        "b": {
                            "text": "U watch-list-da ekanligini batafsil tushuntiraman",
                            "feedback": "Bu bank sirini ochish va AML buzilishi.",
                        },
                    },
                },
            },
        },
    },
}


def localize_scenario(scenario: dict, lang: str) -> dict:
    """Return a copy of ``scenario`` with UZ/EN overrides applied.

    ``scenario`` is whatever ``scenarios.py`` shipped (RU is the source of
    truth). Falls back to the original strings whenever a translation is
    missing so the page still renders.
    """
    if lang in (None, "", "ru"):
        return scenario
    tr = SCENARIO_TRANSLATIONS.get(scenario.get("id", ""), {}).get(lang)
    if not tr:
        return scenario

    out = dict(scenario)
    if "title" in tr:
        out["title"] = tr["title"]
    if "description" in tr:
        out["description"] = tr["description"]
    if "customer" in tr and isinstance(scenario.get("customer"), dict):
        out["customer"] = {**scenario["customer"], **tr["customer"]}

    steps_tr = tr.get("steps", {})
    if steps_tr:
        new_steps = []
        for step in scenario.get("steps", []):
            st_tr = steps_tr.get(step["id"], {})
            new_step = {**step}
            if "prompt" in st_tr:
                new_step["prompt"] = st_tr["prompt"]
            opts_tr = st_tr.get("options", {})
            if opts_tr:
                new_options = []
                for opt in step.get("options", []):
                    opt_tr = opts_tr.get(opt["id"], {})
                    merged = {**opt}
                    if "text" in opt_tr:
                        merged["text"] = opt_tr["text"]
                    if "feedback" in opt_tr:
                        merged["feedback"] = opt_tr["feedback"]
                    new_options.append(merged)
                new_step["options"] = new_options
            new_steps.append(new_step)
        out["steps"] = new_steps
    return out
