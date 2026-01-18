///Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    default: 'general',
    index: true
  },
  type: {
    type: String,
    enum: ['user', 'system', 'file', 'private'],
    default: 'user'
  },
  // For file messages
  fileUrl: {
    type: String
  },
  fileType: {
    type: String
  },
  // For private messages
  recipientId: {
    type: String,
    index: true
  },
  // Reactions to messages
  reactions: [{
    userId: String,
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Message status
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, recipientId: 1 });

module.exports = mongoose.model('Message', messageSchema);
