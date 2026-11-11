import { prisma } from '../config/database.js'
import type { Prisma } from '../generated/prisma/client.js'
import type {
  FiltrosNoticias,
  Indicadores,
  ItemContagem,
  Municipio,
  NoticiaPublica,
  PaginaNoticias,
  TipoEvento,
} from '../type/index.js'

// Recortes de atendimentos com menos casos que este limite não são publicados.
const MINIMO_CASOS_PUBLICOS = 5
const TEMPO_CACHE_INDICADORES_MS = 5 * 60 * 1000

// Depoimentos de moradores, ruas e texto integral não integram a resposta pública.
const SELECAO_PUBLICA = {
  id: true,
  titulo: true,
  dataPublicacao: true,
  dataEvento: true,
  fonte: true,
  url: true,
  pessoasAfetadas: true,
  danoMaterial: true,
  problemaInfraestrutura: true,
  depoimentoInstituicao: true,
  temas: true,
  tipoEvento: { select: { nome: true } },
  locais: { select: { municipio: { select: { nome: true } }, bairro: { select: { nome: true } } } },
} satisfies Prisma.NoticiaSelect

type NoticiaSelecionada = Prisma.NoticiaGetPayload<{ select: typeof SELECAO_PUBLICA }>

const dia = (data: Date | null) => (data ? data.toISOString().slice(0, 10) : null)

function paraPublica(n: NoticiaSelecionada): NoticiaPublica {
  return {
    id: n.id,
    titulo: n.titulo,
    dataPublicacao: dia(n.dataPublicacao),
    dataEvento: dia(n.dataEvento),
    fonte: n.fonte,
    url: n.url,
    tipoEvento: n.tipoEvento?.nome ?? null,
    municipios: [...new Set(n.locais.map((l) => l.municipio.nome))],
    bairros: [...new Set(n.locais.flatMap((l) => (l.bairro ? [l.bairro.nome] : [])))],
    pessoasAfetadas: n.pessoasAfetadas,
    danoMaterial: n.danoMaterial,
    problemaInfraestrutura: n.problemaInfraestrutura,
    depoimentoInstituicao: n.depoimentoInstituicao,
    temas: Array.isArray(n.temas) ? n.temas.filter((t): t is string => typeof t === 'string' && t !== 'outro') : [],
  }
}

export const referenciaService = {
  async tiposEvento(): Promise<TipoEvento[]> {
    return prisma.tipoEvento.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } })
  },

  async municipios(): Promise<Municipio[]> {
    return prisma.municipio.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } })
  },
}

