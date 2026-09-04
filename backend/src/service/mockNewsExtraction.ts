import type { CreateNewsEventInput, Sentiment } from '../type/index.js'

const EVENT_TYPES = ['enchente', 'alagamento', 'deslizamento', 'falta_de_agua', 'incendio', 'outro']
const NEIGHBORHOODS = ['Boa Viagem', 'Casa Amarela', 'Várzea', 'Ibura', 'Torre', 'Afogados']
const SOURCES = ['G1', 'JC Online', 'Diário de Pernambuco', 'Twitter/X', 'Instagram']
const SENTIMENTS: Sentiment[] = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED']

export type MockExtractedNewsEvent = Omit<CreateNewsEventInput, 'eventTypeId'> & {
  eventTypeName: string
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'noticia'
  )
}

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length] as T
}

/**
 * Gera notícias fake plausíveis a partir de um termo de busca, simulando o que
 * uma extração via IA produziria. As urls são determinísticas por query+índice
 * para permitir testar a deduplicação ao rodar a mesma busca de novo.
 */
export function generateMockNewsEvents(query: string, count = 3): MockExtractedNewsEvent[] {
  const querySlug = slugify(query)

  return Array.from({ length: count }, (_, index) => {
    const eventTypeName = pick(EVENT_TYPES, index)
    const neighborhood = pick(NEIGHBORHOODS, index + 1)
    const source = pick(SOURCES, index + 2)
    const sentiment = pick(SENTIMENTS, index + 3)

    return {
      title: `${eventTypeName} atinge bairro de ${neighborhood} em buscas por "${query}"`,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      source,
      url: `https://mock-news.local/${querySlug}-${index}`,
      fullText: `Moradores do bairro de ${neighborhood} relataram problemas relacionados a ${eventTypeName} nesta semana. A situação chamou atenção de órgãos públicos e da imprensa local após buscas por "${query}".`,
      eventTypeName,
      locationText: `${neighborhood}, Recife`,
      neighborhood,
      streetOrLandmark: index % 2 === 0 ? `Rua das Flores, ${100 + index}` : undefined,
      peopleAffected: `${(index + 1) * 12} famílias`,
      materialDamage: index % 2 === 0 ? 'Casas parcialmente destruídas e móveis perdidos' : undefined,
      infrastructureIssue: index % 3 === 0 ? 'Via principal interditada' : undefined,
      residentQuote: '"Nunca vi uma situação dessas por aqui", disse um morador local.',
      institutionQuote:
        index % 2 === 0 ? 'Defesa Civil informou que equipes já estão no local.' : undefined,
      sentiment,
      themes: [eventTypeName, 'infraestrutura'],
      latitude: -8.05 + index * 0.01,
      longitude: -34.9 + index * 0.01,
    }
  })
}
