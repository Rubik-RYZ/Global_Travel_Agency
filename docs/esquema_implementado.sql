-- =========================================================
-- Modelo relacional para PostgreSQL 9.x (Illimani Global Travel)
-- Listo para importar en PowerDesigner 16.5
-- =========================================================

BEGIN;

-- =========================
-- GRUPO 1 - Acceso y Usuarios
-- =========================

CREATE TABLE roles (
id          SERIAL PRIMARY KEY,
nombre      VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
id            BIGSERIAL PRIMARY KEY,
email         VARCHAR(255) NOT NULL UNIQUE,
activo        BOOLEAN NOT NULL DEFAULT TRUE,
creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ultimo_acceso TIMESTAMPTZ NULL,
password_hash VARCHAR(255) NOT NULL,
rol_id        INTEGER NOT NULL,
foto_public_id VARCHAR(255) NULL,
foto_url      TEXT NULL
);

CREATE TABLE auditoria (
id         BIGSERIAL PRIMARY KEY,
accion     VARCHAR(100) NOT NULL,
entidad    VARCHAR(100) NULL,
entidad_id VARCHAR(100) NULL,
detalle    TEXT NULL,
ip         INET NULL,
creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
usuario_id BIGINT NULL
);

-- =========================
-- GRUPO 2 - Clientes
-- =========================

CREATE TABLE clientes (
id                  BIGSERIAL PRIMARY KEY,
nombres             VARCHAR(150) NOT NULL,
apellidos           VARCHAR(150) NOT NULL,
documento_tipo      VARCHAR(50) NULL,
documento_numero    VARCHAR(50) NULL,
telefono            VARCHAR(50) NULL,
fecha_nacimiento    DATE NULL,
pais_origen         VARCHAR(100) NULL,
creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
usuario_id          BIGINT NULL UNIQUE,
carnet_public_id    VARCHAR(255) NULL,
carnet_url          TEXT NULL,
pasaporte_public_id VARCHAR(255) NULL,
pasaporte_url       TEXT NULL
);

CREATE TABLE cliente_preferencias (
cliente_id      BIGINT PRIMARY KEY,
presupuesto_max DECIMAL(12,2) NULL,
moneda          VARCHAR(3) NOT NULL DEFAULT 'USD',
intereses       TEXT NOT NULL,
actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

CONSTRAINT ck_preferencias_presupuesto
    CHECK ((presupuesto_max >= 0) OR (presupuesto_max IS NULL))


);

-- =========================
-- GRUPO 3 - Catálogo y Destinos
-- =========================

CREATE TABLE proveedores (
id             BIGSERIAL PRIMARY KEY,
nombre         VARCHAR(255) NOT NULL UNIQUE,
tipo           VARCHAR(50) NOT NULL,
email          VARCHAR(255) NULL,
telefono       VARCHAR(50) NULL,
activo         BOOLEAN NOT NULL DEFAULT TRUE,
ciudad         VARCHAR(100) NULL,
contacto       VARCHAR(150) NULL,
notas          TEXT NULL,
pais           VARCHAR(100) NULL,
logo_url       TEXT NULL,
logo_public_id VARCHAR(255) NULL
);

CREATE TABLE destinos (
id               BIGSERIAL PRIMARY KEY,
nombre           VARCHAR(255) NOT NULL,
pais             VARCHAR(100) NOT NULL,
descripcion      TEXT NULL,
latitud          DECIMAL(9,6) NULL,
longitud         DECIMAL(9,6) NULL,
etiquetas        TEXT NOT NULL,
activo           BOOLEAN NOT NULL DEFAULT TRUE,
caracter         VARCHAR(50) NULL,
destacado        BOOLEAN NOT NULL DEFAULT FALSE,
duracion_dias    SMALLINT NULL,
duracion_noches  SMALLINT NULL,
imagen_principal TEXT NULL,
incluye          TEXT NOT NULL,
mejor_epoca      VARCHAR(100) NULL,
moneda           VARCHAR(3) NOT NULL DEFAULT 'USD',
no_incluye       TEXT NOT NULL,
pais_codigo      VARCHAR(2) NULL,
precio_desde     DECIMAL(10,2) NULL,
region           VARCHAR(100) NULL,
resumen          TEXT NULL,
slug             VARCHAR(140) NULL UNIQUE,
lema             TEXT NULL,
imagen_public_id VARCHAR(255) NULL,

CONSTRAINT uq_destinos_nombre_pais UNIQUE (nombre, pais),
CONSTRAINT ck_destinos_duracion_dias CHECK ((duracion_dias >= 0) OR (duracion_dias IS NULL)),
CONSTRAINT ck_destinos_duracion_noches CHECK ((duracion_noches >= 0) OR (duracion_noches IS NULL)),
CONSTRAINT ck_destinos_precio_desde CHECK ((precio_desde >= 0) OR (precio_desde IS NULL))


);

