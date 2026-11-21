import axios from 'axios'
import { api } from './axiosInstance'
import { useAuthStore } from '../../store/authStore'

api.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    const url = error.config?.url ?? ''
    if ((error.response?.status === 401 && !url.includes('/auth/token') && !url.includes('/auth/me')) ||
      (error.response?.status === 400 && error.response.data.detail === 'Cuenta de usuario desactivada')) useAuthStore.getState().clear()
  }
  return Promise.reject(error)
})
