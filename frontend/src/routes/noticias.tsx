import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react'
import { CabecalhoPagina } from '@/components/cabecalho-pagina'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  listarMunicipios,
  listarNoticias,
  listarTiposEvento,
  type Municipio,
  type Noticia,
  type PaginaNoticias,
  type TipoEvento,
} from '@/lib/api'
import { formatarData, formatarNumero, nomeTema, nomeTipoEvento } from '@/lib/formato'

interface Busca {
  pagina?: number
  busca?: string
  tipoEventoId?: number
  municipioId?: number
}

const numeroOpcional = (valor: unknown) => {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : undefined
}

export const Route = createFileRoute('/noticias')({
  component: PaginaNoticiasPublica,
  validateSearch: (entrada: Record<string, unknown>): Busca => ({
    pagina: numeroOpcional(entrada.pagina),
    busca: typeof entrada.busca === 'string' && entrada.busca ? entrada.busca : undefined,
    tipoEventoId: numeroOpcional(entrada.tipoEventoId),
    municipioId: numeroOpcional(entrada.municipioId),
  }),
})

const CLASSE_SELECT =
  'border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3'

function PaginaNoticiasPublica() {
  const filtros = Route.useSearch()
  const navegar = useNavigate({ from: '/noticias' })
  const [resultado, setResultado] = useState<PaginaNoticias | null>(null)
  const [tipos, setTipos] = useState<TipoEvento[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [erro, setErro] = useState(false)
  const [textoBusca, setTextoBusca] = useState(filtros.busca ?? '')

  useEffect(() => {
    listarTiposEvento().then(setTipos).catch(() => setErro(true))
    listarMunicipios().then(setMunicipios).catch(() => setErro(true))
  }, [])

  useEffect(() => {
    let ativo = true
    setErro(false)
    listarNoticias(filtros)
      .then((pagina) => {
        if (ativo) setResultado(pagina)
      })
      .catch(() => {
        if (ativo) setErro(true)
      })
    return () => {
      ativo = false
    }
  }, [filtros])

  const aplicar = (mudanca: Busca) =>
    navegar({ search: (atual) => ({ ...atual, pagina: undefined, ...mudanca }) })

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / resultado.porPagina)) : 1

  return (
    <main>
      <CabecalhoPagina titulo="Notícias">
        <p>
          Matérias sobre desastres no Recife e na região metropolitana. Os dados de cada cartão foram extraídos do texto
          original por inteligência artificial e podem conter erros; consulte sempre a fonte.
        </p>
      </CabecalhoPagina>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <form
          role="search"
          className="bg-card border-border grid gap-3 rounded-2xl border p-4 shadow-[0_1px_2px_rgb(11_79_92/0.04)] md:grid-cols-[1fr_14rem_14rem]"
          onSubmit={(evento) => {
            evento.preventDefault()
            aplicar({ busca: textoBusca.trim() || undefined })
          }}
        >
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
            <Input
              aria-label="Buscar por título, veículo ou bairro"
              value={textoBusca}
              onChange={(evento) => setTextoBusca(evento.target.value)}
              placeholder="Buscar por título, veículo ou bairro"
              className="h-10 pl-9"
            />
          </div>
          <select
            aria-label="Filtrar por tipo de evento"
            className={CLASSE_SELECT}
            value={filtros.tipoEventoId ?? ''}
            onChange={(evento) => aplicar({ tipoEventoId: numeroOpcional(evento.target.value) })}
          >
            <option value="">Todos os tipos de evento</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {nomeTipoEvento(tipo.nome)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por município"
            className={CLASSE_SELECT}
            value={filtros.municipioId ?? ''}
            onChange={(evento) => aplicar({ municipioId: numeroOpcional(evento.target.value) })}
          >
            <option value="">Todos os municípios</option>
            {municipios.map((municipio) => (
              <option key={municipio.id} value={municipio.id}>
                {municipio.nome}
              </option>
            ))}
          </select>
        </form>

        {erro && (
          <p role="alert" className="text-destructive">
            Não foi possível carregar as notícias neste momento. Por favor, tente novamente mais tarde.
          </p>
        )}
        {!resultado && !erro && (
          <ul className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Carregando as notícias">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="bg-card border-border flex flex-col gap-3 rounded-2xl border p-5" aria-hidden>
                <span className="bg-muted h-4 w-1/3 animate-pulse rounded-full" />
                <span className="bg-muted h-5 w-5/6 animate-pulse rounded-full" />
                <span className="bg-muted h-3 w-1/2 animate-pulse rounded-full" />
              </li>
            ))}
          </ul>
        )}

        {resultado && (
          <>
            <p className="text-muted-foreground flex items-center gap-2 text-sm" aria-live="polite">
              <SlidersHorizontal className="text-ecoa-petroleo size-4" aria-hidden />
              {resultado.total === 1 ? '1 notícia encontrada' : `${formatarNumero(resultado.total)} notícias encontradas`}
            </p>

            {resultado.itens.length === 0 && (
              <p className="bg-card border-border text-muted-foreground rounded-2xl border border-dashed p-8 text-center">
                Nenhuma notícia corresponde aos filtros selecionados.
              </p>
            )}

            <ul className="grid gap-4 md:grid-cols-2">
              {resultado.itens.map((noticia) => (
                <CartaoNoticia key={noticia.id} noticia={noticia} />
              ))}
            </ul>

            {totalPaginas > 1 && (
              <nav aria-label="Paginação" className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-10 rounded-full px-5"
                  disabled={resultado.pagina <= 1}
                  onClick={() => navegar({ search: (atual) => ({ ...atual, pagina: resultado.pagina - 1 }) })}
                >
                  Anterior
                </Button>
                <span className="text-muted-foreground text-sm">
                  Página {resultado.pagina} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  className="h-10 rounded-full px-5"
                  disabled={resultado.pagina >= totalPaginas}
                  onClick={() => navegar({ search: (atual) => ({ ...atual, pagina: resultado.pagina + 1 }) })}
                >
                  Próxima
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function CartaoNoticia({ noticia: n }: { noticia: Noticia }) {
  const fatos: [string, string | null][] = [
    ['Pessoas afetadas', n.pessoasAfetadas],
    ['Danos materiais', n.danoMaterial],
    ['Infraestrutura', n.problemaInfraestrutura],
    ['Declaração institucional', n.depoimentoInstituicao],
  ]
  const preenchidos = fatos.filter(([, valor]) => valor)

  return (
    <li className="bg-card border-border hover:border-ecoa-petroleo/40 flex flex-col gap-3 rounded-2xl border p-5 transition hover:shadow-[0_10px_30px_-12px_rgb(11_79_92/0.25)]">
      <div className="flex flex-wrap items-center gap-2">
        {n.tipoEvento && <Badge>{nomeTipoEvento(n.tipoEvento)}</Badge>}
        <span className="text-muted-foreground text-xs">
          {n.fonte} · Publicada em {formatarData(n.dataPublicacao)}
        </span>
      </div>
      <a
        href={n.url}
        target="_blank"
        rel="noreferrer"
        className="font-heading text-ecoa-marinho inline-flex items-start gap-1 text-[1.05rem] font-semibold [overflow-wrap:anywhere] hover:underline"
      >
        {n.titulo ?? 'Notícia sem título'}
        <ArrowUpRight className="text-ecoa-petroleo mt-1 size-4 shrink-0" aria-hidden />
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
      {(n.bairros.length > 0 || n.municipios.length > 0) && (
        <p className="text-muted-foreground text-sm">
          {n.bairros.length > 0
            ? `${n.bairros.length === 1 ? 'Bairro citado' : 'Bairros citados'}: ${n.bairros.join(', ')}`
            : `${n.municipios.length === 1 ? 'Município citado' : 'Municípios citados'}: ${n.municipios.join(', ')}`}
        </p>
      )}
      {n.temas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {n.temas.map((tema) => (
            <Badge key={tema} variant="secondary">
              {nomeTema(tema)}
            </Badge>
          ))}
        </div>
      )}
      {preenchidos.length > 0 && (
        <details className="text-sm">
          <summary className="text-ecoa-petroleo cursor-pointer font-medium select-none">Fatos extraídos</summary>
          <dl className="bg-muted/60 mt-2 flex flex-col gap-2 rounded-xl p-3">
            {preenchidos.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className="text-muted-foreground">{rotulo}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </li>
  )
}
