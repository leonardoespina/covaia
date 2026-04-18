<template>
  <div class="alerts-view">
    <!-- HEADER -->
    <div class="page-header">
      <div>
        <h1>Gestión de Alertas y Despacho</h1>
        <p>Control operacional de amenazas activas — ZODI N°62</p>
      </div>
      <div class="header-filters">
        <select v-model="filtroEstado" @change="cargarAlertas" class="filter-select" id="filter-estado">
          <option value="">Todos los estados</option>
          <option value="ACTIVA">🔴 Activas</option>
          <option value="ASIGNADA">🟡 Asignadas</option>
          <option value="RESUELTA">🟢 Resueltas</option>
        </select>
        <select v-model="filtroRiesgo" @change="cargarAlertas" class="filter-select" id="filter-riesgo">
          <option value="">Todos los niveles</option>
          <option value="CRITICO">🚨 Crítico</option>
          <option value="ALTO">🔴 Alto</option>
          <option value="MEDIO">🟡 Medio</option>
          <option value="BAJO">🟢 Bajo</option>
        </select>
      </div>
    </div>

    <!-- KPI BAR -->
    <div class="kpi-bar">
      <div class="kpi-card kpi-critico">
        <span class="kpi-val">{{ kpis.criticas }}</span>
        <span class="kpi-lbl">🚨 Críticas</span>
      </div>
      <div class="kpi-card kpi-alto">
        <span class="kpi-val">{{ kpis.altas }}</span>
        <span class="kpi-lbl">🔴 Altas</span>
      </div>
      <div class="kpi-card kpi-activa">
        <span class="kpi-val">{{ kpis.activas }}</span>
        <span class="kpi-lbl">Activas Total</span>
      </div>
      <div class="kpi-card kpi-resuelta">
        <span class="kpi-val">{{ kpis.resueltas }}</span>
        <span class="kpi-lbl">✅ Resueltas</span>
      </div>
      <div class="kpi-card kpi-despachos">
        <span class="kpi-val">{{ despachos.length }}</span>
        <span class="kpi-lbl">🚁 Despachos</span>
      </div>
    </div>

    <!-- MAIN GRID: ALERTAS + HISTORIAL DESPACHOS -->
    <div class="alerts-grid">

      <!-- COLUMNA IZQUIERDA: Lista de Alertas -->
      <section class="alerts-section">
        <div class="section-title">📡 Alertas Operacionales</div>

        <div v-if="loadingAlertas" class="loading-state">Cargando alertas...</div>
        <div v-else-if="alertasFiltradas.length === 0" class="empty-state">
          <span>Sin alertas para los filtros seleccionados</span>
        </div>

        <div v-else class="alerts-list-full">
          <div
            v-for="alerta in alertasFiltradas"
            :key="alerta.id"
            :class="['alerta-row', `risk-${alerta.nivel_riesgo?.toLowerCase()}`, { 'is-resolved': alerta.estado === 'RESUELTA' }]"
          >
            <!-- BADGES -->
            <div class="row-badges">
              <span :class="['badge-risk', `badge-risk-${alerta.nivel_riesgo?.toLowerCase()}`]">
                {{ riskIcon(alerta.nivel_riesgo) }} {{ alerta.nivel_riesgo }}
              </span>
              <span :class="['badge-status', `badge-status-${alerta.estado?.toLowerCase()}`]">
                {{ alerta.estado }}
              </span>
            </div>

            <!-- CONTENIDO -->
            <div class="row-content">
              <div class="row-cat">{{ alerta.categoria?.replace(/_/g, ' ') }}</div>
              <p class="row-summary">{{ alerta.resumen_ia }}</p>
              <div class="row-meta">
                <span>📍 {{ alerta.reporte?.tipo_evento?.replace(/_/g, ' ') || 'Sin tipo' }}</span>
                <span>🕐 {{ timeAgo(alerta.created_at) }}</span>
                <span v-if="alerta.reporte?.usuario">
                  👤 {{ alerta.reporte.usuario.nombre }} ({{ alerta.reporte.usuario.rango }})
                </span>
              </div>
            </div>

            <!-- ACCIONES -->
            <div class="row-actions" v-if="puedeDespachar">
              <button
                v-if="alerta.estado !== 'RESUELTA'"
                @click="abrirDespacho(alerta)"
                class="btn-dispatch"
                :id="`btn-dispatch-${alerta.id}`"
              >
                🚁 Despachar
              </button>
              <button
                v-if="alerta.estado === 'ASIGNADA'"
                @click="abrirResolver(alerta)"
                class="btn-resolve-full"
                :id="`btn-resolve-${alerta.id}`"
              >
                ✅ Resolver
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- COLUMNA DERECHA: Historial de Despachos -->
      <section class="dispatch-section">
        <div class="section-title">🚁 Historial de Despachos</div>

        <div v-if="loadingDespachos" class="loading-state">Cargando historial...</div>
        <div v-else-if="despachos.length === 0" class="empty-state">
          <span>Sin despachos registrados aún.</span>
        </div>

        <div v-else class="dispatch-list">
          <div v-for="d in despachos" :key="d.id" class="dispatch-card">
            <div class="dispatch-header">
              <span :class="['badge-risk', `badge-risk-${d.alerta?.nivel_riesgo?.toLowerCase()}`]">
                {{ riskIcon(d.alerta?.nivel_riesgo) }} {{ d.alerta?.nivel_riesgo }}
              </span>
              <span class="dispatch-time">{{ timeAgo(d.created_at) }}</span>
            </div>
            <div class="dispatch-unit">🪖 {{ d.unidad?.nombre }}</div>
            <div class="dispatch-cat">{{ d.alerta?.categoria?.replace(/_/g, ' ') }}</div>
            <div class="dispatch-by">
              Despachado por: <strong>{{ d.despachador?.nombre }}</strong>
              <small> ({{ d.despachador?.rango }})</small>
            </div>
            <div v-if="d.resultado" class="dispatch-resultado">
              📋 {{ d.resultado }}
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- MODAL: DESPACHO -->
    <Transition name="modal">
      <div v-if="showDespachoModal" class="modal-overlay" @click.self="cerrarModal" id="modal-despacho">
        <div class="modal-box">
          <div class="modal-header">
            <h2>🚁 Despachar Unidad</h2>
            <button @click="cerrarModal" class="modal-close">✕</button>
          </div>

          <div class="modal-body">
            <!-- Alerta info -->
            <div class="modal-alert-info" :class="`modal-risk-${alertaSeleccionada?.nivel_riesgo?.toLowerCase()}`">
              <div class="modal-risk-badge">
                {{ riskIcon(alertaSeleccionada?.nivel_riesgo) }} {{ alertaSeleccionada?.nivel_riesgo }}
              </div>
              <div class="modal-cat">{{ alertaSeleccionada?.categoria?.replace(/_/g, ' ') }}</div>
              <p class="modal-summary">{{ alertaSeleccionada?.resumen_ia }}</p>
            </div>

            <!-- Form -->
            <div class="modal-form">
              <div class="form-group">
                <label>Unidad a Despachar *</label>
                <select v-model="despachoForm.unidad_despachada_id" required id="select-unidad">
                  <option value="">— Seleccione una unidad —</option>
                  <option v-for="u in unidades" :key="u.id" :value="u.id">
                    {{ u.tipo === 'PUESTO_CONTROL' ? '🏠' : '🚗' }} {{ u.nombre }}
                    ({{ u.efectivos_asignados }} efectivos)
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Tiempo estimado de respuesta (min)</label>
                <input
                  type="number"
                  v-model="despachoForm.tiempo_respuesta_min"
                  placeholder="Ej: 30"
                  min="1"
                  max="480"
                  id="input-tiempo"
                />
              </div>
            </div>

            <div v-if="despachoError" class="modal-error">{{ despachoError }}</div>
          </div>

          <div class="modal-footer">
            <button @click="cerrarModal" class="btn-cancel">Cancelar</button>
            <button
              @click="confirmarDespacho"
              class="btn-confirm-dispatch"
              :disabled="!despachoForm.unidad_despachada_id || despachando"
              id="btn-confirm-dispatch"
            >
              <span v-if="!despachando">🚁 Confirmar Despacho</span>
              <span v-else class="loader"></span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL: RESOLVER -->
    <Transition name="modal">
      <div v-if="showResolverModal" class="modal-overlay" @click.self="cerrarModal" id="modal-resolver">
        <div class="modal-box modal-box-sm">
          <div class="modal-header">
            <h2>✅ Resolver Alerta</h2>
            <button @click="cerrarModal" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Resultado de la operación (opcional)</label>
              <textarea
                v-model="resolverResultado"
                placeholder="Describa brevemente el resultado de la operación..."
                rows="4"
                id="textarea-resultado"
              ></textarea>
            </div>
            <div v-if="resolverError" class="modal-error">{{ resolverError }}</div>
          </div>
          <div class="modal-footer">
            <button @click="cerrarModal" class="btn-cancel">Cancelar</button>
            <button
              @click="confirmarResolver"
              class="btn-confirm-resolve"
              :disabled="resolviendo"
              id="btn-confirm-resolve"
            >
              <span v-if="!resolviendo">✅ Marcar como Resuelta</span>
              <span v-else class="loader"></span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();

