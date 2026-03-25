import express from 'express'
import { webhookController } from '../controllers/webhookController.js'

export const webhookRouter = express.Router()

// The verifyToken middleware executes BEFORE handleWebhook
webhookRouter.post('/', webhookController.verifyToken, webhookController.handleWebhook)
