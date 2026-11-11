import type { Request, Response } from 'express'
import { z } from 'zod'
import { indicadoresService, noticiaService, referenciaService } from '../service/index.js'
import type { ApiResponse, Indicadores, Municipio, NoticiaPublica, PaginaNoticias, TipoEvento } from '../type/index.js'

const filtrosNoticiasSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().min(1).max(100).optional(),
  tipoEventoId: z.coerce.number().int().positive().optional(),
  municipioId: z.coerce.number().int().positive().optional(),
  de: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
})

const idSchema = z.coerce.number().int().positive()

export const referenciaController = {
  async tiposEvento(_req: Request, res: Response) {
    const body: ApiResponse<TipoEvento[]> = {
      success: true,
      message: 'Tipos de evento listados',
      data: await referenciaService.tiposEvento(),
    }
    res.json(body)
  },

  async municipios(_req: Request, res: Response) {
    const body: ApiResponse<Municipio[]> = {
      success: true,
      message: 'Municípios listados',
      data: await referenciaService.municipios(),
    }
    res.json(body)
  },
}

export const noticiaController = {
  async list(req: Request, res: Response) {
    const parsed = filtrosNoticiasSchema.safeParse(req.query)

    if (!parsed.success) {
      const body: ApiResponse = {
        success: false,
        message: 'Filtros inválidos',
        data: parsed.error.flatten().fieldErrors,
      }
      res.status(400).json(body)
      return
    }

    const body: ApiResponse<PaginaNoticias> = {
      success: true,
      message: 'Notícias listadas',
      data: await noticiaService.list(parsed.data),
    }
    res.json(body)
  },

  async getById(req: Request, res: Response) {
    const id = idSchema.safeParse(req.params.id)

    if (!id.success) {
      const body: ApiResponse = { success: false, message: 'Identificador inválido' }
      res.status(400).json(body)
      return
    }

    const noticia = await noticiaService.findById(id.data)

    if (!noticia) {
      const body: ApiResponse = { success: false, message: 'Notícia não encontrada' }
      res.status(404).json(body)
      return
    }

    const body: ApiResponse<NoticiaPublica> = {
      success: true,
      message: 'Notícia encontrada',
      data: noticia,
    }
    res.json(body)
  },
}

export const indicadoresController = {
  async get(_req: Request, res: Response) {
    const body: ApiResponse<Indicadores> = {
      success: true,
      message: 'Indicadores calculados',
      data: await indicadoresService.get(),
    }
    res.json(body)
  },
}
