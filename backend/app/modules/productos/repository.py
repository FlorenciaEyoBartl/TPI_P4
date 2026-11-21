from sqlmodel import func, select
from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session):
        super().__init__(session, Producto)

    def all_active(self) -> list[Producto]:
        return list(self.session.exec(select(Producto).where(Producto.activo.is_(True))).all())

    def search_page(self, skip: int, limit: int, search: str | None = None,
                    categoria_id: int | None = None, disponible: bool | None = None) -> tuple[list[Producto], int]:
        filters = [Producto.activo.is_(True)]
        if search:
            filters.append(Producto.nombre.ilike(f"%{search}%"))
        if categoria_id is not None:
            filters.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            filters.append(Producto.disponible == disponible)
        items = list(self.session.exec(select(Producto).where(*filters).offset(skip).limit(limit)).all())
        total = int(self.session.exec(select(func.count()).select_from(Producto).where(*filters)).one())
        return items, total
