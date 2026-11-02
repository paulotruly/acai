import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_URL_API ?? 'http://localhost:3001/api',
})

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface TipoEvento {
  id: number
  nome: string
}

export interface Municipio {
  id: number
  nome: string
}

export interface Noticia {
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
  itens: Noticia[]
  total: number
  pagina: number
  porPagina: number
}

export interface FiltrosNoticias {
  pagina?: number
  busca?: string
  tipoEventoId?: number
  municipioId?: number
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

export async function listarNoticias(filtros: FiltrosNoticias): Promise<PaginaNoticias> {
  const { data } = await api.get<ApiResponse<PaginaNoticias>>('/noticias', { params: { ...filtros, porPagina: 12 } })
  return data.data
}

export async function listarTiposEvento(): Promise<TipoEvento[]> {
  const { data } = await api.get<ApiResponse<TipoEvento[]>>('/tipos-evento')
  return data.data
}

export async function listarMunicipios(): Promise<Municipio[]> {
  const { data } = await api.get<ApiResponse<Municipio[]>>('/municipios')
  return data.data
}

export async function obterIndicadores(): Promise<Indicadores> {
  const { data } = await api.get<ApiResponse<Indicadores>>('/indicadores')
  return data.data
}
