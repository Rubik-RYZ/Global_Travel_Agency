# Illimani Global Travel S.R.L.

Sistema de Información Web para Agencia de Viajes Internacional.  
**Equipo**: Brayan · José · Yeral — UMSA Taller de Proyecto 2026

---

## Descripción del sistema

Tour operador que gestiona su **propio inventario** de vuelos, hoteles y paquetes turísticos internacionales — no conecta a GDS externos (sin Amadeus, sin Sabre). El sistema cubre: autenticación y roles, catálogo de destinos, reservas con itinerarios, pagos en línea, asistente conversacional con NLP y reportes gerenciales.

El equipo trabaja en 4 sprints de desarrollo (S2–S5). La base de datos ya está diseñada y versionada en el repositorio.

---

## Stack tecnológico

**Backend**: Python 3.11 · Django 4.2 LTS · Django REST Framework · PostgreSQL 15  
**Autenticación**: `djangorestframework-simplejwt` · bcrypt (cost 10) — sin Firebase  
**Imágenes**: Cloudinary (SDK `cloudinary`, app `apps.almacen`) — la base guarda la URL y el `public_id`  
**Pagos**: Stripe modo test (PaymentIntent API)  
**Emails**: Resend (llamadas síncronas — sin Celery, sin Redis)  
**Moneda**: ExchangeRate-API (BOB/USD, free tier)  
**Aeropuertos**: OurAirports CSV (carga única con management command)  
**IA/NLP**: scikit-learn — pipeline TF-IDF + LogisticRegression, 7 intents  
**Mapas**: Leaflet + OpenStreetMap (sin costo)

**Frontend**: React 18 · TypeScript · Vite  
**Estilos**: Tailwind CSS  
**Animaciones**: Framer Motion — no usar GSAP  
**Estado global**: Zustand (auth + flujo de reserva)  
**Formularios**: React Hook Form + Zod  
**HTTP**: Axios con interceptor JWT  
**Routing**: React Router v6 con rutas protegidas  
**Iconos**: Heroicons  
**Infraestructura**: Docker Compose (backend + frontend + PostgreSQL) (quiza luego el modelo de ai)

Lo que NO se usa: Firebase · Redis · Celery · Amadeus · GDS · microservicios · Django templates para UI

---

## Arquitectura Django — Layered Architecture orientada a dominio

El proyecto NO sigue MVC. La arquitectura es **por capas con organización por dominio (apps)**, un patrón estándar en proyectos Django REST de escala media en la industria. Cada app encapsula un dominio completo del negocio con sus propias capas internas.

```
apps/
├── almacen/        → Fase 3b (subida de archivos al almacén externo)
├── notificaciones/ → Fase 3b (correo transaccional de la casa)
├── usuarios/       → CU1 (acceso/seguridad) + CU2 (clientes/preferencias)
├── catalogo/       → CU3 (destinos/proveedores) + CU4 (vuelos) + CU5 (hoteles) + CU6 (paquetes/salidas)
├── reservas/       → CU7 (reservas) + CU8 (itinerarios/notificaciones)
├── pagos/          → CU9 (pagos/tipos de cambio)
├── ia/             → CU10 (chatbot) + CU11 (recomendaciones)
└── reportes/       → CU12 (reportes gerenciales)
```

Cada app tiene esta estructura de capas:

```
<app>/
├── models.py           # Capa de dominio: entidades y relaciones
├── managers.py         # QuerySets reutilizables (solo cuando la complejidad lo justifique)
├── serializers.py      # Capa de esquema: validación de entrada y serialización de salida
├── services.py         # Capa de negocio: toda la lógica del dominio vive aquí
├── views.py            # Capa de presentación: ViewSets delgados, solo orquestan
├── permissions.py      # Permisos por dominio (IsAdminUser, IsOwner, etc.)
├── urls.py             # Registro de routers DRF
└── tests/
    ├── test_models.py
    ├── test_services.py
    └── test_api.py
```

### Reglas de capas (no negociables)

