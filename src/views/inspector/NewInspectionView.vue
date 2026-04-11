<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { inspectionsApi } from '@/api/inspections.api'
import { extractErrorMessage } from '@/api/error'
import { blocksApi, type BlockDto } from '@/api/blocks.api'
import { usersApi } from '@/api/users.api'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Slider from 'primevue/slider'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Textarea from 'primevue/textarea'

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const allBlocks = ref<BlockDto[]>([])
const assignedFloors = ref<number[]>([])
const loading = ref(false)
const submitting = ref(false)

// Форма
const selectedBlock = ref<BlockDto | null>(null)
const date = ref<Date>(new Date())
const scores = ref<Record<string, number | null>>({ shower: 3, toilet: 3, hall: 3, kitchen: 3, roomA: 3, roomB: 3 })

function toggleScore(key: string) {
  scores.value[key] = scores.value[key] === null ? 3 : null
}
const comment = ref('')

const zoneLabels: Record<keyof typeof scores.value, string> = {
  shower: 'Душевая',
  toilet: 'Туалет',
  hall: 'Коридор',
  kitchen: 'Кухня',
  roomA: 'Комната А',
  roomB: 'Комната Б',
}

// Только блоки на закреплённых этажах
const availableBlocks = computed(() =>
  allBlocks.value.filter((b) => assignedFloors.value.includes(b.floor)),
)

const avgScore = computed<number | null>(() => {
  const vals = Object.entries(scores.value)
    .filter(([key]) => key !== 'roomB' || selectedBlock.value?.hasRoomB)
    .map(([, v]) => v)
    .filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})

function avgSeverity(val: number | null): 'success' | 'warn' | 'danger' | 'secondary' {
  if (val === null) return 'secondary'
  if (val >= 4) return 'success'
  if (val >= 3) return 'warn'
  return 'danger'
}

function scoreColor(val: number | null) {
  if (val === null) return 'var(--p-text-muted-color)'
  if (val >= 4) return '#22c55e'
  if (val >= 3) return '#f97316'
  return '#ef4444'
}

onMounted(async () => {
  loading.value = true
  try {
    const [blocks, floors] = await Promise.all([
      blocksApi.getAll(),
      auth.userId ? usersApi.getFloors(auth.userId) : Promise.resolve([]),
    ])
    allBlocks.value = blocks
    assignedFloors.value = floors
  } finally {
    loading.value = false
  }
})

async function submit() {
  if (!selectedBlock.value || !date.value) {
    toast.add({ severity: 'warn', summary: 'Заполните все поля', life: 2000 })
    return
  }

  submitting.value = true
  try {
    await inspectionsApi.create({
      blockId: selectedBlock.value.id,
      date: date.value.toISOString().slice(0, 10),
      ...scores.value,
      roomB: selectedBlock.value?.hasRoomB ? (scores.value['roomB'] ?? null) : null,
      comment: comment.value.trim() || null,
    })
    toast.add({ severity: 'success', summary: 'Обход сохранён', life: 2000 })
    router.push('/inspections')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: extractErrorMessage(err, 'Не удалось сохранить обход'), life: 4000 })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <Button icon="pi pi-arrow-left" text @click="router.back()" />
      <h1 class="page-title">Новый обход</h1>
    </div>

    <div class="form-card">
      <!-- Блок и дата -->
      <div class="form-row">
        <div class="field">
          <label>Блок</label>
          <Select
            v-model="selectedBlock"
            :options="availableBlocks"
            optionLabel="number"
            placeholder="Выберите блок"
            :loading="loading"
            fluid
          >
            <template #option="{ option }">
              Блок {{ option.number }}
            </template>
            <template #value="{ value }">
              <span v-if="value">Блок {{ value.number }}</span>
              <span v-else class="text-muted">Выберите блок</span>
            </template>
          </Select>
          <small v-if="!loading && availableBlocks.length === 0" class="text-danger">
            Вам не назначены этажи
          </small>
        </div>

        <div class="field">
          <label>Дата обхода</label>
          <DatePicker v-model="date" dateFormat="dd.mm.yy" :maxDate="new Date()" fluid />
        </div>
      </div>

      <Divider />

      <!-- Оценки -->
      <div class="scores-header">
        <span class="scores-title">Оценки зон (1 — плохо, 5 — отлично)</span>
        <div class="avg-badge">
          Средняя: <Tag :value="avgScore !== null ? String(avgScore) : '—'" :severity="avgSeverity(avgScore)" class="ml-1" />
        </div>
      </div>

      <div class="scores-grid">
        <div
          v-for="(_, key) in scores"
          v-show="key !== 'roomB' || selectedBlock?.hasRoomB"
          :key="key"
          class="score-item"
        >
          <div class="score-item__header">
            <span class="score-item__label">{{ zoneLabels[key] }}</span>
            <div class="score-item__right">
              <button
                class="closed-btn"
                :class="{ 'closed-btn--active': scores[key] === null }"
                @click="toggleScore(key)"
                :title="scores[key] === null ? 'Отметить как проверено' : 'Закрыта / не проверялась'"
              ><i :class="scores[key] === null ? 'pi pi-lock' : 'pi pi-unlock'" /></button>
              <span v-if="scores[key] !== null" class="score-item__value" :style="{ color: scoreColor(scores[key] ?? null) }">{{ scores[key] }}</span>
              <span v-else class="score-item__value score-item__value--none">—</span>
            </div>
          </div>
          <template v-if="scores[key] !== null">
            <Slider v-model="scores[key]" :min="1" :max="5" :step="1" />
            <div class="score-item__marks">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </template>
          <p v-else class="score-item__closed-hint">закрыта / не проверялась</p>
        </div>
      </div>

      <Divider />

      <div class="field">
        <label class="field-label">Замечания</label>
        <Textarea v-model="comment" rows="3" autoResize fluid placeholder="Опишите замечания по блоку..." />
      </div>

      <Divider />

      <div class="form-actions">
        <Button label="Отмена" severity="secondary" outlined @click="router.back()" />
        <Button
          label="Сохранить обход"
          icon="pi pi-save"
          :loading="submitting"
          @click="submit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.page-title { font-size: 1.5rem; font-weight: 700; margin: 0; }

.form-card {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  max-width: 760px;
  margin: 0 auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 767px) {
  .form-card {
    padding: 1.25rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .scores-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .scores-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.text-danger { color: var(--p-red-500); font-size: 0.8rem; }

.scores-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.scores-title { font-weight: 600; }

.avg-badge {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.scores-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem 2rem;
}

.score-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.score-item__right {
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

.score-item__label {
  font-size: 0.9rem;
  font-weight: 500;
}

.score-item__value {
  font-size: 1.1rem;
  font-weight: 700;
  transition: color 0.2s;
  width: 1.2rem;
  text-align: right;
}

.score-item__value--none {
  color: var(--p-text-muted-color);
}

.score-item__closed-hint {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}

.score-item__marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--p-text-muted-color);
  margin-top: 0.25rem;
  padding: 0 2px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.optional {
  font-weight: 400;
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}


</style>
