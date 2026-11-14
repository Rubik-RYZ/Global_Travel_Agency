CREATE TABLE roles (
    id      SMALLINT PRIMARY KEY,
    nombre  TEXT NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_id         SMALLINT NOT NULL REFERENCES roles(id),
    email          TEXT NOT NULL,
    password_hash  TEXT NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultimo_acceso  TIMESTAMPTZ,
    foto_url       TEXT,
    foto_public_id TEXT
);
CREATE UNIQUE INDEX ux_usuarios_email ON usuarios (lower(email));

CREATE TABLE auditoria (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    accion      TEXT NOT NULL,
    entidad     TEXT,
    entidad_id  TEXT,
    detalle     JSONB,
    ip          INET,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_auditoria_usuario ON auditoria (usuario_id, creado_en DESC);

CREATE TABLE clientes (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id        BIGINT UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
    nombres           TEXT NOT NULL,
    apellidos         TEXT NOT NULL,
    documento_tipo    TEXT CHECK (documento_tipo IN ('CI','PASAPORTE','OTRO')),
    documento_numero  TEXT,
    telefono          TEXT,
    fecha_nacimiento  DATE,
    pais_origen       TEXT,
    pasaporte_url       TEXT,
    pasaporte_public_id TEXT,
    carnet_url          TEXT,
    carnet_public_id    TEXT,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cliente_preferencias (
    cliente_id       BIGINT PRIMARY KEY REFERENCES clientes(id) ON DELETE CASCADE,
    presupuesto_max  NUMERIC(12,2) CHECK (presupuesto_max >= 0),
    moneda           CHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('BOB','USD','EUR')),
    intereses        TEXT[] NOT NULL DEFAULT '{}',
    actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE destinos (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            TEXT NOT NULL,
    pais              TEXT NOT NULL,
    pais_codigo       CHAR(2) CHECK (pais_codigo ~ '^[A-Z]{2}$'),
    slug              VARCHAR(140) UNIQUE,
    region            TEXT CHECK (region IN ('america_del_sur','america_del_norte',
                                             'europa','asia','africa','oceania')),
    resumen           TEXT,
    lema              TEXT,
    descripcion       TEXT,
    latitud           NUMERIC(9,6) CHECK (latitud BETWEEN -90 AND 90),
    longitud          NUMERIC(9,6) CHECK (longitud BETWEEN -180 AND 180),
    duracion_dias     SMALLINT CHECK (duracion_dias > 0),
    duracion_noches   SMALLINT CHECK (duracion_noches >= 0),
    precio_desde      NUMERIC(10,2) CHECK (precio_desde >= 0),
    moneda            CHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('BOB','USD','EUR')),
    mejor_epoca       TEXT,
    caracter          TEXT CHECK (caracter IN ('arqueologico','cultural','naturaleza',
                                              'aventura','gastronomico','descanso')),
    imagen_principal  TEXT,
    imagen_public_id  TEXT,
    incluye           TEXT[] NOT NULL DEFAULT '{}',
    no_incluye        TEXT[] NOT NULL DEFAULT '{}',
    etiquetas         TEXT[] NOT NULL DEFAULT '{}',
    destacado         BOOLEAN NOT NULL DEFAULT FALSE,
    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (nombre, pais)
);
CREATE INDEX ix_destinos_etiquetas ON destinos USING GIN (etiquetas);
CREATE INDEX ix_destinos_region ON destinos (region);
CREATE INDEX ix_destinos_caracter ON destinos (caracter);
CREATE INDEX ix_destinos_destacado ON destinos (destacado);

CREATE TABLE itinerario_dias (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    destino_id   BIGINT NOT NULL REFERENCES destinos(id) ON DELETE CASCADE,
    numero_dia   SMALLINT NOT NULL CHECK (numero_dia > 0),
    titulo       TEXT NOT NULL,
    descripcion  TEXT,
    ubicacion    TEXT,
    UNIQUE (destino_id, numero_dia)
);
CREATE INDEX ix_itinerario_dias_destino ON itinerario_dias (destino_id, numero_dia);

CREATE TABLE aeropuertos (
    codigo_iata  CHAR(3) PRIMARY KEY,
    nombre       TEXT NOT NULL,
    destino_id   BIGINT NOT NULL REFERENCES destinos(id)
);

CREATE TABLE proveedores (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre     TEXT NOT NULL UNIQUE,
    tipo       TEXT NOT NULL CHECK (tipo IN ('aerolinea','hotel','transporte','operador','otro')),
    pais       TEXT,
    ciudad     TEXT,
    contacto   TEXT,
    email      TEXT,
    telefono   TEXT,
    notas      TEXT,
    logo_url       TEXT,
    logo_public_id TEXT,
    activo     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE vuelos (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor_id       BIGINT NOT NULL REFERENCES proveedores(id),
    numero_vuelo       TEXT NOT NULL,
    origen             CHAR(3) NOT NULL REFERENCES aeropuertos(codigo_iata),
    destino            CHAR(3) NOT NULL REFERENCES aeropuertos(codigo_iata),
    salida             TIMESTAMPTZ NOT NULL,
    llegada            TIMESTAMPTZ NOT NULL,
    precio             NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    moneda             CHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('BOB','USD','EUR')),
    cupos_totales      INT NOT NULL CHECK (cupos_totales >= 0),
    cupos_disponibles  INT NOT NULL CHECK (cupos_disponibles >= 0),
    referencia_externa TEXT,
    CHECK (origen <> destino),
    CHECK (llegada > salida),
    CHECK (cupos_disponibles <= cupos_totales),
    UNIQUE (numero_vuelo, salida)
);
CREATE INDEX ix_vuelos_ruta ON vuelos (origen, destino, salida);

CREATE TABLE hoteles (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor_id  BIGINT NOT NULL REFERENCES proveedores(id),
    destino_id    BIGINT NOT NULL REFERENCES destinos(id),
    nombre        TEXT NOT NULL,
    estrellas     SMALLINT CHECK (estrellas BETWEEN 1 AND 5),
    direccion     TEXT,
    latitud       NUMERIC(9,6) CHECK (latitud BETWEEN -90 AND 90),
    longitud      NUMERIC(9,6) CHECK (longitud BETWEEN -180 AND 180),
    descripcion   TEXT,
    activo        BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX ix_hoteles_destino ON hoteles (destino_id);

CREATE TABLE habitaciones (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hotel_id     BIGINT NOT NULL REFERENCES hoteles(id) ON DELETE CASCADE,
    tipo         TEXT NOT NULL,
    capacidad    SMALLINT NOT NULL CHECK (capacidad > 0),
    precio_noche NUMERIC(12,2) NOT NULL CHECK (precio_noche >= 0),
    moneda       CHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('BOB','USD','EUR'))
);

CREATE TABLE paquetes (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    destino_id     BIGINT NOT NULL REFERENCES destinos(id),
    hotel_id       BIGINT REFERENCES hoteles(id),
    nombre         TEXT NOT NULL,
    descripcion    TEXT,
    duracion_dias  SMALLINT NOT NULL CHECK (duracion_dias > 0),
    precio_base    NUMERIC(12,2) NOT NULL CHECK (precio_base >= 0),
    moneda         CHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('BOB','USD','EUR')),
    etiquetas      TEXT[] NOT NULL DEFAULT '{}',
    activo         BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX ix_paquetes_destino ON paquetes (destino_id);
CREATE INDEX ix_paquetes_etiquetas ON paquetes USING GIN (etiquetas);

CREATE TABLE paquete_salidas (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    paquete_id         BIGINT NOT NULL REFERENCES paquetes(id) ON DELETE CASCADE,
    fecha_salida       DATE NOT NULL,
    vuelo_ida_id       BIGINT REFERENCES vuelos(id),
    vuelo_vuelta_id    BIGINT REFERENCES vuelos(id),
    cupos_totales      INT NOT NULL CHECK (cupos_totales >= 0),
    cupos_disponibles  INT NOT NULL CHECK (cupos_disponibles >= 0),
    CHECK (cupos_disponibles <= cupos_totales),
    UNIQUE (paquete_id, fecha_salida)
);
CREATE INDEX ix_salidas_fecha ON paquete_salidas (fecha_salida);

CREATE TABLE intenciones (
    id           SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre       TEXT NOT NULL UNIQUE,
    descripcion  TEXT,
    activa       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE frases_entrenamiento (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    intencion_id SMALLINT NOT NULL REFERENCES intenciones(id) ON DELETE CASCADE,
    texto        TEXT NOT NULL,
    origen       TEXT NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual','historial')),
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (intencion_id, texto)
);

CREATE TABLE modelos_ia (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre       TEXT NOT NULL,
    version      TEXT NOT NULL,
    tipo         TEXT NOT NULL CHECK (tipo IN ('clasificador_intenciones','recomendador')),
    metricas     JSONB,
    activo       BOOLEAN NOT NULL DEFAULT FALSE,
    entrenado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (nombre, version)
);

CREATE TABLE conversaciones (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id        BIGINT NOT NULL REFERENCES usuarios(id),
    estado_dialogo    JSONB NOT NULL DEFAULT '{}'::jsonb,
    intencion_activa  TEXT,
    cerrada           BOOLEAN NOT NULL DEFAULT FALSE,
    iniciada_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultima_actividad  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_conversaciones_usuario ON conversaciones (usuario_id, ultima_actividad DESC);

CREATE TABLE mensajes (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversacion_id  UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    emisor           TEXT NOT NULL CHECK (emisor IN ('usuario','agente')),
    texto            TEXT NOT NULL,
    intencion_id     SMALLINT REFERENCES intenciones(id),
    confianza        NUMERIC(4,3) CHECK (confianza BETWEEN 0 AND 1),
    entidades        JSONB,
    modelo_id        BIGINT REFERENCES modelos_ia(id),
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_mensajes_conversacion ON mensajes (conversacion_id, creado_en);
CREATE INDEX ix_mensajes_intencion ON mensajes (intencion_id);

CREATE SEQUENCE seq_codigo_reserva START 1;

CREATE TABLE reservas (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo           TEXT NOT NULL UNIQUE DEFAULT
                     ('RES-' || to_char(now(), 'YYYY') || '-' ||
                      lpad(nextval('seq_codigo_reserva')::text, 6, '0')),
    cliente_id       BIGINT NOT NULL REFERENCES clientes(id),
    salida_id        BIGINT NOT NULL REFERENCES paquete_salidas(id),
    num_personas     SMALLINT NOT NULL CHECK (num_personas > 0),
    estado           TEXT NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente','confirmada','pagada','cancelada')),
    total            NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    moneda           CHAR(3) NOT NULL CHECK (moneda IN ('BOB','USD','EUR')),
    canal            TEXT NOT NULL DEFAULT 'web' CHECK (canal IN ('web','agente','personal')),
    conversacion_id  UUID REFERENCES conversaciones(id),
    creada_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_reservas_cliente ON reservas (cliente_id);
CREATE INDEX ix_reservas_estado ON reservas (estado);
CREATE INDEX ix_reservas_salida ON reservas (salida_id);

CREATE TABLE reserva_pasajeros (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id        BIGINT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    nombres           TEXT NOT NULL,
    apellidos         TEXT NOT NULL,
    documento_tipo    TEXT CHECK (documento_tipo IN ('CI','PASAPORTE','OTRO')),
    documento_numero  TEXT,
    fecha_nacimiento  DATE
);
CREATE INDEX ix_pasajeros_reserva ON reserva_pasajeros (reserva_id);

CREATE TABLE tipos_cambio (
    fecha            DATE NOT NULL,
    moneda_origen    CHAR(3) NOT NULL CHECK (moneda_origen IN ('BOB','USD','EUR')),
    moneda_destino   CHAR(3) NOT NULL CHECK (moneda_destino IN ('BOB','USD','EUR')),
    tasa             NUMERIC(14,6) NOT NULL CHECK (tasa > 0),
    PRIMARY KEY (fecha, moneda_origen, moneda_destino)
);

CREATE TABLE pagos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id          BIGINT NOT NULL REFERENCES reservas(id),
    monto               NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    moneda              CHAR(3) NOT NULL CHECK (moneda IN ('BOB','USD','EUR')),
    tipo_cambio_a_bob   NUMERIC(14,6) NOT NULL DEFAULT 1 CHECK (tipo_cambio_a_bob > 0),
    monto_bob           NUMERIC(14,2) NOT NULL CHECK (monto_bob > 0),
    metodo              TEXT NOT NULL DEFAULT 'tarjeta',
    estado              TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente','aprobado','fallido','reembolsado')),
    stripe_payment_id   TEXT UNIQUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_pagos_reserva ON pagos (reserva_id);

CREATE TABLE itinerarios (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id   BIGINT NOT NULL UNIQUE REFERENCES reservas(id) ON DELETE CASCADE,
    generado_por TEXT NOT NULL DEFAULT 'sistema' CHECK (generado_por IN ('sistema','ia','personal')),
    pdf_url      TEXT,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE itinerario_items (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    itinerario_id BIGINT NOT NULL REFERENCES itinerarios(id) ON DELETE CASCADE,
    dia           SMALLINT NOT NULL CHECK (dia > 0),
    orden         SMALLINT NOT NULL DEFAULT 1,
    hora          TIME,
    titulo        TEXT NOT NULL,
    descripcion   TEXT,
    latitud       NUMERIC(9,6),
    longitud      NUMERIC(9,6),
    UNIQUE (itinerario_id, dia, orden)
);

CREATE TABLE notificaciones (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id          BIGINT NOT NULL REFERENCES usuarios(id),
    reserva_id          BIGINT REFERENCES reservas(id),
    tipo                TEXT NOT NULL CHECK (tipo IN ('confirmacion_reserva','comprobante_pago','itinerario')),
    estado              TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviada','fallida')),
    resend_message_id    TEXT,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recomendaciones (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id    BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    paquete_id    BIGINT NOT NULL REFERENCES paquetes(id) ON DELETE CASCADE,
    modelo_id     BIGINT REFERENCES modelos_ia(id),
    puntaje       NUMERIC(6,4) NOT NULL,
    mostrada      BOOLEAN NOT NULL DEFAULT FALSE,
    aceptada      BOOLEAN,
    generada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_recomendaciones_cliente ON recomendaciones (cliente_id, generada_en DESC);

CREATE FUNCTION fn_actualizar_fecha() RETURNS trigger AS $$
BEGIN
    NEW.actualizada_en := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_reservas_actualizada
    BEFORE UPDATE ON reservas
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();

CREATE VIEW v_ventas_mensuales AS
SELECT date_trunc('month', creado_en)::date AS mes,
       count(*)                              AS pagos_aprobados,
       sum(monto_bob)                        AS total_bob
FROM pagos
WHERE estado = 'aprobado'
GROUP BY 1
ORDER BY 1;

CREATE VIEW v_reservas_por_destino AS
SELECT d.nombre AS destino,
       count(r.id)          AS reservas,
       sum(r.num_personas)  AS pasajeros
FROM reservas r
JOIN paquete_salidas s ON s.id = r.salida_id
JOIN paquetes p        ON p.id = s.paquete_id
JOIN destinos d        ON d.id = p.destino_id
WHERE r.estado <> 'cancelada'
GROUP BY d.nombre
ORDER BY reservas DESC;

INSERT INTO roles (id, nombre) VALUES
    (1, 'administrador'), (2, 'agente'), (3, 'cliente');

INSERT INTO intenciones (nombre, descripcion) VALUES
    ('saludo',                   'El usuario saluda'),
    ('consultar_paquetes',       'Pregunta qué paquetes existen'),
    ('consultar_disponibilidad', 'Pregunta cupos para una fecha'),
    ('recomendar_destino',       'Pide una recomendación personalizada'),
    ('estado_reserva',           'Consulta el estado de su reserva'),
    ('tipo_de_cambio',           'Pregunta por el tipo de cambio'),
    ('iniciar_reserva',          'Quiere reservar un paquete'),
    ('ayuda',                    'Pide ayuda o información general'),
    ('despedida',                'El usuario se despide'),
    ('fallback',                 'No se entendió el mensaje');
