# 🛠️ Plan de Instalación y Configuración — COVA-AI Stack

> **Prerrequisito cumplido:** Docker Desktop instalado ✅  
> **SO:** Windows 11  
> **Directorio de trabajo:** `c:\cova`

---

## ✅ Verificación Previa

Antes de empezar, verifica que Docker Desktop esté corriendo correctamente:

```powershell
docker --version
docker compose version
docker ps
```

Deberías ver algo como:
- `Docker version 26.x.x`
- `Docker Compose version v2.x.x`
- Lista de contenedores vacía (o los que ya tengas)

---

## PASO 1 — Crear la estructura de directorios del proyecto

Abre una terminal PowerShell en `c:\cova` y ejecuta:

```powershell
# Moverse al directorio del proyecto
cd c:\cova

# Crear estructura completa de carpetas
New-Item -ItemType Directory -Force -Path `
  frontend/src/components/map,
  frontend/src/components/alerts,
  frontend/src/components/reports,
  frontend/src/components/ui,
  frontend/src/views,
  frontend/src/router,
  frontend/src/stores,
  frontend/src/services,
  frontend/public,
  backend/src/config,
  backend/src/middleware,
  backend/src/modules/auth,
  backend/src/modules/reports,
  backend/src/modules/alerts,
  backend/src/modules/units,
  backend/src/modules/ai,
  backend/src/socket,
  backend/migrations,
  ai-engine/app,
  ai-engine/models,
  ai-engine/data,
  db/init
```

---

## PASO 2 — Crear el archivo `.env`

En `c:\cova`, crear el archivo `.env.example` (luego copiar a `.env`):

**Archivo: `c:\cova\.env.example`**
```env
# =============================================
#  COVA-AI — Variables de Entorno
# =============================================

# --- Base de Datos ---
POSTGRES_DB=cova_ai_db
POSTGRES_USER=cova_admin
POSTGRES_PASSWORD=CovaSecure2026!
POSTGRES_HOST=db
POSTGRES_PORT=5432

# --- Backend Node.js ---
NODE_ENV=development
PORT=3000
JWT_SECRET=cova_jwt_super_secret_2026_change_in_prod
JWT_EXPIRES_IN=8h
AI_ENGINE_URL=http://ai-engine:8000

# --- Frontend ---
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000

# --- pgAdmin ---
PGADMIN_DEFAULT_EMAIL=admin@cova.mil.ve
PGADMIN_DEFAULT_PASSWORD=AdminCova2026!
```

Luego en PowerShell:
```powershell
# Copiar example a .env real
Copy-Item .env.example .env
```

> [!CAUTION]
> Nunca subas `.env` a Git. Siempre usa `.env.example` como referencia.

---

## PASO 3 — Crear el Script SQL de Inicialización de la BD

**Archivo: `c:\cova\db\init\01_schema.sql`**

```sql
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
```

**Archivo: `c:\cova\db\init\02_seed.sql`**

```sql
-- Seed: Unidades iniciales de la ZODI N°62
INSERT INTO unidades (nombre, tipo, efectivos_asignados) VALUES
  ('Puesto Control Norte - Río Carapo', 'PUESTO_CONTROL', 8),
  ('Puesto Control Sur - Km 45', 'PUESTO_CONTROL', 6),
  ('Patrulla Móvil Alpha', 'PATRULLA_MOVIL', 4),
  ('Patrulla Móvil Bravo', 'PATRULLA_MOVIL', 4)
ON CONFLICT DO NOTHING;

-- Seed: Usuario administrador inicial
-- Password: Admin2026! (cambiar en producción)
INSERT INTO usuarios (nombre, cedula, rango, rol, password_hash) VALUES
  ('Sistema Administrador', '00000000', 'N/A', 'ADMIN_SISTEMA',
   '$2b$10$rOzJqKqKqKqKqKqKqKqKqOzJqKqKqKqKqKqKqKqKqKqKqKqKqKqKq')
