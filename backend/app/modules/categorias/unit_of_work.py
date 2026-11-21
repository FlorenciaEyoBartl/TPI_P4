from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository


class CategoriaUnitOfWork(UnitOfWork):
    def _attach_repositories(self) -> None:
        assert self.session is not None
        self.categorias = CategoriaRepository(self.session)
