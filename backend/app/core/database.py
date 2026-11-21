from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def create_all_tables() -> None:
    from app.modules.usuarios.models import Usuario
    from app.modules.categorias.models import Categoria
    from app.modules.productos.models import Producto
    from app.modules.pedidos.models import Pedido, DetallePedido

    _ = (Usuario, Categoria, Producto, Pedido, DetallePedido)
    SQLModel.metadata.create_all(engine)


def session_factory() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
