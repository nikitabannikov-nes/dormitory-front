<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/stores/auth.store'
import { inspectionsApi } from '@/api/inspections.api'
import { extractErrorMessage } from '@/api/error'
import { blocksApi, type BlockDto } from '@/api/blocks.api'
import { usersApi } from '@/api/users.api'
import { getScoreSeverity } from '@/utils/score'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Textarea from 'primevue/textarea'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import ScoreInput from '@/components/ScoreInput.vue'

type ZoneKey = 'shower' | 'toilet' | 'hall' | 'kitchen' | 'roomA' | 'roomB'

interface BlockRoundEntry {
  scores: Record<ZoneKey, number | null>
  closed: Record<ZoneKey, boolean>
  comment: string
  touched: boolean
  status: 'idle' | 'saving' | 'saved' | 'error'
  errorMessage?: string
}

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const auth = useAuthStore()

const zoneKeys: ZoneKey[] = ['shower', 'toilet', 'hall', 'kitchen', 'roomA', 'roomB']
const zoneLabels: Record<ZoneKey, string> = {
  shower: 'Душевая',
  toilet: 'Туалет',
  hall: 'Коридор',
  kitchen: 'Кухня',
  roomA: 'Комната А',
  roomB: 'Комната Б',
}

const allBlocks = ref<BlockDto[]>([])
const assignedFloors = ref<number[]>([])
const loading = ref(false)
const submitting = ref(false)

// Обход
const date = ref<Date>(new Date())
const selectedFloor = ref<number>(0)
const selectedBlockId = ref<number | null>(null)
const roundState = reactive<Record<number, BlockRoundEntry>>({})

function createEntry(): BlockRoundEntry {
  const scores = {} as Record<ZoneKey, number | null>
  const closed = {} as Record<ZoneKey, boolean>
  for (const key of zoneKeys) {
    scores[key] = null
    closed[key] = false
  }
  return { scores, closed, comment: '', touched: false, status: 'idle' }
}

function zoneValue(entry: BlockRoundEntry, key: ZoneKey): number | null {
  return entry.closed[key] ? null : entry.scores[key]
}

function getEntry(blockId: number): BlockRoundEntry {
  if (!roundState[blockId]) roundState[blockId] = createEntry()
  return roundState[blockId]
}

function blocksForFloor(floor: number): BlockDto[] {
  return allBlocks.value.filter((b) => b.floor === floor).sort((a, b) => a.number - b.number)
}

function selectBlock(blockId: number) {
  selectedBlockId.value = blockId
  getEntry(blockId)
}

const currentBlock = computed<BlockDto | null>(
  () => allBlocks.value.find((b) => b.id === selectedBlockId.value) ?? null,
)
const currentBlockHasRoomB = computed(() => currentBlock.value?.hasRoomB ?? false)
const currentEntry = computed<BlockRoundEntry | null>(() =>
  selectedBlockId.value != null ? (roundState[selectedBlockId.value] ?? null) : null,
)

function chipStatus(blockId: number): 'saved' | 'touched' | 'error' | 'none' {
  const e = roundState[blockId]
  if (!e) return 'none'
  if (e.status === 'saved') return 'saved'
  if (e.status === 'error') return 'error'
  if (e.touched) return 'touched'
  return 'none'
}

function markTouched(entry: BlockRoundEntry) {
  entry.touched = true
  entry.errorMessage = undefined
  if (entry.status !== 'saving') entry.status = 'idle'
}

function setScore(entry: BlockRoundEntry, key: ZoneKey, value: number | null) {
  entry.scores[key] = value
  markTouched(entry)
}

function setClosed(entry: BlockRoundEntry, key: ZoneKey, value: boolean) {
  entry.closed[key] = value
  if (value) entry.scores[key] = null
  markTouched(entry)
}

function setComment(entry: BlockRoundEntry, value: string) {
  entry.comment = value
  markTouched(entry)
}

const totalBlocksCount = computed(
  () => allBlocks.value.filter((b) => assignedFloors.value.includes(b.floor)).length,
)
const touchedCount = computed(() => Object.values(roundState).filter((e) => e.touched).length)
const pendingCount = computed(
  () => Object.values(roundState).filter((e) => e.touched && e.status !== 'saved').length,
)
const hasUnsavedChanges = computed(() => pendingCount.value > 0)

