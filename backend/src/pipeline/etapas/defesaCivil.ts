import { createWriteStream, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { prisma } from '../../config/database.js'
import { paraDate } from '../tratamento/data.js'
import { tratarAtendimento, validarColunas } from '../tratamento/defesaCivil.js'
import { normalizarNome } from '../tratamento/texto.js'
import { CONJUNTO_ATENDIMENTOS, lerConjunto, lerPagina } from '../coleta/ckanRecife.js'

const PASTA_BRUTOS = join('dados', 'brutos', 'defesa-civil')
const ANO_INICIAL = 2020

// O portal publica o mesmo ano em vários lotes; importa-se apenas o primeiro de cada ano.
export async function importarDefesaCivil(): Promise<void> {
  const conjunto = await lerConjunto()
  const anos = new Set<number>()
  const recursos = conjunto.recursos.filter((recurso) => {
    if (!recurso.datastoreAtivo || recurso.ano < ANO_INICIAL || anos.has(recurso.ano)) return false
    anos.add(recurso.ano)
    return true
  })

  const recife = await prisma.municipio.findUniqueOrThrow({ where: { nome: 'Recife' } })
  const bairros = await prisma.bairro.findMany({ where: { municipioId: recife.id } })
  const idBairro = new Map(bairros.map((b) => [b.nomeNormalizado, b.id]))
  const tipos = await prisma.tipoEvento.findMany()
  const idTipo = new Map(tipos.map((t) => [t.nome, t.id]))

  mkdirSync(PASTA_BRUTOS, { recursive: true })

  for (const recurso of recursos) {
    const salvo = await prisma.recursoDefesaCivil.upsert({
      where: { ckanId: recurso.id },
      update: { licenca: conjunto.licenca, ultimaModificacao: new Date(recurso.ultimaModificacao) },
      create: {
        ckanId: recurso.id,
        conjunto: CONJUNTO_ATENDIMENTOS,
        ano: recurso.ano,
        licenca: conjunto.licenca,
        ultimaModificacao: new Date(recurso.ultimaModificacao),
      },
    })
    if (salvo.concluido) {
      console.log(`${recurso.ano}: já importado (${salvo.totalImportado} linhas)`)
      continue
    }

    // Arquivo gzip com um membro por página; retomar apenas acrescenta novos membros.
    const bruto = createWriteStream(join(PASTA_BRUTOS, `${recurso.id}.ndjson.gz`), { flags: 'a' })
    let offset = salvo.totalImportado
    let total = 0

    for (;;) {
      const pagina = await lerPagina(recurso.id, offset)
      total = pagina.total
      if (offset === salvo.totalImportado) validarColunas(pagina.colunas)
      if (pagina.registros.length === 0) break

      bruto.write(gzipSync(pagina.registros.map((r) => JSON.stringify(r)).join('\n') + '\n'))

      const linhas = pagina.registros.map((registro) => {
        const t = tratarAtendimento(registro)
        return {
          recursoId: salvo.id,
          idOrigem: t.idOrigem,
          ano: t.ano,
          regional: t.regional,
          dataSolicitacao: paraDate(t.dataSolicitacao),
          ocorrencia: t.ocorrencia?.slice(0, 255),
          solicitacao: t.solicitacao?.slice(0, 255),
          categoria: t.categoria,
          tipoEventoId: t.nomeTipoEvento ? (idTipo.get(t.nomeTipoEvento) ?? null) : null,
          bairroOriginal: t.bairroOriginal?.slice(0, 191),
          bairroId: t.bairro ? (idBairro.get(normalizarNome(t.bairro)) ?? null) : null,
          grauRisco: t.grauRisco,
          dataAcao: paraDate(t.dataAcao),
          tipoAcao: t.tipoAcao?.slice(0, 255),
          quantidade: t.quantidade,
          altura: t.altura,
          largura: t.largura,
          areaM2: t.areaM2,
          colunasDeslocadas: t.colunasDeslocadas,
          hashLinha: t.hashLinha,
          alertas: t.alertas.length > 0 ? t.alertas : undefined,
        }
      })
      await prisma.atendimentoDefesaCivil.createMany({ data: linhas, skipDuplicates: true })

      offset += pagina.registros.length
      await prisma.recursoDefesaCivil.update({
        where: { id: salvo.id },
        data: { totalImportado: offset, totalDeclarado: total },
      })
      if (offset % 5000 === 0) console.log(`${recurso.ano}: ${offset} de ${total}`)
      if (offset >= total) break
    }
    await new Promise((resolver) => bruto.end(resolver))

    const gravadas = await prisma.atendimentoDefesaCivil.count({ where: { recursoId: salvo.id } })
    if (gravadas !== total) throw new Error(`${recurso.ano}: ${gravadas} linhas gravadas de ${total} declaradas`)
    await prisma.recursoDefesaCivil.update({ where: { id: salvo.id }, data: { concluido: true } })
    console.log(`${recurso.ano}: concluído com ${gravadas} linhas`)
  }
}
