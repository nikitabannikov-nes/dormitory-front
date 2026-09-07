<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usersApi, type UserDto, type UserUpdateDto, type AdminCreateUserDto, type Role } from '@/api/users.api'
import { blocksApi, type BlockDto } from '@/api/blocks.api'
import { extractErrorMessage } from '@/api/error'
import RoleChip from '@/components/RoleChip.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const users = ref<UserDto[]>([])
const blocks = ref<BlockDto[]>([])
const loading = ref(true)
const search = ref('')

const filteredUsers = computed(() => {
  if (!search.value.trim()) return users.value
  const q = search.value.trim().toLowerCase()
  return users.value.filter(
    (u) =>
      u.fio.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      String(u.blockNumber ?? '').includes(q),
  )
})

const editDialog = ref(false)
const saving = ref(false)
const editForm = ref<{ id: number; fio: string; role: Role; blockId: number | null }>({
  id: 0,
  fio: '',
  role: 'USER',
  blockId: null,
})

const createDialog = ref(false)
const creating = ref(false)
const createForm = ref<{ username: string; password: string; fio: string; role: Role; blockId: number | null }>({
  username: '',
  password: '',
  fio: '',
  role: 'USER',
  blockId: null,
})

const roleOptions: { label: string; value: Role }[] = [
  { label: 'Житель', value: 'USER' },
  { label: 'Инспектор', value: 'INSPECTOR' },
  { label: 'Администратор', value: 'ADMIN' },
]

async function load() {
  loading.value = true
  try {
    const [u, b] = await Promise.all([usersApi.getAll(), blocksApi.getAll()])
    users.value = u
    blocks.value = b
  } finally {
    loading.value = false
  }
}

function openEdit(user: UserDto) {
  editForm.value = {
    id: user.id,
    fio: user.fio,
    role: user.role,
    blockId: user.blockId,
  }
  editDialog.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    const dto: UserUpdateDto = {
      fio: editForm.value.fio,
      role: editForm.value.role,
      blockId: editForm.value.blockId,
    }
    const updated = await usersApi.update(editForm.value.id, dto)
    const idx = users.value.findIndex((u) => u.id === editForm.value.id)
    if (idx !== -1) users.value[idx] = updated
    editDialog.value = false
    toast.add({ severity: 'success', summary: 'Сохранено', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: extractErrorMessage(err), life: 4000 })
  } finally {
    saving.value = false
  }
}

function openCreate() {
  createForm.value = { username: '', password: '', fio: '', role: 'USER', blockId: null }
  createDialog.value = true
}

async function createUser() {
  creating.value = true
  try {
    const dto: AdminCreateUserDto = {
      username: createForm.value.username.trim(),
      password: createForm.value.password,
      fio: createForm.value.fio.trim() || null,
      role: createForm.value.role,
      blockId: createForm.value.blockId,
    }
    const created = await usersApi.create(dto)
    users.value.push(created)
    createDialog.value = false
    toast.add({ severity: 'success', summary: 'Пользователь создан', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: extractErrorMessage(err, 'Не удалось создать пользователя'), life: 4000 })
  } finally {
    creating.value = false
  }
}