// ── ESTADO ─────────────────────────────────────────────────
const alertas = ref([]);
const despachos = ref([]);
const unidades = ref([]);
const loadingAlertas = ref(true);
const loadingDespachos = ref(true);
const filtroEstado = ref('');
const filtroRiesgo = ref('');

// Modal despacho
const showDespachoModal = ref(false);
const alertaSeleccionada = ref(null);
const despachoForm = ref({ unidad_despachada_id: '', tiempo_respuesta_min: '' });
const despachoError = ref('');
const despachando = ref(false);

// Modal resolver
const showResolverModal = ref(false);
const alertaParaResolver = ref(null);
const resolverResultado = ref('');
const resolverError = ref('');
const resolviendo = ref(false);

// ── PERMISOS ────────────────────────────────────────────────
const ROLES_DESPACHO = ['COMANDANTE', 'OFICIAL_OPERACIONES', 'ADMIN_SISTEMA'];
const puedeDespachar = computed(() => ROLES_DESPACHO.includes(authStore.user?.rol));

// ── KPIs ────────────────────────────────────────────────────
const kpis = computed(() => ({
  criticas: alertas.value.filter(a => a.nivel_riesgo === 'CRITICO').length,
  altas: alertas.value.filter(a => a.nivel_riesgo === 'ALTO').length,
  activas: alertas.value.filter(a => a.estado === 'ACTIVA').length,
  resueltas: alertas.value.filter(a => a.estado === 'RESUELTA').length,
}));