- **`services.py` es el corazón.** Toda lógica de negocio, validaciones de dominio, operaciones atómicas y llamadas a servicios externos van aquí. Los ViewSets llaman a services, no procesan lógica directamente.
- **ViewSets son delgados.** Solo reciben request, llaman al service correcto y devuelven Response. Si un ViewSet supera 20 líneas por acción, algo de lógica debería estar en services.
- **FK entre apps: siempre como string.** `ForeignKey('usuarios.Cliente', ...)` — nunca import directo de modelos de otra app dentro de `models.py`.
- **`managers.py` es opcional.** Solo agregar cuando haya querysets complejos que se repiten en varios services o views.
- **Usar ViewSets + Routers DRF**, no `APIView` genéricas salvo casos justificados (webhooks, endpoints no-CRUD).
- **`SELECT FOR UPDATE`** obligatorio en cualquier operación que decremente `cupos_disponibles` en `PaqueteSalida` para prevenir overbooking.
- **Resend se llama sincrónicamente** dentro del service, justo después de la operación que dispara el email. Sin colas, sin tasks asíncronas.
- **Los servicios externos degradan con elegancia.** Si faltan las credenciales de Cloudinary o Resend, el sistema sigue operando: se deshabilita la subida (con aviso en pantalla) o se imprime el correo en el log, y se deja constancia en `Auditoria`. Nunca un error 500.
- **La firma del almacén vive sólo en el servidor.** El navegador sube el archivo al backend (`/api/v1/almacen/subir/`) y éste lo reenvía firmado; las credenciales nunca llegan al cliente.
- **Los secretos de proveedores NUNCA se almacenan.** El campo en DB es `secreto_ref` (una referencia o alias), no el secreto real.

---

## Arquitectura React — Feature-based por directorios

El frontend es una SPA completamente separada del backend Django. La organización es **por feature/dominio**, donde cada módulo funcional tiene su propio directorio con sus vistas y sus componentes internos.

```
src/
├── api/
│   ├── auth.ts
│   ├── catalogo.ts
│   ├── reservas.ts
│   ├── pagos.ts
│   ├── ia.ts
│   └── reportes.ts
│
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Card/
│   │   ├── Badge/
│   │   └── Table/
│   ├── layout/
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx
│   │   │   └── components/
│   │   │       ├── NavLinks.tsx
│   │   │       └── UserMenu.tsx
│   │   ├── Footer/
│   │   ├── AppLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   └── AdminLayout.tsx
│   └── shared/
│       ├── MapaDestino/
│       │   ├── MapaDestino.tsx
│       │   └── components/
│       │       └── MarkerPopup.tsx
│       └── ChatbotWidget/
│           ├── ChatbotWidget.tsx
│           └── components/
│               ├── MensajeItem.tsx
│               └── InputChat.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useReservaFlow.ts
│
├── layouts/         # Re-exportaciones o wrappers si se necesitan
│
├── lib/
│   ├── axios.ts     # Instancia Axios + interceptor JWT automático
│   └── motion.ts    # Variantes Framer Motion reutilizables del proyecto
│
├── store/
│   ├── authStore.ts
│   └── reservaStore.ts
│
├── types/
│   ├── auth.types.ts
│   ├── catalogo.types.ts
│   ├── reserva.types.ts
│   ├── pago.types.ts
│   └── ia.types.ts
│
├── utils/
│   ├── formatters.ts    # Fechas, monedas BOB/USD, duración vuelo
│   ├── validators.ts    # Helpers Zod comunes
│   └── roles.ts         # Constantes ADMIN, AGENTE, CLIENTE
│
├── views/
│   ├── home/
│   │   ├── HomeView.tsx
│   │   └── components/
│   │       ├── HeroSection.tsx
│   │       ├── DestinosDestacados.tsx
│   │       └── BuscadorRapido.tsx
│   │
│   ├── auth/
│   │   ├── LoginView.tsx
│   │   ├── RegisterView.tsx
│   │   └── components/
│   │       ├── LoginForm.tsx
│   │       └── RegisterForm.tsx
│   │
│   ├── catalogo/
│   │   ├── CatalogoView.tsx
│   │   ├── DetallePaqueteView.tsx
│   │   └── components/
│   │       ├── PaqueteCard.tsx
│   │       ├── FiltrosBusqueda.tsx
│   │       └── GaleriaDestino.tsx
│   │
│   ├── reservas/
│   │   ├── NuevaReservaView.tsx
│   │   ├── MisReservasView.tsx
│   │   ├── ItinerarioView.tsx
│   │   └── components/
│   │       ├── PasoSeleccion.tsx
│   │       ├── PasoPasajeros.tsx
│   │       ├── PasoPago.tsx
│   │       └── ResumenReserva.tsx
│   │
│   ├── pagos/
│   │   ├── PagoView.tsx
│   │   ├── ConfirmacionView.tsx
│   │   └── components/
│   │       └── StripeForm.tsx
│   │
│   └── admin/
│       ├── DashboardView.tsx
│       ├── GestionPaquetesView.tsx
│       ├── GestionReservasView.tsx
│       ├── GestionClientesView.tsx
│       ├── ReportesView.tsx
│       └── components/
│           ├── TablaReservas.tsx
│           ├── GraficoVentas.tsx
│           ├── FiltroPeriodo.tsx
│           └── ExportarReporte.tsx
│
├── main.tsx
└── router.tsx
```

