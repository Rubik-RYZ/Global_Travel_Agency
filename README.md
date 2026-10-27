# Illimani Global Travel S.R.L.

Sistema de Información Web para Agencia de Viajes Internacional.
**Equipo**: Brayan · José · Yeral — UMSA Taller de Proyecto 2026.

Documentación de referencia (leer en este orden):

1. [`AGENT.md`](./AGENT.md) — arquitectura, stack y reglas.
2. [`esquema_agencia_viajes.sql`](./esquema_agencia_viajes.sql) — esquema de base de datos.
3. [`SCREENS.md`](./SCREENS.md) — guía de pantallas por sprint.
4. [`design.md_terranova_oficial_definitivo.md`](./design.md_terranova_oficial_definitivo.md) — tokens de diseño (marca Terranova).

## Stack

- **Backend**: Python 3.11 · Django 4.2 LTS · Django REST Framework · PostgreSQL 15
- **Auth**: SimpleJWT + bcrypt (cost 10)
- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS
- **Infra**: Docker Compose

## Puesta en marcha (Docker)

```bash
# 1. Copiar variables de entorno
cp .env.example .env      # (Windows: copy .env.example .env)

# 2. Levantar los servicios
docker compose up --build

# 3. En otra terminal: migrar y poblar datos
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

- Backend: http://localhost:8000/api/v1/
- Frontend: http://localhost:5173/
- Admin Django: http://localhost:8000/admin/

## Estructura

```
backend/     # Django + DRF (arquitectura por capas, organizada por dominio)
frontend/    # React + TS (feature-based)
docs/        # documentación adicional
```
