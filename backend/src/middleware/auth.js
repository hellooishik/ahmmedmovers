const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { auth, requireRole };