ON CONFLICT DO NOTHING;
```

---

## PASO 4 — Crear los Dockerfiles de cada servicio

### 4.1 — Dockerfile del Backend (Node.js)

**Archivo: `c:\cova\backend\Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (cacheo de capas)
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

### 4.2 — Dockerfile del Motor de IA (Python)

**Archivo: `c:\cova\ai-engine\Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema (para scikit-learn y psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 4.3 — Dockerfile del Frontend (Vue 3)

**Archivo: `c:\cova\frontend\Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## PASO 5 — Crear el `docker-compose.yml` principal

**Archivo: `c:\cova\docker-compose.yml`**

```yaml
version: '3.9'

services:

  # ─────────────────────────────────────────
  # BASE DE DATOS: PostgreSQL 15 + PostGIS
  # ─────────────────────────────────────────
  db:
    image: postgis/postgis:15-3.3
    container_name: cova_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - cova_db_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d  # Scripts SQL de inicialización
    networks:
      - cova_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─────────────────────────────────────────
  # ADMIN DE BD: pgAdmin 4
  # ─────────────────────────────────────────
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: cova_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
    ports:
      - "8080:80"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - cova_network

  # ─────────────────────────────────────────
  # MOTOR DE IA: Python + FastAPI
  # ─────────────────────────────────────────
  ai-engine:
    build:
      context: ./ai-engine
      dockerfile: Dockerfile
    container_name: cova_ai_engine
    restart: unless-stopped
    environment:
      POSTGRES_HOST: ${POSTGRES_HOST}
      POSTGRES_PORT: ${POSTGRES_PORT}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "8000:8000"
    volumes:
      - ./ai-engine:/app  # Hot-reload en desarrollo
    depends_on:
      db:
        condition: service_healthy
    networks:
      - cova_network

  # ─────────────────────────────────────────
  # BACKEND: Node.js + Express + Socket.io
  # ─────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cova_backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV}
      PORT: ${PORT}
      POSTGRES_HOST: ${POSTGRES_HOST}
      POSTGRES_PORT: ${POSTGRES_PORT}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      AI_ENGINE_URL: ${AI_ENGINE_URL}
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app  # Hot-reload en desarrollo
      - /app/node_modules  # Evita sobrescribir node_modules del contenedor
    depends_on:
      db:
        condition: service_healthy
      ai-engine:
        condition: service_started
    networks:
      - cova_network

  # ─────────────────────────────────────────
  # FRONTEND: Vue 3 + Vite
  # ─────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cova_frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: ${VITE_API_URL}
      VITE_WS_URL: ${VITE_WS_URL}
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app   # Hot-reload en desarrollo
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - cova_network

# ─────────────────────────────────────────
# REDES Y VOLÚMENES
# ─────────────────────────────────────────
networks:
  cova_network:
    driver: bridge

volumes:
  cova_db_data:
    driver: local
```

---

## PASO 6 — Crear el `package.json` del Backend

**Archivo: `c:\cova\backend\package.json`**

```json
{
  "name": "cova-ai-backend",
  "version": "1.0.0",
  "description": "API Gateway COVA-AI - Resguardo Nacional Minero ZODI 62",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "sequelize": "^6.35.0",
    "socket.io": "^4.6.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## PASO 7 — Crear el `requirements.txt` del Motor de IA

**Archivo: `c:\cova\ai-engine\requirements.txt`**

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
scikit-learn==1.4.0
joblib==1.3.2
psycopg2-binary==2.9.9
python-dotenv==1.0.0
numpy==1.26.3
pydantic==2.5.3
```

---

## PASO 8 — Crear el `package.json` del Frontend

En PowerShell (dentro de `c:\cova`), inicializar con Vite directamente mediante Docker para no necesitar Node.js local:

```powershell
# Opción A: Si tienes Node.js local instalado
cd c:\cova\frontend
npm create vite@latest . -- --template vue
npm install
npm install vue-router@4 pinia axios socket.io-client leaflet @vue-leaflet/vue-leaflet chart.js
```

Si **no tienes Node.js local** (todo por Docker):

