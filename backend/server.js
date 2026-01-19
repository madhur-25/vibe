// server.js - Updated with JWT Authentication
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

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
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
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Import Models
const Message = require('./models/Message');
const User = require('./models/User');
const Room = require('./models/Room');

// Import Routes
const authRoutes = require('./routes/auth');
const { verifyToken } = require('./middleware/auth');

// Store online users
const onlineUsers = new Map();

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat server is running' });
});

// Get message history (protected)
app.get('/api/messages/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username avatar');
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint (protected)
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

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
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
  
  // User joins the chat
  socket.on('join', async (data) => {
    try {
      const { roomId = 'general' } = data;
      
      // Update user status
      socket.user.status = 'online';
      socket.user.lastSeen = new Date();
      await socket.user.save();
      
      socket.roomId = roomId;
      socket.join(roomId);
      
      // Add to online users
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        username: socket.username,
        roomId,
        avatar: socket.user.avatar,
        joinedAt: new Date()
      });
      
      // Get online users in room
      const roomUsers = Array.from(onlineUsers.values())
        .filter(u => u.roomId === roomId)
        .map(u => ({
          userId: u.userId,
          username: u.username,
          avatar: u.avatar
        }));
      
      // Notify room
      io.to(roomId).emit('userJoined', {
        username: socket.username,
        userId: socket.userId,
        avatar: socket.user.avatar,
        onlineUsers: roomUsers,
        timestamp: new Date()
      });
      
      console.log(`✅ ${socket.username} joined room: ${roomId}`);
    } catch (error) {
      console.error('Error in join:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });
  
  // Handle messages
  socket.on('message', async (data) => {
    try {
      const { text, roomId = 'general', type = 'user' } = data;
      
      const message = await Message.create({
        userId: socket.userId,
        username: socket.username,
        text,
        roomId,
        type,
        timestamp: new Date()
      });
      
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
  
  // Handle file messages
  socket.on('fileMessage', async (data) => {
    try {
      const { fileUrl, filename, fileType, roomId = 'general' } = data;
      
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
  
  // Handle private messages
  socket.on('privateMessage', async (data) => {
    try {
      const { toUserId, text } = data;
      
      const message = await Message.create({
        userId: socket.userId,
        username: socket.username,
        text,
        type: 'private',
        recipientId: toUserId,
        timestamp: new Date()
      });
      
      const recipient = onlineUsers.get(toUserId);
      
      if (recipient) {
        io.to(recipient.socketId).emit('privateMessage', {
          id: message._id,
          fromUserId: socket.userId,
          fromUsername: socket.username,
          text,
          timestamp: message.timestamp
        });
      }
      
      socket.emit('privateMessageSent', {
        id: message._id,
        toUserId,
        text,
        timestamp: message.timestamp
      });
      
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });
  
  // Handle typing
  socket.on('typing', (data) => {
    const { roomId = 'general' } = data;
    socket.to(roomId).emit('userTyping', { 
      username: socket.username, 
      userId: socket.userId 
    });
  });
  
  // Handle reactions
  socket.on('reaction', async (data) => {
    try {
      const { messageId, emoji, roomId = 'general' } = data;
      
      const message = await Message.findById(messageId);
      if (!message) return;
      
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
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        // Update user status
        await User.findOneAndUpdate(
          { userId: socket.userId },
          { 
            status: 'offline',
            lastSeen: new Date() 
          }
        );
        
        if (socket.roomId) {
          const roomUsers = Array.from(onlineUsers.values())
            .filter(u => u.roomId === socket.roomId)
            .map(u => ({
              userId: u.userId,
              username: u.username,
              avatar: u.avatar
            }));
          
          io.to(socket.roomId).emit('userLeft', {
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled with JWT authentication`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
