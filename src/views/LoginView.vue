<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { extractErrorMessage } from '@/api/error'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  if (!username.value || !password.value) return

  loading.value = true
  try {
    await auth.signIn({ username: username.value, password: password.value })
    router.push('/')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка входа', detail: extractErrorMessage(err, 'Неверный логин или пароль'), life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-form">
    <h2 class="login-title">Вход в систему</h2>

    <div class="field">
      <label for="username">Логин</label>
      <InputText
        id="username"
        v-model="username"
        placeholder="Введите логин"
        fluid
        @keyup.enter="submit"
      />
    </div>

    <div class="field">
      <label for="password">Пароль</label>
      <Password
        id="password"
        v-model="password"
        placeholder="Введите пароль"
        :feedback="false"
        toggleMask
        fluid
        @keyup.enter="submit"
      />
    </div>

    <Button
      label="Войти"
      icon="pi pi-sign-in"
      :loading="loading"
      fluid
      @click="submit"
    />
  </div>
</template>

<style scoped>
.login-title {
  text-align: center;
  margin-bottom: 1.75rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}
</style>
