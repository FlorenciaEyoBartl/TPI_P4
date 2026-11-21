import type { PropsWithChildren } from 'react'
import { Button } from './Button'

interface ModalProps extends PropsWithChildren { title: string; onClose: () => void }
export function Modal({ title, onClose, children }: ModalProps) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <header className="row"><h2>{title}</h2><Button type="button" onClick={onClose}>Cerrar</Button></header>
      {children}
    </section>
  </div>
}
