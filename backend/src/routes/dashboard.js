const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const PeerMentor = require('../models/PeerMentor');
const Session = require('../models/Session');
const Doubt = require('../models/Doubt');
const { NGO } = require('../models/Book');
const { Exam, ExamResult } = require('../models/Exam');
const { evaluateAtRisk } = require('../utils/atRiskDetector');

// GET /api/dashboard/ngo — full NGO admin view
router.get('/ngo', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const ngoId = req.user.ngoId;

    // Build filter: if admin has no ngoId assigned, show all data (super-admin view)
    const filter = ngoId ? { ngoId } : {};
    const sessionFilter = ngoId ? { ngoId, status: 'completed' } : { status: 'completed' };

    const [students, volunteers, peerMentors, sessions, doubts, ngo] = await Promise.all([
      Student.find(filter).populate('userId', 'name email'),
      Volunteer.find(filter).populate('userId', 'name email'),
      PeerMentor.find(filter).populate('userId', 'name email'),
      Session.find(sessionFilter),
      Doubt.find(filter),
      ngoId ? NGO.findById(ngoId) : Promise.resolve(null),
    ]);

    // At-risk students
    const atRiskStudents = students.filter(s => s.isAtRisk);

    // Mentor load
    const mentorLoad = volunteers.filter(v => v.isApproved).map(v => ({
      id: v._id,
      name: v.userId?.name,
      studentCount: v.studentIds.length,
      capacity: v.capacity,
      performanceScore: v.performanceScore,
      badges: v.badges,
      isVerified: v.isVerified,
      avgRating: v.totalRatings > 0 ? (v.ratingSum / v.totalRatings).toFixed(1) : 0
    }));

    // Pending Volunteers with their qualification exam scores
    let pendingVolunteers = volunteers.filter(v => !v.isApproved && v.userId).map(v => {
      return {
        id: v.userId._id,
        name: v.userId.name,
        email: v.userId.email,
        teachingPreferences: v.teachingPreferences || []
      };
    });

    // Filter out any with undefined ids
    pendingVolunteers = pendingVolunteers.filter(pv => pv.id);

    // Populate actual exam results for pending volunteers concurrently
    const validIds = pendingVolunteers.map(v => v.id).filter(Boolean);
    const examResultsData = validIds.length > 0 
      ? await ExamResult.find({ studentId: { $in: validIds } }).populate('examId')
      : [];

    const allQualExams = await Exam.find({ 
      type: 'qualification', 
      isActive: true,
      ...(ngoId ? { ngoId } : {})
    });

    pendingVolunteers = pendingVolunteers.map(pv => {
      pv.examResults = [];

      if (!pv.teachingPreferences || pv.teachingPreferences.length === 0) {
        return pv;
      }

      for (const pref of pv.teachingPreferences) {
        for (const subject of (pref.subjects || [])) {
          const exam = allQualExams.find(e => {
            const examClass = parseInt(e.class);
            const prefClass = parseInt(pref.class);
            return examClass === prefClass && e.subject.toLowerCase() === subject.toLowerCase();
          });
          
          if (!exam) {
            pv.examResults.push({ id: null, class: pref.class, subject, percentage: 0, status: 'missing_exam' });
            continue;
          }
          
          const result = examResultsData.find(r => 
            r.studentId && pv.id && 
            r.studentId.toString() === pv.id.toString() && 
            r.examId?._id?.toString() === exam._id.toString()
          );
          
          let mcqTotal = 0;
          if (exam && exam.questions) {
            exam.questions.forEach(q => {
              if (q.type !== 'text') {
                mcqTotal += (q.marks || 1);
              }
            });
          }
          
          pv.examResults.push({
            id: result ? result._id : null,
            class: pref.class,
            subject,
            percentage: result ? result.percentage : 0,
            score: result ? result.score : 0,
            totalMarks: result ? mcqTotal : 0,
            status: result ? (result.percentage >= 60 ? 'passed' : 'failed') : 'pending'
          });
        }
      }
      return pv;
    });

    // Subject health overview across NGO
    const subjectDoubtCount = {};
    doubts.forEach(d => {
      subjectDoubtCount[d.subject] = (subjectDoubtCount[d.subject] || 0) + 1;
    });

    res.json({
      ngo: ngo ? { id: ngo._id, name: ngo.name, district: ngo.district, contactEmail: ngo.contactEmail } : null,
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
          : 0
      })),
      mentorLoad,
      pendingVolunteers,
      qualExams: allQualExams.map(e => ({ id: e._id, class: e.class, subject: e.subject })),
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

// GET /api/dashboard/volunteer — volunteer / peer_mentor dashboard
router.get('/volunteer', protect, authorize('volunteer', 'peer_mentor'), async (req, res) => {
  try {
    let volunteer;
    let assignedStudentIds = [];

    if (req.user.role === 'volunteer') {
      volunteer = await Volunteer.findOne({ userId: req.user._id });
      assignedStudentIds = volunteer?.studentIds || [];
    } else {
      volunteer = await PeerMentor.findOne({ userId: req.user._id });
      assignedStudentIds = volunteer?.juniorStudentIds || [];
    }

    const pendingDoubts = await Doubt.find({
      mentorId: req.user._id,
      status: { $in: ['pending', 'reopened'] }
    }).populate('studentId', 'name').sort({ createdAt: 1 });

    const upcomingSessions = await Session.find({
      volunteerId: req.user._id,
      status: 'scheduled'
    }).sort({ scheduledDate: 1 }).limit(5);

    const students = await Student.find({
      userId: { $in: assignedStudentIds }
    }).populate('userId', 'name');

    res.json({ volunteer, pendingDoubts, upcomingSessions, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
