const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { getDb } = require('./lib/db');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-clone-secret-key-2024';

// Track online users: userId -> socketId
const onlineUsers = new Map();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    let currentUserId = null;

    // Authenticate via JWT cookie
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = cookies.auth_token;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (e) {
        // invalid token
      }
    }

    // Also accept userId from auth header (fallback)
    if (!currentUserId && socket.handshake.auth?.userId) {
      currentUserId = socket.handshake.auth.userId;
    }

    if (currentUserId) {
      onlineUsers.set(currentUserId, socket.id);
      // Broadcast updated online list to all clients
      io.emit('online:users', Array.from(onlineUsers.keys()));
    }

    // Handle user coming online (explicit event)
    socket.on('user:online', (userId) => {
      currentUserId = userId;
      onlineUsers.set(userId, socket.id);
      io.emit('online:users', Array.from(onlineUsers.keys()));
    });

    // Send a direct message
    socket.on('message:send', (data) => {
      const { senderId, receiverId, content } = data;
      const db = getDb();

      try {
        // Save to database
        const stmt = db.prepare(
          'INSERT INTO messages (sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, 0)'
        );
        const result = stmt.run(senderId, receiverId, content);

        const message = {
          id: result.lastInsertRowid,
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          is_read: 0,
          created_at: new Date().toISOString(),
        };

        // Send back to sender
        socket.emit('message:receive', message);

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', message);
        }
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    // Mark messages as read
    socket.on('message:read', ({ senderId, receiverId }) => {
      const db = getDb();
      try {
        db.prepare(
          'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0'
        ).run(senderId, receiverId);

        // Notify the original sender their messages were read
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:read:ack', { senderId, receiverId });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        io.emit('online:users', Array.from(onlineUsers.keys()));
      }
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
