import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface ReportRequestDto {
  month: number
  chairmanFio: string
  performedWork: string[]
}

export const reportsApi = {
  generateMonthly: async (data: ReportRequestDto): Promise<void> => {
    const response = await api.post('/reports/monthly', data, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `report_${new Date().getFullYear()}_${String(data.month).padStart(2, '0')}.docx`
    link.click()
    URL.revokeObjectURL(url)
  },
}
