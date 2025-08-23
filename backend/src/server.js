const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { CORS_ORIGINS, PORT, NODE_ENV } = require('./config/env');

dotenv.config();

const port = PORT || process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (!CORS_ORIGINS || CORS_ORIGINS.length === 0) return cb(null, true);
        if (CORS_ORIGINS.includes(origin)) return cb(null, true);
        return cb(new Error('CORS blocked'));
      },
      credentials: true
    }
  });

  // make io available to controllers via app.get('io')
  app.set('io', io);

  // attach sockets handler
  require('./sockets')(io);

  server.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port} [${NODE_ENV}]`);
  });

  const stop = async () => {
    console.log('\\n[SHUTDOWN] Gracefully shutting down...');
    await disconnectDB();
    server.close(() => {
      console.log('[SHUTDOWN] HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
