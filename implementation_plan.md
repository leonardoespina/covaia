# MVP: Sistema COVA-AI — Agente de IA para el Resguardo Nacional Minero (ZODI N°62 Bolívar)

> [!IMPORTANT]
> **Cambios aprobados:** Frontend migrado a **Vue 3 + Vite**. Entorno 100% Dockerizado y portable.

> **Basado en:** Proyecto de Investigación — Mayor Cova Torres Jhosenp Eduardo  
> **Rol:** Arquitecto de Software  
> **Fecha:** Abril 2026

---

## 🎯 Contexto y Problema Central

El Servicio de Resguardo Nacional Minero de la ZODI N°62 Bolívar opera en una región de selva con amenazas multidimensionales (minería ilegal, grupos armados, contrabando de extracción). Los métodos actuales son:

- **Reactivos** y **manuales**: reportes de patrullaje procesados a mano.
- **Fragmentados**: datos de sensores, drones y puestos de control desconectados.
- **Lentos**: existe un "lag operativo" crítico entre la detección y la respuesta.

**El MVP resuelve** la brecha entre la observación y la decisión, entregando al Comandante de la ZODI un **Panel de Conciencia Situacional en Tiempo Real**, impulsado por un Agente de IA que analiza, categoriza y prioriza alertas operacionales.

---

## 🔑 Principios de Diseño del MVP

| Principio | Descripción |
|---|---|
| **Soberanía Tecnológica** | Todo el código y datos son propiedad de la FANB. Sin dependencias de APIs externas para datos sensibles. |
| **Modular** | Cada componente (ingesta, análisis IA, dashboard) puede evolucionar de forma independiente. |
| **Offline-First** | Opera en zonas con conectividad limitada, sincronizando datos cuando hay red. |
| **Mínimo Viable** | El MVP no implementa todo; implementa solo lo necesario para validar el concepto con la organización. |

---

## 🏗️ Arquitectura del MVP (Visión General)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PANEL DE COMANDO (Frontend)                   │
│           Vue 3 + Vite + Leaflet.js + Chart.js + Socket.io      │
│                     [Docker: puerto 5173]                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                    API GATEWAY (Backend)                         │
│              Node.js + Express + JWT + Socket.io                 │
│                     [Docker: puerto 3000]                        │
├──────────┬───────────────┬──────────────────┬───────────────────┤
│ Módulo   │ Módulo Agente │ Módulo Alertas   │ Módulo Reportes   │
│ Ingesta  │    de IA      │   y Despacho     │ y Auditoría       │
└──────────┴───────────────┴──────────────────┴───────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    BASE DE DATOS                                 │
│         PostgreSQL 15 + PostGIS (datos geoespaciales)           │
│               [Docker: puerto 5432] + pgAdmin [8080]             │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              MOTOR DE IA (Microservicio Python)                  │
│          FastAPI + scikit-learn + joblib (modelos locales)       │
│                     [Docker: puerto 8000]                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos del MVP (Alcance)

### MÓDULO 1 — Ingesta de Reportes de Patrulla
Formulario digital para que los efectivos ingresen reportes desde el campo. Reemplaza el papel.

**Funcionalidades:**
- Formulario de novedad (texto libre + campos estructurados: ubicación, tipo de evento, gravedad)
- Adjuntar foto desde dispositivo móvil
- Funciona offline y sincroniza cuando hay conexión (PWA)

---

### MÓDULO 2 — Agente de IA: Análisis y Priorización
El corazón del sistema. Procesa los reportes y genera inteligencia operacional.

**Funcionalidades:**
- **Clasificación automática** del tipo de amenaza: minería ilegal, incursión armada, paso de contrabando, sin novedad.
- **Cálculo de nivel de riesgo** (Bajo / Medio / Alto / Crítico) basado en historial de la zona.
- **Detección de patrones**: si una misma zona reporta incidencias en las últimas 72h, el agente eleva su nivel de alerta automáticamente.
- **Resumen ejecutivo**: genera un párrafo de texto con el resumen del turno para el Comandante.

---

### MÓDULO 3 — Panel de Conciencia Situacional (Mapa Interactivo)
El producto visible. Un mapa táctico con capas de información.

**Funcionalidades:**
- Mapa geoespacial de la ZODI N°62 (Leaflet + OpenStreetMap o tiles propios).
- Marcadores de puestos de control, patrullas activas, alertas recientes.
- Capas activables: zonas de exclusión minera, rutas de patrulla, histórico de incidentes.
- Panel lateral: últimas 10 alertas con nivel de riesgo e IA summary.
- Indicadores en tiempo real: # alertas activas, # patrullas en servicio, zona de mayor riesgo.

