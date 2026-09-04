<script setup lang="ts">
import { computed } from 'vue'
import { getScoreColor } from '@/utils/score'

const props = defineProps<{ modelValue: number | null; closed: boolean; label: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'update:closed': [value: boolean]
}>()

const options = [1, 2, 3, 4, 5]

function select(n: number) {
  emit('update:modelValue', n)
}

function toggleClosed() {
  emit('update:closed', !props.closed)
}

const displayValue = computed(() => (props.closed ? null : props.modelValue))
const displayColor = computed(() => getScoreColor(displayValue.value))
</script>

<template>
  <div class="score-input">
    <div class="score-input__header">
      <span class="score-input__label">{{ label }}</span>
      <div class="score-input__right">
        <button
          class="closed-btn"
          :class="{ 'closed-btn--active': closed }"
          @click="toggleClosed"
          :title="closed ? 'Отметить как проверено' : 'Закрыта / не проверялась'"
        ><i :class="closed ? 'pi pi-lock' : 'pi pi-unlock'" /></button>
        <span v-if="displayValue !== null" class="score-input__value" :style="{ color: displayColor }">{{ displayValue }}</span>
        <span v-else class="score-input__value score-input__value--none">—</span>
      </div>
    </div>

    <div v-if="!closed" class="score-input__buttons">
      <button
        v-for="n in options"
        :key="n"
        type="button"
        class="score-btn"
        :class="{ 'score-btn--active': modelValue === n }"
        :style="modelValue === n ? { background: getScoreColor(n), borderColor: getScoreColor(n) } : undefined"
        @click="select(n)"
      >{{ n }}</button>
    </div>
    <p v-else class="score-input__closed-hint">закрыта / не проверялась</p>
  </div>
</template>

<style scoped>
.score-input__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.score-input__right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.closed-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
  line-height: 1;
  transition: color 0.15s, background 0.15s;
}

.closed-btn:hover {
  color: var(--p-text-color);
  background: var(--p-surface-100);
}

.closed-btn--active {
  color: var(--p-orange-500);
}

.closed-btn--active:hover {
  color: var(--p-orange-600);
}

.score-input__label {
  font-size: 0.9rem;
  font-weight: 500;
}

.score-input__value {
  font-size: 1.1rem;
  font-weight: 700;
  transition: color 0.2s;
  width: 1.2rem;
  text-align: right;
}

.score-input__value--none {
  color: var(--p-text-muted-color);
}

.score-input__closed-hint {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}

.score-input__buttons {
  display: flex;
  gap: 0.4rem;
}

.score-btn {
  flex: 1;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  border: 2px solid var(--p-surface-300);
  background: var(--p-surface-0);
  color: var(--p-text-color);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
}

.score-btn:hover {
  border-color: var(--p-surface-400);
}

.score-btn:active {
  transform: scale(0.95);
}

.score-btn--active {
  color: #fff;
}
</style>
