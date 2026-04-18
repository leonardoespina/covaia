<template>
  <div class="dashboard-view">
    <!-- HEADER con indicadores -->
    <div class="tactical-header">
      <div class="header-title">
        <h1>Panel de Conciencia Situacional</h1>
        <p>ZODI N°62 Bolívar — <span :class="['ws-status', wsConnected ? 'connected' : 'disconnected']" @dblclick="toggleDemo" style="cursor:crosshair" title="Doble clic para Activar Simulador VRSS-2 y Radar">
          {{ wsConnected ? '● EN VIVO' : '○ Sin conexión en tiempo real' }}
        </span></p>
      </div>
      <div class="kpi-strip">
        <div class="kpi" :class="{ 'kpi-alert': alertasActivas.length > 0 }">
          <span class="kpi-number">{{ alertasActivas.length }}</span>
          <span class="kpi-label">Alertas Activas</span>
        </div>
        <div class="kpi">
          <span class="kpi-number">4</span>
          <span class="kpi-label">Unidades en Servicio</span>
        </div>
        <div class="kpi">
          <span class="kpi-number">{{ zonaMaxRiesgo }}</span>
          <span class="kpi-label">Zona Mayor Riesgo</span>
        </div>
      </div>
    </div>

    <!-- LAYOUT: Mapa + Panel -->
    <div class="tactical-body">

      <!-- MAPA LEAFLET -->
      <div class="map-container" id="tactical-map">
        <div ref="mapEl" class="leaflet-map"></div>
        <!-- Leyenda del mapa -->
        <div class="map-legend">
          <div class="legend-title">🗺️ Leyenda</div>
          <div class="legend-item"><span class="dot dot-ok"></span> Sin Novedad</div>
          <div class="legend-item"><span class="dot dot-medium"></span> Medio Riesgo</div>
          <div class="legend-item"><span class="dot dot-high"></span> Alto Riesgo</div>
          <div class="legend-item"><span class="dot dot-critical"></span> CRÍTICO</div>
          <div class="legend-item"><span class="dot dot-base"></span> Puesto Control</div>
        </div>
        
        <!-- CONSOLA MODO DEMO -->
        <div v-if="demoModeActive" class="demo-console">
          <div class="console-header">🔗 INTERFAZ VRSS-2 SAT-UAV SECURE LINK</div>
          <div class="console-body">
            <div v-for="(log, idx) in consoleFeedLogs" :key="idx" class="console-line">{{ log }}</div>
          </div>
        </div>
      </div>

      <!-- PANEL DE ALERTAS -->
      <aside class="alerts-panel">
        <div class="panel-header">
          <h2>Últimas Alertas IA</h2>
          <span class="alert-count">{{ alertasActivas.length }} activas</span>
        </div>

        <div v-if="aiProcessingInfo" class="ai-thinking-banner">
          <div class="ai-spinner"></div>
          <div class="ai-thinking-text">
            <b>Sistema Experto analizando reporte...</b>
            <div class="ai-thinking-sub">"{{ aiProcessingInfo.descripcion }}"</div>
            <div class="ai-thinking-steps">
              <span class="step loading">Extrayendo texto espacial...</span>
              <span class="step loading">Iniciando pipeline TF-IDF...</span>
              <span class="step loading">Calculando score de riesgo...</span>
            </div>
          </div>
        </div>

        <div v-if="loadingAlertas" class="panel-loading">Cargando alertas...</div>

        <div v-else-if="alertas.length === 0 && !aiProcessingInfo" class="panel-empty">
          Sin alertas registradas.<br>Cuando los efectivos envíen reportes, el Agente IA los clasificará aquí.
        </div>

        <div v-else class="alerts-list">
          <div
            v-for="alerta in alertas"
            :key="alerta.id"
            :class="['alert-card-item', `risk-${alerta.nivel_riesgo?.toLowerCase()}`]"
            v-show="!aiProcessingInfo || alerta.id !== currentNewAlertId"
            @click="focusAlerta(alerta)"
          >
            <div class="alert-top">
              <span :class="['risk-badge', `risk-badge-${alerta.nivel_riesgo?.toLowerCase()}`]">
                {{ riskIcon(alerta.nivel_riesgo) }} {{ alerta.nivel_riesgo }}
              </span>
              <span class="alert-time">{{ timeAgo(alerta.created_at) }}</span>
            </div>
            <div class="alert-category">
              {{ alerta.categoria?.replace('_', ' ') }}
              <span v-if="alerta.confianza" class="ai-confidence" :class="{'low-conf': alerta.confianza < 60}">
                (Confianza: {{ alerta.confianza }}%)
              </span>
            </div>
            <p class="alert-summary">{{ alerta.resumen_ia }}</p>
            <img v-if="alerta.evidencia_url" :src="alerta.evidencia_url" class="alert-evidence" alt="Evidencia IA"/>
            <div class="alert-footer">
              <span class="alert-estado" :class="alerta.estado?.toLowerCase()">{{ alerta.estado }}</span>
              <button
                v-if="alerta.estado === 'ACTIVA'"
                @click.stop="resolverAlerta(alerta.id)"
                class="btn-resolve"
              >Resolver</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
    <!-- CHAT TACTICO IA -->
    <ChatTactico />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import api from '../services/api';
