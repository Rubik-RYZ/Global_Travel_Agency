# Pruebas

## Pruebas unitarias

Prueban la lógica sin pasar por la API (modelos y servicios).

| Archivo | Qué prueba | N.º |
|---|---|---|
| `usuarios/tests/test_models.py` | Normalización de correo, hash bcrypt, unicidad, propiedades de rol, último acceso | 8 |
| `usuarios/tests/test_services.py` | Login (éxito y fallo con auditoría), registro, correo duplicado, restablecer contraseña, tokens | 14 |
| `notificaciones/tests/test_services.py` | Envío y omisión de correos, plantillas, degradación si falta la clave | 11 |
| **Total** | | **33** |

## Pruebas de integración

Llaman al endpoint real (`/api/v1/...`) y recorren serializer → servicio → modelo → PostgreSQL. Verifican permisos por rol (anónimo, cliente, agente, admin), validaciones, CRUD y filtros.

| Archivo | Qué prueba | N.º |
|---|---|---|
| `usuarios/tests/test_api.py` | Login/JWT, registro, roles, directorio, alta presencial, perfil y preferencias | 26 |
| `catalogo/tests/test_api.py` | Destinos (filtros, ficha comercial, itinerario) y proveedores | 38 |
| `almacen/tests/test_api.py` | Subida y borrado de láminas, permisos por carpeta, formatos y tamaños | 20 |
| **Total** | | **84** |

Comando:

```bash
docker compose exec -T backend pytest -q
```

Resultado en verde:

```text
........................................................................ [ 45%]
........................................................................ [ 90%]
...............                                                          [100%]
159 passed in 66.32s (0:01:06)
```

![Pruebas en verde](img/pruebas_pytest.png)

*La suite completa da 159 porque incluye también los CU4–CU6 del Sprint 3.*

## Pruebas de caja negra

Casos manuales sobre las pantallas, por entrada y resultado esperado.

**CU1 · Seguridad y acceso**

| ID | Caso | Entrada | Resultado esperado |
|---|---|---|---|
| CN-01 | Inicio de sesión válido | `admin@illimanitravel.bo` / clave | Entra al panel; se emite el token |
| CN-02 | Inicio de sesión inválido | Correo/clave incorrectos | Mensaje de error; no entra; queda en bitácora |
| CN-03 | Crear cuenta | Datos válidos en `/registro` | Cuenta creada e inicio de sesión |
| CN-04 | Recuperar contraseña | Correo registrado | Llega el enlace y se cambia la clave |
| CN-05 | Acceso sin permiso | Cliente entra a `/admin` | Redirige a `/403` |
| CN-06 | Sesión expirada | Token vencido | Redirige a `/sesion-expirada` |
| CN-07 | Ruta inexistente | URL arbitraria | Página 404 |
| CN-08 | Bitácora de seguridad | `/admin/auditoria` (admin) | Lista accesos e intentos fallidos |

**CU2 · Clientes y preferencias**

| ID | Caso | Entrada | Resultado esperado |
|---|---|---|---|
| CN-09 | Ver resumen de mi viaje | `/mi-cuenta` (cliente) | Datos del perfil del viajero |
| CN-10 | Editar perfil y preferencias | Presupuesto e intereses | Se guarda; intereses normalizados |
| CN-11 | Directorio de viajeros | `/admin/clientes` (admin) | Lista con filtros y búsqueda |
| CN-12 | Alta presencial de viajero | `/admin/clientes` (admin) | Crea cliente sin cuenta de acceso |
| CN-13 | Acceso al área del viajero | Un admin intenta `/mi-cuenta` | No accede al área del cliente |

**CU3 · Destinos y proveedores**

| ID | Caso | Entrada | Resultado esperado |
|---|---|---|---|
| CN-14 | Explorar destinos | `/destinos` (anónimo) | Solo destinos activos |
| CN-15 | Filtrar destinos | País, tipo, búsqueda, etiqueta | Resultados filtrados correctos |
| CN-16 | Ver ficha de destino | `/destinos/:id` (anónimo) | Ficha + itinerario día a día ordenado |
| CN-17 | Crear destino | `/admin/destinos` (admin/agente) | Se crea; un duplicado se rechaza |
| CN-18 | Editar o publicar | `/admin/destinos/:id` | Cambios guardados; se publica/despublica |
| CN-19 | Definir itinerario | Editor de destino | Días guardados; duplicado o sin título se rechaza |
| CN-20 | Libreta de proveedores | `/admin/proveedores` (admin) | Lista y ficha; el anónimo no accede |
