import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { public: false }
  },
  {
    path: '/reportes',
    name: 'Reportes',
    component: () => import('../views/ReportesView.vue'),
    meta: { public: false }
  },
  {
    path: '/alertas',
    name: 'Alertas',
    component: () => import('../views/AlertsView.vue'),
    meta: { public: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard Global
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isPublic = to.meta.public;

  if (!isPublic && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
