from app.modules.categorias.models import Categoria
from fastapi import HTTPException
from app.modules.productos.models import Producto
from app.modules.productos.schemas import ProductoCreate, ProductoRead, ProductoStockUpdate, ProductoUpdate, ProductosPaginados
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception): pass
class CategoriaNoEncontrada(Exception): pass


class ProductoService:
    def __init__(self, uow=None): self.uow = uow or ProductoUnitOfWork()

    def listar(self, skip=0, limit=20, search=None, categoria_id=None, disponible=None):
        with self.uow as uow:
            page, total = uow.productos.search_page(skip, limit, search, categoria_id, disponible)
            items = [ProductoRead.model_validate({**row.model_dump(), "categoria": row.categoria}) for row in page]
            return ProductosPaginados(total=total, items=items)

    def obtener(self, entity_id: int) -> ProductoRead:
        with self.uow as uow:
            row = uow.productos.get_by_id(entity_id)
            if row is None or not row.activo: raise ProductoNoEncontrado()
            return ProductoRead.model_validate({**row.model_dump(), "categoria": row.categoria})

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            cat = uow.categorias.get_by_id(data.categoria_id)
            if cat is None or not cat.activo: raise CategoriaNoEncontrada()
            row = uow.productos.add(Producto.model_validate(data))
            return ProductoRead.model_validate({**row.model_dump(), "categoria": cat})

    def actualizar(self, entity_id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            row = uow.productos.get_by_id(entity_id)
            if row is None or not row.activo: raise ProductoNoEncontrado()
            values = data.model_dump(exclude_unset=True)
            for field in ("categoria_id", "nombre", "precio_base", "stock", "disponible"):
                if field in values and values[field] is None:
                    raise HTTPException(status_code=422, detail=f"{field} no puede ser nulo")
            if "precio_base" in values and values["precio_base"] < 0:
                raise HTTPException(status_code=422, detail="precio_base debe ser mayor o igual a cero")
            if "stock" in values and values["stock"] < 0:
                raise HTTPException(status_code=422, detail="stock debe ser mayor o igual a cero")
            if "categoria_id" in values:
                cat = uow.categorias.get_by_id(values["categoria_id"])
                if cat is None or not cat.activo: raise CategoriaNoEncontrada()
            for key, value in values.items(): setattr(row, key, value)
            uow.session.add(row); uow.session.flush(); uow.session.refresh(row)
            return ProductoRead.model_validate({**row.model_dump(), "categoria": row.categoria})

    def stock(self, entity_id: int, data: ProductoStockUpdate) -> ProductoRead:
        return self.actualizar(entity_id, ProductoUpdate(**data.model_dump()))

    def desactivar(self, entity_id: int) -> None:
        with self.uow as uow:
            row = uow.productos.get_by_id(entity_id)
            if row is None or not row.activo: raise ProductoNoEncontrado()
            row.activo = False; uow.session.add(row)
