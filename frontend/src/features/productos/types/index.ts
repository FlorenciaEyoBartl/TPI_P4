export interface Category { id: number; nombre: string; descripcion: string | null; activo: boolean }
export interface Product { id: number; categoria_id: number; nombre: string; descripcion: string | null; precio_base: number; imagen_url: string | null; stock: number; disponible: boolean; activo: boolean; categoria: Category }
export interface ProductsPage { total: number; items: Product[] }
