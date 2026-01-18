
// server.js 
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');
const DirectMessage = require('./models/DirectMessage');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents allowed.'));
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


// Store online users
const onlineUsers = new Map();

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat server is running' });
});

// Get message history
app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username');
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
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

// Get or create user
async function getOrCreateUser(username, userId) {
  let user = await User.findOne({ userId });
  
  if (!user) {
    user = await User.create({
      userId,
      username,
      lastSeen: new Date()
    });
  } else {
    user.username = username;
    user.lastSeen = new Date();
    await user.save();
  }
  
  return user;
}

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);
  
  // User joins the chat
  socket.on('join', async (data) => {
    try {
      const { username, userId, roomId = 'general' } = data;
      
      // Create or get user
      const user = await getOrCreateUser(username, userId);
      
      // Store socket info
      socket.username = username;
      socket.userId = userId;
      socket.roomId = roomId;
      
      // Join room
      socket.join(roomId);
      
      // Add to online users
      onlineUsers.set(userId, {
        socketId: socket.id,
        username,
        roomId,
        joinedAt: new Date()
      });
      
      // Get current online users in room
    const roomUsers = Array.from(onlineUsers.values())
  .filter(u => u.roomId === roomId)
  .map(u => ({ 
    userId: u.userId, 
    username: u.username 
  })); 
      
      // Emit to all users in room
      io.to(roomId).emit('userJoined', {
        username,
        userId,
        onlineUsers: roomUsers,
        timestamp: new Date()
      });
      
      console.log(`✅ ${username} joined room: ${roomId}`);
    } catch (error) {
      console.error('Error in join:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });
  
  // Handle regular messages
  socket.on('message', async (data) => {
    try {
      const { username, userId, text, roomId = 'general', type = 'user' } = data;
      
      // Save message to database
      const message = await Message.create({
        userId,
        username,
        text,
        roomId,
        type,
        timestamp: new Date()
      });
      
      // Broadcast to all users in room
      io.to(roomId).emit('message', {
        id: message._id,
        username,
        userId,
        text,
        type,
        timestamp: message.timestamp
      });
      
      console.log(`💬 Message from ${username}: ${text}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle file messages
  socket.on('fileMessage', async (data) => {
    try {
      const { username, userId, fileUrl, filename, fileType, roomId = 'general' } = data;
      
      // Save file message to database
      const message = await Message.create({
        userId,
        username,
        text: filename,
        roomId,
        type: 'file',
        fileUrl,
        fileType,
        timestamp: new Date()
      });
      
      // Broadcast to all users in room
      io.to(roomId).emit('message', {
        id: message._id,
        username,
        userId,
        text: filename,
        type: 'file',
        fileUrl,
        fileType,
        timestamp: message.timestamp
      });
      
      console.log(`📎 File from ${username}: ${filename}`);
    } catch (error) {
      console.error('Error sending file:', error);
      socket.emit('error', { message: 'Failed to send file' });
    }
  });
  
  // Handle private messages
  socket.on('privateMessage', async (data) => {
    try {
      const { fromUserId, fromUsername, toUserId, text } = data;
      
      // Save private message
      const message = await Message.create({
        userId: fromUserId,
        username: fromUsername,
        text,
        type: 'private',
        recipientId: toUserId,
        timestamp: new Date()
      });
      
      // Find recipient's socket
      const recipient = onlineUsers.get(toUserId);
      
      if (recipient) {
        // Send to recipient
        io.to(recipient.socketId).emit('privateMessage', {
          id: message._id,
          fromUserId,
          fromUsername,
          text,
          timestamp: message.timestamp
        });
      }
      
      // Send confirmation to sender
      socket.emit('privateMessageSent', {
        id: message._id,
        toUserId,
        text,
        timestamp: message.timestamp
      });
      
      console.log(`🔒 Private message from ${fromUsername} to ${toUserId}`);
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    const { username, userId, roomId = 'general' } = data;
    socket.to(roomId).emit('userTyping', { username, userId });
  });
  
  // Handle stop typing
  socket.on('stopTyping', (data) => {
    const { userId, roomId = 'general' } = data;
    socket.to(roomId).emit('userStoppedTyping', { userId });
  });
  
  // Handle reactions
  socket.on('reaction', async (data) => {
    try {
      const { messageId, emoji, userId, roomId = 'general' } = data;
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }
      
      if (!message.reactions) {
        message.reactions = [];
      }
      
      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(
        r => r.userId === userId && r.emoji === emoji
      );
      
      if (existingReaction) {
        // Remove reaction
        message.reactions = message.reactions.filter(
          r => !(r.userId === userId && r.emoji === emoji)
        );
      } else {
        // Add reaction
        message.reactions.push({ userId, emoji });
      }
      
      await message.save();
      
      // Broadcast reaction update
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
      const { username, userId, roomId } = socket;
      
      if (userId) {
        // Remove from online users
        onlineUsers.delete(userId);
        
        // Update user's last seen
        await User.findOneAndUpdate(
          { userId },
          { lastSeen: new Date() }
        );
        
        if (roomId) {
          // Get updated online users
          const roomUsers = Array.from(onlineUsers.values())
            .filter(u => u.roomId === roomId)
            .map(u => u.username);
          
          // Notify room
          io.to(roomId).emit('userLeft', {
            username,
            userId,
            onlineUsers: roomUsers,
            timestamp: new Date()
          });
        }
        
        console.log(`❌ ${username} disconnected`);
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
  console.log(`📡 Socket.io enabled`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