const avgScore = computed<number | null>(() => {
  if (!currentEntry.value) return null
  const entry = currentEntry.value
  const vals = zoneKeys
    .filter((key) => key !== 'roomB' || currentBlockHasRoomB.value)
    .map((key) => zoneValue(entry, key))
    .filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [blocks, floors] = await Promise.all([
      blocksApi.getAll(),
      auth.userId ? usersApi.getFloors(auth.userId) : Promise.resolve([]),
    ])
    allBlocks.value = blocks
    assignedFloors.value = [...floors].sort((a, b) => a - b)
    if (assignedFloors.value.length > 0) {
      selectedFloor.value = assignedFloors.value[0] ?? 0
    }
  } finally {
    loading.value = false
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!hasUnsavedChanges.value) {
    next()
    return
  }
  confirm.require({
    message: 'Есть несохранённые оценки. Уйти со страницы?',
    header: 'Подтверждение',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Остаться',
    acceptLabel: 'Уйти',
    acceptClass: 'p-button-danger',
    accept: () => next(),
    reject: () => next(false),
  })
})

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function submitRound() {
  if (!date.value) {
    toast.add({ severity: 'warn', summary: 'Выберите дату обхода', life: 2000 })
    return
  }

  const entries = Object.entries(roundState)
    .map(([id, entry]) => ({ id: Number(id), entry }))
    .filter(({ entry }) => entry.touched && entry.status !== 'saved')

  if (entries.length === 0) {
    toast.add({ severity: 'warn', summary: 'Нет заполненных блоков для сохранения', life: 2000 })
    return
  }

  submitting.value = true
  let savedCount = 0
  const failedBlocks: string[] = []

  try {
    for (const { id, entry } of entries) {
      const block = allBlocks.value.find((b) => b.id === id)
      if (!block) continue
      entry.status = 'saving'
      try {
        await inspectionsApi.create({
          blockId: id,
          date: toLocalDateStr(date.value),
          shower: zoneValue(entry, 'shower'),
          toilet: zoneValue(entry, 'toilet'),
          hall: zoneValue(entry, 'hall'),
          kitchen: zoneValue(entry, 'kitchen'),
          roomA: zoneValue(entry, 'roomA'),
          roomB: block.hasRoomB ? zoneValue(entry, 'roomB') : null,
          comment: entry.comment.trim() || null,
        })
        entry.status = 'saved'
        entry.errorMessage = undefined
        savedCount++
      } catch (err) {
        entry.status = 'error'
        entry.errorMessage = extractErrorMessage(err, 'Не удалось сохранить блок')
        failedBlocks.push(`Блок ${block.number}: ${entry.errorMessage}`)
      }
    }
  } finally {
    submitting.value = false
  }

  const attempted = savedCount + failedBlocks.length
  if (failedBlocks.length === 0) {
    toast.add({ severity: 'success', summary: `Обход сохранён: ${savedCount} из ${attempted}`, life: 2500 })
    router.push('/inspections')
  } else {
    toast.add({
      severity: savedCount > 0 ? 'warn' : 'error',
      summary: `Сохранено ${savedCount} из ${attempted} блоков`,
      detail: failedBlocks.join('; '),
      life: 6000,
    })
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
      <div class="field date-field">
        <label>Дата обхода</label>
        <DatePicker v-model="date" dateFormat="dd.mm.yy" :maxDate="new Date()" style="max-width: 220px" />
      </div>

      <Divider />

      <div v-if="loading" class="flex justify-content-center" style="padding: 2rem 0">
        <ProgressSpinner />
      </div>

      <small v-else-if="assignedFloors.length === 0" class="text-danger">
        Вам не назначены этажи
      </small>

      <template v-else>
        <Tabs v-model:value="selectedFloor">
          <TabList>
            <Tab v-for="f in assignedFloors" :key="f" :value="f">{{ f }} этаж</Tab>
          </TabList>
          <TabPanels>
            <TabPanel v-for="f in assignedFloors" :key="f" :value="f">
              <div class="block-grid">
                <button
                  v-for="b in blocksForFloor(f)"
                  :key="b.id"
                  type="button"
                  class="block-chip"
                  :class="[
                    `block-chip--${chipStatus(b.id)}`,
                    { 'block-chip--active': selectedBlockId === b.id },
                  ]"
                  @click="selectBlock(b.id)"
                >
                  <span>Блок {{ b.number }}</span>
                  <i
                    v-if="chipStatus(b.id) === 'saved'"
                    class="pi pi-check-circle block-chip__badge block-chip__badge--saved"
                  />
                  <i
                    v-else-if="chipStatus(b.id) === 'error'"
                    class="pi pi-exclamation-circle block-chip__badge block-chip__badge--error"
                  />
                  <span
                    v-else-if="chipStatus(b.id) === 'touched'"
                    class="block-chip__badge block-chip__badge--touched"
                  />
                </button>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <template v-if="currentEntry && currentBlock">
          <Divider />

          <div class="scores-header">
            <span class="scores-title">Блок {{ currentBlock.number }} — оценки зон (1 — плохо, 5 — отлично)</span>
            <div class="avg-badge">
              Средняя: <Tag :value="avgScore !== null ? String(avgScore) : '—'" :severity="getScoreSeverity(avgScore)" class="ml-1" />
            </div>
          </div>

          <div class="scores-grid">
            <ScoreInput
              v-for="key in zoneKeys"
              v-show="key !== 'roomB' || currentBlockHasRoomB"
              :key="key"
              :label="zoneLabels[key]"
              :model-value="currentEntry.scores[key]"
              :closed="currentEntry.closed[key]"
              @update:model-value="(v) => currentEntry && setScore(currentEntry, key, v)"
              @update:closed="(v) => currentEntry && setClosed(currentEntry, key, v)"
            />
          </div>

          <p v-if="currentEntry.status === 'error'" class="text-danger block-error">
            {{ currentEntry.errorMessage }}
          </p>

          <Divider />

          <div class="field">
            <label class="field-label">Замечания</label>
            <Textarea
              :model-value="currentEntry.comment"
              @update:model-value="(v) => currentEntry && setComment(currentEntry, String(v ?? ''))"
              rows="3"
              autoResize
              fluid
              placeholder="Опишите замечания по блоку..."
            />
          </div>
        </template>
        <p v-else class="text-muted select-hint">Выберите блок на этаже, чтобы поставить оценки</p>
      </template>
    </div>

    <div v-if="!loading && assignedFloors.length > 0" class="round-footer">
      <span class="round-footer__count">Заполнено: {{ touchedCount }} из {{ totalBlocksCount }}</span>
      <Button
        :label="`Сохранить обход (${pendingCount})`"
        icon="pi pi-save"
        :loading="submitting"
        :disabled="pendingCount === 0"
        @click="submitRound"
      />
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
  margin: 0 auto 5.5rem;
}

