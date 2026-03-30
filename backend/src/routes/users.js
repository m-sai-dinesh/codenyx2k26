const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const PeerMentor = require('../models/PeerMentor');
const User = require('../models/User');
const { findBestMentor } = require('../utils/matchingEngine');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id }).populate('mentorId', 'name role');
    } else if (user.role === 'volunteer') {
      profile = await Volunteer.findOne({ userId: user._id });
    } else if (user.role === 'peer_mentor') {
      profile = await PeerMentor.findOne({ userId: user._id });
    }

    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/student-profile — student completes their profile after Google OAuth
router.put('/student-profile', protect, authorize('student'), async (req, res) => {
  try {
    const { name, class: cls, age, schoolName, district, language } = req.body;

    if (name && name.trim()) {
      await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }
    if (language) {
      await User.findByIdAndUpdate(req.user._id, { language });
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { class: cls, age, schoolName: schoolName?.trim(), district: district?.trim() },
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    res.json({ message: 'Profile completed', student });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/profile — volunteer/peer_mentor updates their profile after OAuth signup
router.put('/profile', protect, authorize('volunteer', 'peer_mentor'), async (req, res) => {
  try {
    const { name, highestDegree, teachingExperience, teachingPreferences, class: pmClass, subjects: pmSubjects } = req.body;

    if (name && name.trim()) {
      await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }

    let profile;
    if (req.user.role === 'volunteer') {
      profile = await Volunteer.findOneAndUpdate(
        { userId: req.user._id },
        { highestDegree, teachingExperience, teachingPreferences },
        { new: true, runValidators: true }
      );
    } else {
      profile = await PeerMentor.findOneAndUpdate(
        { userId: req.user._id },
        { class: pmClass, subjects: pmSubjects },
        { new: true, runValidators: true }
      );
    }

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json({ message: 'Profile updated', profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/users/match-mentor — run matching for a student after diagnostic
router.post('/match-mentor', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const result = await findBestMentor(student, student.ngoId);
    if (!result) {
      return res.json({ matched: false, message: 'Added to waitlist — no mentor available yet' });
    }

    const { mentor, type } = result;
    student.mentorId = mentor.userId;
    student.mentorType = type;
    await student.save();

    // Add student to mentor's list
    if (type === 'volunteer') {
      await Volunteer.findOneAndUpdate(
        { userId: mentor.userId },
        { $addToSet: { studentIds: req.user._id } }
      );
    } else {
      await PeerMentor.findOneAndUpdate(
        { userId: mentor.userId },
        { $addToSet: { juniorStudentIds: req.user._id } }
      );
    }

    res.json({ matched: true, mentorType: type, mentorId: mentor.userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const ngoId = req.user.ngoId;

    const volunteers = await Volunteer.find({ ngoId, isApproved: true })
      .populate('userId', 'name profileImage')
      .sort({ performanceScore: -1 })
      .limit(10);

    const peerMentors = await PeerMentor.find({ ngoId, isApproved: true })
      .populate('userId', 'name profileImage')
      .sort({ performanceScore: -1 })
      .limit(10);

    res.json({ volunteers, peerMentors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/approve — ngo admin approves a volunteer
router.put('/:id/approve', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const volunteer = await Volunteer.findOneAndUpdate(
      { userId: req.params.id, ngoId: req.user.ngoId },
      { isApproved: true },
      { new: true }
    );
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    res.json({ message: 'Volunteer approved successfully', volunteer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
