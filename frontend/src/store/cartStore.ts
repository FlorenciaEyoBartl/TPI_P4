import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '../features/productos/types'

export interface CartItem { producto: Product; cantidad: number }
interface CartState { items: CartItem[]; agregar: (producto: Product) => void; quitar: (productoId: number) => void; cambiarCantidad: (productoId: number, cantidad: number) => void; vaciar: () => void; total: () => number }
export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [], agregar: (producto) => set((state) => { const found = state.items.find((x) => x.producto.id === producto.id); return { items: found ? state.items.map((x) => x.producto.id === producto.id ? { ...x, cantidad: Math.min(x.cantidad + 1, producto.stock) } : x) : [...state.items, { producto, cantidad: 1 }] } }),
  quitar: (id) => set((state) => ({ items: state.items.filter((x) => x.producto.id !== id) })),
  cambiarCantidad: (id, cantidad) => set((state) => ({ items: state.items.map((x) => x.producto.id === id ? { ...x, cantidad: Math.max(1, Math.min(cantidad, x.producto.stock)) } : x) })),
  vaciar: () => set({ items: [] }), total: () => get().items.reduce((sum, x) => sum + x.producto.precio_base * x.cantidad, 0),
}), { name: 'food-store-cart' }))
