from fastapi import HTTPException
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

class UsuarioService:
    def listar(self) -> list[UserPublic]:
        with UsuarioUnitOfWork() as uow:
            rows = uow.usuarios.list_all()
            return [UserPublic.model_validate(x) for x in rows]
    def estado(self, entity_id: int, activar: bool, actual: Usuario) -> UserPublic:
        with UsuarioUnitOfWork() as uow:
            user = uow.usuarios.get_by_id(entity_id)
            if user is None: raise HTTPException(status_code=404, detail="Usuario inexistente")
            if not activar and user.id == actual.id: raise HTTPException(status_code=400, detail="No puede desactivarse a sí mismo")
            user.disabled = not activar
            uow.session.add(user)
            return UserPublic.model_validate(user)
