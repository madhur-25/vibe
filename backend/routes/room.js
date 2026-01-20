// Room Management Routes 
const express = require('express');
const { body, validationResult } = require('express-validator');
const Room = require('../models/Room');
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Generate unique room ID
const generateRoomId = () => {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// @route    POST /api/rooms/create
// @desc     Create a new room
// @access   Private
router.post('/create', verifyToken, [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Room name must be between 3 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Type must be either public or private'),
  body('password')
    .optional({ checkFalsy: true }) //skips if password is empty.....***-----
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, type = 'public', password, maxMembers = 100 } = req.body;

    // Generate unique room ID
    const roomId = generateRoomId();

    // Create room
    const room = await Room.create({
      roomId,
      name,
      description,
      type,
      createdBy: req.userId,
      admins: [req.userId],
      members: [{
        userId: req.userId,
        role: 'admin',
        joinedAt: new Date()
      }],
      settings: {
        maxMembers,
        allowFileUploads: true,
        isPasswordProtected: !!password,
        password: password || undefined
      }
    });

    // Update user's joined rooms
    req.user.joinedRooms.push(roomId);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        type: room.type,
        createdBy: room.createdBy,
        memberCount: 1,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// @route    POST /api/rooms/join/:roomId
// @desc     Join a room
// @access   Private
router.post('/join/:roomId', verifyToken, [
  body('password').optional().isString()
], async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;

    // Find room
    const room = await Room.findOne({ roomId }).select('+settings.password');

    if (!room) {
      return res.status(404).json({ 
        error: 'Invalid room ID. This room does not exist.' 
      });
    }

    // Check if room is archived
    if (room.isArchived) {
      return res.status(410).json({ 
        error: 'This room has been deleted.' 
      });
    }

    // Check if already a member
    if (room.isMember(req.userId)) {
      return res.json({
        success: true,
        message: 'Already a member of this room',
        room: {
          roomId: room.roomId,
          name: room.name,
          description: room.description,
          type: room.type,
          memberCount: room.members.length
        }
      });
    }

    // Check password for private rooms
    if (room.settings.isPasswordProtected) {
      if (!password) {
        return res.status(401).json({ 
          error: 'Password required to join this room',
          requiresPassword: true
        });
      }
      
      if (password !== room.settings.password) {
        return res.status(401).json({ 
          error: 'Incorrect password' 
        });
      }
    }

    // Check max members
    if (room.members.length >= room.settings.maxMembers) {
      return res.status(403).json({ 
        error: 'Room is full' 
      });
    }

    // Add user to room
    room.members.push({
      userId: req.userId,
      role: 'member',
      joinedAt: new Date()
    });
    await room.save();

    // Update user's joined rooms
    if (!req.user.joinedRooms.includes(roomId)) {
      req.user.joinedRooms.push(roomId);
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Successfully joined room',
      room: {
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        type: room.type,
        memberCount: room.members.length,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// @route    POST /api/rooms/leave/:roomId
// @desc     Leave a room
// @access   Private
router.post('/leave/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Can't leave if you're the creator (must delete room instead)
    if (room.createdBy === req.userId) {
      return res.status(400).json({ 
        error: 'Room creator cannot leave. Delete the room instead.' 
      });
    }

    // Remove user from room
    room.members = room.members.filter(m => m.userId !== req.userId);
    await room.save();

    // Remove room from user's joined rooms
    req.user.joinedRooms = req.user.joinedRooms.filter(r => r !== roomId);
    await req.user.save();

    res.json({
      success: true,
      message: 'Successfully left room'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// @route    DELETE /api/rooms/:roomId
// @desc     Delete a room (creator only)
// @access   Private
router.delete('/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only creator can delete
    if (room.createdBy !== req.userId) {
      return res.status(403).json({ 
        error: 'Only room creator can delete this room' 
      });
    }

    // Delete all messages in this room
    await Message.deleteMany({ roomId });

    // Delete the room
    await Room.deleteOne({ roomId });

    res.json({
      success: true,
      message: 'Room and all messages deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// @route    GET /api/rooms
// @desc     Get all public rooms or user's rooms
// @access   Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    let query = { isArchived: false };

    if (type === 'public') {
      query.type = 'public';
    } else if (type === 'joined') {
      query.roomId = { $in: req.user.joinedRooms };
    } else if (type === 'created') {
      query.createdBy = req.userId;
    }

    const rooms = await Room.find(query)
      .select('-settings.password')
      .sort({ lastActivity: -1 })
      .limit(50);

    const roomsWithDetails = rooms.map(room => ({
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      type: room.type,
      createdBy: room.createdBy,
      memberCount: room.members.length,
      maxMembers: room.settings.maxMembers,
      isPasswordProtected: room.settings.isPasswordProtected,
      isMember: room.isMember(req.userId),
      isCreator: room.createdBy === req.userId,
      lastActivity: room.lastActivity,
      createdAt: room.createdAt
    }));

    res.json({
      success: true,
      rooms: roomsWithDetails
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// @route    GET /api/rooms/:roomId
// @desc     Get room details
// @access   Private
router.get('/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId })
      .select('-settings.password');

    if (!room) {
      return res.status(404).json({ 
        error: 'Invalid room ID. This room does not exist.' 
      });
    }

    if (room.isArchived) {
      return res.status(410).json({ 
        error: 'This room has been deleted.' 
      });
    }

    res.json({
      success: true,
      room: {
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        type: room.type,
        createdBy: room.createdBy,
        memberCount: room.members.length,
        maxMembers: room.settings.maxMembers,
        isPasswordProtected: room.settings.isPasswordProtected,
        allowFileUploads: room.settings.allowFileUploads,
        isMember: room.isMember(req.userId),
        isCreator: room.createdBy === req.userId,
        isAdmin: room.isAdmin(req.userId),
        lastActivity: room.lastActivity,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
});

// @route    PATCH /api/rooms/:roomId
// @desc     Update room settings (creator/admin only)
// @access   Private
router.patch('/:roomId', verifyToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
], async (req, res) => {
  try {
    const { roomId } = req.params;
    const updates = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isAdmin(req.userId)) {
      return res.status(403).json({ 
        error: 'Only admins can update room settings' 
      });
    }

    const allowedUpdates = ['name', 'description', 'maxMembers', 'allowFileUploads'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'maxMembers' || field === 'allowFileUploads') {
          room.settings[field] = updates[field];
        } else {
          room[field] = updates[field];
        }
      }
    });

    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      room: {
        roomId: room.roomId,
        name: room.name,
        description: room.description
      }
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// @route    GET /api/rooms/:roomId/members
// @desc     Get room members
// @access   Private
router.get('/:roomId/members', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isMember(req.userId)) {
      return res.status(403).json({ 
        error: 'You must be a member to view members list' 
      });
    }

    // Get user details for members
    const User = require('../models/User');
    const memberIds = room.members.map(m => m.userId);
    const users = await User.find({ userId: { $in: memberIds } })
      .select('userId username avatar status');

    const membersWithDetails = room.members.map(member => {
      const user = users.find(u => u.userId === member.userId);
      return {
        userId: member.userId,
        username: user?.username || 'Unknown',
        avatar: user?.avatar,
        status: user?.status || 'offline',
        role: member.role,
        joinedAt: member.joinedAt
      };
    });

    res.json({
      success: true,
      members: membersWithDetails
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;
