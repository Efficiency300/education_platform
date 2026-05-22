from datetime import datetime
from pydantic import BaseModel


class UserCreate(BaseModel):
    employee_id: str
    full_name: str
    role: str = "intern"
    department: str = ""
    program: str = ""


class UserOut(BaseModel):
    id: int
    employee_id: str
    full_name: str
    role: str
    department: str
    program: str
    created_at: datetime

    class Config:
        from_attributes = True
