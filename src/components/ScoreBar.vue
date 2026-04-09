<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number; label?: string }>()

const color = computed(() => {
  if (props.value >= 4) return 'green'
  if (props.value >= 3) return 'orange'
  return 'red'
})

const width = computed(() => `${(props.value / 5) * 100}%`)
</script>

<template>
  <div class="score-bar">
    <span v-if="label" class="score-label">{{ label }}</span>
    <div class="bar-track">
      <div class="bar-fill" :class="`bar-fill--${color}`" :style="{ width }" />
    </div>
    <span class="score-value" :class="`score-value--${color}`">{{ value }}</span>
  </div>
</template>

<style scoped>
.score-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-label {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  width: 64px;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 6px;
  background: var(--p-surface-200);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.bar-fill--green  { background: var(--p-green-400); }
.bar-fill--orange { background: var(--p-orange-400); }
.bar-fill--red    { background: var(--p-red-400); }

.score-value {
  font-size: 0.85rem;
  font-weight: 700;
  width: 1.5rem;
  text-align: right;
  flex-shrink: 0;
}

.score-value--green  { color: var(--p-green-600); }
.score-value--orange { color: var(--p-orange-600); }
.score-value--red    { color: var(--p-red-600); }
</style>
