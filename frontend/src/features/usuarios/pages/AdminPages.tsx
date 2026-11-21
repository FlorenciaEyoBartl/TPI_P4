import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { api } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { Skeleton } from '../../../shared/components/Skeleton'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useAuthStore } from '../../../store/authStore'
import { useUsuarios } from '../hooks/useUsuarios'

interface Summary { pendientes: number; en_preparacion: number; entregados: number; cancelados: number; pedidos_hoy: number; ingresos_entregados: number }
interface OrderRow { id: number; usuario_id: number; estado: string; total: number }
interface ApiPage<T> { total: number; items: T[] }

function TableView<T>({ rows, columns }: { rows: T[]; columns: ColumnDef<T, unknown>[] }) {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })
  return <div className="table-wrap"><table><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>
}

export function SummaryPage() {
  const query = useQuery({ queryKey: ['pedidos', 'resumen'], queryFn: async () => (await api.get<Summary>('/pedidos/resumen')).data })
  const labels: Array<[keyof Summary, string]> = [['pendientes', 'Pendientes'], ['en_preparacion', 'En preparación'], ['entregados', 'Entregados'], ['cancelados', 'Cancelados'], ['pedidos_hoy', 'Pedidos hoy'], ['ingresos_entregados', 'Ingresos entregados']]
  if (query.isLoading) return <Skeleton />
  if (query.isError) return <EstadoError texto={handleApiError(query.error)} />
  return <><h1>Resumen</h1><div className="grid">{labels.map(([key, label]) => <Card key={key}><p>{label}</p><h2>{key === 'ingresos_entregados' ? `$${(query.data?.[key] ?? 0).toLocaleString('es-AR')}` : query.data?.[key] ?? 0}</h2></Card>)}</div></>
}

export function UsersAdminPage() {
  const client = useQueryClient()
  const me = useAuthStore((state) => state.usuario)
  const query = useUsuarios()
  const stateMutation = useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) => api.post(`/admin/usuarios/${id}/${activate ? 'activar' : 'desactivar'}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['usuarios'] }),
  })
  const columns: ColumnDef<NonNullable<typeof query.data>[number], unknown>[] = [
    { accessorKey: 'username', header: 'Usuario' }, { accessorKey: 'full_name', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' }, { accessorKey: 'role', header: 'Rol' },
    { id: 'estado', header: 'Estado', cell: ({ row }) => <>{row.original.disabled ? 'Desactivado' : 'Activo'} {me?.id !== row.original.id && <Button disabled={stateMutation.isPending} onClick={() => stateMutation.mutate({ id: row.original.id, activate: row.original.disabled })}>{row.original.disabled ? 'Activar' : 'Desactivar'}</Button>}</> },
  ]
  if (query.isLoading) return <Skeleton />
  if (query.isError) return <EstadoError texto={handleApiError(query.error)} />
  return <><h1>Usuarios</h1>{stateMutation.isError && <EstadoError texto={handleApiError(stateMutation.error)} />}{query.data?.length === 0 ? <p>No hay usuarios.</p> : query.data && <TableView rows={query.data} columns={columns} />}</>
}

export function OrdersAdminPage() {
  const client = useQueryClient()
  const [estado, setEstado] = useState('')
  const query = useQuery({ queryKey: ['pedidos', 'admin', estado], queryFn: async () => (await api.get<ApiPage<OrderRow>>('/pedidos', { params: { limit: 100, estado: estado || undefined } })).data })
  const change = useMutation({ mutationFn: ({ id, nextState }: { id: number; nextState: string }) => api.patch(`/pedidos/${id}/estado`, { estado: nextState }), onSuccess: () => client.invalidateQueries({ queryKey: ['pedidos'] }) })
  const next: Record<string, string> = { PENDIENTE: 'EN_PREPARACION', EN_PREPARACION: 'ENTREGADO' }
  const columns: ColumnDef<OrderRow, unknown>[] = [
    { accessorKey: 'id', header: 'Pedido' }, { accessorKey: 'usuario_id', header: 'Cliente' },
    { accessorKey: 'estado', header: 'Estado', cell: ({ getValue }) => <BadgeEstado estado={String(getValue())} /> },
    { accessorKey: 'total', header: 'Total' },
    { id: 'acciones', header: 'Acciones', cell: ({ row }) => <>{next[row.original.estado] && <Button disabled={change.isPending} onClick={() => change.mutate({ id: row.original.id, nextState: next[row.original.estado] })}>Avanzar</Button>}{!['ENTREGADO', 'CANCELADO'].includes(row.original.estado) && <Button disabled={change.isPending} onClick={() => change.mutate({ id: row.original.id, nextState: 'CANCELADO' })}>Cancelar</Button>}</> },
  ]
  return <><h1>Pedidos</h1><select value={estado} onChange={(event) => setEstado(event.target.value)}><option value="">Todos</option>{['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO'].map((value) => <option key={value}>{value}</option>)}</select>{query.isLoading && <Skeleton />}{query.isError && <EstadoError texto={handleApiError(query.error)} />}{change.isError && <EstadoError texto={handleApiError(change.error)} />}{query.data && <TableView rows={query.data.items} columns={columns} />}</>
}
