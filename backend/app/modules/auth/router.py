from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from app.core.config import settings
from app.core.deps import get_current_active_user
from app.core.security import create_access_token
from app.modules.auth.service import AuthService
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserPublic, status_code=201)
def register(data: UserCreate):
    return AuthService().register(data)

@router.post("/token")
def login(response: Response, form: OAuth2PasswordRequestForm = Depends()):
    user = AuthService().authenticate(form.username, form.password)
    response.set_cookie("access_token", create_access_token(user.username), httponly=True, secure=settings.environment == "production", samesite="lax", max_age=settings.access_token_expire_minutes * 60, path="/")
    return {"message": "Login exitoso"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logout exitoso"}

@router.get("/me", response_model=UserPublic)
def me(user: Usuario = Depends(get_current_active_user)):
    return UserPublic.model_validate(user)
