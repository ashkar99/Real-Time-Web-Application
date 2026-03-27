/**
 * @file Express router handling GitLab OAuth 2.0 authentication endpoints.
 * @module authRouter - Manages routes for user login, OAuth callback handling, and logout functionality.
 */
import express from 'express'
import { authController } from '../controllers/authController.js'

export const authRouter = express.Router()

authRouter.get('/login', authController.login)
authRouter.get('/gitlab/callback', authController.callback)
authRouter.get('/logout', authController.logout)
