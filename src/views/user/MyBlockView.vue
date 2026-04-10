<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { inspectionsApi, type InspectionDto } from '@/api/inspections.api'
import { blocksApi, type BlockDto } from '@/api/blocks.api'
import { usersApi } from '@/api/users.api'
import ScoreBar from '@/components/ScoreBar.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

const block = ref<BlockDto | null>(null)
const blockId = ref<number | null>(null)
interface InspectionRow extends InspectionDto { avgScore: number }

const inspections = ref<InspectionRow[]>([])
const loading = ref(true)
const error = ref(false)

function avg(i: InspectionDto): number {
  const vals = [i.shower, i.toilet, i.hall, i.kitchen, i.roomA, i.roomB].filter((v) => v != null) as number[]
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function avgSeverity(val: number): 'success' | 'warn' | 'danger' {
  if (val >= 4) return 'success'
  if (val >= 3) return 'warn'
  return 'danger'
}

const avgOverall = computed(() => {
  if (!inspections.value.length) return null
  const sum = inspections.value.reduce((acc, i) => acc + avg(i), 0)
  return +(sum / inspections.value.length).toFixed(1)
})

onMounted(async () => {
  try {
    const me = await usersApi.getMe()
    blockId.value = me.blockId
    if (me.blockId) {
      const [blockData, inspData] = await Promise.all([
        blocksApi.getById(me.blockId),
        inspectionsApi.getByBlock(me.blockId),
      ])
      block.value = blockData
      inspections.value = inspData
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((i) => ({ ...i, avgScore: avg(i) }))
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="page-title">Мой блок</h1>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <Message v-else-if="error" severity="error">Не удалось загрузить данные</Message>

    <Message v-else-if="!blockId" severity="info">
      Вам ещё не назначен блок. Обратитесь к администратору.
    </Message>

    <template v-else>
      <!-- Карточка блока -->
      <div class="block-cards">
        <div class="info-card">
          <i class="pi pi-home info-card__icon" />
          <div>
            <div class="info-card__label">Номер блока</div>
            <div class="info-card__value">{{ block?.number }}</div>
          </div>
        </div>
        <div class="info-card">
          <i class="pi pi-building info-card__icon" />
          <div>
            <div class="info-card__label">Этаж</div>
            <div class="info-card__value">{{ block?.floor }}</div>
          </div>
        </div>
        <div class="info-card" v-if="avgOverall !== null">
          <i class="pi pi-star-fill info-card__icon" />
          <div>
            <div class="info-card__label">Средняя оценка</div>
            <div class="info-card__value">
              <Tag :value="String(avgOverall)" :severity="avgSeverity(avgOverall!)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Таблица обходов -->
      <div class="card mt-4">
        <h2 class="section-title">История обходов</h2>

        <Message v-if="!inspections.length" severity="info">Обходов ещё не было</Message>

        <DataTable v-else :value="inspections" :rows="5" paginator stripedRows>
          <Column field="date" header="Дата" sortable>
            <template #body="{ data }">
              {{ new Date(data.date).toLocaleDateString('ru-RU') }}
            </template>
          </Column>

          <Column header="Средняя" sortable sortField="avgScore" style="text-align: center">
            <template #body="{ data }">
              <div style="display: flex; justify-content: center">
                <Tag :value="String(avg(data))" :severity="avgSeverity(avg(data))" />
              </div>
            </template>
          </Column>

          <Column header="Оценки по зонам" style="min-width: 260px">
            <template #body="{ data }">
              <div class="scores-grid">
                <ScoreBar :value="data.shower" label="Душ" />
                <ScoreBar :value="data.toilet" label="Туалет" />
                <ScoreBar :value="data.hall" label="Коридор" />
                <ScoreBar :value="data.kitchen" label="Кухня" />
                <ScoreBar :value="data.roomA" label="Комн. А" />
                <ScoreBar :value="data.roomB" label="Комн. Б" />
              </div>
            </template>
          </Column>

          <Column field="inspectorFio" header="Инспектор" />
          <Column header="Замечания">
            <template #body="{ data }">
              <div v-if="data.comment" class="comment-badge">
                <i class="pi pi-exclamation-circle" />
                {{ data.comment }}
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.block-cards {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.info-card {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  min-width: 160px;
}

.info-card__icon {
  font-size: 1.75rem;
  color: var(--p-primary-400);
}

.info-card__label {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  margin-bottom: 0.2rem;
}

.info-card__value {
  font-size: 1.3rem;
  font-weight: 700;
}

.card {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.scores-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-badge {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--p-orange-50);
  border: 1px solid var(--p-orange-200);
  border-left: 4px solid var(--p-orange-400);
  color: var(--p-orange-800);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.4;
}

.comment-badge .pi {
  color: var(--p-orange-500);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
