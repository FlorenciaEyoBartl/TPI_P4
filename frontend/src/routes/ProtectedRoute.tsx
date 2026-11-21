import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
export function ProtectedRoute({ role }: { role?: 'admin' | 'user' }) { const { usuario, cargando } = useAuthStore(); if (cargando) return <p>Cargando sesión…</p>; if (!usuario) return <Navigate to="/login" replace />; if (role && usuario.role !== role) return <Navigate to="/unauthorized" replace />; return <Outlet /> }