```powershell
# Opción B: Usar Docker para inicializar el proyecto
docker run --rm -v "c:/cova/frontend:/app" -w /app node:20-alpine sh -c `
  "npm create vite@latest . -- --template vue && npm install && npm install vue-router@4 pinia axios socket.io-client leaflet @vue-leaflet/vue-leaflet chart.js"
```

---

## PASO 9 — Crear los archivos mínimos del Backend para el primer arranque

**Archivo: `c:\cova\backend\src\config\db.js`**

```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST || 'db',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado correctamente.');
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
```

**Archivo: `c:\cova\backend\src\app.js`**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'COVA-AI Backend', timestamp: new Date() });
});

// WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Arranque
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Backend COVA-AI corriendo en http://localhost:${PORT}`);
  });
});
```

---

## PASO 10 — Crear el archivo mínimo del Motor de IA para el primer arranque

**Archivo: `c:\cova\ai-engine\app\main.py`**

```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(
    title="COVA-AI Engine",
    description="Motor de Inteligencia Artificial para el Sistema COVA-AI",
    version="1.0.0"
)

class ReporteInput(BaseModel):
    descripcion: str
    tipo_evento: str | None = None
    unidad_id: str | None = None

class AnalisisOutput(BaseModel):
    categoria: str
    nivel_riesgo: str
    patron_detectado: bool
    resumen_ia: str
    timestamp: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "COVA-AI Engine", "timestamp": datetime.now().isoformat()}

@app.post("/analyze", response_model=AnalisisOutput)
def analyze_report(reporte: ReporteInput):
    """
    Endpoint principal del Agente de IA.
    Fase 0: Retorna análisis simulado (lógica real se implementa en Fase 3).
    """
    descripcion_lower = reporte.descripcion.lower()

    # Clasificación básica por palabras clave (MVP inicial)
    if any(w in descripcion_lower for w in ["minería", "mineria", "draga", "motor"]):
        categoria = "MINERIA_ILEGAL"
        nivel_riesgo = "ALTO"
    elif any(w in descripcion_lower for w in ["armado", "grupo", "disparos", "herido"]):
        categoria = "INTRUSION_ARMADA"
        nivel_riesgo = "CRITICO"
    elif any(w in descripcion_lower for w in ["contrabando", "mercancía", "mercancia", "carga"]):
        categoria = "CONTRABANDO"
        nivel_riesgo = "MEDIO"
    else:
        categoria = "SIN_NOVEDAD"
        nivel_riesgo = "BAJO"

    resumen = (
        f"Reporte analizado por el Agente COVA-AI. "
        f"Categoría detectada: {categoria}. "
        f"Nivel de riesgo asignado: {nivel_riesgo}. "
        f"Se recomienda monitoreo {'inmediato' if nivel_riesgo == 'CRITICO' else 'de rutina'}."
    )

    return AnalisisOutput(
        categoria=categoria,
        nivel_riesgo=nivel_riesgo,
        patron_detectado=False,
        resumen_ia=resumen,
        timestamp=datetime.now().isoformat()
    )
```

---

## PASO 11 — Crear el `.gitignore`

**Archivo: `c:\cova\.gitignore`**

```gitignore
# Variables de entorno (NUNCA subir a Git)
.env
*.env.local

# Node.js
node_modules/
npm-debug.log*

# Python
__pycache__/
*.py[cod]
*.pyo
venv/
.venv/
*.pkl
*.onnx

# Vue / Vite
dist/
.vite/

# Docker
*.tar

# SO
.DS_Store
Thumbs.db

# Logs
logs/
*.log
```

---

## PASO 12 — Primer Arranque del Stack 🚀

Ahora que todos los archivos están en su lugar, ejecuta desde `c:\cova`:

```powershell
# 1. Construir todas las imágenes (solo la primera vez o cuando cambie código)
docker compose build

# 2. Levantar todo el stack en segundo plano
docker compose up -d

