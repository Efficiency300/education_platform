from pydantic import BaseModel


class ScenarioStep(BaseModel):
    id: str
    prompt: str
    options: list[dict]  # [{"id": "a", "text": "...", "correct": bool, "feedback": "...", "points": int}]


class ScenarioOut(BaseModel):
    id: str
    title: str
    description: str
    icon: str = "book"
    difficulty: str = "easy"
    estimated_minutes: int = 5
    customer: dict
    steps: list[ScenarioStep]


class StartSessionRequest(BaseModel):
    user_id: int
    scenario_id: str


class AnswerRequest(BaseModel):
    session_id: int
    step_id: str
    option_id: str


class AnswerResponse(BaseModel):
    correct: bool
    feedback: str
    points_awarded: int
    total_score: int
    next_step_id: str | None
    finished: bool


class SessionOut(BaseModel):
    id: int
    user_id: int
    scenario_id: str
    score: int
    finished: bool
    state: dict

    class Config:
        from_attributes = True
