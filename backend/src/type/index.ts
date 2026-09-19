export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface Usuario {
  id: number
  email: string
  nome: string | null
  senha: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface CriarUsuarioInput {
  email: string
  nome?: string
  senha: string
}

export type Sentimento = 'POSITIVO' | 'NEGATIVO' | 'NEUTRO' | 'MISTO'

export interface TipoEvento {
  id: number
  nome: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface Noticia {
  id: number
  titulo: string | null
  data: Date | null
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
  temas: unknown
  latitude: number | null
  longitude: number | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface CriarNoticiaInput {
  titulo?: string
  data?: Date
  fonte: string
  url: string
  textoCompleto: string
  tipoEventoId?: number
  localizacaoTexto?: string
  bairro?: string
  ruaOuPontoDeReferencia?: string
  pessoasAfetadas?: string
  danoMaterial?: string
  problemaInfraestrutura?: string
  depoimentoMorador?: string
  depoimentoInstituicao?: string
  sentimento?: Sentimento
  temas?: string[]
  latitude?: number
  longitude?: number
}

export interface PesquisarNoticiasInput {
  consulta: string
  quantidade?: number
}

export interface PesquisarNoticiasResultado {
  criadas: Noticia[]
  ignoradas: number
}