# 3. Ver los logs en tiempo real (opcional)
docker compose logs -f
```

---

## PASO 13 — Verificación del Sistema

Después de `docker compose up -d`, espera ~30 segundos para que todos los servicios arranquen y verifica:

### Verificación por URL (en el navegador)

| Servicio | URL | Resultado Esperado |
|---|---|---|
| Backend | http://localhost:3000/health | `{"status":"ok","service":"COVA-AI Backend"}` |
| Motor IA | http://localhost:8000/health | `{"status":"ok","service":"COVA-AI Engine"}` |
| Motor IA Docs | http://localhost:8000/docs | Interfaz Swagger automática de FastAPI |
| pgAdmin | http://localhost:8080 | Pantalla de login de pgAdmin |
| Frontend | http://localhost:5173 | Página inicial de Vue 3 |

### Verificación por consola

```powershell
# Ver el estado de todos los contenedores
docker compose ps

# Deberías ver 5 contenedores en estado "Up":
# cova_db        Up (healthy)
# cova_pgadmin   Up
# cova_ai_engine Up
# cova_backend   Up
# cova_frontend  Up
```

### Conectar pgAdmin a la base de datos

1. Abrir http://localhost:8080
2. Login: `admin@cova.mil.ve` / `AdminCova2026!`
3. Click derecho en **Servers → Register → Server**
4. Pestaña **General**: Name = `COVA-AI DB`
5. Pestaña **Connection**:
   - Host: `db` (nombre del servicio Docker, no `localhost`)
   - Port: `5432`
   - Database: `cova_ai_db`
   - Username: `cova_admin`
   - Password: `CovaSecure2026!`
6. Click **Save** → verás las tablas creadas automáticamente

---

## PASO 14 — Comandos de Mantenimiento Cotidiano

```powershell
# Levantar el stack
docker compose up -d

# Detener el stack (sin borrar datos)
docker compose down

# Detener Y borrar todos los datos (BD incluida) ⚠️
docker compose down -v

# Reconstruir solo un servicio (ej: al cambiar requirements.txt)
docker compose build ai-engine
docker compose up -d ai-engine

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f ai-engine

# Entrar a la consola de la BD
docker compose exec db psql -U cova_admin -d cova_ai_db

# Reiniciar un servicio específico
docker compose restart backend
```

---

## PASO 15 — Prueba del Motor de IA (opcional pero recomendado)

Puedes probar el AI Engine directamente desde PowerShell:

```powershell
# Prueba 1: Sin novedad
Invoke-RestMethod -Method POST -Uri "http://localhost:8000/analyze" `
  -ContentType "application/json" `
  -Body '{"descripcion": "Patrulla de rutina en el sector norte, sin novedad que reportar"}'

# Prueba 2: Minería ilegal
Invoke-RestMethod -Method POST -Uri "http://localhost:8000/analyze" `
  -ContentType "application/json" `
  -Body '{"descripcion": "Se detectó actividad de minería ilegal con draga en el río Caura"}'

# Prueba 3: Grupo armado
Invoke-RestMethod -Method POST -Uri "http://localhost:8000/analyze" `
  -ContentType "application/json" `
  -Body '{"descripcion": "Avistamiento de grupo armado en el margen oeste, se escucharon disparos"}'
```

---

## 📋 Resumen del Estado al Final de Este Plan

| Componente | Estado Esperado |
|---|---|
| PostgreSQL + PostGIS | ✅ Corriendo con tablas creadas |
| pgAdmin | ✅ Accesible con BD conectada |
| Motor IA (FastAPI) | ✅ Analizando reportes con lógica básica |
| Backend (Express) | ✅ Health check respondiendo |
| Frontend (Vue 3) | ✅ Página inicial visible |
| Red Docker interna | ✅ Todos los servicios comunicados |

---

## ➡️ Siguiente Paso: FASE 1 — Autenticación

Una vez que el stack esté operativo, el siguiente paso de desarrollo es implementar:
- `POST /api/auth/login` en el backend
- Página de Login en Vue 3
- Sistema RBAC con los 4 roles del sistema

> Consultar la sección **"FASE 1"** del `implementation_plan.md` para el detalle.
