from datetime import date
from sqlmodel import func, select
from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session):
        super().__init__(session, Pedido)

    def with_items(self, pedido_id: int) -> Pedido | None:
        return self.session.exec(select(Pedido).where(Pedido.id == pedido_id)).first()

    def list_page(self, user_id: int, admin: bool, skip: int, limit: int,
                  estado: str | None = None) -> tuple[list[Pedido], int]:
        filters = []
        if not admin:
            filters.append(Pedido.usuario_id == user_id)
        if estado:
            filters.append(Pedido.estado == estado)
        items = list(self.session.exec(select(Pedido).where(*filters).order_by(Pedido.created_at.desc()).offset(skip).limit(limit)).all())
        total = int(self.session.exec(select(func.count()).select_from(Pedido).where(*filters)).one())
        return items, total

    def count_by_estado(self, estado: str) -> int:
        return int(self.session.exec(select(func.count()).select_from(Pedido).where(Pedido.estado == estado)).one())

    def count_created_on(self, day: date) -> int:
        return int(self.session.exec(select(func.count()).select_from(Pedido).where(func.date(Pedido.created_at) == day.isoformat())).one())

    def sum_entregados(self) -> float:
        total = self.session.exec(select(func.sum(Pedido.total)).where(Pedido.estado == "ENTREGADO")).one()
        return float(total or 0.0)
