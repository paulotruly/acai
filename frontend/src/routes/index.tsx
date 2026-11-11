import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Car,
  ChartNoAxesColumn,
  Info,
  Layers,
  MapPin,
  Newspaper,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { GraficoBarras, GraficoCarregando } from '@/components/grafico-barras'
import { Indicador, IndicadorCarregando } from '@/components/indicador'
import { LinhasOndas, ManchaAquarela } from '@/components/marca/ondas'
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
  const carregando = !indicadores && !erro

  return (
    <main>
      <Abertura />

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-14">
        {erro && (
          <p role="alert" className="border-destructive/30 bg-destructive/5 text-destructive rounded-2xl border p-4">
            Não foi possível carregar os dados neste momento. Por favor, tente novamente mais tarde.
          </p>
        )}

        {carregando && (
          <div className="flex flex-col gap-6" aria-busy="true">
            <p className="sr-only">Carregando os dados…</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <IndicadorCarregando />
              <IndicadorCarregando />
              <IndicadorCarregando />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <GraficoCarregando />
              <GraficoCarregando />
            </div>
          </div>
        )}

        {dc && noticias && (
          <>
            <Secao
              id="titulo-atendimentos"
              icone={ShieldAlert}
              titulo="Atendimentos da Defesa Civil do Recife"
              descricao={`Registros oficiais de ${anoDe(dc.periodo.inicio)} a ${anoDe(dc.periodo.fim)}. Esses dados medem o trabalho e a demanda atendida, incluindo monitoramento preventivo, e não o número de desastres.`}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Indicador icone={Users} rotulo="Registros de atendimento" valor={formatarNumero(dc.total)} />
                <Indicador icone={MapPin} rotulo="Bairros com registros" valor={formatarNumero(dc.bairros)} />
                <Indicador
                  icone={CalendarDays}
                  rotulo="Período coberto"
                  valor={`${anoDe(dc.periodo.inicio)} a ${anoDe(dc.periodo.fim)}`}
                />
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
            </Secao>

            <Secao
              id="titulo-noticias"
              icone={Newspaper}
              titulo="Cobertura da imprensa"
              descricao="Notícias do Recife e da região metropolitana. A contagem mede a atenção da imprensa e não deve ser somada aos atendimentos. A coleta prossegue diariamente, de modo que os números ainda são parciais."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Indicador icone={Newspaper} rotulo="Notícias analisadas" valor={formatarNumero(noticias.total)} />
                <Indicador icone={Car} rotulo="Veículos" valor={formatarNumero(noticias.fontes)} />
                <Indicador icone={Building2} rotulo="Municípios citados" valor={formatarNumero(noticias.municipios)} />
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
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <h3 className="text-lg font-semibold">Notícias mais recentes</h3>
                    <Link
                      to="/noticias"
                      className="text-ecoa-petroleo inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                    >
                      Ver todas as notícias
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                  <ul className="grid gap-4 md:grid-cols-3">
                    {recentes.map((n) => (
                      <li key={n.id}>
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group bg-card border-border hover:border-ecoa-petroleo/40 flex h-full flex-col gap-3 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgb(11_79_92/0.25)]"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="bg-muted text-ecoa-marinho truncate rounded-full px-2.5 py-0.5 text-xs font-medium">
                              {n.fonte}
                            </span>
                            <ArrowUpRight
                              className="text-ecoa-petroleo size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                              aria-hidden
                            />
                          </span>
                          <span className="font-heading text-ecoa-marinho font-semibold [overflow-wrap:anywhere] group-hover:underline">
                            {n.titulo ?? 'Notícia sem título'}
                          </span>
                          <span className="text-muted-foreground mt-auto text-xs">
                            Publicada em {formatarData(n.dataPublicacao)}
                          </span>
                          <span className="sr-only"> (abre em nova aba)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Secao>
          </>
        )}

        <aside className="border-ecoa-coral bg-accent text-ecoa-marinho flex gap-3 rounded-2xl border-l-4 p-5 text-sm leading-relaxed">
          <Info className="text-ecoa-coral mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            Em situação de risco ou emergência, procure diretamente a Defesa Civil do seu município. Este site é um
            projeto de pesquisa, não um serviço de alerta, e não apresenta dados em tempo real.
          </p>
        </aside>
      </div>
    </main>
  )
}

function Abertura() {
  return (
    <section className="border-ecoa-marinho/10 relative overflow-hidden border-b">
      <ManchaAquarela className="absolute -top-20 -right-24 w-[36rem] opacity-90" />
      <ManchaAquarela cor="var(--ecoa-agua)" className="absolute -bottom-32 right-1/4 hidden w-[30rem] md:block" />
      <LinhasOndas className="text-ecoa-agua/40 absolute top-1/2 -right-16 hidden w-[42rem] -translate-y-1/2 md:block" />
      <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-24">
        <div className="flex max-w-2xl flex-col gap-6">
          <p className="text-ecoa-coral-escuro font-heading text-sm font-semibold tracking-wide">
            Recife e região metropolitana
          </p>
          <h1 className="text-[2.1rem] leading-[1.1] font-bold tracking-tight text-balance md:text-5xl">
            Dados abertos sobre chuvas, encostas e desastres no Recife
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed text-pretty">
            Reunimos os registros públicos da Defesa Civil e a cobertura da imprensa sobre o Recife e a região
            metropolitana, para que moradores, jornalistas e pesquisadores possam consultar a mesma base.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/noticias" className={buttonVariants({ size: 'lg' })}>
              <ChartNoAxesColumn aria-hidden />
              Explorar as notícias
              <ArrowRight aria-hidden />
            </Link>
            <Link to="/metodologia" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              <Layers aria-hidden />
              Conhecer a metodologia
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

interface PropsSecao {
  id: string
  icone: LucideIcon
  titulo: string
  descricao: string
  children: ReactNode
}

function Secao({ id, icone: Icone, titulo, descricao, children }: PropsSecao) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <div className="flex gap-4">
        <span className="bg-accent text-ecoa-coral flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Icone className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id={id} className="text-2xl font-bold tracking-tight">
            {titulo}
          </h2>
          <p className="text-muted-foreground max-w-3xl">{descricao}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
