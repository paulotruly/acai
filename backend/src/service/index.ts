import { prisma } from '../config/database.js'
import { buscarFontesComGemini, extrairNoticiaDaPagina } from './extracaoNoticias.js'
import type {
  CriarNoticiaInput,
  CriarUsuarioInput,
  Noticia,
  PesquisarNoticiasResultado,
  TipoEvento,
  Usuario,
} from '../type/index.js'

export const usuarioService = {
  async list(): Promise<Usuario[]> {
    return prisma.usuario.findMany()
  },

  async create(input: CriarUsuarioInput): Promise<Usuario> {
    return prisma.usuario.create({
      data: {
        email: input.email,
        nome: input.nome,
        senha: input.senha,
      },
    })
  },

  async findById(id: number): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } })
  },
}

export const tipoEventoService = {
  async list(): Promise<TipoEvento[]> {
    return prisma.tipoEvento.findMany({ orderBy: { nome: 'asc' } })
  },
}

export const noticiaService = {
  async list(): Promise<Noticia[]> {
    return prisma.noticia.findMany({ orderBy: { criadoEm: 'desc' } })
  },

  async findById(id: number): Promise<Noticia | null> {
    return prisma.noticia.findUnique({ where: { id } })
  },

  async create(input: CriarNoticiaInput): Promise<Noticia> {
    return prisma.noticia.create({ data: input })
  },

  async search(consulta: string, quantidade = 3): Promise<PesquisarNoticiasResultado> {
    const fontes = await buscarFontesComGemini(consulta)

    const existing = await prisma.noticia.findMany({
      where: { url: { in: fontes.map((fonte) => fonte.url) } },
      select: { url: true },
    })
    const existingUrls = new Set(existing.map((item) => item.url))
    const novas = fontes.filter((fonte) => !existingUrls.has(fonte.url))

    const criadas: Noticia[] = []
    for (const fonte of novas) {
      if (criadas.length >= quantidade) break

      try {
        const item = await extrairNoticiaDaPagina(fonte)
        if (!item) continue

        const tipoEvento = await prisma.tipoEvento.upsert({
          where: { nome: item.nomeTipoEvento },
          update: {},
          create: { nome: item.nomeTipoEvento },
        })

        const { nomeTipoEvento: _nomeTipoEvento, ...data } = item
        const noticia = await prisma.noticia.create({
          data: { ...data, tipoEventoId: tipoEvento.id },
        })
        criadas.push(noticia)
      } catch (erro) {
        console.warn(`Falha ao processar ${fonte.url}:`, erro)
      }
    }

    return { criadas, ignoradas: existingUrls.size }
  },
}