---

### MÓDULO 4 — Gestión de Alertas y Despacho
Flujo de trabajo para responder a una alerta.

**Funcionalidades:**
- El Comandante recibe una notificación de alerta.
- Puede asignar una unidad de respuesta directamente desde el panel.
- Registro de la respuesta: tiempo de reacción, unidad despachada, resolución.
- Historial de atención a alertas (para análisis posterior).

---

### MÓDULO 5 — Autenticación y Control de Acceso (RBAC)
Seguridad mínima esencial para un sistema de defensa.

**Roles:**
| Rol | Permisos |
|---|---|
| `COMANDANTE` | Vista completa, aprueba despachos, ve resumen ejecutivo IA |
| `OFICIAL_OPERACIONES` | Gestiona alertas, crea reportes, asigna unidades |
| `EFECTIVO_CAMPO` | Solo puede crear reportes de patrulla |
| `ADMIN_SISTEMA` | Gestión de usuarios y configuración |

---

## 🗂️ Estructura del Proyecto

```
cova-ai/
├── frontend/                    # Panel de Comando (Vue 3 + Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── map/             # Componentes del mapa táctico (Leaflet)
│   │   │   ├── alerts/          # Panel de alertas
│   │   │   ├── reports/         # Formulario de reportes
│   │   │   └── ui/              # Componentes genéricos (botones, cards)
│   │   ├── views/               # Vistas de Vue Router
│   │   │   ├── DashboardView.vue   # Panel principal con mapa
│   │   │   ├── ReportsView.vue     # Lista y formulario de reportes
│   │   │   ├── AlertsView.vue      # Gestión de alertas
│   │   │   └── LoginView.vue       # Autenticación
│   │   ├── router/
│   │   │   └── index.js         # Vue Router (rutas protegidas)
│   │   ├── stores/              # Estado global (Pinia)
│   │   │   ├── auth.js
│   │   │   ├── alerts.js
│   │   │   └── map.js
│   │   ├── services/            # Llamadas a la API (Axios)
│   │   │   └── api.js
│   │   └── App.vue
│   ├── Dockerfile               # Dockerfile del frontend
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # API Gateway (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Conexión PostgreSQL
│   │   ├── middleware/
│   │   │   ├── auth.js          # Validación JWT
│   │   │   └── rbac.js          # Control de roles
│   │   ├── modules/
│   │   │   ├── auth/            # Login, tokens
│   │   │   ├── reports/         # CRUD de reportes de patrulla
│   │   │   ├── alerts/          # CRUD de alertas
│   │   │   ├── units/           # Gestión de unidades/patrullas
│   │   │   └── ai/              # Proxy al microservicio de IA
│   │   ├── socket/
│   │   │   └── events.js        # WebSocket para tiempo real
│   │   └── app.js
│   ├── migrations/              # Migraciones Sequelize
│   └── package.json
│
├── ai-engine/                   # Motor de IA (Python + FastAPI)
│   ├── app/
│   │   ├── main.py              # Endpoints FastAPI
│   │   ├── classifier.py        # Modelo de clasificación de amenazas
│   │   ├── risk_engine.py       # Cálculo de nivel de riesgo
│   │   ├── pattern_detector.py  # Detección de patrones temporales
│   │   └── summarizer.py        # Generación de resumen ejecutivo
│   ├── models/                  # Modelos entrenados (.pkl, .onnx)
│   ├── data/
│   │   └── training_data.csv    # Datos de entrenamiento iniciales
│   └── requirements.txt
│
├── docker-compose.yml           # Orquestación completa (portable)
├── docker-compose.prod.yml      # Variante para entrega/producción
├── .env.example                 # Variables de entorno (copiar a .env)
├── export.sh / export.ps1       # Script para exportar imágenes Docker
└── README.md                    # Instrucciones de arranque en 3 pasos
```

---

## 🗄️ Modelo de Datos Principal

