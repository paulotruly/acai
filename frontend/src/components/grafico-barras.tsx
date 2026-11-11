import { useState } from 'react'
import type { ItemContagem } from '@/lib/api'
import { formatarNumero } from '@/lib/formato'

interface Props {
  titulo: string
  descricao?: string
  dados: ItemContagem[]
  unidade: string
}

export function GraficoBarras({ titulo, descricao, dados, unidade }: Props) {
  const [destaque, setDestaque] = useState<string | null>(null)
  const maximo = Math.max(1, ...dados.map((d) => d.valor))

  return (
    <article className="bg-card border-border flex flex-col gap-4 rounded-2xl border p-5 shadow-[0_1px_2px_rgb(11_79_92/0.04)]">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">{titulo}</h3>
        {descricao && <p className="text-muted-foreground text-sm">{descricao}</p>}
      </header>
      {dados.length === 0 ? (
        <p className="text-muted-foreground text-sm">Não há dados disponíveis neste momento.</p>
      ) : (
        <ul className="flex flex-col gap-0.5" onMouseLeave={() => setDestaque(null)}>
          {dados.map((d) => (
            <li
              key={d.rotulo}
              className="hover:bg-muted/70 grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 md:grid-cols-[minmax(0,12rem)_1fr_auto]"
              onMouseEnter={() => setDestaque(d.rotulo)}
              title={`${d.rotulo}: ${formatarNumero(d.valor)} ${unidade}`}
            >
              <span className="truncate text-sm">{d.rotulo}</span>
              <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-(--serie-1) transition-opacity"
                  style={{
                    width: `${(d.valor / maximo) * 100}%`,
                    opacity: destaque !== null && destaque !== d.rotulo ? 0.35 : 1,
                  }}
                />
              </div>
              <span className="text-ecoa-marinho text-right text-sm font-medium tabular-nums">
                {formatarNumero(d.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function GraficoCarregando() {
  return (
    <div className="bg-card border-border flex flex-col gap-4 rounded-2xl border p-5" aria-hidden>
      <span className="bg-muted h-4 w-1/3 animate-pulse rounded-full" />
      {[90, 70, 80, 55, 40].map((largura) => (
        <div key={largura} className="grid grid-cols-[6rem_1fr] items-center gap-3">
          <span className="bg-muted h-3 animate-pulse rounded-full" />
          <span className="bg-muted h-2.5 animate-pulse rounded-full" style={{ width: `${largura}%` }} />
        </div>
      ))}
    </div>
  )
}
