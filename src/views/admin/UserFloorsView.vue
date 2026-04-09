<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usersApi, type UserDto } from '@/api/users.api'
import { extractErrorMessage } from '@/api/error'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import InputNumber from 'primevue/inputnumber'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userId = Number(route.params.id)

const user = ref<UserDto | null>(null)
const floors = ref<number[]>([])
const newFloor = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    const [u, f] = await Promise.all([usersApi.getById(userId), usersApi.getFloors(userId)])
    user.value = u
    floors.value = f.sort((a, b) => a - b)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка загрузки', detail: extractErrorMessage(err), life: 4000 })
  } finally {
    loading.value = false
  }
})

function addFloor() {
  if (!newFloor.value || floors.value.includes(newFloor.value)) return
  floors.value = [...floors.value, newFloor.value].sort((a, b) => a - b)
  newFloor.value = null
}

function removeFloor(floor: number) {
  floors.value = floors.value.filter((f) => f !== floor)
}

async function save() {
  saving.value = true
  try {
    await usersApi.assignFloors(userId, floors.value)
    toast.add({ severity: 'success', summary: 'Этажи сохранены', life: 2000 })
    router.push('/admin/users')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка сохранения', detail: extractErrorMessage(err), life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <Button icon="pi pi-arrow-left" text @click="router.back()" />
      <h1 class="page-title">Этажи инспектора</h1>
    </div>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <div v-else class="form-card">
      <div class="user-info" v-if="user">
        <i class="pi pi-user" />
        <div>
          <div class="user-fio">{{ user.fio }}</div>
          <div class="user-login">@{{ user.username }}</div>
        </div>
      </div>

      <Message v-if="user?.role === 'USER'" severity="warn">
        Пользователю с ролью USER нельзя назначать этажи
      </Message>

      <template v-else>
        <div class="section-label">Закреплённые этажи</div>

        <div class="chips-area" v-if="floors.length">
          <div v-for="floor in floors" :key="floor" class="floor-chip">
            <span>Этаж {{ floor }}</span>
            <button class="chip-remove" @click="removeFloor(floor)">
              <i class="pi pi-times" />
            </button>
          </div>
        </div>
        <div v-else class="text-muted mb-3">Этажи не назначены</div>

        <div class="add-row">
          <InputNumber
            v-model="newFloor"
            placeholder="Номер этажа"
            :min="1"
            :max="20"
            style="width: 160px"
            @keyup.enter="addFloor"
          />
          <Button icon="pi pi-plus" label="Добавить" outlined @click="addFloor" />
        </div>

        <div class="form-actions">
          <Button label="Отмена" severity="secondary" outlined @click="router.back()" />
          <Button label="Сохранить" icon="pi pi-save" :loading="saving" @click="save" />
        </div>
      </template>
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
  max-width: 540px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--p-surface-200);
}

.user-info .pi-user { font-size: 2rem; color: var(--p-primary-400); }

.user-fio { font-weight: 600; font-size: 1rem; }
.user-login { font-size: 0.85rem; color: var(--p-text-muted-color); }

.section-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
  margin-bottom: 0.75rem;
}

.chips-area {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.floor-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--p-primary-50);
  color: var(--p-primary-700);
  border-radius: 20px;
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--p-primary-400);
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  transition: color 0.15s;
}

.chip-remove:hover { color: var(--p-red-500); }

.add-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.text-muted { color: var(--p-text-muted-color); font-size: 0.9rem; }
</style>
