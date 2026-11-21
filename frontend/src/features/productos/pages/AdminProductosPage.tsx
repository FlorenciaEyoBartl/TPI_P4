import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { api } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Skeleton } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'

interface Category { id: number; nombre: string; activo: boolean }
interface Product { id: number; categoria_id: number; nombre: string; descripcion: string | null; precio_base: number; imagen_url: string | null; stock: number; disponible: boolean; activo: boolean; categoria: Category }
interface ProductPage { total: number; items: Product[] }
interface ProductValues { categoria_id: number; nombre: string; descripcion: string; precio_base: number; imagen_url: string; stock: number; disponible: boolean }

function ProductFormModal({ product, categories, saving, onClose, onSave }: {
  product: Product | null; categories: Category[]; saving: boolean; onClose: () => void; onSave: (values: ProductValues) => Promise<void>
}) {
  const [error, setError] = useState('')
  const form = useForm({
    defaultValues: { categoria_id: product?.categoria_id ?? categories[0]?.id ?? 0, nombre: product?.nombre ?? '', descripcion: product?.descripcion ?? '', precio_base: product?.precio_base ?? 0, imagen_url: product?.imagen_url ?? '', stock: product?.stock ?? 0, disponible: product?.disponible ?? true },
    onSubmit: async ({ value }) => {
      if (!value.nombre.trim() || value.precio_base < 0 || value.stock < 0 || value.categoria_id < 1) { setError('Completá los campos requeridos con valores válidos.'); return }
      try { await onSave({ ...value, nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || '', imagen_url: value.imagen_url.trim() || '' }) }
      catch (cause) { setError(handleApiError(cause)) }
    },
  })
  return <Modal title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
    <form className="form-card" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="nombre">{(field) => <label>Nombre<Input autoFocus required minLength={2} maxLength={120} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
      <form.Field name="categoria_id">{(field) => <label>Categoría<select required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))}><option value={0}>Elegir categoría</option>{categories.filter((category) => category.activo).map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label>}</form.Field>
      <form.Field name="descripcion">{(field) => <label>Descripción<Input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
      <form.Field name="precio_base">{(field) => <label>Precio base<Input type="number" min={0} step="0.01" required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} /></label>}</form.Field>
      <form.Field name="imagen_url">{(field) => <label>URL de imagen<Input type="url" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
      <form.Field name="stock">{(field) => <label>Stock inicial<Input type="number" min={0} step={1} required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} /></label>}</form.Field>
      <form.Field name="disponible">{(field) => <label><input type="checkbox" checked={field.state.value} onChange={(event) => field.handleChange(event.target.checked)} /> Disponible</label>}</form.Field>
      {error && <p className="error" role="alert">{error}</p>}
      <Button disabled={saving || categories.length === 0}>{saving ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  </Modal>
}

export function AdminProductosPage() {
  const client = useQueryClient()
  const [editing, setEditing] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [stockDrafts, setStockDrafts] = useState<Record<number, number>>({})
  const products = useQuery({ queryKey: ['productos', 'admin'], queryFn: async () => (await api.get<ProductPage>('/productos', { params: { limit: 100 } })).data })
  const categories = useQuery({ queryKey: ['categorias'], queryFn: async () => (await api.get<Category[]>('/categorias')).data })
  const invalidate = async (id?: number) => { await client.invalidateQueries({ queryKey: ['productos'] }); if (id !== undefined) await client.invalidateQueries({ queryKey: ['productos', id] }) }
  const save = useMutation({
    mutationFn: async ({ values, id }: { values: ProductValues; id: number | null }) => id === null ? api.post('/productos', values) : api.put(`/productos/${id}`, values),
    onSuccess: async (_result, variables) => { await invalidate(variables.id ?? undefined); setModalOpen(false); setEditing(null) },
  })
  const changeStock = useMutation({
    mutationFn: ({ product, stock, disponible }: { product: Product; stock: number; disponible: boolean }) => api.patch(`/productos/${product.id}/stock`, { stock, disponible }),
    onSuccess: (_result, variables) => invalidate(variables.product.id),
  })
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/productos/${id}`), onSuccess: (_result, id) => invalidate(id) })
  const helper = createColumnHelper<Product>()
  const columns = [
    helper.accessor('id', { header: 'ID' }), helper.accessor('nombre', { header: 'Nombre' }),
    helper.accessor((product) => product.categoria.nombre, { id: 'categoria', header: 'Categoría' }),
    helper.accessor('precio_base', { header: 'Precio' }),
    helper.display({ id: 'stock', header: 'Stock', cell: (cell) => { const product = cell.row.original; return <div className="row"><Input aria-label={`Stock de ${product.nombre}`} type="number" min={0} step={1} value={stockDrafts[product.id] ?? product.stock} onChange={(event) => setStockDrafts((current) => ({ ...current, [product.id]: Number(event.target.value) }))} /><Button type="button" disabled={changeStock.isPending || (stockDrafts[product.id] ?? product.stock) < 0} onClick={() => changeStock.mutate({ product, stock: stockDrafts[product.id] ?? product.stock, disponible: product.disponible })}>Guardar stock</Button></div> } }),
    helper.accessor('disponible', { header: 'Disponible', cell: (cell) => <Button type="button" disabled={changeStock.isPending} onClick={() => changeStock.mutate({ product: cell.row.original, stock: stockDrafts[cell.row.original.id] ?? cell.row.original.stock, disponible: !cell.row.original.disponible })}>{cell.getValue() ? 'Sí · desactivar' : 'No · activar'}</Button> }),
    helper.accessor('activo', { header: 'Activo', cell: (cell) => cell.getValue() ? 'Sí' : 'No' }),
    helper.display({ id: 'acciones', header: 'Acciones', cell: (cell) => <div className="row"><Button type="button" onClick={() => { setEditing(cell.row.original); setModalOpen(true) }}>Editar</Button><Button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`¿Dar de baja “${cell.row.original.nombre}”?`)) remove.mutate(cell.row.original.id) }}>Dar de baja</Button></div> }),
  ]
  const table = useReactTable({ data: products.data?.items ?? [], columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } })
  return <><header className="row"><h1>Productos</h1><Button onClick={() => { setEditing(null); setModalOpen(true) }}>Nuevo producto</Button></header>
    {products.isLoading && <Skeleton />}{products.isError && <EstadoError texto={handleApiError(products.error)} />}{categories.isError && <EstadoError texto={handleApiError(categories.error)} />}
    {products.data?.items.length === 0 && <EstadoVacio texto="No hay productos activos." />}
    {products.data && products.data.items.length > 0 && <><div className="table-wrap"><table><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div><div className="row"><Button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Anterior</Button><span>Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span><Button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Siguiente</Button></div></>}
    {(save.isError || changeStock.isError || remove.isError) && <EstadoError texto={handleApiError(save.error ?? changeStock.error ?? remove.error)} />}
    {modalOpen && categories.data && <ProductFormModal key={editing?.id ?? 'new'} product={editing} categories={categories.data} saving={save.isPending} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={async (values) => { await save.mutateAsync({ values, id: editing?.id ?? null }) }} />}
  </>
}
