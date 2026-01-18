const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows null values but enforces uniqueness when present
  },
  avatar: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  // User preferences
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  // Blocked users
  blockedUsers: [{
    type: String
  }],
  // Joined rooms
  joinedRooms: [{
    type: String
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for user's online status
userSchema.virtual('isOnline').get(function() {
  return this.status === 'online';
});

module.exports = mongoose.model('User', userSchema);

