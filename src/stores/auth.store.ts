import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import { authApi, type SignInRequest } from '@/api/auth.api'
import type { Role } from '@/api/users.api'

interface JwtPayload {
  sub: string
  role: Role
  exp: number
  id: number
  fio: string
  blockId: number | null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))

  const jwtPayload = computed<JwtPayload | null>(() => {
    if (!token.value) return null
    try {
      return jwtDecode<JwtPayload>(token.value)
    } catch {
      return null
    }
  })

  const isAuthenticated = computed(() => !!token.value && !!jwtPayload.value)
  const role = computed(() => jwtPayload.value?.role ?? null)
  const username = computed(() => jwtPayload.value?.sub ?? '')
  const fio = computed(() => jwtPayload.value?.fio ?? '')
  const userId = computed(() => jwtPayload.value?.id ?? null)
  const blockId = computed(() => jwtPayload.value?.blockId ?? null)

  async function signIn(credentials: SignInRequest) {
    const data = await authApi.signIn(credentials)
    token.value = data.accessToken
    localStorage.setItem('token', data.accessToken)
  }

  function signOut() {
    token.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    isAuthenticated,
    role,
    username,
    fio,
    userId,
    blockId,
    signIn,
    signOut,
  }
})
