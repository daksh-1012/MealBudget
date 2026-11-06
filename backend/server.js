require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const routes = require('./routes');
const seedRecipes = require('./utils/seed/seedRecipes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());

app.use(helmet());
app.use(cors({ origin: origins, credentials: false }));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 2000, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  connectDB()
    .then(seedRecipes)
    .then(() => app.listen(PORT, () => console.log(`MealBudget API running on http://localhost:${PORT}`)))
    .catch((err) => { console.error('Failed to start:', err.message); process.exit(1); });
}

module.exports = app;
