const { StatusCodes } = require('http-status-codes');

function notFound(req, res, next) {
res.status(StatusCodes.NOT_FOUND).json({ message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
console.error(err);
const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
const message = err.message || 'Server error';
res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };