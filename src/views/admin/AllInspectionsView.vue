<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { inspectionsApi, type InspectionDto } from '@/api/inspections.api'
import ScoreBar from '@/components/ScoreBar.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'

interface InspectionRow extends InspectionDto { avgScore: number }

const inspections = ref<InspectionRow[]>([])
const loading = ref(true)
const search = ref('')
const dateRange = ref<[Date, Date] | null>(null)

function avg(i: InspectionDto): number {
  return +((i.shower + i.toilet + i.hall + i.kitchen + i.roomA + i.roomB) / 6).toFixed(1)
}

function avgSeverity(val: number): 'success' | 'warn' | 'danger' {
  if (val >= 4) return 'success'
  if (val >= 3) return 'warn'
  return 'danger'
}

const filtered = computed(() => {
  let result = inspections.value

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (i) =>
        String(i.blockNumber).includes(q) ||
        i.inspectorFio.toLowerCase().includes(q),
    )
  }

  if (dateRange.value?.[0] && dateRange.value?.[1]) {
    const [from, to] = dateRange.value
    result = result.filter((i) => {
      const d = new Date(i.date)
      return d >= from && d <= to
    })
  }

  return result
})

function clearFilters() {
  search.value = ''
  dateRange.value = null
}

onMounted(async () => {
  try {
    const data = await inspectionsApi.getAll()
    inspections.value = data
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((i) => ({ ...i, avgScore: avg(i) }))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="page-title">Все обходы</h1>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <div v-else class="card">
      <!-- Фильтры -->
      <div class="filters">
        <InputText
          v-model="search"
          placeholder="Блок или инспектор..."
          style="width: 240px"
        />
        <DatePicker
          v-model="dateRange"
          selectionMode="range"
          dateFormat="dd.mm.yy"
          placeholder="Период"
          style="width: 240px"
        />
        <Button
          icon="pi pi-times"
          text
          severity="secondary"
          tooltip="Сбросить фильтры"
          @click="clearFilters"
        />
        <span class="filter-count">Показано: {{ filtered.length }}</span>
      </div>

      <DataTable :value="filtered" :rows="20" paginator stripedRows>
        <Column field="date" header="Дата" sortable>
          <template #body="{ data }">
            {{ new Date(data.date).toLocaleDateString('ru-RU') }}
          </template>
        </Column>
        <Column field="blockNumber" header="Блок" sortable />
        <Column field="inspectorFio" header="Инспектор" sortable />
        <Column header="Ср. оценка" sortable sortField="avgScore">
          <template #body="{ data }">
            <Tag :value="String(avg(data))" :severity="avgSeverity(avg(data))" />
          </template>
        </Column>
        <Column header="Оценки по зонам" style="min-width: 260px">
          <template #body="{ data }">
            <div class="scores-col">
              <ScoreBar :value="data.shower" label="Душ" />
              <ScoreBar :value="data.toilet" label="Туалет" />
              <ScoreBar :value="data.hall" label="Коридор" />
              <ScoreBar :value="data.kitchen" label="Кухня" />
              <ScoreBar :value="data.roomA" label="Комн. А" />
              <ScoreBar :value="data.roomB" label="Комн. Б" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; }

.card {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-count {
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  margin-left: auto;
}

.scores-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
