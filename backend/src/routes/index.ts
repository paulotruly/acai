import { Router } from 'express'
import { indicadoresController, noticiaController, referenciaController } from '../controller/index.js'

const router = Router()

router.get('/tipos-evento', referenciaController.tiposEvento)
router.get('/municipios', referenciaController.municipios)

router.get('/noticias', noticiaController.list)
router.get('/noticias/:id', noticiaController.getById)

router.get('/indicadores', indicadoresController.get)

export default router
