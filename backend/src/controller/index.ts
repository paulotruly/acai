import type { Request, Response } from 'express'
import { z } from 'zod'
import { tipoEventoService, noticiaService, usuarioService } from '../service/index.js'
import type {
  ApiResponse,
  TipoEvento,
  Noticia,
  PesquisarNoticiasResultado,
  Usuario,
} from '../type/index.js'

const criarUsuarioSchema = z.object({
  email: z.string().email(),
  nome: z.string().optional(),
  senha: z.string().min(6),
})

const criarNoticiaSchema = z.object({
  titulo: z.string().optional(),
  data: z.coerce.date().optional(),
  fonte: z.string().min(1),
  url: z.string().url(),
  textoCompleto: z.string().min(1),
  tipoEventoId: z.number().int().optional(),
  localizacaoTexto: z.string().optional(),
  bairro: z.string().optional(),
  ruaOuPontoDeReferencia: z.string().optional(),
  pessoasAfetadas: z.string().optional(),
  danoMaterial: z.string().optional(),
  problemaInfraestrutura: z.string().optional(),
  depoimentoMorador: z.string().optional(),
  depoimentoInstituicao: z.string().optional(),
  sentimento: z.enum(['POSITIVO', 'NEGATIVO', 'NEUTRO', 'MISTO']).optional(),
  temas: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

const pesquisarNoticiasSchema = z.object({
  consulta: z.string().min(1),
  quantidade: z.coerce.number().int().min(1).max(20).optional(),
})

export const usuarioController = {
  async list(_req: Request, res: Response) {
    const usuarios = await usuarioService.list()
    const body: ApiResponse<Usuario[]> = {
      success: true,
      message: 'Usuários listados',
      data: usuarios,
    }
    res.json(body)
  },

  async create(req: Request, res: Response) {
    const parsed = criarUsuarioSchema.safeParse(req.body)

    if (!parsed.success) {
      const body: ApiResponse = {
        success: false,
        message: 'Dados inválidos',
        data: parsed.error.flatten().fieldErrors,
      }
      res.status(400).json(body)
      return
    }

    const usuario = await usuarioService.create(parsed.data)
    const body: ApiResponse<Usuario> = {
      success: true,
      message: 'Usuário criado',
      data: usuario,
    }
    res.status(201).json(body)
  },
}

export const tipoEventoController = {
  async list(_req: Request, res: Response) {
    const tiposEvento = await tipoEventoService.list()
    const body: ApiResponse<TipoEvento[]> = {
      success: true,
      message: 'Tipos de evento listados',
      data: tiposEvento,
    }
    res.json(body)
  },
}

export const noticiaController = {
  async list(_req: Request, res: Response) {
    const noticias = await noticiaService.list()
    const body: ApiResponse<Noticia[]> = {
      success: true,
      message: 'Notícias listadas',
      data: noticias,
    }
    res.json(body)
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id)
    const noticia = await noticiaService.findById(id)

    if (!noticia) {
      const body: ApiResponse = { success: false, message: 'Notícia não encontrada' }
      res.status(404).json(body)
      return
    }

    const body: ApiResponse<Noticia> = {
      success: true,
      message: 'Notícia encontrada',
      data: noticia,
    }
    res.json(body)
  },

  async create(req: Request, res: Response) {
    const parsed = criarNoticiaSchema.safeParse(req.body)

    if (!parsed.success) {
      const body: ApiResponse = {
        success: false,
        message: 'Dados inválidos',
        data: parsed.error.flatten().fieldErrors,
      }
      res.status(400).json(body)
      return
    }

    const noticia = await noticiaService.create(parsed.data)
    const body: ApiResponse<Noticia> = {
      success: true,
      message: 'Notícia criada',
      data: noticia,
    }
    res.status(201).json(body)
  },

  async search(req: Request, res: Response) {
    const parsed = pesquisarNoticiasSchema.safeParse(req.body)

    if (!parsed.success) {
      const body: ApiResponse = {
        success: false,
        message: 'Dados inválidos',
        data: parsed.error.flatten().fieldErrors,
      }
      res.status(400).json(body)
      return
    }

    const result = await noticiaService.search(parsed.data.consulta, parsed.data.quantidade)
    const body: ApiResponse<PesquisarNoticiasResultado> = {
      success: true,
      message: `${result.criadas.length} notícia(s) criada(s), ${result.ignoradas} já existiam`,
      data: result,
    }
    res.status(201).json(body)
  },
}
