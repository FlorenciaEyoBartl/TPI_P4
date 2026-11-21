import type { PropsWithChildren } from 'react'
import { Navbar } from './Navbar'
export function MainLayout({ children }: PropsWithChildren) { return <><Navbar /><main className="container">{children}</main></> }
