const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const { protect } = require('../middleware/auth');
const passport = require('../config/googleOAuth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register/student
router.post('/register/student', async (req, res) => {
  try {
    const { name, email, password, class: cls, age, schoolName, district, language, ngoId } = req.body;

    // Use findOne with lean for faster check, then rely on unique index for race condition protection
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    try {
      const user = await User.create({ name, email, password, role: 'student', ngoId, language });
      await Student.create({ userId: user._id, ngoId, class: cls, age, schoolName, district });
      res.status(201).json({ token: generateToken(user._id), user });
    } catch (createError) {
      // Handle duplicate key error from MongoDB unique index
      if (createError.code === 11000 && createError.keyPattern?.email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      throw createError;
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/register/volunteer
router.post('/register/volunteer', async (req, res) => {
  try {
    const { name, email, password, highestDegree, subjects, teachingExperience, grades, language, ngoId } = req.body;

    // Use findOne with lean for faster check, then rely on unique index for race condition protection
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    try {
      const user = await User.create({ name, email, password, role: 'volunteer', ngoId, language });
      await Volunteer.create({ userId: user._id, ngoId, highestDegree, subjects, teachingExperience, grades });
      res.status(201).json({ token: generateToken(user._id), user, message: 'Registration successful. Please complete qualification test.' });
    } catch (createError) {
      // Handle duplicate key error from MongoDB unique index
      if (createError.code === 11000 && createError.keyPattern?.email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      throw createError;
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// Google OAuth Routes
// GET /api/auth/google - Initiate Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const { googleId, email, name, firstName, lastName, profilePicture } = req.user;

      // Check if user already exists
      let user = await User.findOne({ email });
      
      if (!user) {
        // Create new user with Google OAuth
        user = new User({
          name,
          email,
          password: googleId, // Use Google ID as password placeholder
          role: 'volunteer',
          isEmailVerified: true, // Auto-verify Google emails
          authProvider: 'google',
          googleId
        });
        
        await user.save();

        // Create volunteer profile
        const volunteer = new Volunteer({
          userId: user._id,
          firstName,
          lastName,
          email,
          profilePicture,
          highestDegree: '', // Will be filled later
          teachingExperience: 0,
          subjects: [],
          grades: [],
          ngoId: '000000000000000000000001', // Default NGO
          isVerified: true, // Auto-verify Google users
          authProvider: 'google'
        });
        
        await volunteer.save();
      } else if (user.authProvider !== 'google') {
        // User exists but not with Google - link accounts
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }

      // Generate JWT token
      const token = generateToken(user._id);

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&role=${user.role}`);
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/oauth-error?error=auth_failed`);
    }
  }
);

module.exports = router;
