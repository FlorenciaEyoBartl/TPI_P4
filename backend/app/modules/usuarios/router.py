from fastapi import APIRouter, Depends
from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService

router = APIRouter(prefix="/admin/usuarios", tags=["usuarios"])
@router.get("", response_model=list[UserPublic])
def listar(_: Usuario = Depends(require_role("admin"))):
    return UsuarioService().listar()
@router.post("/{entity_id}/activar", response_model=UserPublic)
def activar(entity_id: int, current: Usuario = Depends(require_role("admin"))):
    return UsuarioService().estado(entity_id, True, current)
@router.post("/{entity_id}/desactivar", response_model=UserPublic)
def desactivar(entity_id: int, current: Usuario = Depends(require_role("admin"))):
    return UsuarioService().estado(entity_id, False, current)
