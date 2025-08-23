const { verifyToken } = require('../utils/jwt');
const DriverLocation = require('../models/DriverLocation');

/**
 * Socket.IO handler.
 * Clients should connect with:
 *   const socket = io(URL, { auth: { token } });
 */
module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(); // allow anonymous connections optionally
      const user = verifyToken(token);
      socket.user = user; // { id, role, email, name }
      return next();
    } catch (err) {
      // allow connection without token but mark as anonymous
      return next();
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, socket.user ? socket.user.id : 'anon');

    // join admin room if user is admin
    if (socket.user && socket.user.role === 'admin') {
      socket.join('admins');
    }

    // join driver room if user is driver
    if (socket.user && socket.user.role === 'driver') {
      socket.join(`driver:${socket.user.id}`);
      // mark driver online
      DriverLocation.findOneAndUpdate(
        { driver: socket.user.id },
        { $set: { isOnline: true, updatedAt: new Date() } },
        { upsert: true }
      ).then(() => {
        io.to('admins').emit('driver:online', { driverId: socket.user.id });
      }).catch(() => {});
    }

    // driver sends location update
    socket.on('driver:location', async (payload) => {
      try {
        const uid = socket.user?.id;
        const driverId = payload.driverId || uid;
        const { lat, lng, heading, speed, accuracy, tripId } = payload;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        const doc = await DriverLocation.findOneAndUpdate(
          { driver: driverId },
          { $set: { coords: { type: 'Point', coordinates: [lng, lat] }, heading, speed, accuracy, isOnline: true, updatedAt: new Date() } },
          { upsert: true, new: true }
        );

        const event = { driverId, lat, lng, heading, speed, accuracy, isOnline: doc.isOnline, updatedAt: doc.updatedAt, tripId: tripId || null };

        io.to('admins').emit('driver:location', event);
        if (tripId) io.to(`trip:${tripId}`).emit('driver:location', event);
        io.to(`driver:${driverId}`).emit('driver:location:ack', { ok: true });
      } catch (err) {
        console.error('driver:location error', err);
      }
    });

    socket.on('watch:trip', ({ tripId }) => {
      if (!tripId) return;
      socket.join(`trip:${tripId}`);
    });

    socket.on('unwatch:trip', ({ tripId }) => {
      if (!tripId) return;
      socket.leave(`trip:${tripId}`);
    });

    socket.on('disconnect', async () => {
      try {
        const role = socket.user?.role;
        const userid = socket.user?.id;
        if (role === 'driver' && userid) {
          await DriverLocation.findOneAndUpdate({ driver: userid }, { $set: { isOnline: false, updatedAt: new Date() } }, { upsert: true });
          io.to('admins').emit('driver:offline', { driverId: userid });
        }
      } catch (err) {
        console.error('disconnect err', err);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
};
