<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { inspectionsApi, type InspectionDto } from '@/api/inspections.api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
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
const toast = useToast()
const confirm = useConfirm()

interface InspectionRow extends InspectionDto { avgScore: number }

const inspections = ref<InspectionRow[]>([])
const loading = ref(true)
const search = ref('')

function avg(i: InspectionDto): number {
  const vals = [i.shower, i.toilet, i.hall, i.kitchen, i.roomA, i.roomB].filter((v) => v != null) as number[]
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
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

function deleteInspection(row: InspectionRow) {
  confirm.require({
    message: `Удалить обход от ${new Date(row.date).toLocaleDateString('ru-RU')} (блок ${row.blockNumber})?`,
    header: 'Подтверждение',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Отмена',
    acceptLabel: 'Удалить',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await inspectionsApi.delete(row.id)
        inspections.value = inspections.value.filter((i) => i.id !== row.id)
        toast.add({ severity: 'success', summary: 'Удалено', life: 2000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Ошибка при удалении', life: 3000 })
      }
    },
  })
}

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
            class="search-input"
          />
        </IconField>
      </div>

      <div class="table-wrapper">
        <DataTable :value="filtered" :rows="5" paginator stripedRows>
          <Column field="date" header="Дата" sortable style="min-width: 100px">
            <template #body="{ data }">
              {{ new Date(data.date).toLocaleDateString('ru-RU') }}
            </template>
          </Column>
          <Column field="blockNumber" header="Блок" sortable style="min-width: 70px" />

          <Column header="Ср." sortable sortField="avgScore" style="min-width: 70px; text-align: center">
            <template #body="{ data }">
              <div style="display: flex; justify-content: center">
                <Tag :value="String(avg(data))" :severity="avgSeverity(avg(data))" />
              </div>
            </template>
          </Column>

          <Column header="Оценки по зонам" style="min-width: 220px">
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
          <Column header="Замечания" style="min-width: 180px">
            <template #body="{ data }">
              <div v-if="data.comment" class="comment-badge">
                <i class="pi pi-exclamation-circle" />
                {{ data.comment }}
              </div>
            </template>
          </Column>
          <Column style="width: 60px; min-width: 60px">
            <template #body="{ data }">
              <Button
                icon="pi pi-trash"
                size="small"
                text
                severity="danger"
                tooltip="Удалить"
                @click="deleteInspection(data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
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

.search-input {
  width: 280px;
  max-width: 100%;
}

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
  max-width: 280px;
}

.comment-badge .pi {
  color: var(--p-orange-500);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
