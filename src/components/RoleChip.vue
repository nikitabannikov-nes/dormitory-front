<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import type { Role } from '@/api/users.api'

const props = defineProps<{ role: Role }>()

const label = computed(() => {
  const map: Record<Role, string> = {
    USER: 'Житель',
    INSPECTOR: 'Инспектор',
    ADMIN: 'Администратор',
  }
  return map[props.role]
})

const severity = computed((): 'secondary' | 'info' | 'warn' => {
  const map: Record<Role, 'secondary' | 'info' | 'warn'> = {
    USER: 'secondary',
    INSPECTOR: 'info',
    ADMIN: 'warn',
  }
  return map[props.role]
})
</script>

<template>
  <Tag :value="label" :severity="severity" />
</template>