// ── FILTROS ─────────────────────────────────────────────────
const alertasFiltradas = computed(() => {
  let list = alertas.value;
  if (filtroEstado.value) list = list.filter(a => a.estado === filtroEstado.value);
  if (filtroRiesgo.value) list = list.filter(a => a.nivel_riesgo === filtroRiesgo.value);
  return list;
});

// ── HELPERS ─────────────────────────────────────────────────
const riskIcon = (nivel) => ({ BAJO: '🟢', MEDIO: '🟡', ALTO: '🔴', CRITICO: '🚨' }[nivel] || '⚪');
const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('es-VE');
};

// ── CARGA DE DATOS ──────────────────────────────────────────
const cargarAlertas = async () => {
  loadingAlertas.value = true;
  try {
    const res = await api.get('/alertas?limit=100');
    alertas.value = res.data;
  } catch (e) {
    console.error('Error cargando alertas:', e);
  } finally {
    loadingAlertas.value = false;
  }
};

const cargarDespachos = async () => {
  loadingDespachos.value = true;
  try {
    const res = await api.get('/despachos?limit=30');
    despachos.value = res.data;
  } catch (e) {
    console.error('Error cargando despachos:', e);
  } finally {
    loadingDespachos.value = false;
  }
};

const cargarUnidades = async () => {
  try {
    const res = await api.get('/unidades');
    unidades.value = res.data;
  } catch (e) {
    console.error('Error cargando unidades:', e);
  }
};

// ── MODAL DESPACHO ──────────────────────────────────────────
const abrirDespacho = (alerta) => {
  alertaSeleccionada.value = alerta;
  despachoForm.value = { unidad_despachada_id: '', tiempo_respuesta_min: '' };
  despachoError.value = '';
  showDespachoModal.value = true;
};

const confirmarDespacho = async () => {
  if (!despachoForm.value.unidad_despachada_id) {
    despachoError.value = 'Debe seleccionar una unidad.';
    return;
  }
  despachando.value = true;
  despachoError.value = '';
  try {
    await api.post('/despachos', {
      alerta_id: alertaSeleccionada.value.id,
      unidad_despachada_id: despachoForm.value.unidad_despachada_id,
      tiempo_respuesta_min: despachoForm.value.tiempo_respuesta_min || null,
    });
    cerrarModal();
    await cargarAlertas();
    await cargarDespachos();
  } catch (e) {
    despachoError.value = e.response?.data?.message || 'Error al despachar. Intente de nuevo.';
  } finally {
    despachando.value = false;
  }
};

// ── MODAL RESOLVER ──────────────────────────────────────────
const abrirResolver = (alerta) => {
  alertaParaResolver.value = alerta;
  resolverResultado.value = '';
  resolverError.value = '';
  showResolverModal.value = true;
};

const confirmarResolver = async () => {
  resolviendo.value = true;
  resolverError.value = '';
  try {
    await api.patch(`/despachos/alertas/${alertaParaResolver.value.id}/resolver`, {
      resultado: resolverResultado.value || null,
    });
    cerrarModal();
    await cargarAlertas();
    await cargarDespachos();
  } catch (e) {
    resolverError.value = e.response?.data?.message || 'Error al resolver la alerta.';
  } finally {
    resolviendo.value = false;
  }
};

const cerrarModal = () => {
  showDespachoModal.value = false;
  showResolverModal.value = false;
};

// ── LIFECYCLE ───────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([cargarAlertas(), cargarDespachos(), cargarUnidades()]);
});
</script>
