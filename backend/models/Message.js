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
  fileUrl: {
    type: String
  },
  fileType: {
    type: String
  },
  recipientId: {
    type: String,
    index: true
  },
  reactions: [{
    userId: String,
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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

messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, recipientId: 1 });

module.exports = mongoose.model('Message', messageSchema);
