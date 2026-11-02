const NOMES_TIPO_EVENTO: Record<string, string> = {
  enchente: 'Enchente',
  alagamento: 'Alagamento',
  deslizamento: 'Deslizamento',
  falta_de_agua: 'Falta de água',
  incendio: 'Incêndio',
  outro: 'Outro',
}

const NOMES_TEMA: Record<string, string> = {
  mortes: 'Mortes',
  desabrigados: 'Desabrigados',
  desalojados: 'Desalojados',
  defesa_civil: 'Defesa Civil',
  mobilidade: 'Mobilidade',
  saneamento: 'Saneamento',
  abastecimento_de_agua: 'Abastecimento de água',
  habitacao: 'Habitação',
  encostas: 'Encostas',
  drenagem: 'Drenagem',
  politicas_publicas: 'Políticas públicas',
  doacoes: 'Doações',
  saude: 'Saúde',
  educacao: 'Educação',
}

// Um valor sem nome cadastrado nunca aparece como identificador técnico.
function legivel(valor: string): string {
  const texto = valor.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const nomeTipoEvento = (nome: string) => NOMES_TIPO_EVENTO[nome] ?? legivel(nome)
export const nomeTema = (tema: string) => NOMES_TEMA[tema] ?? legivel(tema)

export const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR')

// As datas chegam como dia civil (AAAA-MM-DD) e não devem sofrer conversão de fuso.
export function formatarData(dia: string | null): string {
  if (!dia) return 'Não informada'
  const [ano, mes, data] = dia.split('-')
  return `${data}/${mes}/${ano}`
}

export function anoDe(dia: string | null): string {
  return dia ? dia.slice(0, 4) : '—'
}
