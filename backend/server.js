//  Updated with Room Management,jwt
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const Message = require('./models/Message');
const User = require('./models/User');
const Room = require('./models/Room');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const { verifyToken } = require('./middleware/auth');

const onlineUsers = new Map();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat server is running' });
});

// Get message history for a room (protected)
app.get('/api/messages/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    // Check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Invalid room ID' });
    }

    // Check if user is member
    if (!room.isMember(req.userId)) {
      return res.status(403).json({ error: 'You are not a member of this room' });
    }
    
    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user.userId;
    socket.username = user.username;
    socket.user = user;
    
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 ${socket.username} connected (${socket.id})`);
  
  // Join a room
  socket.on('joinRoom', async (data) => {
    try {
      const { roomId } = data;

      // Verify room exists
      const room = await Room.findOne({ roomId });
      
      if (!room) {
        return socket.emit('error', { 
          message: 'Invalid room ID. This room does not exist.',
          code: 'ROOM_NOT_FOUND'
        });
      }

      if (room.isArchived) {
        return socket.emit('error', { 
          message: 'This room has been deleted.',
          code: 'ROOM_DELETED'
        });
      }

      // Check if user is a member
      if (!room.isMember(socket.userId)) {
        return socket.emit('error', { 
          message: 'You are not a member of this room. Please join first.',
          code: 'NOT_MEMBER'
        });
      }

      // Leave previous room if any
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
        
        // Remove from online users in previous room
        const prevRoomUsers = Array.from(onlineUsers.values())
          .filter(u => u.roomId === socket.currentRoom && u.userId !== socket.userId);
        
        io.to(socket.currentRoom).emit('userLeft', {
          username: socket.username,
          userId: socket.userId,
          onlineUsers: prevRoomUsers.map(u => ({
            userId: u.userId,
            username: u.username,
            avatar: u.avatar
          }))
        });
      }

      // Join new room
      socket.join(roomId);
      socket.currentRoom = roomId;

      // Update user status
      socket.user.status = 'online';
      socket.user.lastSeen = new Date();
      await socket.user.save();

      // Update online users
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        username: socket.username,
        userId: socket.userId,
        roomId,
        avatar: socket.user.avatar,
        joinedAt: new Date()
      });

      // Get online users in this room
      const roomUsers = Array.from(onlineUsers.values())
        .filter(u => u.roomId === roomId)
        .map(u => ({
          userId: u.userId,
          username: u.username,
          avatar: u.avatar
        }));

      // Update room's last activity
      room.lastActivity = new Date();
      await room.save();

      // Notify room
      io.to(roomId).emit('userJoined', {
        username: socket.username,
        userId: socket.userId,
        avatar: socket.user.avatar,
        onlineUsers: roomUsers,
        timestamp: new Date()
      });

      // Send room info to user
      socket.emit('roomJoined', {
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        memberCount: room.members.length,
        onlineUsers: roomUsers
      });

      console.log(`✅ ${socket.username} joined room: ${room.name} (${roomId})`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { 
        message: 'Failed to join room',
        code: 'JOIN_FAILED'
      });
    }
  });

  // Send message to room
  socket.on('message', async (data) => {
    try {
      const { text, type = 'user' } = data;
      const roomId = socket.currentRoom;

      if (!roomId) {
        return socket.emit('error', { message: 'You are not in any room' });
      }

      // Verify room still exists
      const room = await Room.findOne({ roomId });
      if (!room || room.isArchived) {
        return socket.emit('error', { 
          message: 'This room no longer exists',
          code: 'ROOM_DELETED'
        });
      }

      const message = await Message.create({
        userId: socket.userId,
        username: socket.username,
        text,
        roomId,
        type,
        timestamp: new Date()
      });

      // Update room stats
      room.messageCount += 1;
      room.lastActivity = new Date();
      await room.save();

      io.to(roomId).emit('message', {
        id: message._id,
        username: socket.username,
        userId: socket.userId,
        text,
        type,
        timestamp: message.timestamp
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // File message
  socket.on('fileMessage', async (data) => {
    try {
      const { fileUrl, filename, fileType } = data;
      const roomId = socket.currentRoom;

      if (!roomId) {
        return socket.emit('error', { message: 'You are not in any room' });
      }

      const room = await Room.findOne({ roomId });
      if (!room || room.isArchived) {
        return socket.emit('error', { message: 'This room no longer exists' });
      }

      if (!room.settings.allowFileUploads) {
        return socket.emit('error', { message: 'File uploads are disabled in this room' });
      }

      const message = await Message.create({
        userId: socket.userId,
        username: socket.username,
        text: filename,
        roomId,
        type: 'file',
        fileUrl,
        fileType,
        timestamp: new Date()
      });

      room.messageCount += 1;
      room.lastActivity = new Date();
      await room.save();

      io.to(roomId).emit('message', {
        id: message._id,
        username: socket.username,
        userId: socket.userId,
        text: filename,
        type: 'file',
        fileUrl,
        fileType,
        timestamp: message.timestamp
      });

    } catch (error) {
      console.error('Error sending file:', error);
      socket.emit('error', { message: 'Failed to send file' });
    }
  });

  // Typing indicator
  socket.on('typing', () => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('userTyping', { 
        username: socket.username, 
        userId: socket.userId 
      });
    }
  });

  // Reaction
  socket.on('reaction', async (data) => {
    try {
      const { messageId, emoji } = data;
      const roomId = socket.currentRoom;

      const message = await Message.findById(messageId);
      if (!message || message.roomId !== roomId) return;

      if (!message.reactions) {
        message.reactions = [];
      }

      const existingReaction = message.reactions.find(
        r => r.userId === socket.userId && r.emoji === emoji
      );

      if (existingReaction) {
        message.reactions = message.reactions.filter(
          r => !(r.userId === socket.userId && r.emoji === emoji)
        );
      } else {
        message.reactions.push({ userId: socket.userId, emoji });
      }

      await message.save();

      io.to(roomId).emit('reactionUpdate', {
        messageId,
        reactions: message.reactions
      });
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  });

  // Room deleted event
  socket.on('roomDeleted', async (data) => {
    const { roomId } = data;
    
    // Notify all users in the room
    io.to(roomId).emit('roomDeleted', {
      roomId,
      message: 'This room has been deleted by the creator'
    });

    // Force disconnect all users from this room
    const socketsInRoom = await io.in(roomId).fetchSockets();
    socketsInRoom.forEach(s => {
      s.leave(roomId);
      if (s.currentRoom === roomId) {
        s.currentRoom = null;
      }
    });
  });

  // Disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        await User.findOneAndUpdate(
          { userId: socket.userId },
          { 
            status: 'offline',
            lastSeen: new Date() 
          }
        );

        if (socket.currentRoom) {
          const roomUsers = Array.from(onlineUsers.values())
            .filter(u => u.roomId === socket.currentRoom)
            .map(u => ({
              userId: u.userId,
              username: u.username,
              avatar: u.avatar
            }));

          io.to(socket.currentRoom).emit('userLeft', {
            username: socket.username,
            userId: socket.userId,
            onlineUsers: roomUsers,
            timestamp: new Date()
          });
        }

        console.log(`❌ ${socket.username} disconnected`);
      }
    } catch (error) {
      console.error('Error on disconnect:', error);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled with JWT authentication`);
  console.log(`🏠 Room management enabled`);
});
