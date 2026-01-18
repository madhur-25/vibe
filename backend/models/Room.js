const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'public'
  },
  // Room owner
  createdBy: {
    type: String,
    required: true
  },
  // Room admins
  admins: [{
    type: String
  }],
  // Room members (for private rooms)
  members: [{
    userId: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  // Room settings
  settings: {
    maxMembers: {
      type: Number,
      default: 100
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    isPasswordProtected: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      select: false // Don't return password in queries
    }
  },
  // Room metadata
  messageCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient room searches
roomSchema.index({ type: 1, isArchived: 1 });
roomSchema.index({ 'members.userId': 1 });

// Method to check if user is member
roomSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.userId === userId);
};

// Method to check if user is admin
roomSchema.methods.isAdmin = function(userId) {
  return this.admins.includes(userId) || this.createdBy === userId;
};

module.exports = mongoose.model('Room', roomSchema);
