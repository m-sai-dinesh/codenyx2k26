const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { findBestMentor, evaluateBadges } = require('../utils/matchingEngine');
const User = require('../models/User');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const PeerMentor = require('../models/PeerMentor');

// POST /api/match/run — trigger matching for a student
router.post('/run', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student?.diagnosticCompleted) {
      return res.status(400).json({ error: 'Complete diagnostic exam first' });
    }

    const result = await findBestMentor(student, student.ngoId);
    if (!result) {
      return res.json({ matched: false, message: 'Added to waitlist' });
    }

    const { mentor, type, score } = result;
    student.mentorId = mentor.userId._id;
    student.mentorType = type;
    await student.save();

    if (type === 'volunteer') {
      await Volunteer.findByIdAndUpdate(mentor._id, {
        $addToSet: { studentIds: req.user._id }
      });
    } else {
      await PeerMentor.findByIdAndUpdate(mentor._id, {
        $addToSet: { juniorStudentIds: req.user._id }
      });
    }

    res.json({ matched: true, type, matchScore: score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/match/evaluate-badges/:mentorId
router.post('/evaluate-badges/:mentorId', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.mentorId);
    if (!user) return res.status(404).json({ error: 'Mentor not found' });
    await evaluateBadges(req.params.mentorId, user.role);
    res.json({ message: 'Badges evaluated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
