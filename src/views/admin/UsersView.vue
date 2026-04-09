<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usersApi, type UserDto } from '@/api/users.api'
import RoleChip from '@/components/RoleChip.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const users = ref<UserDto[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    users.value = await usersApi.getAll()
  } finally {
    loading.value = false
  }
}

function deleteUser(user: UserDto) {
  confirm.require({
    message: `Удалить пользователя «${user.fio}»?`,
    header: 'Подтверждение',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Отмена',
    acceptLabel: 'Удалить',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await usersApi.delete(user.id)
        users.value = users.value.filter((u) => u.id !== user.id)
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
    <h1 class="page-title">Пользователи</h1>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <div v-else class="card">
      <DataTable :value="users" :rows="20" paginator stripedRows>
        <Column field="fio" header="ФИО" sortable />
        <Column field="username" header="Логин" />
        <Column header="Роль">
          <template #body="{ data }">
            <RoleChip :role="data.role" />
          </template>
        </Column>
        <Column header="Блок">
          <template #body="{ data }">
            <Tag v-if="data.blockId" :value="`Блок ${data.blockId}`" severity="secondary" />
            <span v-else class="text-muted">—</span>
          </template>
        </Column>
        <Column header="Действия" style="width: 180px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                v-if="data.role === 'INSPECTOR' || data.role === 'ADMIN'"
                icon="pi pi-map"
                size="small"
                text
                tooltip="Назначить этажи"
                @click="router.push(`/admin/users/${data.id}/floors`)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                text
                severity="danger"
                tooltip="Удалить"
                @click="deleteUser(data)"
              />
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

.text-muted { color: var(--p-text-muted-color); }
</style>
