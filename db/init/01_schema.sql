-- Habilitar extensión PostGIS para datos geoespaciales
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  rango VARCHAR(50),
  rol VARCHAR(30) NOT NULL, -- COMANDANTE, OFICIAL_OPERACIONES, EFECTIVO_CAMPO, ADMIN_SISTEMA
  unidad_id UUID,
  password_hash VARCHAR NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Puestos de control y patrullas
CREATE TABLE IF NOT EXISTS unidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(30), -- PUESTO_CONTROL, PATRULLA_MOVIL
  coordenadas GEOGRAPHY(Point, 4326),
  efectivos_asignados INT DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reportes de campo (ingesta)
CREATE TABLE IF NOT EXISTS reportes_patrulla (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unidad_id UUID REFERENCES unidades(id),
  usuario_id UUID REFERENCES usuarios(id),
  descripcion TEXT NOT NULL,
  tipo_evento VARCHAR(50), -- MINERIA_ILEGAL, INTRUSION, SIN_NOVEDAD, CONTRABANDO
  coordenadas GEOGRAPHY(Point, 4326),
  latitud FLOAT,           -- Redundante para compatibilidad con el ORM (Sequelize)
  longitud FLOAT,          -- Redundante para compatibilidad con el ORM (Sequelize)
  foto_url VARCHAR,
  sincronizado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alertas generadas por el Agente de IA
CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporte_id UUID REFERENCES reportes_patrulla(id),
  nivel_riesgo VARCHAR(20), -- BAJO, MEDIO, ALTO, CRITICO
  categoria VARCHAR(50),
  resumen_ia TEXT,
  patron_detectado BOOLEAN DEFAULT false,
  confianza FLOAT,
  estado VARCHAR(20) DEFAULT 'ACTIVA', -- ACTIVA, ASIGNADA, RESUELTA
  created_at TIMESTAMP DEFAULT NOW()
);

-- Despachos de respuesta
CREATE TABLE IF NOT EXISTS despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alerta_id UUID REFERENCES alertas(id),
  unidad_despachada_id UUID REFERENCES unidades(id),
  despachado_por UUID REFERENCES usuarios(id),
  tiempo_respuesta_min INT,
  resultado TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