export const noticiaService = {
  async list(filtros: FiltrosNoticias): Promise<PaginaNoticias> {
    const where: Prisma.NoticiaWhereInput = {
      duplicadaDeId: null,
      tipoEventoId: filtros.tipoEventoId,
      locais: filtros.municipioId ? { some: { municipioId: filtros.municipioId } } : undefined,
      dataPublicacao: filtros.de || filtros.ate ? { gte: filtros.de, lte: filtros.ate } : undefined,
      OR: filtros.busca
        ? [
            { titulo: { contains: filtros.busca } },
            { fonte: { contains: filtros.busca } },
            { bairroTexto: { contains: filtros.busca } },
          ]
        : undefined,
    }
    const [itens, total] = await Promise.all([
      prisma.noticia.findMany({
        where,
        select: SELECAO_PUBLICA,
        orderBy: [{ dataPublicacao: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      prisma.noticia.count({ where }),
    ])
    return { itens: itens.map(paraPublica), total, pagina: filtros.pagina, porPagina: filtros.porPagina }
  },

  async findById(id: number): Promise<NoticiaPublica | null> {
    const noticia = await prisma.noticia.findUnique({ where: { id }, select: SELECAO_PUBLICA })
    return noticia ? paraPublica(noticia) : null
  },
}

type LinhaContagem = { rotulo: string | number | null; valor: bigint | number }

const paraItens = (linhas: LinhaContagem[]): ItemContagem[] =>
  linhas.map((l) => ({ rotulo: String(l.rotulo ?? 'Não informado'), valor: Number(l.valor) }))

let cacheIndicadores: { expiraEm: number; dados: Indicadores } | undefined

async function calcularIndicadores(): Promise<Indicadores> {
  const naoDuplicada = { duplicadaDeId: null }
  const [total, fontes, periodoNoticias, porTipo, porAnoNoticias, porMunicipio, porBairroNoticias] = await Promise.all([
    prisma.noticia.count({ where: naoDuplicada }),
    prisma.noticia.findMany({ where: naoDuplicada, distinct: ['fonte'], select: { fonte: true } }),
    prisma.noticia.aggregate({ where: naoDuplicada, _min: { dataPublicacao: true }, _max: { dataPublicacao: true } }),
    prisma.$queryRaw<LinhaContagem[]>`
      SELECT t.nome AS rotulo, COUNT(*) AS valor FROM noticia n
      JOIN tipoevento t ON t.id = n.tipoEventoId
      WHERE n.duplicadaDeId IS NULL GROUP BY t.nome ORDER BY valor DESC`,
    prisma.$queryRaw<LinhaContagem[]>`
      SELECT YEAR(dataPublicacao) AS rotulo, COUNT(*) AS valor FROM noticia
      WHERE duplicadaDeId IS NULL AND dataPublicacao IS NOT NULL GROUP BY rotulo ORDER BY rotulo`,
    prisma.$queryRaw<LinhaContagem[]>`
      SELECT m.nome AS rotulo, COUNT(DISTINCT l.noticiaId) AS valor FROM noticialocal l
      JOIN municipio m ON m.id = l.municipioId
      JOIN noticia n ON n.id = l.noticiaId AND n.duplicadaDeId IS NULL
      GROUP BY m.nome ORDER BY valor DESC`,
    prisma.$queryRaw<LinhaContagem[]>`
      SELECT b.nome AS rotulo, COUNT(DISTINCT l.noticiaId) AS valor FROM noticialocal l
      JOIN bairro b ON b.id = l.bairroId
      JOIN noticia n ON n.id = l.noticiaId AND n.duplicadaDeId IS NULL
      GROUP BY b.nome ORDER BY valor DESC LIMIT 10`,
  ])

  const [totalDc, distintas, bairrosDc, periodoDc, recurso, porAnoDc, porCategoria, porBairroDc, ocorrencias] =
    await Promise.all([
      prisma.atendimentoDefesaCivil.count(),
      prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(DISTINCT hashLinha) AS n FROM atendimentodefesacivil`,
      prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(DISTINCT bairroId) AS n FROM atendimentodefesacivil`,
      prisma.atendimentoDefesaCivil.aggregate({ _min: { dataSolicitacao: true }, _max: { dataSolicitacao: true } }),
      prisma.recursoDefesaCivil.findFirst({ select: { licenca: true } }),
      prisma.$queryRaw<LinhaContagem[]>`
        SELECT YEAR(dataSolicitacao) AS rotulo, COUNT(*) AS valor FROM atendimentodefesacivil
        WHERE dataSolicitacao IS NOT NULL GROUP BY rotulo ORDER BY rotulo`,
      prisma.$queryRaw<LinhaContagem[]>`
        SELECT categoria AS rotulo, COUNT(*) AS valor FROM atendimentodefesacivil
        WHERE categoria IS NOT NULL GROUP BY categoria HAVING valor >= ${MINIMO_CASOS_PUBLICOS} ORDER BY valor DESC`,
      prisma.$queryRaw<LinhaContagem[]>`
        SELECT b.nome AS rotulo, COUNT(*) AS valor FROM atendimentodefesacivil a
        JOIN bairro b ON b.id = a.bairroId
        GROUP BY b.nome HAVING valor >= ${MINIMO_CASOS_PUBLICOS} ORDER BY valor DESC LIMIT 10`,
      prisma.$queryRaw<LinhaContagem[]>`
        SELECT b.nome AS rotulo, COUNT(*) AS valor FROM atendimentodefesacivil a
        JOIN bairro b ON b.id = a.bairroId
        WHERE a.tipoEventoId IS NOT NULL
        GROUP BY b.nome HAVING valor >= ${MINIMO_CASOS_PUBLICOS} ORDER BY valor DESC LIMIT 10`,
    ])

  return {
    noticias: {
      total,
      fontes: fontes.length,
      municipios: porMunicipio.length,
      periodo: { inicio: dia(periodoNoticias._min.dataPublicacao), fim: dia(periodoNoticias._max.dataPublicacao) },
      porTipo: paraItens(porTipo),
      porAno: paraItens(porAnoNoticias),
      porMunicipio: paraItens(porMunicipio),
      porBairro: paraItens(porBairroNoticias),
    },
    defesaCivil: {
      total: totalDc,
      linhasDistintas: Number(distintas[0]?.n ?? 0),
      bairros: Number(bairrosDc[0]?.n ?? 0),
      licenca: recurso?.licenca ?? null,
      periodo: { inicio: dia(periodoDc._min.dataSolicitacao), fim: dia(periodoDc._max.dataSolicitacao) },
      porAno: paraItens(porAnoDc),
      porCategoria: paraItens(porCategoria),
      porBairro: paraItens(porBairroDc),
      ocorrenciasPorBairro: paraItens(ocorrencias),
    },
  }
}

export const indicadoresService = {
  async get(): Promise<Indicadores> {
    if (cacheIndicadores && cacheIndicadores.expiraEm > Date.now()) return cacheIndicadores.dados
    const dados = await calcularIndicadores()
    cacheIndicadores = { expiraEm: Date.now() + TEMPO_CACHE_INDICADORES_MS, dados }
    return dados
  },
}
