export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface TipoEvento {
  id: number
  nome: string
}

export interface Municipio {
  id: number
  nome: string
}

export interface NoticiaPublica {
  id: number
  titulo: string | null
  dataPublicacao: string | null
  dataEvento: string | null
  fonte: string
  url: string
  tipoEvento: string | null
  municipios: string[]
  bairros: string[]
  pessoasAfetadas: string | null
  danoMaterial: string | null
  problemaInfraestrutura: string | null
  depoimentoInstituicao: string | null
  temas: string[]
}

export interface PaginaNoticias {
  itens: NoticiaPublica[]
  total: number
  pagina: number
  porPagina: number
}

export interface FiltrosNoticias {
  pagina: number
  porPagina: number
  busca?: string
  tipoEventoId?: number
  municipioId?: number
  de?: Date
  ate?: Date
}

export interface ItemContagem {
  rotulo: string
  valor: number
}

export interface Periodo {
  inicio: string | null
  fim: string | null
}

export interface Indicadores {
  noticias: {
    total: number
    fontes: number
    municipios: number
    periodo: Periodo
    porTipo: ItemContagem[]
    porAno: ItemContagem[]
    porMunicipio: ItemContagem[]
    porBairro: ItemContagem[]
  }
  defesaCivil: {
    total: number
    linhasDistintas: number
    bairros: number
    licenca: string | null
    periodo: Periodo
    porAno: ItemContagem[]
    porCategoria: ItemContagem[]
    porBairro: ItemContagem[]
    ocorrenciasPorBairro: ItemContagem[]
  }
}