import ChatTactico from '../components/ChatTactico.vue';

// ── ESTADO ──────────────────────────────────────────
const mapEl = ref(null);
const alertas = ref([]);
const loadingAlertas = ref(true);
const wsConnected = ref(false);
const aiProcessingInfo = ref(null);
const currentNewAlertId = ref(null);

const demoModeActive = ref(false);
const consoleFeedLogs = ref([]);
let droneInterval = null;

let map = null;
let markersLayer = null;
let socket = null;

// ── PUESTOS DE CONTROL DEL ARCO MINERO (ZODI N°62) ──
const puestosControl = [
  { nombre: 'Las Claritas (Base Sur)', lat: 6.17, lng: -61.43, tipo: 'base' },
  { nombre: 'Fuerte Cayaurima (El Dorado)', lat: 6.72, lng: -61.61, tipo: 'base' },
  { nombre: 'El Callao (ZODI N62)', lat: 7.34, lng: -61.82, tipo: 'base' },
  { nombre: 'Caicara del Orinoco (Bloque 1)', lat: 7.63, lng: -66.16, tipo: 'base' },
  { nombre: 'Fuerte Tarabay (Tumeremo)', lat: 7.29, lng: -61.50, tipo: 'base' }
];

// ── COMPUTED ────────────────────────────────────────
const alertasActivas = computed(() => alertas.value.filter(a => a.estado === 'ACTIVA'));
const zonaMaxRiesgo = computed(() => {
  const criticas = alertas.value.filter(a => a.nivel_riesgo === 'CRITICO');
  const altas = alertas.value.filter(a => a.nivel_riesgo === 'ALTO');
  if (criticas.length > 0) return 'CRÍTICA';
  if (altas.length > 0) return 'ALTA';
  return 'Normal';
});

// ── HELPERS ──────────────────────────────────────────
const riskIcon = (nivel) => ({ BAJO: '🟢', MEDIO: '🟡', ALTO: '🔴', CRITICO: '🚨' }[nivel] || '⚪');

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return new Date(dateStr).toLocaleDateString('es-VE');
};

const riskColor = (nivel) => ({
  BAJO: '#a0d84a',
  MEDIO: '#ffa500',
  ALTO: '#ff6b6b',
  CRITICO: '#ff4757'
}[nivel] || '#8395a7');

// ── LEAFLET HELPERS ──────────────────────────────────
const crearIcono = (color, size = 14, blink = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:${size}px; height:${size}px;
    border-radius:50%;
    background:${color};
    border: 2px solid rgba(255,255,255,0.4);
    box-shadow: 0 0 ${blink ? 16 : 8}px ${color};
    ${blink ? 'animation: blink 1s infinite alternate;' : ''}
  "></div>`,
  iconSize: [size, size],
  iconAnchor: [size/2, size/2],
});

