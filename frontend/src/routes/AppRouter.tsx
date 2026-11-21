import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../shared/layout/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage, RegisterPage } from '../features/auth/pages/AuthPages'
import { CatalogPage } from '../features/productos/pages/CatalogPage'
import { CartPage, CheckoutPage, MyOrdersPage } from '../features/pedidos/pages/OrderPages'
import { AdminUsuariosPage } from '../features/usuarios/pages/AdminUsuariosPage'
import { OrdersAdminPage, SummaryPage } from '../features/usuarios/pages/AdminPages'
import { AdminCategoriasPage } from '../features/categorias/pages/AdminCategoriasPage'
import { AdminProductosPage } from '../features/productos/pages/AdminProductosPage'

export function AppRouter() { return <BrowserRouter><MainLayout><Routes><Route path="/" element={<CatalogPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/carrito" element={<CartPage />} /><Route path="/unauthorized" element={<h1>Acceso no autorizado</h1>} /><Route element={<ProtectedRoute />}><Route path="/checkout" element={<CheckoutPage />} /><Route path="/mis-pedidos" element={<MyOrdersPage />} /></Route><Route element={<ProtectedRoute role="admin" />}><Route path="/admin/resumen" element={<SummaryPage />} /><Route path="/admin/categorias" element={<AdminCategoriasPage />} /><Route path="/admin/productos" element={<AdminProductosPage />} /><Route path="/admin/pedidos" element={<OrdersAdminPage />} /><Route path="/admin/usuarios" element={<AdminUsuariosPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></MainLayout></BrowserRouter> }
