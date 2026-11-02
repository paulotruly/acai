import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
      </CardHeader>
      <CardContent>
        {dados.length === 0 ? (
          <p className="text-muted-foreground text-sm">Não há dados disponíveis neste momento.</p>
        ) : (
          <ul className="flex flex-col gap-0.5" onMouseLeave={() => setDestaque(null)}>
            {dados.map((d) => (
              <li
                key={d.rotulo}
                className="hover:bg-muted/60 grid grid-cols-[minmax(0,8rem)_1fr_auto] md:grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3 rounded-md px-1 py-1"
                onMouseEnter={() => setDestaque(d.rotulo)}
                title={`${d.rotulo}: ${formatarNumero(d.valor)} ${unidade}`}
              >
                <span className="truncate text-sm">{d.rotulo}</span>
                <div className="h-3">
                  <div
                    className="h-full rounded-r-[4px] bg-(--serie-1) transition-opacity"
                    style={{
                      width: `${(d.valor / maximo) * 100}%`,
                      opacity: destaque !== null && destaque !== d.rotulo ? 0.35 : 1,
                    }}
                  />
                </div>
                <span className="text-muted-foreground text-right text-sm tabular-nums">{formatarNumero(d.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
