<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { blocksApi, type BlockDto } from '@/api/blocks.api'
import { extractErrorMessage } from '@/api/error'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import ProgressSpinner from 'primevue/progressspinner'
import Checkbox from 'primevue/checkbox'

const toast = useToast()
const confirm = useConfirm()

const blocks = ref<BlockDto[]>([])
const loading = ref(true)
const showDialog = ref(false)
const saving = ref(false)

const form = ref({ number: null as number | null, floor: null as number | null, hasRoomB: true })

async function load() {
  loading.value = true
  try {
    blocks.value = await blocksApi.getAll()
  } finally {
    loading.value = false
  }
}

async function createBlock() {
  if (!form.value.number || !form.value.floor) return
  saving.value = true
  try {
    const created = await blocksApi.create({ number: form.value.number, floor: form.value.floor, hasRoomB: form.value.hasRoomB })
    blocks.value.push(created)
    blocks.value.sort((a, b) => a.number - b.number)
    showDialog.value = false
    form.value = { number: null, floor: null, hasRoomB: true }
    toast.add({ severity: 'success', summary: 'Блок добавлен', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: extractErrorMessage(err, 'Не удалось создать блок'), life: 4000 })
  } finally {
    saving.value = false
  }
}

function deleteBlock(block: BlockDto) {
  confirm.require({
    message: `Удалить блок №${block.number}?`,
    header: 'Подтверждение',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Отмена',
    acceptLabel: 'Удалить',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await blocksApi.delete(block.id)
        blocks.value = blocks.value.filter((b) => b.id !== block.id)
        toast.add({ severity: 'success', summary: 'Удалено', life: 2000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Ошибка при удалении', life: 3000 })
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Блоки</h1>
      <Button label="Добавить блок" icon="pi pi-plus" @click="showDialog = true" />
    </div>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <div v-else class="card">
      <DataTable :value="blocks" :rows="20" paginator stripedRows>
        <Column field="number" header="Номер блока" sortable />
        <Column field="floor" header="Этаж" sortable />
        <Column header="Действия" style="width: 100px">
          <template #body="{ data }">
            <Button
              icon="pi pi-trash"
              size="small"
              text
              severity="danger"
              @click="deleteBlock(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Диалог добавления -->
    <Dialog v-model:visible="showDialog" header="Новый блок" modal style="width: 340px">
      <div class="dialog-form">
        <div class="field">
          <label>Номер блока</label>
          <InputNumber v-model="form.number" :min="1" fluid />
        </div>
        <div class="field">
          <label>Этаж</label>
          <InputNumber v-model="form.floor" :min="1" :max="20" fluid />
        </div>
        <div class="field field--row">
          <Checkbox v-model="form.hasRoomB" :binary="true" inputId="hasRoomB" />
          <label for="hasRoomB">Есть комната Б</label>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" outlined @click="showDialog = false" />
        <Button
          label="Добавить"
          icon="pi pi-plus"
          :loading="saving"
          :disabled="!form.number || !form.floor"
          @click="createBlock"
        />
      </template>
    </Dialog>
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

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.field--row {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.field--row label { cursor: pointer; }
</style>
