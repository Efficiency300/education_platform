from datetime import datetime
from pydantic import BaseModel


class ProgressOut(BaseModel):
    id: int
    module: str
    kind: str = "simulator"
    completion_pct: float
    points: int
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgressBreakdown(BaseModel):
    simulator_done: int
    simulator_total: int
    courses_done: int
    courses_total: int


class ProgressSummary(BaseModel):
    user_id: int
    full_name: str
    total_points: int
    overall_completion_pct: float
    breakdown: ProgressBreakdown
    modules: list[ProgressOut]
