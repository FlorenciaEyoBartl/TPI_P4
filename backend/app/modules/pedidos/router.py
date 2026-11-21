from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.deps import get_current_active_user, require_role
from app.modules.usuarios.models import Usuario
from app.modules.pedidos.schemas import CambioEstado, PedidoCreate, PedidoRead, PedidosPaginados, ResumenPedidos
from app.modules.pedidos.service import PedidoService, PedidoNoEncontrado, PedidoAjeno, StockInsuficiente, ProductoNoDisponible, ProductoRepetido, TransicionInvalida

router = APIRouter(prefix="/pedidos", tags=["pedidos"])
def get_pedidos_service(): return PedidoService()
def _http(exc: Exception):
    if isinstance(exc, PedidoNoEncontrado): raise HTTPException(404, detail=str(exc) or "Pedido o producto no encontrado")
    if isinstance(exc, PedidoAjeno): raise HTTPException(403, detail="Pedido ajeno")
    if isinstance(exc, TransicionInvalida): raise HTTPException(400, detail="Transición inválida")
    if isinstance(exc, StockInsuficiente): raise HTTPException(400, detail="Stock insuficiente")
    if isinstance(exc, ProductoNoDisponible): raise HTTPException(400, detail="Producto no disponible")
    if isinstance(exc, ProductoRepetido): raise HTTPException(400, detail="Producto repetido")
    raise exc
@router.post("", response_model=PedidoRead, status_code=201)
def crear(data: PedidoCreate, user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(get_pedidos_service)):
    try: return service.crear(user.id, data)
    except (PedidoNoEncontrado, StockInsuficiente, ProductoNoDisponible, ProductoRepetido) as exc: _http(exc)
@router.get("", response_model=PedidosPaginados)
def listar(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), estado: str | None = None, user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(get_pedidos_service)):
    return service.listar(user.id, user.role == "admin", skip, limit, estado)
@router.get("/resumen", response_model=ResumenPedidos)
def resumen(_: Usuario = Depends(require_role("admin")), service: PedidoService = Depends(get_pedidos_service)): return service.resumen()
@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener(pedido_id: int, user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(get_pedidos_service)):
    try: return service.obtener(pedido_id, user.id, user.role == "admin")
    except (PedidoNoEncontrado, PedidoAjeno) as exc: _http(exc)
@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar(pedido_id: int, data: CambioEstado, _: Usuario = Depends(require_role("admin")), user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(get_pedidos_service)):
    try: return service.cambiar_estado(pedido_id, data.estado, user.id, True)
    except (PedidoNoEncontrado, TransicionInvalida) as exc: _http(exc)
@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar(pedido_id: int, user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(get_pedidos_service)):
    try: return service.cambiar_estado(pedido_id, "CANCELADO", user.id, False)
    except (PedidoNoEncontrado, PedidoAjeno, TransicionInvalida) as exc: _http(exc)