```sql
-- Usuarios del sistema
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  nombre VARCHAR(100),
  cedula VARCHAR(20) UNIQUE,
  rango VARCHAR(50),
  rol VARCHAR(30),       -- COMANDANTE, OFICIAL_OPERACIONES, etc.
  unidad_id UUID,
  password_hash VARCHAR,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

-- Puestos de control y patrullas
CREATE TABLE unidades (
  id UUID PRIMARY KEY,
  nombre VARCHAR(100),
  tipo VARCHAR(30),       -- PUESTO_CONTROL, PATRULLA_MOVIL
  coordenadas GEOGRAPHY(Point, 4326),
  efectivos_asignados INT,
  activa BOOLEAN
);

-- Reportes de campo (ingesta)
CREATE TABLE reportes_patrulla (
  id UUID PRIMARY KEY,
  unidad_id UUID REFERENCES unidades(id),
  usuario_id UUID REFERENCES usuarios(id),
  descripcion TEXT,
  tipo_evento VARCHAR(50),   -- MINERIA_ILEGAL, INTRUSIÓN, SIN_NOVEDAD, etc.
  coordenadas GEOGRAPHY(Point, 4326),
  foto_url VARCHAR,
  sincronizado BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

-- Alertas generadas por el Agente de IA
CREATE TABLE alertas (
  id UUID PRIMARY KEY,
  reporte_id UUID REFERENCES reportes_patrulla(id),
  nivel_riesgo VARCHAR(20),  -- BAJO, MEDIO, ALTO, CRITICO
  categoria VARCHAR(50),
  resumen_ia TEXT,
  patron_detectado BOOLEAN DEFAULT false,
  estado VARCHAR(20) DEFAULT 'ACTIVA',  -- ACTIVA, ASIGNADA, RESUELTA
  created_at TIMESTAMP
);

-- Despachos de respuesta
CREATE TABLE despachos (
  id UUID PRIMARY KEY,
  alerta_id UUID REFERENCES alertas(id),
  unidad_despachada_id UUID REFERENCES unidades(id),
  despachado_por UUID REFERENCES usuarios(id),
  tiempo_respuesta_min INT,
  resultado TEXT,
  created_at TIMESTAMP
);
```

---

## 🚀 Hoja de Ruta de Desarrollo (Paso a Paso)

### FASE 0 — Preparación del entorno (Semana 1)
> **Objetivo:** Tener el entorno de desarrollo operativo.

- [ ] Instalar Docker Desktop
- [ ] Crear repositorio Git (local o servidor propio)
- [ ] Copiar `.env.example` y configurar variables de entorno
- [ ] Levantar `docker-compose up` (PostgreSQL + pgAdmin ya configurados)
- [ ] Verificar conexión con pgAdmin en `localhost:5050`
- [ ] Ejecutar migración inicial para crear las tablas

**Entregable:** Base de datos corriendo con el schema inicial. ✅

---

### FASE 1 — Autenticación y Usuarios (Semana 2)
> **Objetivo:** Sistema de login con roles funcional.

**Backend:**
- [ ] Endpoint `POST /api/auth/login` → retorna JWT
- [ ] Middleware de autenticación (verifica JWT en headers)
- [ ] Middleware RBAC (verifica rol en la ruta)
- [ ] Endpoint `GET /api/auth/me` → devuelve datos del usuario actual
- [ ] Seed de usuarios de prueba (1 por cada rol)

**Frontend:**
- [ ] Página de Login (`/login`) con formulario estilizado
- [ ] Guardar JWT en `localStorage` y inyectarlo en Axios
- [ ] Ruta protegida: redirigir a `/login` si no hay token
- [ ] Navbar con nombre del usuario, rol y botón de cerrar sesión

**Entregable:** Login funcional con 4 roles. Rutas protegidas. ✅

---

### FASE 2 — Ingesta de Reportes de Campo (Semana 3)
> **Objetivo:** Efectivos pueden registrar novedades desde el campo.

**Backend:**
- [ ] `POST /api/reportes` → crear reporte (solo EFECTIVO_CAMPO, OFICIAL)
- [ ] `GET /api/reportes` → listar reportes (con filtros de fecha y tipo)
- [ ] `GET /api/reportes/:id` → detalle de reporte
- [ ] Upload de foto: multer + almacenamiento local `/uploads/`
- [ ] Validación: coordenadas dentro del bounding box de la ZODI Bolívar

**Frontend:**
- [ ] Página `/reportes/nuevo` — Formulario con:
  - Campo de descripción libre
  - Select de tipo de evento (minería, incursión, SN, etc.)
  - Coordenadas (lat/lon manual o selector en mini-mapa)
  - Carga de foto
- [ ] Página `/reportes` — Tabla de reportes con filtros

