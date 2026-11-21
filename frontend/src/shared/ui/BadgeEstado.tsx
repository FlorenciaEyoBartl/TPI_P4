export function BadgeEstado({ estado }: { estado: string }) { return <span className="badge">{estado.replace('_', ' ')}</span> }
