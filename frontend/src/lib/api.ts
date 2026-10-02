import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_URL_API ?? 'http://localhost:3000/api',
})

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export type Sentimento = 'POSITIVO' | 'NEGATIVO' | 'NEUTRO' | 'MISTO'

export interface TipoEvento {
  id: number
  nome: string
}

export interface Noticia {
  id: number
  titulo: string | null
  data: string | null
  fonte: string
  url: string
  textoCompleto: string
  tipoEventoId: number | null
  localizacaoTexto: string | null
  bairro: string | null
  ruaOuPontoDeReferencia: string | null
  pessoasAfetadas: string | null
  danoMaterial: string | null
  problemaInfraestrutura: string | null
  depoimentoMorador: string | null
  depoimentoInstituicao: string | null
  sentimento: Sentimento | null
  temas: string[] | null
  criadoEm: string
}

export async function listarNoticias(): Promise<Noticia[]> {
  const { data } = await api.get<ApiResponse<Noticia[]>>('/noticias')
  return data.data
}

export async function listarTiposEvento(): Promise<TipoEvento[]> {
  const { data } = await api.get<ApiResponse<TipoEvento[]>>('/tipos-evento')
  return data.data
}
