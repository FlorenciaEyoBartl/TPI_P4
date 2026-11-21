import axios from 'axios'

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string }>(error)) return error.response?.data.detail ?? error.message
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado'
}