### Reglas del frontend

- Cada view de `views/` corresponde a una ruta del router. No renderizar views directamente desde otra view. Dentro tendra por carpeta agrupadas sus views por modulo o partes q necesite y estara relacionando igual con las carpetas de los modulos de components q usa el mismo modulo en sus views.
- Los componentes de `components/ui/` son genéricos, sin lógica de negocio. Los de `components/shared/` conocen el dominio del proyecto.
- Los componentes específicos de una sola view viven en `views/<feature>/components/`, no en `components/`.
- Todo acceso HTTP pasa por `src/api/`. Las views nunca llaman `axios` directamente.
- El estado global de sesión (token, usuario) vive en `authStore`. El flujo multi-paso de reserva vive en `reservaStore`. El resto es estado local de componente.
- Validación de formularios con Zod + React Hook Form. Los schemas Zod van en `types/`.
- Animaciones de transición de página y cards con Framer Motion. No instalar otras librerías de animación.

---

## Casos de uso y responsables

| CU | Dominio | Responsable | Sprint |
|---|---|---|---|
| CU1 | Seguridad y acceso (roles, JWT, auditoría) | Brayan | S2 |
| CU2 | Clientes y preferencias | Brayan | S2 |
| CU3 | Destinos y proveedores | Brayan | S2 |
| CU4 | Gestión de vuelos | Brayan | S3 |
| CU5 | Hoteles | José | S3 |
| CU6 | Paquetes turísticos y salidas programadas | José | S3 |
| CU7 | Reservas | José | S4 |
| CU8 | Itinerarios y notificaciones | José | S4 |
| CU9 | Pagos y tipos de cambio | Yeral | S4 |
| CU10 | Asistente conversacional (NLP) | Yeral | S5 |
| CU11 | Recomendaciones personalizadas | Yeral | S5 |
| CU12 | Reportes gerenciales | Yeral | S5 |

**Actores**: Administrador · Agente · Cliente · Sistema

---

## Sprints

| Sprint | Fechas |
|---|---|
| S1 — Análisis y base | Oct 19–21 |
| S2 — CU1, CU2, CU3 (Brayan) | Oct 22–28 |
| S3 — CU4 (Brayan) · CU5, CU6 (José) | Oct 29–Nov 4 |
| S4 — CU7, CU8 (José) · CU9 (Yeral) | Nov 5–11 |
| S5 — CU10, CU11, CU12 (Yeral) | Nov 12–18 |

2da entrega: 9–10 Nov · Entrega final: 24–25 Nov

**Estrategia de integración**: El esqueleto del proyecto (estructura de apps, settings, modelos base) debe estar listo antes del inicio de S2 para que los tres miembros puedan trabajar en paralelo sin conflictos. Las FK entre apps se definen siempre como string para evitar imports circulares.

---

## Servicios externos

| Servicio | Para qué | Notas |
|---|---|---|
| Cloudinary | Almacenamiento de imágenes | Free tier, SDK `cloudinary` (app `apps.almacen`) |
| Stripe | Pagos (modo test) | PaymentIntent, webhook directo en view |
| Resend | Emails transaccionales | Síncrono, sin cola (app `apps.notificaciones`) |
| ExchangeRate-API | Conversión BOB/USD | Free tier, cachear en DB recomendado |
| OurAirports CSV | Datos reales de aeropuertos | Carga única con management command |

---

## Seguridad

- `secreto_ref` en modelos: los secretos de proveedores o integraciones no se persisten, solo una referencia.
- Intentos de login fallidos se registran en la tabla `auditoria` — sin Redis, sin cache externo.
- Permisos granulares por dominio en `permissions.py` de cada app.
- Variables sensibles (Stripe keys, Cloudinary secret, etc.) solo en `.env`, nunca en código ni en commits.

