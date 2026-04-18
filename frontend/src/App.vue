<template>
  <div class="app-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-logo">ZODI<span>62</span></div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="active" exact id="nav-dashboard">
          <span class="nav-icon">🗺️</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/alertas" class="nav-item" active-class="active" id="nav-alertas">
          <span class="nav-icon">🚨</span>
          <span>Alertas</span>
          <span v-if="alertasBadge > 0" class="nav-badge">{{ alertasBadge }}</span>
        </router-link>
        <router-link to="/reportes" class="nav-item" active-class="active" id="nav-reportes">
          <span class="nav-icon">📋</span>
          <span>Reportes</span>
        </router-link>
      </nav>
      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <span class="user-role">{{ authStore.user?.rol?.replace(/_/g, ' ') }}</span>
          <span class="user-name">{{ authStore.user?.nombre }}</span>
        </div>
        <button @click="authStore.logout()" class="logout-btn" title="Cerrar Sesión">⏻</button>
      </div>
    </aside>

    <!-- CONTENIDO -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from './stores/auth.store';
import api from './services/api';

const authStore = useAuthStore();
const alertasBadge = ref(0);
let pollInterval = null;

const userInitial = computed(() => {
  const name = authStore.user?.nombre || '';
  return name.charAt(0).toUpperCase();
});

const actualizarBadge = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const res = await api.get('/alertas?estado=ACTIVA&limit=100');
    alertasBadge.value = res.data.length;
  } catch { /* ignore */ }
};

onMounted(() => {
  actualizarBadge();
  // Polling ligero cada 30s para mantener el badge actualizado
  pollInterval = setInterval(actualizarBadge, 30000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

