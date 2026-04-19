import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('cova_token') || null,
    user: (localStorage.getItem('cova_user') && localStorage.getItem('cova_user') !== 'undefined') ? JSON.parse(localStorage.getItem('cova_user')) : null,
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user ? state.user.rol : null,
  },
  actions: {
    async login(cedula, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/login', { cedula, password });
        this.token = response.data.token;
        this.user = response.data.user;
        
        localStorage.setItem('cova_token', this.token);
        localStorage.setItem('cova_user', JSON.stringify(this.user));
        
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error de conexión';
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('cova_token');
      localStorage.removeItem('cova_user');
      window.location.href = '/login';
    }
  }
});