---

## Puertas de decisión

Antes de implementar los siguientes puntos, proponer opciones al equipo:

- **[PUERTA-1] React Query vs hook useFetch**: Si el modelo tiene dificultades generando código correcto con TanStack Query, reemplazar por un hook `useFetch` simple basado en `useEffect`.
- **[PUERTA-2] Webhook Stripe en desarrollo**: Requiere CLI de Stripe corriendo en local. Evaluar si se simula o se deja para staging.
- **[PUERTA-3] Modelo IA para recomendaciones (CU11)**: Filtro colaborativo (usuarios similares) vs content-based (preferencias del perfil). Impacta el diseño de `modelos_ia`.
- **[PUERTA-4] Exportación de reportes (CU12)**: ¿Backend genera PDF/Excel (`reportlab`, `openpyxl`) o el frontend renderiza la tabla y el usuario exporta desde el navegador?
- **[PUERTA-5] Persistencia del modelo NLP**: ¿Guardar modelo entrenado como archivo `.joblib` y cargarlo al iniciar Django, o reentrenar en cada deploy? La primera opción es más eficiente.
- **[PUERTA-6] Mapas**: ¿Mostrar solo ubicación del destino o también ruta origen→destino del vuelo?

---

## Estado del Sprint 2 (CU1–CU3, Brayan) — al 28 oct 2026

### Completado ✅
- **Backend CU1+CU2**: modelos, serializers, services, ViewSets, tests (45 green). Commit `8316c8a`.
- **Auth redesign**: Login, Registro, Recuperar, SesionExpirada, 403, 404 — diseño editorial aprobado. Commit `9adba25`.
- **Shell cliente** (`AppLayout.tsx`): Navbar + subnav slim + `PerfilMenu` animado (framer-motion).
- **Shell admin** (`AdminLayout.tsx`): top bar + `SelectorModulos` dropdown framer-motion + breadcrumb + `PerfilMenu`.
- **CU2 cliente** (#10 `/mi-cuenta`, #11 `/mi-cuenta/preferencias`): diseño cuaderno editorial validado.
- **CU2 admin** (#12 `/admin/clientes`, #13 `/admin/clientes/:id`): dossier cards + ficha con hero oscuro.
- **CU1 admin** (#7 `/admin`, #8 `/admin/roles`, #9 `/admin/auditoria`): hero con RosaVientos + métricas, cards custodios, folios bitácora.
- `RutaProtegida.tsx`: fix StrictMode double-effect con `useRef(intentado)`.
- `Iconos.tsx`: migración completa a heroicons; añadidos `IconoModulos`, `IconoMenu`.
- `roles.ts`: añadida `etiquetaRol()`.
- TypeScript: 0 errores (verificado en contenedor).

### Pendiente en Sprint 2 ⏳
- **CU3 frontend**: #14 HomeView (landing), #15–#20 destinos y proveedores (admin+público).
- Commit CU2 frontend (todas las pantallas + shell + fixes).
- Eliminar `frontend/public/_seed.html` antes del commit.

### Decisiones de diseño fijadas
- Admin: top bar + framer-motion dropdown, **sin sidebar**.
- Imágenes diferidas (Cloudinary/fotos): usar `RosaVientos` SVG + diseño editorial como stand-in.
- No Stripe/Cloudinary/Resend en Sprint 2 — console email backend.
- Fuentes: Playfair Display (display) + Work Sans (sans) + Caveat (decorativo/handwritten).
- Paleta: surface `#faf5eb` · primary `#792609` · terracotta `#b85434` · forest `#141d16` · gold `#c6a15b`.

---

## Convenciones generales

- Nombres de variables y funciones en **español** cuando refieren a dominio del negocio (reserva, paquete, salida, pasajero). Inglés para patrones técnicos (handler, schema, store, hook).
- Los endpoints de la API siguen convención REST estándar con prefijo `/api/v1/`.
- Las respuestas de error de la API incluyen siempre `{ "error": "<mensaje>", "code": "<código>" }`.
- El seed script (`python manage.py seed_data`) debe poblar datos realistas: mínimo 3 destinos internacionales, 5 paquetes con salidas, aeropuertos vinculados, y usuarios de prueba (admin + cliente).
