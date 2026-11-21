import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../shared/api/axiosInstance'

export interface User { id: number; username: string; full_name: string; email: string; role: 'user' | 'admin'; disabled: boolean }
interface AuthState { usuario: User | null; cargando: boolean; checkSession: () => Promise<void>; login: (username: string, password: string) => Promise<void>; logout: () => Promise<void>; clear: () => void }
export const useAuthStore = create<AuthState>()(persist((set) => ({
  usuario: null, cargando: true,
  checkSession: async () => { try { const { data } = await api.get<User>('/auth/me'); set({ usuario: data }) } catch { set({ usuario: null }) } finally { set({ cargando: false }) } },
  login: async (username, password) => { const form = new URLSearchParams({ username, password }); await api.post('/auth/token', form); await useAuthStore.getState().checkSession() },
  logout: async () => { try { await api.post('/auth/logout') } finally { set({ usuario: null }) } },
  clear: () => set({ usuario: null }),
}), { name: 'food-store-auth', partialize: (state) => ({ usuario: state.usuario }) }))
