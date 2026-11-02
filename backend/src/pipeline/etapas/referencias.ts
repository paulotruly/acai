import { prisma } from '../../config/database.js'
import { BAIRROS_RECIFE, MUNICIPIOS_RMR } from '../tratamento/territorio.js'
import { normalizarNome } from '../tratamento/texto.js'

interface MunicipioIbge {
  id: number
  nome: string
}

export async function semearReferencias(): Promise<void> {
  const resposta = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/26/municipios', {
    signal: AbortSignal.timeout(30000),
  })
  if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`)
  const ibge = (await resposta.json()) as MunicipioIbge[]

  for (const { nome } of MUNICIPIOS_RMR) {
    const oficial = ibge.find((municipio) => municipio.nome === nome)
    if (!oficial) throw new Error(`Município ${nome} não encontrado no IBGE`)
    await prisma.municipio.upsert({
      where: { codigoIbge: oficial.id },
      update: { nome },
      create: { codigoIbge: oficial.id, nome },
    })
  }

  const recife = await prisma.municipio.findUniqueOrThrow({ where: { nome: 'Recife' } })
  await prisma.bairro.createMany({
    data: BAIRROS_RECIFE.map((nome) => ({
      municipioId: recife.id,
      nome,
      nomeNormalizado: normalizarNome(nome),
    })),
    skipDuplicates: true,
  })

  console.log(`${MUNICIPIOS_RMR.length} municípios e ${BAIRROS_RECIFE.length} bairros registrados`)
}
