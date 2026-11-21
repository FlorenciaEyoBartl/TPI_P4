from fastapi import HTTPException
from app.core.security import hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

class AuthService:
    def register(self, data: UserCreate) -> UserPublic:
        with UsuarioUnitOfWork() as uow:
            if uow.usuarios.by_username(data.username) or uow.usuarios.by_email(data.email):
                raise HTTPException(status_code=409, detail="Username o email ya registrado")
            user = Usuario(username=data.username, full_name=data.full_name, email=data.email, hashed_password=hash_password(data.password))
            return UserPublic.model_validate(uow.usuarios.add(user))

    def authenticate(self, username: str, password: str) -> Usuario:
        with UsuarioUnitOfWork() as uow:
            user = uow.usuarios.by_username(username)
            if user is None: raise HTTPException(status_code=404, detail="Usuario inexistente")
            if not verify_password(password, user.hashed_password): raise HTTPException(status_code=401, detail="Credenciales incorrectas")
            if user.disabled: raise HTTPException(status_code=400, detail="Cuenta de usuario desactivada")
            # UoW closes the session after returning; return a detached but fully loaded identity.
            uow.session.expunge(user)
            return user
