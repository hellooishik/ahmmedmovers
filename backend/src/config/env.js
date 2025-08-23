const dotenv = require('dotenv');
dotenv.config();
const required = (name) => {
if (!process.env[name]) {
throw new Error(`Missing required env var: ${name}`);
}
return process.env[name];
};

module.exports = {
NODE_ENV: process.env.NODE_ENV || 'development',
PORT: parseInt(process.env.PORT || '4000', 10),
MONGO_URI: required('MONGO_URI'),
JWT_SECRET: required('JWT_SECRET'),
JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
CORS_ORIGINS: (process.env.CORS_ORIGINS || '')
.split(',')
.map((s) => s.trim())
.filter(Boolean),
ADMIN_EMAIL: process.env.ADMIN_EMAIL,
ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
ADMIN_NAME: process.env.ADMIN_NAME || 'Admin',
};