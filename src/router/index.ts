import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Auth
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { layout: 'auth' },
    },

    // USER
    {
      path: '/my-block',
      name: 'my-block',
      component: () => import('@/views/user/MyBlockView.vue'),
      meta: { requiresAuth: true, roles: ['USER', 'INSPECTOR', 'ADMIN'] },
    },

    // INSPECTOR
    {
      path: '/inspections',
      name: 'inspections',
      component: () => import('@/views/inspector/InspectionsView.vue'),
      meta: { requiresAuth: true, roles: ['INSPECTOR', 'ADMIN'] },
    },
    {
      path: '/inspections/new',
      name: 'inspections-new',
      component: () => import('@/views/inspector/NewInspectionView.vue'),
      meta: { requiresAuth: true, roles: ['INSPECTOR', 'ADMIN'] },
    },

    // ADMIN
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
    },
    {
      path: '/admin/users/:id/floors',
      name: 'admin-user-floors',
      component: () => import('@/views/admin/UserFloorsView.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
    },
    {
      path: '/admin/blocks',
      name: 'admin-blocks',
      component: () => import('@/views/admin/BlocksView.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
    },
    {
      path: '/admin/inspections',
      name: 'admin-inspections',
      component: () => import('@/views/admin/AllInspectionsView.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
    },
    {
      path: '/admin/report',
      name: 'admin-report',
      component: () => import('@/views/admin/ReportView.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
    },

    // Корень — редирект по роли
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore()
        if (!auth.isAuthenticated) return '/login'
        if (auth.role === 'USER') return '/my-block'
        if (auth.role === 'INSPECTOR') return '/inspections'
        return '/admin/users'
      },
    },

    // 404
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.roles && auth.role && !(to.meta.roles as string[]).includes(auth.role)) {
    return '/'
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return '/'
  }
})

export default router
