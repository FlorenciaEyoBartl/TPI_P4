from datetime import datetime
import re
from typing import Literal
from pydantic import field_validator
from sqlmodel import Field, SQLModel


class UserCreate(SQLModel):
    username: str = Field(min_length=3, max_length=50)
    full_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8)

    @field_validator("username", "full_name", "email")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        result = value.strip()
        if not result:
            raise ValueError("El campo no puede estar vacío")
        return result

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value) is None:
            raise ValueError("El email no tiene un formato válido")
        return value


class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: Literal["user", "admin"]
    disabled: bool
    created_at: datetime
