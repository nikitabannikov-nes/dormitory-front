import api from './axios'

export type Role = 'USER' | 'INSPECTOR' | 'ADMIN'

export interface UserDto {
  id: number
  username: string
  fio: string
  role: Role
  blockId: number | null
}

export const usersApi = {
  getMe: () => api.get<UserDto>('/users/me').then((r) => r.data),

  getAll: () => api.get<UserDto[]>('/users').then((r) => r.data),

  getById: (id: number) => api.get<UserDto>(`/users/${id}`).then((r) => r.data),

  delete: (id: number) => api.delete(`/users/${id}`),

  getFloors: (id: number) => api.get<number[]>(`/users/${id}/floors`).then((r) => r.data),

  assignFloors: (id: number, floors: number[]) =>
    api.post(`/users/${id}/floors`, { floorNumbers: floors }),
}
