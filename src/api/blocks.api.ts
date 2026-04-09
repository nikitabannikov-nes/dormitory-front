import api from './axios'

export interface BlockDto {
  id: number
  number: number
  floor: number
}

export interface BlockCreateDto {
  number: number
  floor: number
}

export const blocksApi = {
  getAll: () => api.get<BlockDto[]>('/blocks').then((r) => r.data),

  getById: (id: number) => api.get<BlockDto>(`/blocks/${id}`).then((r) => r.data),

  create: (data: BlockCreateDto) => api.post<BlockDto>('/blocks', data).then((r) => r.data),

  delete: (id: number) => api.delete(`/blocks/${id}`),
}
