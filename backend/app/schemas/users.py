from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    employee_id: str
    email: str = ""
    full_name: str
    role: str = "user"           # user | hr | admin
    position: str = "intern"     # intern | employee
    department: str = ""
    program: str = ""


class UserOut(BaseModel):
    id: int
    employee_id: str
    email: str = ""
    full_name: str
    role: str
    position: str = "intern"
    department: str
    program: str
    job_title: str = ""
    avatar_url: str = ""
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    """User-editable profile fields (no role / job_title — those are admin-managed)."""

    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=512)


# ---------------------------------------------------------------------------
# auth schemas
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    position: str = "intern"
    department: str = ""
    program: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut
