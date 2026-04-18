<script setup lang="ts">
import { ref } from 'vue'
import { reportsApi } from '@/api/reports.api'
import { extractErrorMessage } from '@/api/error'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'

const toast = useToast()
const loading = ref(false)

const MONTHS = [
  { label: 'Январь',   value: 1  },
  { label: 'Февраль',  value: 2  },
  { label: 'Март',     value: 3  },
  { label: 'Апрель',   value: 4  },
  { label: 'Май',      value: 5  },
  { label: 'Июнь',     value: 6  },
  { label: 'Июль',     value: 7  },
  { label: 'Август',   value: 8  },
  { label: 'Сентябрь', value: 9  },
  { label: 'Октябрь',  value: 10 },
  { label: 'Ноябрь',   value: 11 },
  { label: 'Декабрь',  value: 12 },
]

const DEFAULT_WORK = `Информирование жильцов о критериях оценки блоков во время рейдов жилищно-бытовой комиссии, правилах внутреннего распорядка.
Обновление таблицы учета ОПТ.
Проведение рейдов-проверок на каждом этаже совместно с старостами.`

const month = ref<number>(new Date().getMonth() + 1)
const chairmanFio = ref('')
const workText = ref(DEFAULT_WORK)

function isFormValid() {
  return month.value && chairmanFio.value.trim()
}

async function generate() {
  if (!isFormValid()) {
    toast.add({ severity: 'warn', summary: 'Заполните все обязательные поля', life: 3000 })
    return
  }

  const performedWork = workText.value
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  loading.value = true
  try {
    await reportsApi.generateMonthly({
      month: month.value,
      chairmanFio: chairmanFio.value.trim(),
      performedWork,
    })
    toast.add({ severity: 'success', summary: 'Отчёт сформирован и скачан', life: 3000 })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: extractErrorMessage(err, 'Не удалось сформировать отчёт'),
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="page-title">Отчёт ЖБК</h1>

    <div class="card">
      <p class="hint">
        Отчёт формируется по всем проверкам за выбранный месяц текущего года
        и скачивается в формате <strong>.docx</strong>.
      </p>

      <div class="form-grid">
        <div class="field">
          <label>Месяц <span class="required">*</span></label>
          <Select
            v-model="month"
            :options="MONTHS"
            optionLabel="label"
            optionValue="value"
            placeholder="Выберите месяц"
            class="w-full"
          />
        </div>

        <div class="field">
          <label>ФИО председателя <span class="required">*</span></label>
          <InputText
            v-model="chairmanFio"
            placeholder="Иванов Иван Иванович"
            class="w-full"
          />
        </div>

        <div class="field field--full">
          <label>
            Выполненная работа
            <span class="optional">(каждый пункт с новой строки)</span>
          </label>
          <Textarea
            v-model="workText"
            :rows="5"
            class="w-full"
            autoResize
          />
        </div>
      </div>

      <div class="actions">
        <Button
          label="Сформировать отчёт"
          icon="pi pi-download"
          :loading="loading"
          :disabled="!isFormValid()"
          @click="generate"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.card {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  max-width: 680px;
}

.hint {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field--full {
  grid-column: 1 / -1;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
}

.required {
  color: var(--p-red-500);
}

.optional {
  font-weight: 400;
  color: var(--p-text-muted-color);
}

.actions {
  margin-top: 1.75rem;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
