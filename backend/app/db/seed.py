from sqlmodel import Session, select
from app.core.database import create_all_tables, engine
from app.core.security import hash_password
from app.modules.usuarios.models import Usuario
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto

def seed() -> None:
    create_all_tables()
    with Session(engine) as session:
        admin = session.exec(select(Usuario).where(Usuario.username == "admin")).first()
        if admin is None:
            session.add(Usuario(username="admin", full_name="Administrador", email="admin@foodstore.local", hashed_password=hash_password("Admin1234!"), role="admin"))
        names = [("Hamburguesas", "Hamburguesas artesanales"), ("Pizzas", "Pizzas al horno"), ("Bebidas", "Bebidas frías")]
        cats: list[Categoria] = []
        for name, desc in names:
            cat = session.exec(select(Categoria).where(Categoria.nombre == name)).first()
            if cat is None: cat = Categoria(nombre=name, descripcion=desc); session.add(cat); session.flush()
            cats.append(cat)
        products = [("Clásica", 6500, 0), ("Doble queso", 8200, 0), ("Veggie", 7100, 0), ("Muzzarella", 9000, 1), ("Napolitana", 10500, 1), ("Fugazzeta", 11500, 1), ("Agua mineral", 1800, 2), ("Gaseosa", 2200, 2)]
        for name, price, index in products:
            if session.exec(select(Producto).where(Producto.nombre == name)).first() is None:
                session.add(Producto(categoria_id=cats[index].id, nombre=name, precio_base=price, stock=20, disponible=True))
        session.commit()

if __name__ == "__main__": seed()
