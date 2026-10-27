# SCREENS.md — Guía de implementación de pantallas
# Illimani Global Travel S.R.L. · UMSA Taller de Proyecto 2026

## Cómo usar este archivo

Lee primero AGENT.md (arquitectura, stack, reglas), luego el esquema de BD, luego este archivo.
Implementa una pantalla a la vez en el orden del sprint activo. Para el diseño visual de cada
pantalla consulta el design.md (contiene el enlace a Stitch y los tokens de diseño).

El prefijo indica el portal:
- Sin prefijo        → página pública, sin autenticación requerida
- `Mi viaje ·`       → área privada del cliente autenticado
- `Panel ·`          → panel de administración (rol Admin o Agente)

Formato de cada línea:
  Nombre legible  →  NombreArchivo.tsx  →  /ruta

## Este es el stitch del proyecto: https://stitch.withgoogle.com/projects/11399679559610664478
---

## SPRINT 2 · Oct 22–28 · Brayan

### CU1 · Seguridad y Acceso

 1. Iniciar sesión                      →  LoginView.tsx                    →  /login
 2. Crear cuenta                        →  RegisterView.tsx                 →  /registro
 3. Recuperar contraseña                →  RecuperarPasswordView.tsx        →  /recuperar
 4. Sesión expirada                     →  SesionExpiradaView.tsx           →  /sesion-expirada
 5. Sin permiso                         →  ForbiddenView.tsx                →  /403
 6. Página no encontrada                →  NotFoundView.tsx                 →  /* (catch-all)
 7. Panel · Inicio (esqueleto)          →  DashboardView.tsx                →  /admin
 8. Panel · Equipo y accesos            →  RolesView.tsx                    →  /admin/roles
 9. Panel · Bitácora de seguridad       →  AuditoriaView.tsx                →  /admin/auditoria

### CU2 · Clientes y Preferencias

10. Mi viaje · Resumen                  →  PanelViajeroView.tsx             →  /mi-cuenta
11. Mi viaje · Perfil y preferencias    →  PreferenciasView.tsx             →  /mi-cuenta/preferencias
12. Panel · Directorio de viajeros      →  ClientesAdminView.tsx            →  /admin/clientes
13. Panel · Ficha del viajero           →  FichaClienteAdminView.tsx        →  /admin/clientes/:id

### CU3 · Destinos y Proveedores

    [Layout] Navegación pública         →  PublicLayout.tsx                 →  components/layout/
14. Landing                             →  HomeView.tsx                     →  /
15. Explorar destinos                   →  ExplorarDestinosView.tsx         →  /destinos
16. Ficha de destino                    →  DetalleDestinoView.tsx           →  /destinos/:id
17. Panel · Atlas de destinos           →  DestinosAdminView.tsx            →  /admin/destinos
18. Panel · Editor de destino           →  EditorDestinoAdminView.tsx       →  /admin/destinos/:id
19. Panel · Libreta de proveedores      →  ProveedoresAdminView.tsx         →  /admin/proveedores
20. Panel · Ficha de proveedor          →  FichaProveedorAdminView.tsx      →  /admin/proveedores/:id

---

## SPRINT 3 · Oct 29–Nov 4 · Brayan (CU4) + José (CU5, CU6)

### CU4 · Gestión de Vuelos

21. Panel · Tablero de vuelos           →  VuelosAdminView.tsx              →  /admin/vuelos

### CU5 · Hoteles y Habitaciones

22. Panel · Hospedajes                  →  HotelesAdminView.tsx             →  /admin/hoteles

### CU6 · Paquetes y Salidas

23. Viajes (catálogo público)           →  CatalogoPaquetesView.tsx         →  /viajes
24. Detalle del paquete                 →  DetallePaqueteView.tsx           →  /viajes/:id
25. Panel · Armador de paquetes         →  PaquetesAdminView.tsx            →  /admin/paquetes
26. Panel · Calendario de salidas       →  SalidasAdminView.tsx             →  /admin/salidas

---

## SPRINT 4 · Nov 5–11 · José (CU7, CU8) + Yeral (CU9)

### CU7 · Reservas

27. Reservar · Paso 1: Selección        →  ReservaSeleccionView.tsx         →  /reservar/:paqueteId
28. Reservar · Paso 2: Pasajeros        →  ReservaPasajerosView.tsx         →  /reservar/pasajeros
29. Reservar · Paso 4: Confirmación     →  ReservaConfirmacionView.tsx      →  /reservar/confirmacion
30. Mi viaje · Mis reservas             →  MisViajesView.tsx                →  /mi-cuenta/viajes
31. Mi viaje · Detalle de reserva       →  DetalleViajeView.tsx             →  /mi-cuenta/viajes/:id
32. Panel · Mesa de reservas            →  ReservasAdminView.tsx            →  /admin/reservas
33. Panel · Detalle de reserva          →  DetalleReservaAdminView.tsx      →  /admin/reservas/:id
34. Panel · Nueva reserva presencial    →  NuevaReservaAdminView.tsx        →  /admin/reservas/nueva

### CU8 · Itinerarios y Notificaciones

35. Mi viaje · Itinerario               →  ItinerarioView.tsx               →  /mi-cuenta/viajes/:id/itinerario
36. Mi viaje · Notificaciones           →  NotificacionesView.tsx           →  /mi-cuenta/notificaciones
37. Panel · Editor de itinerario        →  EditorItinerarioAdminView.tsx    →  /admin/reservas/:id/itinerario

### CU9 · Pagos

38. Reservar · Paso 3: Pago             →  ReservaPagoView.tsx              →  /reservar/pago
39. Panel · Libro de pagos              →  PagosAdminView.tsx               →  /admin/pagos

---

## SPRINT 5 · Nov 12–18 · Yeral

### CU10 · Asistente Conversacional

40. Diseña tu viaje (asistente)         →  DiseñaTuViajeView.tsx            →  /diseña-tu-viaje
41. Panel · Entrenamiento del asistente →  AsistenteIAAdminView.tsx         →  /admin/asistente-ia

### CU11 · Recomendaciones IA

42. Mi viaje · Pensado para ti          →  RecomendacionesView.tsx          →  /mi-cuenta/recomendaciones
43. Panel · Calidad de recomendaciones  →  RecomendacionesAdminView.tsx     →  /admin/recomendaciones

### CU12 · Reportes

44. Panel · Reportes                    →  ReportesView.tsx                 →  /admin/reportes
45. Panel · Inicio completo             →  DashboardView.tsx                →  /admin (completar #7 con cifras reales)
