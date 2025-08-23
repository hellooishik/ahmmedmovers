const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const routes = require('./routes');
const { NODE_ENV, CORS_ORIGINS } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Trust proxy
app.set('trust proxy', true);

// Security
app.use(helmet());

// CORS
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!CORS_ORIGINS || CORS_ORIGINS.length === 0) return cb(null, true);
    if (CORS_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
const tripRoutes = require('./routes/tripRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const pricingRoutes = require('./routes/pricingRoutes');

app.use('/trip', tripRoutes);
app.use('/payments', paymentsRoutes);
app.use('/pricing', pricingRoutes);
// API routes
app.use('/api', routes);

// Root health
app.get('/', (req, res) => res.send('✅ AhmmedMovers Backend is running'));

// 404 + error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
