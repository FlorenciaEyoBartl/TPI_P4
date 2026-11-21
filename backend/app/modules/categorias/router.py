from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaService, CategoriaNoEncontrada, NombreDuplicado

router = APIRouter(prefix="/categorias", tags=["categorias"])
def get_categorias_service(): return CategoriaService()

@router.get("", response_model=list[CategoriaRead])
def listar(service: CategoriaService = Depends(get_categorias_service)): return service.listar()
@router.get("/{entity_id}", response_model=CategoriaRead)
def obtener(entity_id: int, service: CategoriaService = Depends(get_categorias_service)):
    try: return service.obtener(entity_id)
    except CategoriaNoEncontrada: raise HTTPException(404, detail="Categoría no encontrada")
@router.post("", response_model=CategoriaRead, status_code=201)
def crear(data: CategoriaCreate, _: Usuario = Depends(require_role("admin")), service: CategoriaService = Depends(get_categorias_service)):
    try: return service.crear(data)
    except NombreDuplicado: raise HTTPException(409, detail="Nombre duplicado")
    except IntegrityError: raise HTTPException(409, detail="Nombre duplicado")
@router.put("/{entity_id}", response_model=CategoriaRead)
def actualizar(entity_id: int, data: CategoriaUpdate, _: Usuario = Depends(require_role("admin")), service: CategoriaService = Depends(get_categorias_service)):
    try: return service.actualizar(entity_id, data)
    except CategoriaNoEncontrada: raise HTTPException(404, detail="Categoría no encontrada")
    except NombreDuplicado: raise HTTPException(409, detail="Nombre duplicado")
    except IntegrityError: raise HTTPException(409, detail="Nombre duplicado")
@router.delete("/{entity_id}", status_code=204)
def eliminar(entity_id: int, _: Usuario = Depends(require_role("admin")), service: CategoriaService = Depends(get_categorias_service)):
    try: service.desactivar(entity_id)
    except CategoriaNoEncontrada: raise HTTPException(404, detail="Categoría no encontrada")
    return Response(status_code=204)
