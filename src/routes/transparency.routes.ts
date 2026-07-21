import { Router } from 'express'
import { getPublishedTransparencyEntries } from '../controllers/transparency.controller.js'

const router = Router()
router.get('/', getPublishedTransparencyEntries)

export default router
