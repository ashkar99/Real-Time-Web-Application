import express from 'express'
import { authController } from '../controllers/authController.js'

export const authRouter = express.Router()

authRouter.get('/login', authController.login)
authRouter.get('/gitlab/callback', authController.callback)
authRouter.get('/logout', authController.logout)
