/**
 * @file Express router for the main dashboard interface and manual issue operations.
 * @module homeRouter - Handles routing for the home page and issue management actions like closing, creating, and reopening issues.
 *  @requires express - Express framework for routing and middleware.
 */
import express from 'express'
import { issueController } from '../controllers/issueController.js'

export const homeRouter = express.Router()

homeRouter.get('/', issueController.index)

homeRouter.post('/issues/:iid/close', issueController.closeIssue)
homeRouter.post('/issues', issueController.createIssue)
homeRouter.post('/issues/:iid/reopen', issueController.reopenIssue)
