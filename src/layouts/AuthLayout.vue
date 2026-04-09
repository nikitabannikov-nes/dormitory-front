<script setup lang="ts"></script>

<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="auth-logo">
        <i class="pi pi-building text-4xl text-primary" />
        <span class="text-2xl font-bold ml-2">ПО ЖБК</span>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-surface-100);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--p-surface-0);
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}
</style>
