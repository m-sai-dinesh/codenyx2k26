const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register/student
router.post('/register/student', async (req, res) => {
  try {
    const { name, email, password, class: cls, age, schoolName, district, language, ngoId } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, role: 'student', ngoId, language });
    await Student.create({ userId: user._id, ngoId, class: cls, age, schoolName, district });

    res.status(201).json({ token: generateToken(user._id), user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/register/volunteer
router.post('/register/volunteer', async (req, res) => {
  try {
    const { name, email, password, highestDegree, subjects, teachingExperience, grades, language, ngoId } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, role: 'volunteer', ngoId, language });
    await Volunteer.create({ userId: user._id, ngoId, highestDegree, subjects, teachingExperience, grades });

    res.status(201).json({ token: generateToken(user._id), user, message: 'Registration successful. Please complete qualification test.' });
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

module.exports = router;