CREATE TABLE aeropuertos (
codigo_iata VARCHAR(3) PRIMARY KEY,
nombre      VARCHAR(255) NOT NULL,
destino_id  BIGINT NOT NULL
);

CREATE TABLE itinerario_dias (
id          BIGSERIAL PRIMARY KEY,
numero_dia  SMALLINT NOT NULL,
titulo      VARCHAR(255) NOT NULL,
descripcion TEXT NULL,
ubicacion   VARCHAR(255) NULL,
destino_id  BIGINT NOT NULL,

CONSTRAINT uq_itinerario_destino_dia UNIQUE (destino_id, numero_dia),
CONSTRAINT ck_itinerario_numero_dia CHECK (numero_dia > 0)


);

CREATE TABLE vuelos (
id                 BIGSERIAL PRIMARY KEY,
proveedor_id       BIGINT NOT NULL,
numero_vuelo       VARCHAR(20) NOT NULL,
origen             VARCHAR(3) NOT NULL,
destino            VARCHAR(3) NOT NULL,
salida             TIMESTAMPTZ NOT NULL,
llegada            TIMESTAMPTZ NOT NULL,
precio             NUMERIC(12,2) NOT NULL,
moneda             VARCHAR(3) NOT NULL DEFAULT 'USD',
cupos_totales      INT NOT NULL,
cupos_disponibles  INT NOT NULL,
referencia_externa TEXT NULL,

CONSTRAINT ux_vuelos_numero_salida UNIQUE (numero_vuelo, salida),
CONSTRAINT ck_vuelos_ruta_distinta CHECK (origen <> destino),
CONSTRAINT ck_vuelos_horario CHECK (llegada > salida),
CONSTRAINT ck_vuelos_cupos CHECK (cupos_disponibles <= cupos_totales),
CONSTRAINT ck_vuelos_cupos_totales CHECK (cupos_totales >= 0),
CONSTRAINT ck_vuelos_cupos_disponibles CHECK (cupos_disponibles >= 0),
CONSTRAINT ck_vuelos_precio CHECK (precio >= 0),
CONSTRAINT ck_vuelos_moneda CHECK (moneda IN ('BOB','USD','EUR'))
);

CREATE INDEX ix_vuelos_ruta ON vuelos(origen, destino, salida);

CREATE TABLE hoteles (
id           BIGSERIAL PRIMARY KEY,
proveedor_id BIGINT NOT NULL,
destino_id   BIGINT NOT NULL,
nombre       VARCHAR(255) NOT NULL,
estrellas    SMALLINT NULL,
direccion    TEXT NULL,
latitud      NUMERIC(9,6) NULL,
longitud     NUMERIC(9,6) NULL,
descripcion  TEXT NULL,
activo       BOOLEAN NOT NULL DEFAULT TRUE,

CONSTRAINT ck_hoteles_estrellas CHECK ((estrellas BETWEEN 1 AND 5) OR (estrellas IS NULL)),
CONSTRAINT ck_hoteles_latitud CHECK ((latitud BETWEEN -90 AND 90) OR (latitud IS NULL)),
CONSTRAINT ck_hoteles_longitud CHECK ((longitud BETWEEN -180 AND 180) OR (longitud IS NULL))
);

CREATE INDEX ix_hoteles_destino ON hoteles(destino_id);

CREATE TABLE paquetes (
id            BIGSERIAL PRIMARY KEY,
destino_id    BIGINT NOT NULL,
hotel_id      BIGINT NULL,
nombre        VARCHAR(255) NOT NULL,
descripcion   TEXT NULL,
duracion_dias SMALLINT NOT NULL,
precio_base   NUMERIC(12,2) NOT NULL,
moneda        VARCHAR(3) NOT NULL DEFAULT 'USD',
etiquetas     TEXT[] NOT NULL DEFAULT '{}',
activo        BOOLEAN NOT NULL DEFAULT TRUE,

CONSTRAINT ck_paquetes_duracion_dias CHECK (duracion_dias > 0),
CONSTRAINT ck_paquetes_precio_base CHECK (precio_base >= 0),
CONSTRAINT ck_paquetes_moneda CHECK (moneda IN ('BOB','USD','EUR'))
);

