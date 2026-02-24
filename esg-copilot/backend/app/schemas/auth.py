"""Pydantic schemas for auth endpoints"""

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int    # seconds


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str
    company_id: str | None
    is_active: bool
    email_verified: bool = False
    subscription_plan: str = "free"
    subscription_status: str = "inactive"

    model_config = {"from_attributes": True}
