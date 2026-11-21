export interface OrderLine { producto_id: number; nombre_producto: string; precio_unitario: number; cantidad: number; subtotal: number }
export interface Order { id: number; usuario_id: number; estado: string; forma_pago: string; direccion_entrega: string; notas: string | null; total: number; created_at: string; updated_at: string; items: OrderLine[] }
export interface OrdersPage { total: number; items: Order[] }
