import express from 'express';
import 'dotenv/config';
import { homeRouter } from './routes/homeRouter.js';
import { webhookRouter } from './routes/webhookRouter.js';
import { wss } from './config/webSocketServer.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// View Engine
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Attach the WebSocket server instance to the response object for easy access in controllers
app.use((req, res, next) => {
    res.wss = wss;
    next();
});

app.use('/', homeRouter);
app.use('/webhook', webhookRouter);

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (socket) => {
        wss.emit('connection', socket, request);
    });
});