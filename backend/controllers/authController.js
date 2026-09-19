const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const inMemoryUsers = new Map();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      name: user.name,
      username: user.username,
      userId: user.userId,
      email: user.email,
    },
    process.env.JWT_SECRET || 'supersecretjwtkey_notification_platform_2026',
    { expiresIn: '30d' }
  );
};

const generateUniqueUserId = () => {
  const prefix = 'SB';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomDigits}`;
};

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const lowerEmail = email.toLowerCase().trim();
    const lowerUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const generatedUserId = generateUniqueUserId();

    if (isDbConnected()) {
      const emailExists = await User.findOne({ email: lowerEmail });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const usernameExists = await User.findOne({ username: lowerUsername });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }

      const user = await User.create({
        name,
        username: lowerUsername,
        userId: generatedUserId,
        email: lowerEmail,
        password,
      });

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          userId: user.userId,
          email: user.email,
          pushToken: user.pushToken,
          status: user.status,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      });
    } else {
      // In-memory fallback
      if (inMemoryUsers.has(lowerEmail)) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const existingUsername = Array.from(inMemoryUsers.values()).find(
        (u) => u.username === lowerUsername
      );
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const fakeId = new mongoose.Types.ObjectId().toString();

      const user = {
        _id: fakeId,
        id: fakeId,
        name,
        username: lowerUsername,
        userId: generatedUserId,
        email: lowerEmail,
        password: hashedPassword,
        pushToken: null,
        status: 'online',
        lastSeen: new Date(),
        blockedUsers: [],
        createdAt: new Date(),
      };

      inMemoryUsers.set(lowerEmail, user);
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          userId: user.userId,
          email: user.email,
          pushToken: user.pushToken,
          status: user.status,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('[Register Error]', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (login by email OR username)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { loginInput, email, password } = req.body;
    const identifier = (loginInput || email || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    if (isDbConnected()) {
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          userId: user.userId,
          email: user.email,
          pushToken: user.pushToken,
          status: user.status,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      });
    } else {
      // In-Memory Fallback
      const user = Array.from(inMemoryUsers.values()).find(
        (u) => u.email === identifier || u.username === identifier
      );

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          userId: user.userId,
          email: user.email,
          pushToken: user.pushToken,
          status: user.status,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  inMemoryUsers,
};
