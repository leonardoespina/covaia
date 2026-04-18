<template>
  <div class="login-wrapper">
    <!-- Efectos de fondo abstracto glassmorphism -->
    <div class="ambient-light light-1"></div>
    <div class="ambient-light light-2"></div>

    <div class="login-container">
      <div class="login-header">
        <div class="logo">ZODI<span>62</span></div>
        <h2>SISTEMA DE RESGUARDO MILITAR</h2>
        <p>ZODI N°62 Bolívar • Acceso Restringido</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Cédula de Identidad</label>
          <input 
            type="text" 
            v-model="cedula" 
            placeholder="00000000" 
            required
            :disabled="authStore.loading"
          />
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            v-model="password" 
            placeholder="••••••••" 
            required
            :disabled="authStore.loading"
          />
        </div>

        <!-- Muestra el error de API -->
        <div v-if="authStore.error" class="error-banner">
          {{ authStore.error }}
        </div>

        <button type="submit" class="btn-login" :class="{ 'is-loading': authStore.loading }" :disabled="authStore.loading">
          <span v-if="!authStore.loading">AUTENTICAR</span>
          <span v-else class="loader"></span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const cedula = ref('00000000');
const password = ref('Admin2026!');

const handleLogin = async () => {
  const success = await authStore.login(cedula.value, password.value);
  if (success) {
    router.push('/');
  }
};
</script>
