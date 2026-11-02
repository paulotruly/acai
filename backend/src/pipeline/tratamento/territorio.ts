import { normalizarNome } from './texto.js'

// Códigos conforme a API de localidades do IBGE.
export const MUNICIPIOS_RMR = [
  { nome: 'Abreu e Lima', consulta: '"Abreu e Lima"' },
  { nome: 'Araçoiaba', consulta: '"Araçoiaba" Pernambuco' },
  { nome: 'Cabo de Santo Agostinho', consulta: '"Cabo de Santo Agostinho"' },
  { nome: 'Camaragibe', consulta: '"Camaragibe"' },
  { nome: 'Goiana', consulta: '"Goiana" Pernambuco' },
  { nome: 'Igarassu', consulta: '"Igarassu"' },
  { nome: 'Ilha de Itamaracá', consulta: '"Itamaracá"' },
  { nome: 'Ipojuca', consulta: '"Ipojuca"' },
  { nome: 'Itapissuma', consulta: '"Itapissuma"' },
  { nome: 'Jaboatão dos Guararapes', consulta: '"Jaboatão"' },
  { nome: 'Moreno', consulta: '"Moreno" Pernambuco' },
  { nome: 'Olinda', consulta: '"Olinda"' },
  { nome: 'Paulista', consulta: '"Paulista" Pernambuco' },
  { nome: 'Recife', consulta: '"Recife"' },
  { nome: 'São Lourenço da Mata', consulta: '"São Lourenço da Mata"' },
]

export const BAIRROS_RECIFE = [
  'Aflitos', 'Afogados', 'Água Fria', 'Alto do Mandu', 'Alto José Bonifácio', 'Alto José do Pinho',
  'Alto Santa Terezinha', 'Apipucos', 'Areias', 'Arruda', 'Barro', 'Beberibe', 'Boa Viagem', 'Boa Vista',
  'Bomba do Hemetério', 'Bongi', 'Brasília Teimosa', 'Brejo da Guabiraba', 'Brejo de Beberibe', 'Cabanga',
  'Caçote', 'Cajueiro', 'Campina do Barreto', 'Campo Grande', 'Casa Amarela', 'Casa Forte', 'Caxangá',
  'Cidade Universitária', 'Coelhos', 'Cohab', 'Coqueiral', 'Cordeiro', 'Córrego do Jenipapo', 'Curado',
  'Derby', 'Dois Irmãos', 'Dois Unidos', 'Encruzilhada', 'Engenho do Meio', 'Espinheiro', 'Estância',
  'Fundão', 'Graças', 'Guabiraba', 'Hipódromo', 'Ibura', 'Ilha do Leite', 'Ilha do Retiro',
  'Ilha Joana Bezerra', 'Imbiribeira', 'Ipsep', 'Iputinga', 'Jaqueira', 'Jardim São Paulo', 'Jiquiá',
  'Jordão', 'Linha do Tiro', 'Macaxeira', 'Madalena', 'Mangabeira', 'Mangueira', 'Monteiro',
  'Morro da Conceição', 'Mustardinha', 'Nova Descoberta', 'Paissandu', 'Parnamirim', 'Passarinho',
  'Pau-Ferro', 'Peixinhos', 'Pina', 'Poço', 'Ponto de Parada', 'Porto da Madeira', 'Prado', 'Recife',
  'Rosarinho', 'San Martin', 'Sancho', 'Santana', 'Santo Amaro', 'Santo Antônio', 'São José',
  'Sítio dos Pintos', 'Soledade', 'Tamarineira', 'Tejipió', 'Torre', 'Torreão', 'Torrões', 'Totó', 'Várzea',
  'Vasco da Gama', 'Zumbi',
]

const SINONIMOS: Record<string, string> = {
  'poco da panela': 'Poço',
  'ur 11': 'Cohab',
  'ibura de cima': 'Ibura',
  'ibura de baixo': 'Ibura',
  'joana bezerra': 'Ilha Joana Bezerra',
  'bairro do recife': 'Recife',
  'recife antigo': 'Recife',
  'jd sao paulo': 'Jardim São Paulo',
  'cid universitaria': 'Cidade Universitária',
  'casa amareal': 'Casa Amarela',
  'brejo beberibe': 'Brejo de Beberibe',
  'brejo guabiraba': 'Brejo da Guabiraba',
  'brejo da guabi': 'Brejo da Guabiraba',
  'ibura baixo': 'Ibura',
  'fundao de fora': 'Fundão',
  coque: 'Ilha Joana Bezerra',
}

const POR_NOME = new Map(BAIRROS_RECIFE.map((nome) => [normalizarNome(nome), nome]))

export function identificarBairroRecife(texto: string): string | null {
  const normalizado = normalizarNome(texto)
  return (
    POR_NOME.get(normalizado) ??
    SINONIMOS[normalizado] ??
    POR_NOME.get(normalizado.replace(/^bairro (do |da |de )?/, '')) ??
    null
  )
}

// Nomes que também aparecem como logradouro ou sobrenome só valem após um indicativo de local.
const NOMES_AMBIGUOS = new Set(['Paulista', 'Moreno', 'Goiana'])
const FORMAS: Record<string, string[]> = {
  'Jaboatão dos Guararapes': ['Jaboatão'],
  'Ilha de Itamaracá': ['Itamaracá'],
}
const LETRA_ANTES = '(?<![\\p{L}\\p{N}])'
const LETRA_DEPOIS = '(?![\\p{L}\\p{N}])'

export function encontrarMunicipios(texto: string): string[] {
  return MUNICIPIOS_RMR.map(({ nome }) => nome).filter((nome) =>
    (FORMAS[nome] ?? [nome]).some((forma) => {
      if (NOMES_AMBIGUOS.has(nome)) {
        const indicativo = `${LETRA_ANTES}(?:em|de|para|município de|cidade de)\\s+${forma}${LETRA_DEPOIS}`
        return new RegExp(indicativo, 'u').test(texto)
      }
      return new RegExp(`${LETRA_ANTES}${forma}${LETRA_DEPOIS}`, 'u').test(texto)
    }),
  )
}

/** Separa o texto de bairros; trechos sem nome próprio, como "134 bairros no total", são descartados. */
export function separarBairros(texto: string | null | undefined): string[] {
  if (!texto) return []
  const partes = texto
    .split(/[,;/\n]|\s+e\s+/)
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0 && parte.length < 40 && !/\d/.test(parte) && !/^bairros?\b/i.test(parte))
  return [...new Set(partes)]
}