@media (max-width: 767px) {
  .form-card {
    padding: 1.25rem;
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

.date-field {
  max-width: 260px;
}

.text-danger { color: var(--p-red-500); font-size: 0.8rem; }

.select-hint {
  padding: 1rem 0;
}

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

.block-error {
  margin-top: -0.75rem;
}

.block-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 0.25rem 0 0.5rem;
}

.block-chip {
  position: relative;
  min-width: 84px;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--p-surface-300);
  background: var(--p-surface-0);
  color: var(--p-text-color);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition: border-color 0.15s, background 0.15s;
}

.block-chip:hover {
  border-color: var(--p-surface-400);
}

.block-chip--active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

.block-chip--saved {
  border-color: var(--p-green-300);
}

.block-chip--error {
  border-color: var(--p-red-300);
}

.block-chip__badge--saved {
  color: var(--p-green-500);
}

.block-chip__badge--error {
  color: var(--p-red-500);
}

.block-chip__badge--touched {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--p-orange-500);
}

.field-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.round-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--p-surface-0);
  border-top: 1px solid var(--p-surface-200);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  padding: 0.85rem 1.5rem;
  margin: 0 auto;
  max-width: 760px;
  border-radius: 10px 10px 0 0;
}

.round-footer__count {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}
</style>
