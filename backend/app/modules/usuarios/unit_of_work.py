from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    def _attach_repositories(self) -> None:
        assert self.session is not None
        self.usuarios = UsuarioRepository(self.session)
