import { Router } from 'express'
import { userController } from '../controller/index.js'

const router = Router()

router.get('/users', userController.list)
router.post('/users', userController.create)

export default router
