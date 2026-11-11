import type { ReactNode } from 'react'
import { LinhasOndas, ManchaAquarela } from '@/components/marca/ondas'

interface Props {
  titulo: string
  children: ReactNode
}

/** Faixa de abertura das páginas internas, com o título e uma breve apresentação. */
export function CabecalhoPagina({ titulo, children }: Props) {
  return (
    <section className="border-ecoa-marinho/10 relative overflow-hidden border-b">
      <ManchaAquarela className="absolute -top-24 -right-16 w-[28rem] opacity-80" />
      <LinhasOndas className="text-ecoa-agua/35 absolute -right-10 -bottom-10 hidden w-[32rem] md:block" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 py-12 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{titulo}</h1>
        <div className="text-muted-foreground max-w-3xl text-lg text-pretty">{children}</div>
      </div>
    </section>
  )
}
