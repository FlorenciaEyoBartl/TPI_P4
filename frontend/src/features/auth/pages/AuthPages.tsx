import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from '@tanstack/react-form'
import { api } from '../../../shared/api/axiosInstance'
import { useAuthStore } from '../../../store/authStore'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { handleApiError } from '../../../shared/api/handleApiError'

export function LoginPage() { const [error, setError] = useState(''); const login = useAuthStore((s) => s.login); const navigate = useNavigate(); const form = useForm({ defaultValues: { username: '', password: '' }, onSubmit: async ({ value }) => { try { await login(value.username, value.password); navigate('/') } catch (e) { setError(handleApiError(e)) } } }); return <section className="form-card"><h1>Ingresar</h1><form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}><form.Field name="username">{(field) => <Input placeholder="Usuario" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />}</form.Field><form.Field name="password">{(field) => <Input type="password" placeholder="Contraseña" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />}</form.Field><Button>Ingresar</Button>{error && <p className="error">{error}</p>}</form><Link to="/register">Crear cuenta</Link></section> }

export function RegisterPage() { const [message, setMessage] = useState(''); const navigate = useNavigate(); const form = useForm({ defaultValues: { username: '', full_name: '', email: '', password: '' }, onSubmit: async ({ value }) => { try { await api.post('/auth/register', value); setMessage('Cuenta creada'); navigate('/login') } catch (e) { setMessage(handleApiError(e)) } } }); return <section className="form-card"><h1>Crear cuenta</h1><form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>{(['username', 'full_name', 'email', 'password'] as const).map((name) => <form.Field key={name} name={name}>{(field) => <Input type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'} placeholder={name} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required minLength={name === 'password' ? 8 : undefined} />}</form.Field>)}<Button>Registrarme</Button></form>{message && <p>{message}</p>}</section> }
