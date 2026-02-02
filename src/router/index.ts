import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/scene-editor',
      name: 'scene-editor',
      component: () => import('@/views/SceneEditorView.vue'),
    },
    {
      path: '/surface-plan',
      name: 'surface-plan',
      component: () => import('@/views/SurfacePlanView.vue'),
    },
    {
      path: '/monitor',
      name: 'monitor',
      component: () => import('@/views/MonitorView.vue'),
    },
    {
      path: '/venue-task',
      name: 'venue-task',
      component: () => import('@/views/venueForSeveralDays/index.vue'),
    },
    {
      path: '/3d-guide',
      name: '3d-guide',
      component: () => import('@/views/deliveryCycleDashboard/3D.vue'),
    },
  ],
})

export default router
