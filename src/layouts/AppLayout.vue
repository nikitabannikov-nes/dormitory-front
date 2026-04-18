<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) mobileOpen.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => window.removeEventListener('resize', checkMobile))

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
    items.push({ label: 'Отчёт', icon: 'pi pi-file-word', to: '/admin/report' })
  }

  return items
})

function navigate(to: string) {
  mobileOpen.value = false
  router.push(to)
}

function logout() {
  auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">

    <!-- Мобильный топбар -->
    <header v-if="isMobile" class="mobile-topbar">
      <button class="topbar-btn" @click="mobileOpen = true">
        <i class="pi pi-bars" />
      </button>
      <span class="topbar-title">
        <i class="pi pi-building" />
        ЖБК
      </span>
      <button class="topbar-btn" @click="logout" title="Выйти">
        <i class="pi pi-sign-out" />
      </button>
    </header>

    <!-- Backdrop (мобилка) -->
    <div
      v-if="isMobile && mobileOpen"
      class="sidebar-backdrop"
      @click="mobileOpen = false"
    />

    <!-- Сайдбар -->
    <aside :class="['sidebar', { collapsed: !isMobile && collapsed, 'mobile-open': isMobile && mobileOpen, 'mobile-sidebar': isMobile }]">
      <div class="sidebar-header">
        <i class="pi pi-building sidebar-logo-icon" />
        <span v-if="!collapsed || isMobile" class="sidebar-title">ЖБК</span>
        <button v-if="isMobile" class="collapse-btn" @click="mobileOpen = false">
          <i class="pi pi-times" />
        </button>
        <button v-else class="collapse-btn" @click="collapsed = !collapsed">
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
          @click="mobileOpen = false"
        >
          <i :class="item.icon" />
          <span v-if="!collapsed || isMobile" class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" v-if="!collapsed || isMobile">
          <span class="user-fio">{{ auth.fio || auth.username }}</span>
          <span class="user-role">{{ auth.role }}</span>
        </div>
        <button class="logout-btn" @click="logout" title="Выйти">
          <i class="pi pi-sign-out" />
        </button>
      </div>
    </aside>

    <!-- Контент -->
    <main :class="['main-content', { 'mobile-main': isMobile }]">
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

/* ─── Mobile topbar ─── */
.mobile-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--p-surface-0);
  border-bottom: 1px solid var(--p-surface-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  z-index: 200;
}

.topbar-title {
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--p-text-color);
}

.topbar-title .pi {
  color: var(--p-primary-500);
  font-size: 1.2rem;
}

.topbar-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--p-text-color);
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  transition: background 0.15s;
}

.topbar-btn:hover {
  background: var(--p-surface-100);
}

/* ─── Backdrop ─── */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 299;
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

/* Мобильный сайдбар */
.sidebar.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  z-index: 300;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
}

.sidebar.mobile-sidebar.mobile-open {
  transform: translateX(0);
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
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--p-text-color);
  font-size: 0.95rem;
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

.main-content.mobile-main {
  padding: 1rem;
  padding-top: calc(56px + 1rem);
}
</style>
