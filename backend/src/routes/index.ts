import { Router } from 'express'
import { eventTypeController, newsEventController, userController } from '../controller/index.js'

const router = Router()

router.get('/users', userController.list)
router.post('/users', userController.create)

router.get('/event-types', eventTypeController.list)

router.get('/news-events', newsEventController.list)
router.get('/news-events/:id', newsEventController.getById)
router.post('/news-events', newsEventController.create)
router.post('/news-events/search', newsEventController.search)

export default router
