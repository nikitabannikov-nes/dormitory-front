import api from './axios'

export interface InspectionDto {
  id: number
  inspectorId: number
  inspectorFio: string
  blockId: number
  blockNumber: number
  date: string
  createdAt: string
  shower: number | null
  toilet: number | null
  hall: number | null
  kitchen: number | null
  roomA: number | null
  roomB: number | null
  comment: string | null
}

export interface InspectionCreateDto {
  blockId: number
  date: string
  shower: number | null
  toilet: number | null
  hall: number | null
  kitchen: number | null
  roomA: number | null
  roomB: number | null
  comment: string | null
}

export const inspectionsApi = {
  getAll: () => api.get<InspectionDto[]>('/inspections').then((r) => r.data),

  getMy: () => api.get<InspectionDto[]>('/inspections/my').then((r) => r.data),

  getByBlock: (blockId: number) =>
    api.get<InspectionDto[]>(`/inspections/block/${blockId}`).then((r) => r.data),

  create: (data: InspectionCreateDto) =>
    api.post<InspectionDto>('/inspections', data).then((r) => r.data),

  delete: (id: number) => api.delete(`/inspections/${id}`),
}
