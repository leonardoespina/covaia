<template>
  <div class="reportes-view">
    <div class="page-header">
      <div>
        <h1>Reportes de Patrulla</h1>
        <p>Registro de novedades operacionales del campo</p>
      </div>
      <button @click="showForm = !showForm" class="btn-primary">
        {{ showForm ? '✕ Cancelar' : '+ Nuevo Reporte' }}
      </button>
    </div>

    <!-- FORMULARIO NUEVO REPORTE -->
    <div v-if="showForm" class="form-card">
      <h2 class="form-title">📋 Registrar Novedad de Patrulla</h2>
      <form @submit.prevent="submitReporte" class="reporte-form">
        <div class="form-grid">

          <div class="form-group full-width">
            <label>Descripción de la Novedad *</label>
            <textarea
              v-model="form.descripcion"
              placeholder="Describa detalladamente el evento o la novedad del turno..."
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Tipo de Evento *</label>
            <select v-model="form.tipo_evento" required>
              <option value="">— Seleccione —</option>
              <option value="SIN_NOVEDAD">✅ Sin Novedad</option>
              <option value="MINERIA_ILEGAL">⛏️ Minería Ilegal</option>
              <option value="INTRUSION">⚠️ Intrusión / Grupo Armado</option>
              <option value="CONTRABANDO">🚢 Contrabando de Extracción</option>
              <option value="OTRO">📌 Otro</option>
            </select>
          </div>

          <div class="form-group">
            <label>Latitud</label>
            <input type="number" v-model="form.latitud" placeholder="Ej: 6.3701" step="0.0001" />
          </div>

          <div class="form-group">
            <label>Longitud</label>
            <input type="number" v-model="form.longitud" placeholder="Ej: -63.5369" step="0.0001" />
          </div>

          <div class="form-group full-width">
            <label>Foto del Evento (Opcional)</label>
            <div class="file-upload" @click="$refs.fileInput.click()">
              <span v-if="!form.foto">📷 Adjuntar imagen (JPG, PNG — máx. 10MB)</span>
              <span v-else class="file-selected">✅ {{ form.foto.name }}</span>
              <input ref="fileInput" type="file" accept="image/*" @change="handleFile" hidden />
            </div>
          </div>

        </div>

        <div v-if="submitError" class="error-banner">{{ submitError }}</div>
        <div v-if="submitOk" class="success-banner">✅ ¡Reporte registrado! El Agente IA está analizando la novedad...</div>

        <div class="form-actions">
          <button type="submit" class="btn-submit" :disabled="submitting">
            <span v-if="!submitting">🚀 Enviar Reporte</span>
            <span v-else class="loader"></span>
          </button>
        </div>
      </form>
    </div>

    <!-- TABLA DE REPORTES -->
    <div class="table-card">
      <div class="table-header-row">
        <h2>Historial de Novedades</h2>
        <select v-model="filtroTipo" @change="cargarReportes" class="filter-select">
          <option value="">Todos los tipos</option>
          <option value="SIN_NOVEDAD">Sin Novedad</option>
          <option value="MINERIA_ILEGAL">Minería Ilegal</option>
          <option value="INTRUSION">Intrusión</option>
          <option value="CONTRABANDO">Contrabando</option>
        </select>
      </div>

      <div v-if="loading" class="loading-state">Cargando reportes...</div>
      <div v-else-if="reportes.length === 0" class="empty-state">
        No hay reportes registrados aún. ¡Crea el primero!
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo de Evento</th>
            <th>Descripción</th>
            <th>Reportado por</th>
            <th>Coords</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reportes" :key="r.id">
            <td class="date-cell">{{ formatDate(r.created_at) }}</td>
            <td><span :class="['badge', badgeClass(r.tipo_evento)]">{{ labelEvento(r.tipo_evento) }}</span></td>
            <td class="desc-cell">{{ r.descripcion }}</td>
            <td>{{ r.usuario?.nombre || 'Sistema' }}<br><small>{{ r.usuario?.rango }}</small></td>
            <td class="coords-cell">
              <span v-if="r.latitud">{{ r.latitud.toFixed(4) }}, {{ r.longitud.toFixed(4) }}</span>
              <span v-else class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const reportes = ref([]);
const loading = ref(false);
const showForm = ref(false);
const filtroTipo = ref('');
const submitting = ref(false);
const submitError = ref('');
const submitOk = ref(false);

const form = ref({
  descripcion: '',
  tipo_evento: '',
  latitud: '',
  longitud: '',
  foto: null
});

const handleFile = (e) => {
  form.value.foto = e.target.files[0];
};

const cargarReportes = async () => {
  loading.value = true;
  try {
    const params = filtroTipo.value ? `?tipo_evento=${filtroTipo.value}` : '';
    const res = await api.get(`/reportes${params}`);
    reportes.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const submitReporte = async () => {
  submitting.value = true;
  submitError.value = '';
  submitOk.value = false;
  try {
    const formData = new FormData();
    formData.append('descripcion', form.value.descripcion);
    formData.append('tipo_evento', form.value.tipo_evento);
    if (form.value.latitud) formData.append('latitud', form.value.latitud);
    if (form.value.longitud) formData.append('longitud', form.value.longitud);
    if (form.value.foto) formData.append('foto', form.value.foto);

    await api.post('/reportes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    submitOk.value = true;
    form.value = { descripcion: '', tipo_evento: '', latitud: '', longitud: '', foto: null };
    await cargarReportes();
    setTimeout(() => { showForm.value = false; submitOk.value = false; }, 2500);
  } catch (e) {
    submitError.value = e.response?.data?.message || 'Error al enviar el reporte';
  } finally {
    submitting.value = false;
  }
};

const formatDate = (d) => new Date(d).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
const labelEvento = (t) => ({ SIN_NOVEDAD: '✅ Sin Novedad', MINERIA_ILEGAL: '⛏️ Minería', INTRUSION: '⚠️ Intrusión', CONTRABANDO: '🚢 Contrabando', OTRO: '📌 Otro' }[t] || t);
const badgeClass = (t) => ({ SIN_NOVEDAD: 'badge-ok', MINERIA_ILEGAL: 'badge-high', INTRUSION: 'badge-critical', CONTRABANDO: 'badge-medium', OTRO: 'badge-low' }[t] || '');

onMounted(cargarReportes);
</script>
