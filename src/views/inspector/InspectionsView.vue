<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { inspectionsApi, type InspectionDto } from '@/api/inspections.api'
import ScoreBar from '@/components/ScoreBar.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const router = useRouter()
interface InspectionRow extends InspectionDto { avgScore: number }

const inspections = ref<InspectionRow[]>([])
const loading = ref(true)
const search = ref('')

function avg(i: InspectionDto): number {
  return +((i.shower + i.toilet + i.hall + i.kitchen + i.roomA + i.roomB) / 6).toFixed(1)
}

function avgSeverity(val: number): 'success' | 'warn' | 'danger' {
  if (val >= 4) return 'success'
  if (val >= 3) return 'warn'
  return 'danger'
}

const filtered = computed(() => {
  if (!search.value) return inspections.value
  const q = search.value.toLowerCase()
  return inspections.value.filter(
    (i) => String(i.blockNumber).includes(q) || i.date.includes(q),
  )
})

onMounted(async () => {
  try {
    const data = await inspectionsApi.getMy()
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
    <div class="page-header">
      <h1 class="page-title">Мои обходы</h1>
      <Button
        label="Новый обход"
        icon="pi pi-plus"
        @click="router.push('/inspections/new')"
      />
    </div>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <div v-else class="card">
      <div class="flex mb-3">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Поиск по блоку или дате..."
            style="width: 280px"
          />
        </IconField>
      </div>

      <DataTable :value="filtered" :rows="5" paginator stripedRows>
        <Column field="date" header="Дата" sortable>
          <template #body="{ data }">
            {{ new Date(data.date).toLocaleDateString('ru-RU') }}
          </template>
        </Column>
        <Column field="blockNumber" header="Блок" sortable />

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
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title { font-size: 1.5rem; font-weight: 700; }

.card {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.scores-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
