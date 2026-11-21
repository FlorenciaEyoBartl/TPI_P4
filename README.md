# Food Store — TPI Programación 4

Aplicación de pedidos de comida con API FastAPI/SQLModel y cliente React/TypeScript. La API publica OpenAPI en `/docs` y `/redoc`.

## Requisitos

- Python 3.11, 3.12 o 3.13.
- Node.js 20.19 o posterior y pnpm 9 o posterior.
- SQLite para desarrollo (incluido) o PostgreSQL 15+ para despliegue.

## Backend

Desde la raíz:

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
python -m app.db.seed
uvicorn app.main:app --reload
```

`backend/.env.example` y `backend/.env.sqlite.example` son plantillas para SQLite. Para elegir SQLite, copiá `.env.sqlite.example` como `.env` (o usá `.env.example`). Para PostgreSQL 15+, creá primero la base `food_store` y copiá `.env.postgresql.example` como `.env`; después reemplazá `CHANGE_ME` y, si corresponde, el usuario, host o puerto en `DATABASE_URL`. No copies ninguna plantilla por encima de un `.env` ya configurado.

El seed es idempotente y crea admin `admin` / `Admin1234!`, tres categorías y ocho productos. Cambiá la clave del administrador y `SECRET_KEY` antes de exponer el servicio.

## Frontend

En otra terminal, desde la raíz:

```powershell
cd frontend
Copy-Item .env.example .env
corepack enable
pnpm install
pnpm dev
```

La aplicación abre en `http://localhost:5173`. `VITE_API_URL` apunta por defecto a `http://localhost:8000/api/v1`.

## Verificación CE-05 / CE-06

**CE-05 — backend y API:** desde `backend`, activar el virtualenv indicado arriba y ejecutar:

```powershell
pip install -r requirements.txt
python -m app.db.seed
uvicorn app.main:app --reload
```

Esperado: proceso activo en `http://localhost:8000`, `http://localhost:8000/health` responde `{"status":"ok"}` y `/docs` y `/redoc` muestran los endpoints `/api/v1`, incluido `GET /api/v1/admin/usuarios` como array.

**CE-06 — frontend:** desde `frontend`:

```powershell
pnpm install
pnpm build
pnpm dev
```

Esperado: `pnpm build` termina con código 0 sin errores TypeScript; `pnpm dev` sirve la interfaz en `http://localhost:5173`.

CE-05 y CE-06 corresponden a los criterios de ejecución del backend y frontend, respectivamente, indicados en las páginas 22–23 de la consigna.

### Prueba manual de stock concurrente (PostgreSQL)

Usá PostgreSQL y un producto activo/disponible con stock 1. Iniciá dos sesiones de usuario en terminales o navegadores separados y enviá casi simultáneamente un `POST /api/v1/pedidos` en cada sesión con el mismo producto y cantidad 1. Se espera un `201` y un `400 Stock insuficiente`; una consulta posterior debe mostrar stock 0, nunca negativo. `SELECT ... FOR UPDATE` serializa la lectura/descuento en PostgreSQL. SQLite de desarrollo no implementa el bloqueo `FOR UPDATE`, por lo que esta prueba de concurrencia debe ejecutarse con PostgreSQL.

## Variables de entorno

Backend: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `FRONTEND_ORIGIN`, `ENVIRONMENT`. Frontend: `VITE_API_URL`. Los archivos `backend/.env.example` y `frontend/.env.example` documentan valores de desarrollo.

## API y arquitectura

Los endpoints están bajo `/api/v1`. Las categorías, productos y pedidos usan Service → Unit of Work → Repository; el UoW confirma solo al salir sin excepciones y revierte ante errores. Los pedidos guardan una copia del nombre y precio de cada producto y se cancelan mediante transición de estado, reponiendo existencias en la misma transacción.

## Auditoría de consigna

| Criterio | Implementación |
|---|---|
| [1] Backend, config y seed | Cumplido: `backend/app/core`, `backend/app/db/seed.py`, `backend/requirements.txt` |
| [2] Modelos y relaciones | Cumplido: `backend/app/modules/{usuarios,categorias,productos,pedidos}/models.py` |
| [3] UoW y repositorios | Cumplido: UoW/Repository; `ProductoRepository.search_page` y `PedidoRepository.list_page` aplican LIMIT/OFFSET y COUNT con los mismos filtros |
| [4] Auth y usuarios | Cumplido: `backend/app/modules/auth`, `modules/usuarios`, `backend/app/core/deps.py`; `GET /api/v1/admin/usuarios` responde `list[UserPublic]` |
| [5] Catálogo | Cumplido: `backend/app/modules/categorias/router.py`, `productos/router.py`; PATCH de stock en `/productos/{id}/stock` según tabla API del PDF, actualización parcial y conflictos de integridad traducidos a 409 |
| [6] Pedidos y RN-01–06 | Cumplido: `PedidoService.crear` bloquea productos con `FOR UPDATE` en PostgreSQL y mantiene RN atómicas |
| [7] Cliente | Implementado: auth, catálogo, carrito, checkout, historial, detalle de pedido y cancelación en `frontend/src/features` |
| [8] Panel admin | Implementado: CRUD de categorías/productos en `frontend/src/features/categorias/pages/AdminCategoriasPage.tsx` y `features/productos/pages/AdminProductosPage.tsx`; resumen, pedidos y usuarios en `features/usuarios/pages/AdminPages.tsx` |
| [9] Estado y sesión | Implementado: stores, Axios, guardas y Query; `useCrearPedido` invalida pedidos, resumen y productos |
| [10] Entrega | Requisitos, variables, comandos y lockfile documentados; la URL pública de GitHub queda pendiente y el backend no se pudo arrancar porque este entorno solo tiene Python 3.14 |

### Reglas de negocio de pedidos

- RN-01: `PedidoService.crear`: detecta productos repetidos, valida estado y stock, descuenta y copia nombre/precio por línea dentro de un único UoW.
- RN-02: `TRANSITIONS` y `PedidoService.cambiar_estado` aplican el mapa de transiciones.
- RN-03: `PedidoService.cambiar_estado`, al pasar a CANCELADO, repone stock y cambia estado dentro del mismo UoW.
- RN-04: `PedidoService.listar`, `obtener` y `cambiar_estado` aplican el alcance dueño/admin.
- RN-05: no existen endpoints de edición o borrado de pedidos/líneas; total y líneas se fijan al crear.
- RN-06: `PedidoCreate` valida forma de pago y longitud de dirección.

## URL del repositorio
https://github.com/FlorenciaEyoBartl/TPI_P4.git

## Link al video 
https://drive.google.com/file/d/1u9aKEuuW-CMFKBk-neYw2fYZGhTew9fK/view?usp=sharing

