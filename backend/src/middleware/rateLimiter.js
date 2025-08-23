const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
windowMs: 60 * 1000, // 1 minute
max: 120,
standardHeaders: true,
legacyHeaders: false,
});

module.exports = { apiLimiter };