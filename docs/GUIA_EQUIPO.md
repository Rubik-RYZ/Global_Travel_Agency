# Guía rápida del equipo

Estado del proyecto y cómo levantar todo en local. Para el detalle técnico
completo, ver [`../README.md`](../README.md) y [`../AGENT.md`](../AGENT.md).

## Cómo levantar (Docker)

```bash
cp .env.example .env          # Windows: copy .env.example .env
docker compose up --build

# en otra terminal:
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

- Frontend: http://localhost:5173/
- Backend (API): http://localhost:8000/api/v1/
- Admin Django: http://localhost:8000/admin/

> El `.env` **no se versiona**: pídanlo por privado. Si faltan las claves de
> Cloudinary o Resend, el sistema **igual funciona**: solo se deshabilita la
> subida de imágenes (con aviso en pantalla) y los correos se imprimen en el log.

## Usuarios de prueba (los crea `seed_data`)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@illimanitravel.bo` | `Admin12345` |
| Cliente (viajero) | `cliente@illimanitravel.bo` | `Cliente12345` |

## Qué ya está hecho (Sprint 2)

- **CU1 — Acceso**: login/registro/recuperación con JWT, roles (admin/agente/
  cliente), bitácora de auditoría y panel de equipo.
- **CU2 — Clientes y preferencias**: área «Mi viaje» del viajero (`/mi-cuenta`),
  directorio y ficha del viajero en el panel.
- **CU3 — Destinos y proveedores**: landing, explorador y ficha de destino;
  atlas de destinos y libreta de proveedores en el panel.
- **Fase 3b**: subida de imágenes a Cloudinary (destinos, proveedores, retratos y
  documentos del viajero) y correo transaccional con Resend.
- 117 pruebas de backend en verde; `tsc` y `vite build` limpios.

## Qué falta

- **Sprint 3**: CU4 vuelos, CU5 hoteles, CU6 paquetes y salidas programadas.
- **Sprint 4**: CU7 reservas, CU8 itinerarios/notificaciones, CU9 pagos.
- **Sprint 5**: CU10 chatbot, CU11 recomendaciones, CU12 reportes.

## Reglas mínimas (no negociables)

1. **Arquitectura por capas**: la lógica de negocio va en `services.py`; los
   ViewSets solo orquestan.
2. **Todo el HTTP del frontend pasa por `src/api/`**. Ninguna view llama a
   `axios` directo.
3. **Nunca commitear `.env`** ni secretos (Cloudinary, Resend, Stripe).
4. Las imágenes se guardan como **URL + `public_id`** en la base.
5. Si cambian un modelo, **actualicen `esquema_agencia_viajes.sql`** y generen la
   migración.
6. El seed es idempotente: `docker compose exec backend python manage.py seed_data`.

## Dónde mirar

- [`../AGENT.md`](../AGENT.md) — arquitectura, stack y convenciones.
- [`../esquema_agencia_viajes.sql`](../esquema_agencia_viajes.sql) — diseño completo de la base.
- [`esquema_implementado.sql`](./esquema_implementado.sql) — DDL real de lo implementado (para el ER).
- [`../SCREENS.md`](../SCREENS.md) — guía de pantallas por sprint.
