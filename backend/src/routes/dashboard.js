const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const PeerMentor = require('../models/PeerMentor');
const Session = require('../models/Session');
const Doubt = require('../models/Doubt');
const { ExamResult } = require('../models/Exam');
const { evaluateAtRisk } = require('../utils/atRiskDetector');

// GET /api/dashboard/ngo — full NGO admin view
router.get('/ngo', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const ngoId = req.user.ngoId;

    const [students, volunteers, peerMentors, sessions, doubts] = await Promise.all([
      Student.find({ ngoId }).populate('userId', 'name email'),
      Volunteer.find({ ngoId }).populate('userId', 'name email'),
      PeerMentor.find({ ngoId }).populate('userId', 'name email'),
      Session.find({ ngoId, status: 'completed' }),
      Doubt.find({ ngoId })
    ]);

    // At-risk students
    const atRiskStudents = students.filter(s => s.isAtRisk);

    // Mentor load
    const mentorLoad = volunteers.map(v => ({
      id: v._id,
      name: v.userId?.name,
      studentCount: v.studentIds.length,
      capacity: v.capacity,
      performanceScore: v.performanceScore,
      badges: v.badges,
      isVerified: v.isVerified,
      avgRating: v.totalRatings > 0 ? (v.ratingSum / v.totalRatings).toFixed(1) : 0
    }));

    // Subject health overview across NGO
    const subjectDoubtCount = {};
    doubts.forEach(d => {
      subjectDoubtCount[d.subject] = (subjectDoubtCount[d.subject] || 0) + 1;
    });

    res.json({
      overview: {
        totalStudents: students.length,
        totalVolunteers: volunteers.length,
        totalPeerMentors: peerMentors.length,
        totalSessions: sessions.length,
        totalDoubtsResolved: doubts.filter(d => d.status === 'resolved').length,
        atRiskCount: atRiskStudents.length,
      },
      atRiskStudents: atRiskStudents.map(s => ({
        id: s.userId?._id,
        name: s.userId?.name,
        class: s.class,
        reasons: s.atRiskReasons,
        attendancePercentage: s.totalSessions > 0
          ? Math.round((s.attendanceCount / s.totalSessions) * 100)
          : 100
      })),
      mentorLoad,
      subjectDoubtCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/student — student dashboard data
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('mentorId', 'name role profileImage');

    const recentSessions = await Session.find({
      'attendance.studentId': req.user._id,
    }).sort({ scheduledDate: -1 }).limit(5);

    const pendingDoubts = await Doubt.find({
      studentId: req.user._id,
      status: { $in: ['pending', 'answered'] }
    });

    const examResults = await ExamResult.find({ studentId: req.user._id })
      .populate('examId', 'title subject type')
      .sort({ createdAt: 1 });

    res.json({ student, recentSessions, pendingDoubts, examResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/volunteer — volunteer dashboard
router.get('/volunteer', protect, authorize('volunteer'), async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    const pendingDoubts = await Doubt.find({
      mentorId: req.user._id,
      status: { $in: ['pending', 'reopened'] }
    }).populate('studentId', 'name').sort({ createdAt: 1 });

    const upcomingSessions = await Session.find({
      volunteerId: req.user._id,
      status: 'scheduled'
    }).sort({ scheduledDate: 1 }).limit(5);

    const students = await Student.find({
      userId: { $in: volunteer?.studentIds || [] }
    }).populate('userId', 'name');

    res.json({ volunteer, pendingDoubts, upcomingSessions, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