const iconoBase = L.divIcon({
  className: '',
  html: `<div style="
    width:16px; height:16px;
    border-radius:3px;
    background:#4a9eff;
    border: 2px solid rgba(255,255,255,0.5);
    box-shadow: 0 0 8px #4a9eff;
  "></div><div class="radar-ping"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ── MAPA ─────────────────────────────────────────────
const initMap = () => {
  // Opciones de tiles
  const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 });
  const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
  const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });

  map = L.map(mapEl.value, {
    center: [7.10, -63.80], // Centro amplio del Estado Bolívar y Arco Minero
    zoom: 7,
    zoomControl: true,
    attributionControl: false,
    layers: [cartoDark] // Por defecto táctico oscuro
  });

  // Switcher de Capas
  const baseMaps = {
    "Táctico (Oscuro)": cartoDark,
    "Satelital (Esri)": esriSatellite,
    "Terreno (OSM)": openStreetMap
  };
  L.control.layers(baseMaps).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  // Puestos de control (cuadrados azules)
  puestosControl.forEach(pc => {
    L.marker([pc.lat, pc.lng], { icon: iconoBase })
      .addTo(markersLayer)
      .bindPopup(`<b>${pc.nombre}</b><br><span style='color:#4a9eff'>Puesto de Control y Resguardo</span>`);
  });

  // Polígono del Arco Minero (Aproximación Estratégica)
  const arcoMineroCoords = [
    [7.85, -67.45], // Noroeste (Caicara)
    [7.40, -64.80], // Centro-Norte (Maripa)
    [8.10, -62.60], // Noreste (Guri)
    [7.50, -60.80], // Extremo Este (Frontera)
    [6.00, -61.10], // Sureste (Km 88)
    [6.50, -63.50], // Centro-Sur (Paragua)
    [6.00, -66.50]  // Suroeste
  ];

  L.polygon(arcoMineroCoords, {
    color: '#ffa500',
    weight: 2,
    opacity: 0.6,
    fillColor: '#ffa500',
    fillOpacity: 0.05,
    dashArray: '8, 8'
  }).addTo(map).bindPopup('<div style="text-align:center"><b>ARCO MINERO DEL ORINOCO</b><br><small>Zona de Desarrollo Estratégico Nacional</small></div>');
};

const renderAlertMarkers = () => {
  if (!map) return;
  // Limpiar marcadores de alertas previos (no bases)
  markersLayer.eachLayer((layer) => {
    if (layer._isAlertMarker) markersLayer.removeLayer(layer);
  });

  alertas.value.forEach(alerta => {
    const lat = alerta.reporte?.latitud;
    const lng = alerta.reporte?.longitud;
    if (!lat || !lng) return;

    const color = riskColor(alerta.nivel_riesgo);
    const blink = alerta.nivel_riesgo === 'CRITICO';
    const icon = crearIcono(color, 18, blink);
    const marker = L.marker([lat, lng], { icon });
    marker._isAlertMarker = true;

    marker.bindPopup(`
      <div style="color:#0f1115; min-width:200px">
        <b style="color:${color}">${riskIcon(alerta.nivel_riesgo)} ${alerta.nivel_riesgo}</b><br>
        <b>${alerta.categoria?.replace('_', ' ')}</b>
        ${alerta.confianza ? `<span style="font-size:10px; color:#a0d84a">Confianza IA: ${alerta.confianza}%</span>` : ''}<br>
        <p style="margin:6px 0;font-size:12px">${alerta.resumen_ia}</p>
        ${alerta.evidencia_url ? `<img src="${alerta.evidencia_url}" style="width:100%; border-radius:4px; margin-bottom:5px;"/>` : ''}
        <small>Por: ${alerta.reporte?.usuario?.nombre || 'Campo'} — ${alerta.estado}</small>
      </div>
    `);

    markersLayer.addLayer(marker);
  });
};

const focusAlerta = (alerta) => {
  const lat = alerta.reporte?.latitud;
  const lng = alerta.reporte?.longitud;
  if (lat && lng && map) {
    map.flyTo([lat, lng], 12, { duration: 1.2 });
  }
};

// ── CARGA DE ALERTAS ─────────────────────────────────
const cargarAlertas = async () => {
  loadingAlertas.value = true;
  try {
    const res = await api.get('/alertas?limit=30');
    alertas.value = res.data;
    renderAlertMarkers();
  } catch (e) {
    console.error('Error al cargar alertas:', e);
  } finally {
    loadingAlertas.value = false;
  }
};

const resolverAlerta = async (id) => {
  try {
    await api.patch(`/alertas/${id}/estado`, { estado: 'RESUELTA' });
    await cargarAlertas();
  } catch (e) {
    console.error('Error al resolver alerta:', e);
  }
};

// ── MODO DEMO / SIMULACION ──────────────────────────────
const pushLog = (msg) => {
  const time = new Date().toLocaleTimeString('es-VE', { hour12: false });
  consoleFeedLogs.value.unshift(`[${time}] ${msg}`);
  if(consoleFeedLogs.value.length > 5) consoleFeedLogs.value.pop();
};

let droneMarkerLayer = null;

const toggleDemo = async () => {
  demoModeActive.value = !demoModeActive.value;
  if(demoModeActive.value) {
    pushLog("VRSS-2 SATLINK ESTABLISHED...");
    setTimeout(() => pushLog("BARRIDO TERMICO INICIADO..."), 1000);
    setTimeout(() => {
      pushLog("UAV DE RECONOCIMIENTO EN RUTA...");
      if (!droneMarkerLayer && map) {
        const droneIcon = L.divIcon({
          className: '',
          html: `<div style="font-size: 20px; animation: pulse 1s infinite alternate;">✈️</div>`,
          iconSize: [20, 20]
        });
        const zonasDron = [
          { lat: 6.17, lng: -61.43 },
          { lat: 6.72, lng: -61.61 },
          { lat: 7.34, lng: -61.82 },
          { lat: 7.63, lng: -66.16 },
          { lat: 7.29, lng: -61.50 }
        ];
        const zonaInicio = zonasDron[Math.floor(Math.random() * zonasDron.length)];

        // Initial pos con offset aleatorio táctico
        let droneLat = zonaInicio.lat + (Math.random() * 0.4 - 0.2);
        let droneLng = zonaInicio.lng + (Math.random() * 0.4 - 0.2);
        droneMarkerLayer = L.marker([droneLat, droneLng], { icon: droneIcon }).addTo(map);
        
        // Simple animation loop moving marker
        let angle = 0;
        droneInterval = setInterval(() => {
          angle += 0.05;
          const r = 0.5; // radius
          droneMarkerLayer.setLatLng([
            droneLat + r * Math.sin(angle) * 0.5,
            droneLng + r * Math.cos(angle)
          ]);
        }, 1000);
      }
    }, 2500);

    // Call the backend trigger to start generating fake incidents in 5 seconds
    setTimeout(async () => {
      try {
        pushLog("DETECTANDO ANOMALÍAS...");
        await api.post('/simulator/trigger');
      } catch (e) {
        console.error(e);
        pushLog("ERROR DE ENLACE SATELITAL...");
      }
    }, 4500);
  } else {
    consoleFeedLogs.value = [];
    if (droneMarkerLayer) {
      if (map) map.removeLayer(droneMarkerLayer);
      droneMarkerLayer = null;
    }
    if (droneInterval) {
      clearInterval(droneInterval);
      droneInterval = null;
    }
  }
};

// ── WEBSOCKET ─────────────────────────────────────────
const initWebSocket = () => {
  socket = io('http://localhost:3000', { transports: ['websocket'] });

  socket.on('connect', () => {
    wsConnected.value = true;
    console.log('🔌 WebSocket conectado al motor experto');
  });

  socket.on('disconnect', () => {
    wsConnected.value = false;
  });

  socket.on('ia_procesando', (data) => {
    console.log('🤖 IA Procesando:', data);
    aiProcessingInfo.value = data;
  });

  socket.on('nueva_alerta', (alerta) => {
    console.log('🚨 Nueva alerta en tiempo real:', alerta);
    aiProcessingInfo.value = null; // Quitar banner de pensando
    currentNewAlertId.value = alerta.id;
    alertas.value.unshift(alerta); // Añadir al inicio
    renderAlertMarkers();
  });
};

// ── LIFECYCLE ─────────────────────────────────────────
onMounted(async () => {
  initMap();
  initWebSocket();
  await cargarAlertas();
});

onUnmounted(() => {
  if (socket) socket.disconnect();
  if (map) map.remove();
});
</script>
