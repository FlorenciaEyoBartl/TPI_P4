from typing import Callable
from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session, select
from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario

def get_current_user(request: Request, session: Session = Depends(session_factory)) -> Usuario:
    token = request.cookies.get("access_token")
    subject = decode_access_token(token) if token else None
    if subject is None: raise HTTPException(status_code=401, detail="No autenticado")
    user = session.exec(select(Usuario).where(Usuario.username == subject)).first()
    if user is None: raise HTTPException(status_code=404, detail="Usuario inexistente")
    return user

def get_current_active_user(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.disabled: raise HTTPException(status_code=400, detail="Cuenta de usuario desactivada")
    return user

def require_role(role: str) -> Callable:
    def checker(user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if user.role != role: raise HTTPException(status_code=403, detail="Rol no permitido")
        return user
    return checker
