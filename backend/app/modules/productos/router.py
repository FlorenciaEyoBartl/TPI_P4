from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.exc import IntegrityError
from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.productos.schemas import ProductoCreate, ProductoRead, ProductoStockUpdate, ProductoUpdate, ProductosPaginados
from app.modules.productos.service import ProductoService, ProductoNoEncontrado, CategoriaNoEncontrada

router = APIRouter(prefix="/productos", tags=["productos"])
def get_productos_service(): return ProductoService()
@router.get("", response_model=ProductosPaginados)
def listar(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), search: str | None = None, categoria_id: int | None = None, disponible: bool | None = None, service: ProductoService = Depends(get_productos_service)):
    return service.listar(skip, limit, search, categoria_id, disponible)
@router.get("/{entity_id}", response_model=ProductoRead)
def obtener(entity_id: int, service: ProductoService = Depends(get_productos_service)):
    try: return service.obtener(entity_id)
    except ProductoNoEncontrado: raise HTTPException(404, detail="Producto no encontrado")
@router.post("", response_model=ProductoRead, status_code=201)
def crear(data: ProductoCreate, _: Usuario = Depends(require_role("admin")), service: ProductoService = Depends(get_productos_service)):
    try: return service.crear(data)
    except CategoriaNoEncontrada: raise HTTPException(404, detail="Categoría no encontrada")
    except IntegrityError: raise HTTPException(409, detail="No se pudo guardar el producto por un conflicto de datos")
@router.put("/{entity_id}", response_model=ProductoRead)
def actualizar(entity_id: int, data: ProductoUpdate, _: Usuario = Depends(require_role("admin")), service: ProductoService = Depends(get_productos_service)):
    try: return service.actualizar(entity_id, data)
    except (ProductoNoEncontrado, CategoriaNoEncontrada): raise HTTPException(404, detail="Producto o categoría no encontrada")
    except IntegrityError: raise HTTPException(409, detail="No se pudo actualizar el producto por un conflicto de datos")
@router.patch("/{entity_id}/stock", response_model=ProductoRead)
def stock(entity_id: int, data: ProductoStockUpdate, _: Usuario = Depends(require_role("admin")), service: ProductoService = Depends(get_productos_service)):
    try: return service.stock(entity_id, data)
    except ProductoNoEncontrado: raise HTTPException(404, detail="Producto no encontrado")
    except IntegrityError: raise HTTPException(409, detail="No se pudo actualizar el stock")
@router.delete("/{entity_id}", status_code=204)
def eliminar(entity_id: int, _: Usuario = Depends(require_role("admin")), service: ProductoService = Depends(get_productos_service)):
    try: service.desactivar(entity_id)
    except ProductoNoEncontrado: raise HTTPException(404, detail="Producto no encontrado")
    return Response(status_code=204)
