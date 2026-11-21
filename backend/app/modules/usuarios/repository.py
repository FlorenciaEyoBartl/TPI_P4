from sqlmodel import select
from app.core.base_repository import BaseRepository
from app.modules.usuarios.models import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session):
        super().__init__(session, Usuario)

    def by_username(self, username: str) -> Usuario | None:
        return self.session.exec(select(Usuario).where(Usuario.username == username)).first()

    def by_email(self, email: str) -> Usuario | None:
        return self.session.exec(select(Usuario).where(Usuario.email == email)).first()

    def count(self) -> int:
        return len(self.session.exec(select(Usuario)).all())

    def get_page(self, skip: int, limit: int) -> list[Usuario]:
        return list(self.session.exec(select(Usuario).offset(skip).limit(limit)).all())

    def list_all(self) -> list[Usuario]:
        return list(self.session.exec(select(Usuario)).all())
