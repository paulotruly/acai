import { Router } from 'express'
import { tipoEventoController, noticiaController, usuarioController } from '../controller/index.js'

const router = Router()

router.get('/usuarios', usuarioController.list)
router.post('/usuarios', usuarioController.create)

router.get('/tipos-evento', tipoEventoController.list)

router.get('/noticias', noticiaController.list)
router.get('/noticias/:id', noticiaController.getById)
router.post('/noticias', noticiaController.create)
router.post('/noticias/pesquisar', noticiaController.search)

export default router
