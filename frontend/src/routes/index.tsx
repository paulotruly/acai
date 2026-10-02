import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ExternalLink, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { listarNoticias, listarTiposEvento, type Noticia, type TipoEvento } from '@/lib/api'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

const NOMES_TIPO_EVENTO: Record<string, string> = {
  enchente: 'Enchente',
  alagamento: 'Alagamento',
  deslizamento: 'Deslizamento',
  falta_de_agua: 'Falta de água',
  incendio: 'Incêndio',
  outro: 'Outro',
}

const NOMES_SENTIMENTO: Record<string, string> = {
  POSITIVO: 'Positivo',
  NEGATIVO: 'Negativo',
  NEUTRO: 'Neutro',
  MISTO: 'Misto',
}

const formatarData = (data: string | null) =>
  data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'

function contar(valores: string[]): { rotulo: string; valor: number }[] {
  const contagem = new Map<string, number>()
  for (const valor of valores) contagem.set(valor, (contagem.get(valor) ?? 0) + 1)
  return [...contagem.entries()]
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo))
}

function separarBairros(bairro: string | null): string[] {
  if (!bairro) return []
  return bairro
    .split(/,| e /)
    .map((b) => b.trim())
    // descarta trechos que não são nome de bairro, ex.: "134 bairros no total"
    .filter((b) => b.length > 0 && b.length < 40 && !/\d/.test(b))
}

function DashboardPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<number | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    Promise.all([listarNoticias(), listarTiposEvento()])
      .then(([noticias, tipos]) => {
        setNoticias(noticias)
        setTiposEvento(tipos)
      })
      .catch(() => setErro('Não foi possível carregar os dados. O backend está rodando em localhost:3000?'))
      .finally(() => setCarregando(false))
  }, [])

  const nomeTipo = (id: number | null) => {
    const nome = tiposEvento.find((t) => t.id === id)?.nome
    return nome ? (NOMES_TIPO_EVENTO[nome] ?? nome) : 'Sem tipo'
  }

  const resumo = useMemo(() => {
    const datas = noticias
      .map((n) => n.data)
      .filter((d): d is string => d !== null)
      .sort()
    return {
      total: noticias.length,
      fontes: new Set(noticias.map((n) => n.fonte)).size,
      bairros: new Set(noticias.flatMap((n) => separarBairros(n.bairro))).size,
      periodo: datas.length ? `${formatarData(datas[0])} – ${formatarData(datas[datas.length - 1])}` : '—',
    }
  }, [noticias])

  const porTipo = useMemo(
    () => contar(noticias.map((n) => nomeTipo(n.tipoEventoId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noticias, tiposEvento],
  )
  const porBairro = useMemo(
    () => contar(noticias.flatMap((n) => separarBairros(n.bairro))).slice(0, 8),
    [noticias],
  )

  const noticiasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return noticias.filter((n) => {
      if (filtroTipo !== null && n.tipoEventoId !== filtroTipo) return false
      if (!termo) return true
      return [n.titulo, n.fonte, n.bairro, n.localizacaoTexto, n.textoCompleto]
        .some((campo) => campo?.toLowerCase().includes(termo))
    })
  }, [noticias, filtroTipo, busca])

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Eventos de desastre no Recife</h1>
        <p className="text-muted-foreground text-sm">
          Notícias reais coletadas pela busca do Google via Gemini, com os fatos extraídos de cada página.
        </p>
      </header>

      {carregando && <p className="text-muted-foreground">Carregando…</p>}
      {erro && <p className="text-destructive">{erro}</p>}

      {!carregando && !erro && (
        <>
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Indicador rotulo="Notícias" valor={String(resumo.total)} />
            <Indicador rotulo="Fontes distintas" valor={String(resumo.fontes)} />
            <Indicador rotulo="Bairros citados" valor={String(resumo.bairros)} />
            <Indicador rotulo="Período das notícias" valor={resumo.periodo} pequeno />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <GraficoBarras titulo="Notícias por tipo de evento" dados={porTipo} unidade="notícia" />
            <GraficoBarras titulo="Bairros mais citados" dados={porBairro} unidade="notícia" />
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold">
                Notícias <span className="text-muted-foreground font-normal">({noticiasFiltradas.length})</span>
              </h2>
              <div className="relative md:w-72">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por título, bairro, fonte…"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={filtroTipo === null ? 'default' : 'outline'} onClick={() => setFiltroTipo(null)}>
                Todos
              </Button>
              {tiposEvento
                .filter((t) => noticias.some((n) => n.tipoEventoId === t.id))
                .map((t) => (
                  <Button
                    key={t.id}
                    size="sm"
                    variant={filtroTipo === t.id ? 'default' : 'outline'}
                    onClick={() => setFiltroTipo(t.id)}
                  >
                    {NOMES_TIPO_EVENTO[t.nome] ?? t.nome}
                  </Button>
                ))}
            </div>

            {noticiasFiltradas.length === 0 && (
              <p className="text-muted-foreground text-sm">Nenhuma notícia encontrada com esses filtros.</p>
            )}

            <div className="flex flex-col gap-3">
              {noticiasFiltradas.map((n) => (
                <CartaoNoticia key={n.id} noticia={n} tipo={nomeTipo(n.tipoEventoId)} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function Indicador({ rotulo, valor, pequeno = false }: { rotulo: string; valor: string; pequeno?: boolean }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{rotulo}</CardDescription>
        <div className={pequeno ? 'text-base font-medium' : 'text-3xl font-semibold tabular-nums'}>{valor}</div>
      </CardHeader>
    </Card>
  )
}

function GraficoBarras({
  titulo,
  dados,
  unidade,
}: {
  titulo: string
  dados: { rotulo: string; valor: number }[]
  unidade: string
}) {
  const [destaque, setDestaque] = useState<string | null>(null)
  const maximo = Math.max(1, ...dados.map((d) => d.valor))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {dados.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem dados.</p>
        ) : (
          <ul className="flex flex-col gap-1" onMouseLeave={() => setDestaque(null)}>
            {dados.map((d) => {
              const apagado = destaque !== null && destaque !== d.rotulo
              return (
                <li
                  key={d.rotulo}
                  className="hover:bg-muted/60 grid grid-cols-[8rem_1fr_2rem] items-center gap-3 rounded-md px-1 py-1"
                  onMouseEnter={() => setDestaque(d.rotulo)}
                  title={`${d.rotulo}: ${d.valor} ${unidade}${d.valor === 1 ? '' : 's'}`}
                >
                  <span className="truncate text-sm">{d.rotulo}</span>
                  <div className="h-3">
                    <div
                      className="h-full rounded-r-[4px] bg-(--serie-1) transition-opacity"
                      style={{ width: `${(d.valor / maximo) * 100}%`, opacity: apagado ? 0.35 : 1 }}
                    />
                  </div>
                  <span className="text-muted-foreground text-right text-sm tabular-nums">{d.valor}</span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function CartaoNoticia({ noticia: n, tipo }: { noticia: Noticia; tipo: string }) {
  const detalhes: [string, string | null][] = [
    ['Local', n.localizacaoTexto],
    ['Rua / ponto de referência', n.ruaOuPontoDeReferencia],
    ['Pessoas afetadas', n.pessoasAfetadas],
    ['Dano material', n.danoMaterial],
    ['Problema de infraestrutura', n.problemaInfraestrutura],
    ['Depoimento de morador', n.depoimentoMorador],
    ['Depoimento de instituição', n.depoimentoInstituicao],
  ]
  const preenchidos = detalhes.filter(([, valor]) => valor)

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{tipo}</Badge>
          {n.sentimento && <Badge variant="outline">{NOMES_SENTIMENTO[n.sentimento]}</Badge>}
          <span className="text-muted-foreground text-xs">
            {n.fonte} · {formatarData(n.data)}
          </span>
        </div>
        <CardTitle className="leading-snug [overflow-wrap:anywhere]">
          <a href={n.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 hover:underline">
            {n.titulo ?? n.url}
            <ExternalLink className="text-muted-foreground mt-1 size-3.5 shrink-0" />
          </a>
        </CardTitle>
        {n.bairro && (
          <CardDescription>
            <span className="font-medium">Bairros:</span> {n.bairro}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {n.temas && n.temas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {n.temas.map((tema) => (
              <Badge key={tema} variant="secondary">
                {tema}
              </Badge>
            ))}
          </div>
        )}
        {preenchidos.length > 0 && (
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer select-none">Fatos extraídos</summary>
            <dl className="mt-2 grid gap-2 md:grid-cols-[14rem_1fr]">
              {preenchidos.map(([rotulo, valor]) => (
                <div key={rotulo} className="contents">
                  <dt className="text-muted-foreground">{rotulo}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
