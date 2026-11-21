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

interface Category { id: number; nombre: string; descripcion: string | null; activo: boolean }
interface CategoryFormValues { nombre: string; descripcion: string }

function CategoryFormModal({ category, saving, onClose, onSave }: {
  category: Category | null; saving: boolean; onClose: () => void; onSave: (values: CategoryFormValues) => Promise<void>
}) {
  const [error, setError] = useState('')
  const form = useForm({
    defaultValues: { nombre: category?.nombre ?? '', descripcion: category?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      if (value.nombre.trim().length < 2 || value.nombre.trim().length > 100) { setError('El nombre debe tener entre 2 y 100 caracteres.'); return }
      try { await onSave({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || '' }) }
      catch (cause) { setError(handleApiError(cause)) }
    },
  })
  return <Modal title={category ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
    <form className="form-card" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="nombre">{(field) => <label>Nombre (2–100)<Input autoFocus minLength={2} maxLength={100} required value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
      <form.Field name="descripcion">{(field) => <label>Descripción<Input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
      {error && <p className="error" role="alert">{error}</p>}
      <Button disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  </Modal>
}

export function AdminCategoriasPage() {
  const client = useQueryClient()
  const [editing, setEditing] = useState<Category | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const categories = useQuery({ queryKey: ['categorias'], queryFn: async () => (await api.get<Category[]>('/categorias')).data })
  const save = useMutation({
    mutationFn: async ({ values, id }: { values: CategoryFormValues; id: number | null }) => id === null ? api.post('/categorias', values) : api.put(`/categorias/${id}`, values),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['categorias'] }); setModalOpen(false); setEditing(null) },
  })
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/categorias/${id}`), onSuccess: () => client.invalidateQueries({ queryKey: ['categorias'] }) })
  const columns = [
    createColumnHelper<Category>().accessor('id', { header: 'ID' }),
    createColumnHelper<Category>().accessor('nombre', { header: 'Nombre' }),
    createColumnHelper<Category>().accessor((row) => row.descripcion ?? '—', { id: 'descripcion', header: 'Descripción' }),
    createColumnHelper<Category>().accessor('activo', { header: 'Activo', cell: (cell) => cell.getValue() ? 'Sí' : 'No' }),
    createColumnHelper<Category>().display({ id: 'acciones', header: 'Acciones', cell: (cell) => <div className="row"><Button type="button" onClick={() => { setEditing(cell.row.original); setModalOpen(true) }}>Editar</Button><Button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`¿Dar de baja “${cell.row.original.nombre}”?`)) remove.mutate(cell.row.original.id) }}>Dar de baja</Button></div> }),
  ]
  const table = useReactTable({ data: categories.data ?? [], columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } })
  return <><header className="row"><h1>Categorías</h1><Button onClick={() => { setEditing(null); setModalOpen(true) }}>Nueva categoría</Button></header>
    {categories.isLoading && <Skeleton />}{categories.isError && <EstadoError texto={handleApiError(categories.error)} />}
    {categories.data?.length === 0 && <EstadoVacio texto="No hay categorías activas." />}
    {categories.data && categories.data.length > 0 && <><div className="table-wrap"><table><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div><div className="row"><Button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Anterior</Button><span>Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span><Button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Siguiente</Button></div></>}
    {remove.isError && <EstadoError texto={handleApiError(remove.error)} />}
    {modalOpen && <CategoryFormModal key={editing?.id ?? 'new'} category={editing} saving={save.isPending} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={async (values) => { await save.mutateAsync({ values, id: editing?.id ?? null }) }} />}
  </>
}
