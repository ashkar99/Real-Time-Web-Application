import express from 'express';
import 'dotenv/config';
import { homeRouter } from './routes/homeRouter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// View Engine
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Use the home router for all routes starting with /
app.use('/', homeRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});