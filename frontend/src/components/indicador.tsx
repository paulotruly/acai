import type { LucideIcon } from 'lucide-react'

interface Props {
  icone: LucideIcon
  rotulo: string
  valor: string
}

export function Indicador({ icone: Icone, rotulo, valor }: Props) {
  return (
    <div className="bg-card border-border flex items-center gap-4 rounded-2xl border p-5 shadow-[0_1px_2px_rgb(11_79_92/0.04)]">
      <span className="bg-accent text-ecoa-coral flex size-12 shrink-0 items-center justify-center rounded-xl">
        <Icone className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm">{rotulo}</p>
        <p className="font-heading text-ecoa-marinho mt-0.5 text-2xl font-bold tabular-nums md:text-[1.75rem]">{valor}</p>
      </div>
    </div>
  )
}

export function IndicadorCarregando() {
  return (
    <div className="bg-card border-border flex items-center gap-4 rounded-2xl border p-5" aria-hidden>
      <span className="bg-muted size-12 shrink-0 animate-pulse rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <span className="bg-muted h-3 w-2/3 animate-pulse rounded-full" />
        <span className="bg-muted h-6 w-1/2 animate-pulse rounded-full" />
      </div>
    </div>
  )
}
