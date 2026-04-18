# Guía de Despliegue en Render.com para ZODI 62 (COVA)

Render es una plataforma excelente para desplegar esta arquitectura de microservicios. Dado que tu proyecto tiene Frontend (Vue), Backend (Node), Motor AI (Python) y Base de Datos (PostgreSQL), la estrategia recomendada es dividir la aplicación en 4 componentes dentro de Render usando los planes gratuitos/básicos.

## Arquitectura de Render

1. **PostgreSQL (Database):** Base de datos gestionada nativa de Render.
2. **AI Engine (Web Service):** Contenedor Docker desplegado desde tu carpeta `ai-engine`.
3. **Backend Node (Web Service):** Web service tradicional desplegado desde tu carpeta `backend`.
4. **Frontend Vue (Static Site):** Sitio estático rápido y con CDN desde tu carpeta `frontend`.

---

## Pasos para Desplegar

> [!IMPORTANT]
> Debes tener todo tu código subido a un repositorio en **GitHub** o **GitLab**. Render se conectará directamente a este repositorio.

### Paso 1: Base de Datos (PostgreSQL)
1. En el Dashboard de Render, haz clic en **New +** y selecciona **PostgreSQL**.
2. Dale un nombre (ej. `zodi-db`) y selecciona la región más cercana.
3. Elige el plan Gratuito (Free) o Starter.
4. Render te dará las credenciales: **Internal Database URL** (para los Web Services internos) y **External Database URL** (para tu PgAdmin si quieres conectarte desde tu PC).

### Paso 2: Motor Inteligencia Artificial (FastAPI/Python)
1. Haz clic en **New +** y selecciona **Web Service**.
2. Conecta tu cuenta de Github y selecciona tu repositorio.
3. En la configuración:
   - **Name:** `zodi-ai-engine`
   - **Environment:** `Docker`
   - **Root Directory:** `ai-engine` (Esto le dirá a Render que construya desde esta carpeta usando tu Dockerfile existente).
4. En **Environment Variables**, añade:
   - `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc. (Sácalos del Paso 1, usa tus credenciales).
5. Crea el servicio.

### Paso 3: Backend Node.js
1. De nuevo haz clic en **New +** -> **Web Service**.
2. Selecciona tu repositorio.
3. Configuración:
   - **Name:** `zodi-backend`
   - **Environment:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (o `node src/app.js` según tu package.json).
4. En **Environment Variables**, añade:
   - Las variables de conexión a DB (iguales al paso 2).
   - `JWT_SECRET`: Tipea un código secreto.
   - `AI_ENGINE_URL`: Ingresa la URL pública o interna que Render te generó en el Paso 2 (ej. `https://zodi-ai-engine.onrender.com`).
5. Crea el servicio.

### Paso 4: Frontend Vue.js (Static Site)
1. Haz clic en **New +** -> **Static Site** (¡Esto es vital porque los Static Sites son completamente gratis y extremadamente rápidos!).
2. Selecciona tu repositorio.
3. Configuración:
   - **Name:** `zodi-dashboard`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. En **Environment Variables**, añade tus rutas hacia el backend recientemente creado:
   - `VITE_API_URL`: La URL pública del backend del paso 3 (ej. `https://zodi-backend.onrender.com/api`)
   - `VITE_WS_URL`: La misma URL pública del backend para el WebSocket (ej. `https://zodi-backend.onrender.com`)
5. En la sección **Redirects/Rewrites** (muy importante para el router de Vue):
   - Crea una regla que redirija **Source:** `/*`, **Destination:** `/index.html`, **Action:** `Rewrite`.

> [!TIP]
> **Modificaciones mínimas sugeridas antes de subir a GitHub:**
> 1. Asegúrate de que tu `backend/src/app.js` escuche explícitamente en el puerto dinámico de Render (`const PORT = process.env.PORT || 3000`).
> 2. En `backend/package.json`, asegúrate de tener un script de inicio (`"start": "node src/app.js"`).

Si quieres automatizar esto aún más en el futuro, Render permite crear un archivo llamado `render.yaml` equivalente a tu `docker-compose`, pero la vía manual explicada arriba es la mejor para garantizar el control sobre URLs y bases de datos gratuitas.
