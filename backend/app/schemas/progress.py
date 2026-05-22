from datetime import datetime
from pydantic import BaseModel


class ProgressOut(BaseModel):
    id: int
    module: str
    completion_pct: float
    points: int
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgressSummary(BaseModel):
    user_id: int
    full_name: str
    total_points: int
    overall_completion_pct: float
    modules: list[ProgressOut]
