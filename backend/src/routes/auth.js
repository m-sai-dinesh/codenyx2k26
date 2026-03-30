const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const { NGO } = require('../models/Book');
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
    const { name, email, password, highestDegree, teachingPreferences, teachingExperience, language, ngoId } = req.body;

    // Use findOne with lean for faster check, then rely on unique index for race condition protection
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    try {
      const user = await User.create({ name, email, password, role: 'volunteer', ngoId, language });
      await Volunteer.create({ userId: user._id, ngoId, highestDegree, teachingPreferences, teachingExperience });
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

// POST /api/auth/register/ngo — creates NGO org + its admin account in one step
router.post('/register/ngo', async (req, res) => {
  try {
    const { name, email, password, ngoName, district, phone } = req.body;

    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    try {
      // Create NGO record first
      const ngo = await NGO.create({
        name: ngoName || `${name}'s NGO`,
        contactEmail: email,
        district: district || '',
        phone: phone || '',
      });

      // Create admin user linked to that NGO
      const user = await User.create({
        name,
        email,
        password,
        role: 'ngo_admin',
        ngoId: ngo._id,
        authProvider: 'local',
      });

      res.status(201).json({ token: generateToken(user._id), user, ngo });
    } catch (createError) {
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

    // ── Hidden platform-admin access ──
    // Credentials are intentionally not shown anywhere in the UI.
    if (email === 'ngo_youngistaan') {
      if (password !== 'ngo@youngistann') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      // Find or create the single platform-wide admin account
      let admin = await User.findOne({ email: 'ngo_youngistaan@platform.internal' });
      if (!admin) {
        admin = await User.create({
          name: 'NGO Youngistaan',
          email: 'ngo_youngistaan@platform.internal',
          password: 'ngo@youngistann',
          role: 'ngo_admin',
          authProvider: 'local',
        });
      }
      return res.json({ token: generateToken(admin._id), user: admin });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.role === 'volunteer' || user.role === 'peer_mentor') {
      return res.status(401).json({ error: 'Volunteers must sign in with Google. Use the "Continue with Google" button.' });
    }
    if (user.authProvider === 'google') {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please use the Google button.' });
    }
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    let userObj = user.toJSON();
    if (userObj.role === 'student') {
      const student = await Student.findOne({ userId: userObj._id }).lean();
      if (student && student.class) {
        userObj.class = student.class;
      }
    } else if (userObj.role === 'volunteer') {
      const volunteer = await Volunteer.findOne({ userId: userObj._id }).lean();
      if (volunteer) userObj.isApproved = volunteer.isApproved;
    } else if (userObj.role === 'peer_mentor') {
      const pm = await require('../models/PeerMentor').findOne({ userId: userObj._id }).lean();
      if (pm) userObj.isApproved = pm.isApproved;
    }
    res.json({ token: generateToken(user._id), user: userObj });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  let userObj = req.user.toJSON();
  if (userObj.role === 'student') {
    const student = await Student.findOne({ userId: userObj._id }).lean();
    if (student && student.class) {
      userObj.class = student.class;
    }
  } else if (userObj.role === 'volunteer') {
    const volunteer = await Volunteer.findOne({ userId: userObj._id }).lean();
    if (volunteer) userObj.isApproved = volunteer.isApproved;
  } else if (userObj.role === 'peer_mentor') {
    const pm = await require('../models/PeerMentor').findOne({ userId: userObj._id }).lean();
    if (pm) userObj.isApproved = pm.isApproved;
  }
  res.json({ user: userObj });
});

// Google OAuth Routes
// GET /api/auth/google - Initiate Google OAuth flow
// Accepts ?role=student or ?role=volunteer and passes it through OAuth state
router.get('/google', (req, res, next) => {
  const role = ['student', 'volunteer', 'peer_mentor'].includes(req.query.role)
    ? req.query.role
    : 'volunteer';
  passport.authenticate('google', { scope: ['profile', 'email'], state: role })(req, res, next);
});

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const { googleId, email, name, firstName, lastName, profilePicture } = req.user;
      // state param carries the role chosen on the landing page
      const intendedRole = ['student', 'volunteer', 'peer_mentor'].includes(req.query.state)
        ? req.query.state
        : 'volunteer';

      // Check if user already exists
      let user = await User.findOne({ email });
      let isNew = false;

      if (!user) {
        isNew = true;
        user = new User({
          name,
          email,
          role: intendedRole,
          isEmailVerified: true,
          authProvider: 'google',
          googleId
        });
        await user.save();

        if (intendedRole === 'student') {
          // Student profile is completed on /complete-student-profile after OAuth
          await Student.create({ userId: user._id });
        } else {
          // volunteer or peer_mentor
          await Volunteer.create({
            userId: user._id,
            firstName,
            lastName,
            email,
            profilePicture,
            highestDegree: '',
            teachingExperience: 0,
            teachingPreferences: [],
          });
        }
      } else if (user.authProvider !== 'google') {
        // Existing local account — link to Google
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }

      // Generate JWT token
      const token = generateToken(user._id);

      // Redirect to frontend with token, role, and isNew flag
      res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&role=${user.role}&isNew=${isNew}`);

    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/oauth-error?error=auth_failed`);
    }
  }
);

module.exports = router;
