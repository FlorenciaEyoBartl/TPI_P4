import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../shared/api/axiosInstance'
import type { Order } from '../types'

export interface CreateOrderInput {
  items: Array<{ producto_id: number; cantidad: number }>
  forma_pago: 'EFECTIVO' | 'TRANSFERENCIA'
  direccion_entrega: string
  notas: string
}

export function useCrearPedido() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateOrderInput) => (await api.post<Order>('/pedidos', payload)).data,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['pedidos'] }),
        client.invalidateQueries({ queryKey: ['pedidos', 'resumen'] }),
        client.invalidateQueries({ queryKey: ['productos'] }),
      ])
    },
  })
}
