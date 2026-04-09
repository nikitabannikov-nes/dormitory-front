import axios from 'axios'

/**
 * Вытаскивает читаемое сообщение из любого формата ошибки:
 * - ErrorDto бэка: { status, error }
 * - Axios network error
 * - Просто строка
 */
export function extractErrorMessage(err: unknown, fallback = 'Произошла ошибка'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data?.error) return data.error
    if (typeof data === 'string') return data
    if (err.response?.status === 403) return 'Недостаточно прав'
    if (err.response?.status === 404) return 'Не найдено'
    if (!err.response) return 'Нет соединения с сервером'
  }
  return fallback
}
