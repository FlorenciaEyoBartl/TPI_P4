import { api } from '../../../shared/api/axiosInstance'
import type { UserPublic } from '../types'

export async function getUsuarios(): Promise<UserPublic[]> {
  return (await api.get<UserPublic[]>('/admin/usuarios')).data
}
