import express from 'express';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// View Engine
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Basic Health Route to verify setup
app.get('/', (req, res) => {
    res.send('Server architecture initialized.');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});