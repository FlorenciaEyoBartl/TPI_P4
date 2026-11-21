from datetime import datetime, timezone
from sqlmodel import select
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import CambioEstado, PedidoCreate, PedidoRead, PedidosPaginados, ResumenPedidos
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.models import Producto

class PedidoNoEncontrado(Exception): pass
class PedidoAjeno(Exception): pass
class StockInsuficiente(Exception): pass
class ProductoNoDisponible(Exception): pass
class ProductoRepetido(Exception): pass
class TransicionInvalida(Exception): pass

TRANSITIONS = {"PENDIENTE": {"EN_PREPARACION", "CANCELADO"}, "EN_PREPARACION": {"ENTREGADO", "CANCELADO"}, "ENTREGADO": set(), "CANCELADO": set()}

def _read(session, pedido: Pedido) -> PedidoRead:
    session.refresh(pedido)
    return PedidoRead.model_validate({**pedido.model_dump(), "items": pedido.items})

class PedidoService:
    def __init__(self, uow=None): self.uow = uow or PedidoUnitOfWork()

    def crear(self, usuario_id: int, data: PedidoCreate) -> PedidoRead:
        with self.uow as uow:
            ids = [item.producto_id for item in data.items]
            if len(ids) != len(set(ids)): raise ProductoRepetido()
            pedido = Pedido(usuario_id=usuario_id, forma_pago=data.forma_pago, direccion_entrega=data.direccion_entrega, notas=data.notas, total=0)
            uow.session.add(pedido); uow.session.flush()
            total = 0.0
            for item in data.items:
                # AUDIT: lock pesimista para evitar sobreventa. SQLite ignora FOR UPDATE en desarrollo.
                producto = uow.session.exec(
                    select(Producto).where(Producto.id == item.producto_id).with_for_update()
                ).first()
                if producto is None or not producto.activo: raise PedidoNoEncontrado("Producto inexistente")
                if not producto.disponible: raise ProductoNoDisponible()
                if producto.stock < item.cantidad: raise StockInsuficiente()
                producto.stock -= item.cantidad; uow.session.add(producto)
                subtotal = producto.precio_base * item.cantidad
                uow.session.add(DetallePedido(pedido_id=pedido.id, producto_id=producto.id, cantidad=item.cantidad,
                    nombre_producto=producto.nombre, precio_unitario=producto.precio_base, subtotal=subtotal))
                total += subtotal
            pedido.total = total; uow.session.add(pedido); uow.session.flush()
            return _read(uow.session, pedido)

    def listar(self, user_id: int, admin: bool, skip=0, limit=20, estado=None) -> PedidosPaginados:
        with self.uow as uow:
            rows, total = uow.pedidos.list_page(user_id, admin, skip, limit, estado)
            return PedidosPaginados(total=total, items=[_read(uow.session, row) for row in rows])

    def obtener(self, pedido_id: int, user_id: int, admin: bool) -> PedidoRead:
        with self.uow as uow:
            row = uow.pedidos.get_by_id(pedido_id)
            if row is None: raise PedidoNoEncontrado()
            if not admin and row.usuario_id != user_id: raise PedidoAjeno()
            return _read(uow.session, row)

    def cambiar_estado(self, pedido_id: int, estado: str, user_id: int, admin: bool) -> PedidoRead:
        with self.uow as uow:
            row = uow.pedidos.get_by_id(pedido_id)
            if row is None: raise PedidoNoEncontrado()
            if not admin and row.usuario_id != user_id: raise PedidoAjeno()
            if not admin and (estado != "CANCELADO" or row.estado != "PENDIENTE"): raise TransicionInvalida()
            if estado not in TRANSITIONS.get(row.estado, set()): raise TransicionInvalida()
            if estado == "CANCELADO":
                for line in row.items:
                    product = uow.productos.get_by_id(line.producto_id)
                    if product is not None: product.stock += line.cantidad; uow.session.add(product)
            row.estado = estado; row.updated_at = datetime.now(timezone.utc); uow.session.add(row); uow.session.flush()
            return _read(uow.session, row)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            today = datetime.now(timezone.utc).date()
            return ResumenPedidos(
                pendientes=uow.pedidos.count_by_estado("PENDIENTE"),
                en_preparacion=uow.pedidos.count_by_estado("EN_PREPARACION"),
                entregados=uow.pedidos.count_by_estado("ENTREGADO"),
                cancelados=uow.pedidos.count_by_estado("CANCELADO"),
                pedidos_hoy=uow.pedidos.count_created_on(today),
                ingresos_entregados=uow.pedidos.sum_entregados(),
            )