function deleteUser(user: UserDto) {
  const hasInspections = user.role === 'INSPECTOR' || user.role === 'ADMIN'
  const message = hasInspections
    ? `Удалить пользователя «${user.fio}»? Все закреплённые за ним обходы также будут удалены.`
    : `Удалить пользователя «${user.fio}»?`

  confirm.require({
    message,
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
    <div class="page-header">
      <h1 class="page-title">Пользователи</h1>
      <Button label="Добавить пользователя" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <div v-else class="card">
      <div class="filters">
        <InputText
          v-model="search"
          placeholder="Поиск по ФИО, логину или блоку..."
          class="filter-input"
        />
        <span class="filter-count">Показано: {{ filteredUsers.length }}</span>
      </div>

      <div class="table-wrapper">
        <DataTable :value="filteredUsers" :rows="10" paginator stripedRows>
          <Column field="fio" header="ФИО" sortable style="min-width: 140px" />
          <Column field="username" header="Логин" style="min-width: 110px" />
          <Column header="Роль" sortable sortField="role" style="min-width: 110px">
            <template #body="{ data }">
              <RoleChip :role="data.role" />
            </template>
          </Column>
          <Column header="Блок" style="min-width: 90px">
            <template #body="{ data }">
              <Tag
                v-if="data.blockNumber"
                :value="`Блок ${data.blockNumber}`"
                severity="secondary"
              />
              <span v-else class="text-muted">—</span>
            </template>
          </Column>
          <Column header="Действия" style="width: 140px; min-width: 120px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  tooltip="Редактировать"
                  @click="openEdit(data)"
                />
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

    <!-- Диалог редактирования -->
    <Dialog
      v-model:visible="editDialog"
      header="Редактировать пользователя"
      :style="{ width: '420px' }"
      modal
    >
      <div class="edit-form">
        <div class="field">
          <label>ФИО</label>
          <InputText v-model="editForm.fio" class="w-full" />
        </div>

        <div class="field">
          <label>Роль</label>
          <Select
            v-model="editForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div class="field">
          <label>Блок</label>
          <Select
            v-model="editForm.blockId"
            :options="[{ label: '— без блока —', value: null }, ...blocks.map(b => ({ label: `Блок ${b.number} (этаж ${b.floor})`, value: b.id }))]"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Выберите блок"
          />
        </div>

        <div v-if="editForm.role === 'INSPECTOR' || editForm.role === 'ADMIN'" class="floors-hint">
          <i class="pi pi-info-circle" />
          Этажи настраиваются отдельно через кнопку
          <Button
            label="Назначить этажи"
            size="small"
            text
            class="p-0"
            @click="editDialog = false; router.push(`/admin/users/${editForm.id}/floors`)"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Отмена" severity="secondary" outlined @click="editDialog = false" />
        <Button label="Сохранить" icon="pi pi-save" :loading="saving" @click="saveEdit" />
      </template>
    </Dialog>

    <!-- Диалог создания пользователя -->
    <Dialog
      v-model:visible="createDialog"
      header="Новый пользователь"
      :style="{ width: '420px' }"
      modal
    >
      <div class="edit-form">
        <div class="field">
          <label>Логин *</label>
          <InputText v-model="createForm.username" class="w-full" />
        </div>

        <div class="field">
          <label>Пароль *</label>
          <Password v-model="createForm.password" class="w-full" inputClass="w-full" :feedback="false" toggleMask />
        </div>

        <div class="field">
          <label>ФИО</label>
          <InputText v-model="createForm.fio" class="w-full" placeholder="Без имени" />
        </div>

        <div class="field">
          <label>Роль</label>
          <Select
            v-model="createForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div class="field">
          <label>Блок</label>
          <Select
            v-model="createForm.blockId"
            :options="[{ label: '— без блока —', value: null }, ...blocks.map(b => ({ label: `Блок ${b.number} (этаж ${b.floor})`, value: b.id }))]"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Выберите блок"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Отмена" severity="secondary" outlined @click="createDialog = false" />
        <Button
          label="Создать"
          icon="pi pi-plus"
          :loading="creating"
          :disabled="!createForm.username.trim() || createForm.password.length < 6"
          @click="createUser"
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
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title { font-size: 1.5rem; font-weight: 700; }

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

.filter-input {
  min-width: 220px;
  flex: 1 1 220px;
  max-width: 320px;
}

.filter-count {
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  margin-left: auto;
}

.text-muted { color: var(--p-text-muted-color); }

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
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

.floors-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  background: var(--p-surface-100);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.floors-hint .pi { color: var(--p-primary-400); }
</style>
