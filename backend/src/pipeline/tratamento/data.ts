const FUSO = 'America/Recife'
export const INICIO_PERIODO = '2020-01-01'

/** Dia civil no Recife, no formato AAAA-MM-DD; datas inválidas resultam em null. */
export function diaNoRecife(valor: string | Date | null | undefined): string | null {
  if (!valor) return null
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return Number.isNaN(new Date(valor).getTime()) ? null : valor
  }
  const instante = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(instante.getTime())) return null
  return instante.toLocaleDateString('en-CA', { timeZone: FUSO })
}

export interface DataEventoAvaliada {
  dataEvento: string | null
  alerta?: string
}

// A data do evento nunca herda a publicação: sem menção no texto, permanece nula.
export function avaliarDataEvento(
  dataEvento: string | null | undefined,
  dataPublicacao: string | null,
): DataEventoAvaliada {
  const dia = diaNoRecife(dataEvento)
  if (!dia) return { dataEvento: null }
  if (dataPublicacao && dia > dataPublicacao) {
    return { dataEvento: null, alerta: 'evento posterior à publicação' }
  }
  return { dataEvento: dia }
}

export function dentroDoPeriodo(dia: string | null, hoje: string): boolean {
  return dia !== null && dia >= INICIO_PERIODO && dia <= hoje
}

export function paraDate(dia: string | null): Date | null {
  return dia ? new Date(`${dia}T00:00:00.000Z`) : null
}
