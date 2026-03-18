
import express from 'express';
import { issueController } from '../controllers/issueController.js';

export const homeRouter = express.Router();

homeRouter.get('/', issueController.index);