<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const route = useRoute()
const isAuthLayout = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <Toast position="top-right" />
  <ConfirmDialog />

  <AuthLayout v-if="isAuthLayout">
    <RouterView />
  </AuthLayout>

  <AppLayout v-else>
    <RouterView />
  </AppLayout>
</template>