**Entregable:** Efectivos pueden crear reportes. Los oficiales los ven en lista. ✅

---

### FASE 3 — Motor de IA (Semana 4-5)
> **Objetivo:** El Agente de IA analiza y clasifica cada reporte.

**AI Engine (Python):**
- [ ] Configurar FastAPI con endpoint `POST /analyze`
- [ ] `classifier.py`: Modelo de clasificación de texto (TF-IDF + Naive Bayes entrenado con datos sintéticos de ejemplos de reportes militares)
- [ ] `risk_engine.py`: Reglas para calcular nivel de riesgo (tipo de evento + historial de zona en últimas 72h)
- [ ] `pattern_detector.py`: Query a PostgreSQL para detectar recurrencia de incidentes en radio de 5km en 72h
- [ ] `summarizer.py`: Plantilla de texto + datos del reporte = párrafo ejecutivo legible
- [ ] Retorna JSON: `{ categoria, nivel_riesgo, patron, resumen_ia }`

**Backend (Node.js):**
- [ ] Worker/job que llama al AI Engine después de cada reporte creado
- [ ] Crea la alerta correspondiente en DB con el resultado del análisis

**Entregable:** Cada reporte genera automáticamente una alerta con análisis de IA. ✅

---

### FASE 4 — Panel de Conciencia Situacional (Semana 6-7)
> **Objetivo:** El mapa táctico interactivo como producto visible del MVP.

**Frontend:**
- [ ] Integrar Leaflet en el Dashboard principal
- [ ] Capa base: OpenStreetMap o tiles satelitales de Venezuela
- [ ] Marcadores de puestos de control (estáticos, de la BD)
- [ ] Marcadores de alertas activas (color según nivel de riesgo: Verde/Amarillo/Rojo/Rojo parpadeante)
- [ ] Panel lateral derecho: lista de últimas 10 alertas con nivel y resumen IA
- [ ] Popup al click en marcador: detalle del reporte + nivel de riesgo del agente IA
- [ ] Indicadores superiores: `Alertas Activas | Patrullas en Servicio | Zona de Mayor Riesgo`

**WebSockets (tiempo real):**
- [ ] El backend emite evento `nueva_alerta` al crear una alerta
- [ ] El frontend escucha y actualiza el mapa + panel sin recarga

**Entregable:** Panel de mando táctico en tiempo real. ✅

---

### FASE 5 — Gestión de Alertas y Despacho (Semana 8)
> **Objetivo:** El Comandante puede actuar sobre una alerta.

**Backend:**
- [ ] `POST /api/despachos` → asignar unidad a una alerta
- [ ] `PATCH /api/alertas/:id/resolver` → marcar alerta como resuelta
- [ ] Notificación WebSocket a la unidad despachada

**Frontend:**
- [ ] En cada alerta: botón **"Despachar Unidad"** (solo COMANDANTE y OFICIAL)
- [ ] Modal de despacho: dropdown de unidades disponibles + confirmación
- [ ] Historial de despachos con tiempos de respuesta

**Entregable:** Flujo completo: novedad → alerta IA → despacho → resolución. ✅

---

### FASE 6 — Reportes y Auditoría (Semana 9)
> **Objetivo:** Generación de reportes ejecutivos para el Comandante.

**Funcionalidades:**
- [ ] Reporte diario: alertas por categoría, tiempo promedio de respuesta
- [ ] Mapa de calor histórico (zonas de mayor recurrencia de amenazas)
- [ ] Exportar PDF del resumen ejecutivo del Agente IA (turno)
- [ ] Log de auditoría de acciones por usuario

**Entregable:** Reportes ejecutivos descargables. ✅

---

### FASE 7 — PWA y Hardening (Semana 10)
> **Objetivo:** Preparar para uso real en campo.

- [ ] Configurar Service Worker para modo offline en el formulario de reportes
- [ ] Cola de novedades offline: sincronizar cuando vuelve la conexión
- [ ] HTTPS (certificado autofirmado para intranet)
- [ ] Rate limiting y protección básica de endpoints
- [ ] Guía de despliegue en servidor institucional (Ubuntu Server LTS)

**Entregable:** Sistema desplegable en la intranet de la ZODI. ✅

---

