import express from 'express'
import { issueController } from '../controllers/issueController.js'

export const homeRouter = express.Router()

homeRouter.get('/', issueController.index)

homeRouter.post('/issues/:iid/close', issueController.closeIssue)
homeRouter.post('/issues', issueController.createIssue)
homeRouter.post('/issues/:iid/reopen', issueController.reopenIssue)
