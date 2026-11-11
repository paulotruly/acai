const BASE = 'https://dados.recife.pe.gov.br'
export const CONJUNTO_ATENDIMENTOS = 'registro-de-atendimentos-da-defesa-civil'

export interface RecursoCkan {
  id: string
  nome: string
  ano: number
  ultimaModificacao: string
  datastoreAtivo: boolean
}

export interface ConjuntoCkan {
  licenca: string
  recursos: RecursoCkan[]
}

export interface PaginaCkan {
  total: number
  colunas: string[]
  registros: Record<string, string | number | null>[]
}

export async function lerConjunto(conjunto = CONJUNTO_ATENDIMENTOS): Promise<ConjuntoCkan> {
  const resposta = await fetch(`${BASE}/api/3/action/package_show?id=${conjunto}`, {
    signal: AbortSignal.timeout(60000),
  })
  if (!resposta.ok) throw new Error(`Portal respondeu ${resposta.status} para ${conjunto}`)
  const { result } = (await resposta.json()) as {
    result: {
      license_title: string
      resources: { id: string; name: string; datastore_active: boolean; last_modified: string | null; created: string }[]
    }
  }
  return {
    licenca: result.license_title,
    recursos: result.resources.map((r) => ({
      id: r.id,
      nome: r.name,
      ano: Number(r.name.match(/\d{4}/)?.[0] ?? 0),
      ultimaModificacao: r.last_modified ?? r.created,
      datastoreAtivo: r.datastore_active,
    })),
  }
}

// A exportação CSV do portal é interrompida sem erro após cerca de um minuto; por isso,
// a importação usa a API paginada em JSON, cujo total pode ser conferido.
export async function lerPagina(recursoId: string, offset: number, limite = 500): Promise<PaginaCkan> {
  const url = `${BASE}/api/3/action/datastore_search?resource_id=${recursoId}&limit=${limite}&offset=${offset}&sort=_id`
  for (let tentativa = 1; ; tentativa++) {
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(90000) })
      if (!resposta.ok) throw new Error(`Portal respondeu ${resposta.status}`)
      const { result } = (await resposta.json()) as {
        result: { total: number; fields: { id: string }[]; records: PaginaCkan['registros'] }
      }
      return { total: result.total, colunas: result.fields.map((f) => f.id), registros: result.records }
    } catch (erro) {
      if (tentativa >= 5) throw erro
      await new Promise((resolver) => setTimeout(resolver, tentativa * 5000))
    }
  }
}
