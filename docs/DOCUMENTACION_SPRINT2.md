# Documentación Sprint 2 — guía de contenido (sección 3.4)

Qué incluir en cada modelo del documento de Sprint 2 y con qué herramienta
generarlo. Los **diagramas son imágenes** que se generan aparte (con IA o
manualmente) y se referencian desde el documento. Guarda las imágenes en
`docs/img/` con un nombre claro (p. ej. `3.4.1_clases.png`).

## Herramienta recomendada por diagrama

| Sección | Diagrama | Herramienta sugerida |
|---|---|---|
| 3.4.1 | Clases | PlantUML (texto) o draw.io |
| 3.4.2 | Navegación (UWE) | draw.io (estereotipos UWE) o Excalidraw |
| 3.4.3 | Presentación (UWE) | draw.io |
| 3.4.4 | Actividades | PlantUML (texto) o draw.io |
| 3.4.5 | ER | dbdiagram.io o draw.io |

Tip: el archivo `docs/esquema_implementado.sql` ya es el DDL real; pégalo en
dbdiagram.io o draw.io (Insertar → SQL) y las relaciones salen solas.

---

## 3.4.1 Modelo Conceptual — diagrama de clases

Solo **7 clases** y sus relaciones:

| Relación | Cardinalidad |
|---|---|
| Rol → Usuario | 1 a N |
| Usuario ↔ Cliente | 1 a 0..1 (`OneToOne`, nulo = alta presencial) |
| Cliente ↔ ClientePreferencia | 1 a 0..1 |
| Usuario → Auditoria | 1 a N |
| Destino → ItinerarioDia | 1 a N |
| Destino → Aeropuerto | 1 a N |
| Proveedor | clase suelta (sin FK en este sprint) |

Atributos clave (no todos):
- `Usuario(email, rol, activo)`
- `Cliente(nombres, apellidos, documento_tipo, pasaporte_url, carnet_url)`
- `ClientePreferencia(presupuesto_max, moneda, intereses)`
- `Destino(nombre, pais, slug, precio_desde, imagen_principal, activo)`
- `ItinerarioDia(numero_dia, titulo)`
- `Aeropuerto(codigo_iata)`
- `Proveedor(nombre, tipo, logo_url)`
- `Auditoria(accion, entidad, ip)`

## 3.4.2 Modelo de navegación (UWE)

Nodos = pantallas, aristas = enlaces. Agrupa por **4 contextos** (los layouts):

- **Público:** `/` → `/destinos` → `/destinos/:id`
- **Acceso:** `/login` ↔ `/registro` · `/recuperar` → `/restablecer` · `/sesion-expirada` · `/403`
- **Cliente (guard `RutaCliente`):** `/mi-cuenta` ↔ `/mi-cuenta/preferencias`
- **Panel (guards `RutaPanel` + `RutaAdmin`):** `/admin` → `/admin/clientes` → `/admin/clientes/:id`, `/admin/destinos` → `/admin/destinos/nuevo` | `/:id/editar`, `/admin/proveedores`, `/admin/roles`, `/admin/auditoria`

Marca los **guards** como restricciones de navegación (rol requerido) y el nodo
`*` → 404.

## 3.4.3 Modelo de presentación (UWE)

Solo las **5 pantallas clave** (1 por contexto), con sus formularios y unidades:

1. **Login** — formulario de acceso.
2. **Mi viaje / Resumen** (`/mi-cuenta`) — incluye el subidor de credenciales.
3. **Dashboard del panel** (`/admin`) — índice de módulos.
4. **Editor de destino** (`/admin/destinos/:id/editar`) — formulario extenso + itinerario + lámina.
5. **Detalle de destino** (público) — ficha de catálogo.

Componentes reutilizables reales: `SubidorImagen`, `Monograma`, `PerfilMenu`,
`Modal`, `Button`, `Iconos`.

## 3.4.4 Modelo de procesos — diagrama de actividades

Con **3–4 diagramas** basta:

1. **Autenticación:** validar credenciales → registrar en `auditoria` → emitir JWT → redirigir según rol.
2. **Digitalización de credenciales del viajero:** elegir archivo → subir a `perfiles`/`pasaportes`/`carnets` → guardar URL + `public_id` → actualizar ficha.
3. **Gestión de catálogo (admin):** alta/edición de destino → validar → subir lámina → publicar/despublicar.
4. **(Opcional) Recuperación de contraseña:** con degradación de Resend (si no hay clave, se imprime en el log).

## 3.4.5 Diseño e implementación

- **ER:** las **9 entidades** y sus FK/UK: `roles`, `usuarios`, `auditoria`,
  `clientes`, `cliente_preferencias`, `destinos`, `itinerario_dias`,
  `aeropuertos`, `proveedores`.
- **Relacional 3N:** tablas con PK/FK, más las `UniqueConstraint`
  (`ux_usuarios_email`, `ux_destinos_nombre_pais`, `ux_itinerario_destino_dia`)
  y los `Check` (latitud/longitud, precio ≥ 0, duración > 0).
  Nota honesta: se usan **arrays de PostgreSQL** (`etiquetas`, `incluye`,
  `no_incluye`, `intereses`) como decisión de diseño — no es 1FN estricto,
  conviene mencionarlo en el documento.
- **Pruebas:** **117 tests** de backend (acceso, roles, clientes, catálogo,
  almacén, notificaciones) + `tsc --noEmit` y `vite build` limpios en frontend.
  Cita 2–3 casos concretos (login OK/401, cliente no puede borrar una lámina
  ajena, destino duplicado).