CREATE INDEX ix_paquetes_destino ON paquetes(destino_id);
CREATE INDEX ix_paquetes_etiquetas ON paquetes USING GIN (etiquetas);

CREATE TABLE paquete_salidas (
id                BIGSERIAL PRIMARY KEY,
paquete_id        BIGINT NOT NULL,
fecha_salida      DATE NOT NULL,
vuelo_ida_id      BIGINT NULL,
vuelo_vuelta_id   BIGINT NULL,
cupos_totales     INT NOT NULL,
cupos_disponibles INT NOT NULL,

CONSTRAINT ux_salidas_paquete_fecha UNIQUE (paquete_id, fecha_salida),
CONSTRAINT ck_salidas_cupos CHECK (cupos_disponibles <= cupos_totales)
);

CREATE INDEX ix_salidas_fecha ON paquete_salidas(fecha_salida);

-- =========================================================
-- FOREIGN KEYS
-- =========================================================

ALTER TABLE usuarios
ADD CONSTRAINT fk_usuarios_roles
FOREIGN KEY (rol_id)
REFERENCES roles(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE auditoria
ADD CONSTRAINT fk_auditoria_usuarios
FOREIGN KEY (usuario_id)
REFERENCES usuarios(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_usuarios
FOREIGN KEY (usuario_id)
REFERENCES usuarios(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

ALTER TABLE cliente_preferencias
ADD CONSTRAINT fk_cliente_preferencias_clientes
FOREIGN KEY (cliente_id)
REFERENCES clientes(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE aeropuertos
ADD CONSTRAINT fk_aeropuertos_destinos
FOREIGN KEY (destino_id)
REFERENCES destinos(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE itinerario_dias
ADD CONSTRAINT fk_itinerario_dias_destinos
FOREIGN KEY (destino_id)
REFERENCES destinos(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE vuelos
ADD CONSTRAINT fk_vuelos_proveedores
FOREIGN KEY (proveedor_id)
REFERENCES proveedores(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE vuelos
ADD CONSTRAINT fk_vuelos_origen
FOREIGN KEY (origen)
REFERENCES aeropuertos(codigo_iata)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE vuelos
ADD CONSTRAINT fk_vuelos_destino
FOREIGN KEY (destino)
REFERENCES aeropuertos(codigo_iata)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE hoteles
ADD CONSTRAINT fk_hoteles_proveedores
FOREIGN KEY (proveedor_id)
REFERENCES proveedores(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE hoteles
ADD CONSTRAINT fk_hoteles_destinos
FOREIGN KEY (destino_id)
REFERENCES destinos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE paquetes
ADD CONSTRAINT fk_paquetes_destinos
FOREIGN KEY (destino_id)
REFERENCES destinos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE paquetes
ADD CONSTRAINT fk_paquetes_hoteles
FOREIGN KEY (hotel_id)
REFERENCES hoteles(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE paquete_salidas
ADD CONSTRAINT fk_paquete_salidas_paquetes
FOREIGN KEY (paquete_id)
REFERENCES paquetes(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE paquete_salidas
ADD CONSTRAINT fk_paquete_salidas_vuelo_ida
FOREIGN KEY (vuelo_ida_id)
REFERENCES vuelos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE paquete_salidas
ADD CONSTRAINT fk_paquete_salidas_vuelo_vuelta
FOREIGN KEY (vuelo_vuelta_id)
REFERENCES vuelos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- =========================================================
-- ÍNDICES RECOMENDADOS PARA FKS
-- =========================================================

CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_aeropuertos_destino_id ON aeropuertos(destino_id);
CREATE INDEX idx_itinerario_dias_destino_id ON itinerario_dias(destino_id);
CREATE INDEX idx_vuelos_proveedor_id ON vuelos(proveedor_id);
CREATE INDEX idx_hoteles_proveedor_id ON hoteles(proveedor_id);
CREATE INDEX idx_paquetes_hotel_id ON paquetes(hotel_id);
CREATE INDEX idx_paquete_salidas_paquete_id ON paquete_salidas(paquete_id);
CREATE INDEX idx_paquete_salidas_vuelo_ida_id ON paquete_salidas(vuelo_ida_id);
CREATE INDEX idx_paquete_salidas_vuelo_vuelta_id ON paquete_salidas(vuelo_vuelta_id);

COMMIT;