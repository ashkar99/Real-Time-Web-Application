/**
 * @file Express router for handling incoming GitLab webhook payloads.
 * @module webhookRouter - Defines the route for receiving webhooks and applies security middleware to verify the source of the webhook.
 */
import express from 'express'
import { webhookController } from '../controllers/webhookController.js'

export const webhookRouter = express.Router()

// The verifyToken middleware executes BEFORE handleWebhook
webhookRouter.post('/', webhookController.verifyToken, webhookController.handleWebhook)
