const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  participants: [{
    type: String,
    required: true
  }],
  messages: [{
    senderId: String,
    text: String,
    fileUrl: String,
    fileType: String,
    isRead: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    text: String,
    senderId: String,
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

directMessageSchema.index({ participants: 1 });
directMessageSchema.index({ 'lastMessage.timestamp': -1 });

directMessageSchema.statics.createConversationId = function(userId1, userId2) {
  return [userId1, userId2].sort().join('-');
};

module.exports = mongoose.model('DirectMessage', directMessageSchema);
