# Fase 5: Gestión de Alertas y Despacho

## Backend
- [x] Crear `unit.model.js` (Mapeo Sequelize → tabla unidades)
- [x] Crear `unit.controller.js` (GET /api/unidades)
- [x] Crear `unit.routes.js` (protegido con JWT)
- [x] Crear `dispatch.model.js` (Mapeo Sequelize → tabla despachos)
- [x] Crear `dispatch.controller.js` (POST despacho, GET historial, PATCH resolver)
- [x] Crear `dispatch.routes.js` (RBAC: COMANDANTE, OFICIAL_OPERACIONES)
- [x] Integrar rutas en `app.js` + asociaciones Sequelize
- [x] Seed SQL `03_units_seed.sql` con 10 unidades operacionales

## Frontend
- [x] Crear `AlertsView.vue` con:
  - [x] KPI bar (Críticas, Altas, Activas, Resueltas, Despachos)
  - [x] Lista de alertas filtrable (estado + nivel de riesgo)
  - [x] Modal de Despacho (selección de unidad, tiempo respuesta)
  - [x] Modal Resolver alerta (con campo de resultado)
  - [x] Panel lateral historial de despachos
  - [x] Protección por rol (RBAC en UI)
- [x] Actualizar `router/index.js` → ruta `/alertas`
- [x] Actualizar `App.vue`:
  - [x] Link 🚨 Alertas en sidebar
  - [x] Badge animado con conteo de alertas activas
  - [x] Avatar inicial de usuario en sidebar
  - [x] Polling cada 30s para badge

## CSS
- [x] Estilos para `AlertsView` (KPI bar, grid, alerta-row)
- [x] Estilos para modales (Despacho + Resolver) con animación
- [x] Badge del sidebar (`.nav-badge`)
- [x] Avatar de usuario (`.user-avatar`)
- [x] Botones `.btn-dispatch` y `.btn-resolve-full`

## Pruebas pendientes
- [ ] Levantar Docker y verificar que `/api/unidades` devuelve las 10 unidades seed
- [ ] Crear un reporte → verificar alerta generada → despachar unidad → resolver
- [ ] Verificar que el badge del sidebar se actualiza
- [ ] Verificar que EFECTIVO_CAMPO no ve botones de despacho
