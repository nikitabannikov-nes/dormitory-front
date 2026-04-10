<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const collapsed = ref(false)

const navItems = computed(() => {
  const items = []

  if (['USER', 'INSPECTOR', 'ADMIN'].includes(auth.role ?? '')) {
    items.push({ label: 'Мой блок', icon: 'pi pi-home', to: '/my-block' })
  }

  if (['INSPECTOR', 'ADMIN'].includes(auth.role ?? '')) {
    items.push({ label: 'Обходы', icon: 'pi pi-list-check', to: '/inspections' })
    items.push({ label: 'Новый обход', icon: 'pi pi-plus-circle', to: '/inspections/new' })
  }

  if (auth.role === 'ADMIN') {
    items.push({ label: 'Все обходы', icon: 'pi pi-table', to: '/admin/inspections' })
    items.push({ label: 'Пользователи', icon: 'pi pi-users', to: '/admin/users' })
    items.push({ label: 'Блоки', icon: 'pi pi-building', to: '/admin/blocks' })
  }

  return items
})

function logout() {
  auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <!-- Сайдбар -->
    <aside :class="['sidebar', { collapsed }]">
      <div class="sidebar-header">
        <i class="pi pi-building sidebar-logo-icon" />
        <span v-if="!collapsed" class="sidebar-title">ЖБК</span>
        <button class="collapse-btn" @click="collapsed = !collapsed">
          <i :class="collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item--active"
        >
          <i :class="item.icon" />
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" v-if="!collapsed">
          <span class="user-fio">{{ auth.fio || auth.username }}</span>
          <span class="user-role">{{ auth.role }}</span>
        </div>
        <button class="logout-btn" @click="logout" title="Выйти">
          <i class="pi pi-sign-out" />
        </button>
      </div>
    </aside>

    <!-- Контент -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--p-surface-50);
}

/* ─── Sidebar ─── */
.sidebar {
  width: 240px;
  background: var(--p-surface-0);
  border-right: 1px solid var(--p-surface-200);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: space-between;
  padding: 1.25rem 0.75rem;
}


.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--p-surface-200);
  min-height: 64px;
}

.sidebar-logo-icon {
  font-size: 1.4rem;
  color: var(--p-primary-500);
  flex-shrink: 0;
}

.sidebar-title {
  font-weight: 700;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--p-text-muted-color);
  padding: 0.25rem;
  margin-left: auto;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.collapse-btn:hover {
  background: var(--p-surface-100);
}

.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--p-text-color);
  font-size: 0.9rem;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background: var(--p-surface-100);
}

.nav-item--active {
  background: var(--p-primary-50);
  color: var(--p-primary-600);
  font-weight: 600;
}

.nav-item i {
  font-size: 1rem;
  flex-shrink: 0;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--p-surface-200);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 64px;
}

.user-info {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-fio {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--p-text-muted-color);
  padding: 0.4rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: var(--p-red-50);
  color: var(--p-red-500);
}

/* ─── Main ─── */
.main-content {
  flex: 1;
  min-width: 0;
  padding: 2rem;
  overflow: auto;
}
</style>
