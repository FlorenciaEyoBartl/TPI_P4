from sqlmodel import select
from fastapi import HTTPException
from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception): pass
class NombreDuplicado(Exception): pass


class CategoriaService:
    def __init__(self, uow=None): self.uow = uow or CategoriaUnitOfWork()

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            rows = uow.session.exec(select(Categoria).where(Categoria.activo.is_(True))).all()
            return [CategoriaRead.model_validate(x) for x in rows]

    def obtener(self, entity_id: int) -> CategoriaRead:
        with self.uow as uow:
            row = uow.categorias.get_by_id(entity_id)
            if row is None or not row.activo: raise CategoriaNoEncontrada()
            return CategoriaRead.model_validate(row)

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            if uow.categorias.by_name(data.nombre): raise NombreDuplicado()
            row = uow.categorias.add(Categoria.model_validate(data))
            return CategoriaRead.model_validate(row)

    def actualizar(self, entity_id: int, data: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            row = uow.categorias.get_by_id(entity_id)
            if row is None or not row.activo: raise CategoriaNoEncontrada()
            values = data.model_dump(exclude_unset=True)
            if "nombre" in values:
                if values["nombre"] is None:
                    raise HTTPException(status_code=422, detail="El nombre no puede ser nulo")
                found = uow.categorias.by_name(values["nombre"])
                if found and found.id != entity_id: raise NombreDuplicado()
            for key, value in values.items(): setattr(row, key, value)
            uow.session.add(row); uow.session.flush()
            return CategoriaRead.model_validate(row)

    def desactivar(self, entity_id: int) -> None:
        with self.uow as uow:
            row = uow.categorias.get_by_id(entity_id)
            if row is None or not row.activo: raise CategoriaNoEncontrada()
            row.activo = False; uow.session.add(row)
