import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Info } from 'lucide-react'
import { GraficoBarras } from '@/components/grafico-barras'
import { buttonVariants } from '@/components/ui/button'
import { obterIndicadores, listarNoticias, type Indicadores, type Noticia } from '@/lib/api'
import { anoDe, formatarData, formatarNumero, nomeTipoEvento } from '@/lib/formato'

export const Route = createFileRoute('/')({
  component: PaginaInicial,
})

function PaginaInicial() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null)
  const [recentes, setRecentes] = useState<Noticia[]>([])
  const [erro, setErro] = useState(false)

  useEffect(() => {
    obterIndicadores().then(setIndicadores).catch(() => setErro(true))
    listarNoticias({}).then((pagina) => setRecentes(pagina.itens.slice(0, 3))).catch(() => setErro(true))
  }, [])

  const dc = indicadores?.defesaCivil
  const noticias = indicadores?.noticias

  return (
    <main>
      <section className="border-b bg-(--fundo-marca)">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-14 md:py-20">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            Dados abertos sobre chuvas, encostas e desastres no Recife
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
            Reunimos os registros públicos da Defesa Civil e a cobertura da imprensa sobre o Recife e a região
            metropolitana, para que moradores, jornalistas e pesquisadores possam consultar a mesma base.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/noticias" className={buttonVariants({ size: 'lg' })}>
              Explorar as notícias
              <ArrowRight aria-hidden />
            </Link>
            <Link to="/metodologia" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Conhecer a metodologia
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
        {erro && (
          <p role="alert" className="text-destructive">
            Não foi possível carregar os dados neste momento. Por favor, tente novamente mais tarde.
          </p>
        )}
        {!indicadores && !erro && <p className="text-muted-foreground">Carregando os dados…</p>}

        {dc && noticias && (
          <>
            <section aria-labelledby="titulo-atendimentos" className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 id="titulo-atendimentos" className="text-2xl font-semibold">
                  Atendimentos da Defesa Civil do Recife
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                  Registros oficiais de {anoDe(dc.periodo.inicio)} a {anoDe(dc.periodo.fim)}. Esses dados medem o trabalho
                  e a demanda atendida, incluindo monitoramento preventivo, e não o número de desastres.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Numero rotulo="Registros de atendimento" valor={formatarNumero(dc.total)} />
                <Numero rotulo="Bairros com registros" valor={formatarNumero(dc.bairros)} />
                <Numero rotulo="Período coberto" valor={`${anoDe(dc.periodo.inicio)} a ${anoDe(dc.periodo.fim)}`} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <GraficoBarras titulo="Registros por ano" dados={dc.porAno} unidade="registros" />
                <GraficoBarras titulo="Registros por categoria" dados={dc.porCategoria} unidade="registros" />
                <GraficoBarras
                  titulo="Bairros com mais registros"
                  descricao="Inclui todas as categorias de atendimento."
                  dados={dc.porBairro}
                  unidade="registros"
                />
                <GraficoBarras
                  titulo="Bairros com mais ocorrências"
                  descricao="Somente registros de alagamento, deslizamento de barreira e incêndio."
                  dados={dc.ocorrenciasPorBairro}
                  unidade="registros"
                />
              </div>
            </section>

            <section aria-labelledby="titulo-noticias" className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 id="titulo-noticias" className="text-2xl font-semibold">
                  Cobertura da imprensa
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                  Notícias do Recife e da região metropolitana. A contagem mede a atenção da imprensa e não deve ser somada
                  aos atendimentos. A coleta prossegue diariamente, de modo que os números ainda são parciais.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Numero rotulo="Notícias analisadas" valor={formatarNumero(noticias.total)} />
                <Numero rotulo="Veículos" valor={formatarNumero(noticias.fontes)} />
                <Numero rotulo="Municípios citados" valor={formatarNumero(noticias.municipios)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <GraficoBarras
                  titulo="Notícias por tipo de evento"
                  dados={noticias.porTipo.map((i) => ({ ...i, rotulo: nomeTipoEvento(i.rotulo) }))}
                  unidade="notícias"
                />
                <GraficoBarras titulo="Municípios mais citados" dados={noticias.porMunicipio.slice(0, 8)} unidade="notícias" />
              </div>

              {recentes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold">Notícias mais recentes</h3>
                  <ul className="grid gap-3 md:grid-cols-3">
                    {recentes.map((n) => (
                      <li key={n.id} className="rounded-xl border p-4">
                        <p className="text-muted-foreground text-xs">
                          {n.fonte} · {formatarData(n.dataPublicacao)}
                        </p>
                        <a href={n.url} target="_blank" rel="noreferrer" className="mt-1 block font-medium hover:underline">
                          {n.titulo ?? 'Notícia sem título'}
                          <span className="sr-only"> (abre em nova aba)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <aside className="bg-muted flex gap-3 rounded-xl p-4 text-sm">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                Em situação de risco ou emergência, procure diretamente a Defesa Civil do seu município. Este site é um
                projeto de pesquisa, não um serviço de alerta, e não apresenta dados em tempo real.
              </p>
            </aside>
          </>
        )}
      </div>
    </main>
  )
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-muted-foreground text-sm">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums md:text-3xl">{valor}</p>
    </div>
  )
}