## 🛠️ Stack Tecnológico Definitivo

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | Vue 3 + Vite | Composition API, rendimiento excelente, curva de aprendizaje amigable |
| **Mapas** | Leaflet.js + vue-leaflet | Open source, sin API keys de Google |
| **Estado** | Pinia | Estado oficial de Vue 3, simple y con DevTools |
| **Routing** | Vue Router 4 | Oficial de Vue, guards para rutas protegidas |
| **Backend API** | Node.js + Express | El equipo ya lo usa (ver historial de proyectos) |
| **ORM** | Sequelize | Alineado con el stack existente |
| **Base de Datos** | PostgreSQL + PostGIS | Soporte nativo a datos geoespaciales (lat/lon, zonas) |
| **Motor de IA** | Python + FastAPI | Estándar de la industria para ML |
| **ML** | scikit-learn | Ligero, entrenamiento local, sin dependencia de cloud |
| **Tiempo Real** | Socket.io | Fácil integración con Node.js |
| **Auth** | JWT + bcrypt | Simple y seguro |
| **Contenedores** | Docker + Docker Compose | Despliegue reproducible |
| **PWA** | Vite PWA Plugin | Soporte offline para efectivos de campo |

---

## 📊 Métricas de Éxito del MVP

| Métrica | Meta |
|---|---|
| Tiempo de creación de un reporte | < 2 minutos |
| Tiempo de generación de alerta por IA | < 5 segundos tras recibir reporte |
| Precisión de clasificación de amenazas | > 80% (validado con oficiales de la ZODI) |
| Disponibilidad del sistema | > 95% en pruebas |
| Usuarios piloto | ≥ 10 efectivos de la ZODI en prueba de campo |

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Datos de entrenamiento escasos | Usar reportes históricos + datos sintéticos + técnica de Data Augmentation |
| Conectividad limitada en campo | Diseño offline-first (PWA + sync queue) |
| Resistencia al cambio institucional | Involucrar a oficiales de la ZODI desde la Fase 0 como validadores |
| Seguridad de datos sensibles | Todo on-premise, HTTPS, RBAC estricto, sin datos a la nube |
| Hardware insuficiente | El motor de IA es liviano (scikit-learn); funciona en servidor de gama media |

---

## 🗓️ Cronograma Resumido

| Fase | Semanas | Entregable |
|---|---|---|
| 0. Entorno | 1 | Docker + BD operativos |
| 1. Auth | 2 | Login con roles |
| 2. Reportes | 3 | Formulario de campo funcional |
| 3. Motor IA | 4-5 | Agente clasifica reportes |
| 4. Mapa Táctico | 6-7 | Dashboard en tiempo real |
| 5. Despacho | 8 | Flujo completo de respuesta |
| 6. Reportes | 9 | PDF ejecutivo del Comandante |
| 7. PWA/Deploy | 10 | Sistema en producción intranet |

**Duración total estimada: 10 semanas (trabajando a tiempo parcial / investigación)**

---

## 🐳 Estrategia Docker — Portabilidad Total

> [!IMPORTANT]
> El sistema es 100% Dockerizado. La persona que recibe el proyecto **solo necesita tener Docker Desktop instalado**. No necesita Node.js, Python ni PostgreSQL en su máquina.

### Para desarrollar (tú en tu PC)
```bash
# 1. Clonar/copiar el proyecto
# 2. Copiar las variables de entorno
copy .env.example .env
# 3. Levantar todo el stack
docker-compose up --build
# Listo: Frontend en http://localhost:5173
#        Backend en http://localhost:3000
#        pgAdmin en http://localhost:8080
```

### Para entregar el proyecto (exportar sin internet)
```powershell
# Construir y exportar todas las imágenes a un archivo .tar
docker-compose build
docker save cova-ai-frontend cova-ai-backend cova-ai-engine cova-ai-db ^
  -o cova-ai-images.tar

# La otra persona ejecuta esto para importar:
docker load -i cova-ai-images.tar
docker-compose up
```

### Archivos que se entregan (zip completo)
```
cova-ai-entrega.zip
├── docker-compose.yml        # Orquestación
├── .env.example              # Variables de entorno (sin secretos)
├── cova-ai-images.tar        # Imágenes Docker pre-construidas
└── README.md                 # Instrucciones de 3 pasos
```

### Variantes del `docker-compose`
| Archivo | Uso |
|---|---|
| `docker-compose.yml` | Desarrollo: hot-reload activado, volúmenes montados |
| `docker-compose.prod.yml` | Entrega: imágenes optimizadas, sin hot-reload |

---

> **Próximo paso:** Generar los archivos reales del proyecto (`docker-compose.yml`, `Dockerfiles`, schema SQL, estructura base de Vue 3).
