const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const StudentInsight = require('../models/StudentInsight');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const PeerMentor = require('../models/PeerMentor');
const User = require('../models/User');
const { runInsightJob, getJobStatus } = require('../jobs/insightJob');

// GET /api/insights/ngo — NGO admin sees risk overview + high-risk student cards
router.get('/ngo', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const ngoId = req.user.ngoId;
    const filter = ngoId ? { ngoId } : {};

    // All insights sorted newest first
    const insights = await StudentInsight.find(filter)
      .sort({ generatedAt: -1 })
      .lean();

    // Deduplicate: one latest insight per student
    const seen = new Set();
    const latest = [];
    for (const ins of insights) {
      const sid = ins.studentId?.toString();
      if (sid && !seen.has(sid)) {
        seen.add(sid);
        latest.push(ins);
      }
    }

    // Fetch student names for display
    const studentUserIds = latest.map(i => i.studentId);
    const users = await User.find({ _id: { $in: studentUserIds } }).select('name').lean();
    const nameMap = {};
    users.forEach(u => { nameMap[u._id.toString()] = u.name; });

    // Risk distribution counts
    const distribution = { low: 0, medium: 0, high: 0 };
    latest.forEach(ins => {
      if (!ins.insufficientData) distribution[ins.riskLevel]++;
    });

    // High-risk cards
    const highRisk = latest
      .filter(ins => ins.riskLevel === 'high' && !ins.insufficientData)
      .sort((a, b) => b.riskScore - a.riskScore)
      .map(ins => ({
        studentId: ins.studentId,
        name: nameMap[ins.studentId?.toString()] || 'Unknown',
        riskScore: ins.riskScore,
        trendSummary: ins.trendSummary,
        weakSubjects: ins.weakSubjects,
        recommendations: ins.recommendations,
        attendanceFlagged: ins.attendanceFlagged,
        generatedAt: ins.generatedAt
      }));

    // Medium-risk cards (for the dashboard secondary list)
    const mediumRisk = latest
      .filter(ins => ins.riskLevel === 'medium' && !ins.insufficientData)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
      .map(ins => ({
        studentId: ins.studentId,
        name: nameMap[ins.studentId?.toString()] || 'Unknown',
        riskScore: ins.riskScore,
        trendSummary: ins.trendSummary,
        weakSubjects: ins.weakSubjects,
        attendanceFlagged: ins.attendanceFlagged
      }));

    const lastRun = latest.length > 0 ? latest[0].generatedAt : null;

    res.json({
      distribution,
      highRisk,
      mediumRisk,
      totalAnalyzed: latest.filter(i => !i.insufficientData).length,
      totalStudents: latest.length,
      lastRun
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/volunteer — Volunteer/peer_mentor sees insights for their assigned students only
router.get('/volunteer', protect, authorize('volunteer', 'peer_mentor'), async (req, res) => {
  try {
    let assignedUserIds = [];

    if (req.user.role === 'volunteer') {
      const vol = await Volunteer.findOne({ userId: req.user._id }).lean();
      assignedUserIds = vol?.studentIds || [];
    } else {
      const pm = await PeerMentor.findOne({ userId: req.user._id }).lean();
      assignedUserIds = pm?.juniorStudentIds || [];
    }

    if (assignedUserIds.length === 0) return res.json({ students: [] });

    // Latest insight per assigned student
    const insights = await StudentInsight.find({ studentId: { $in: assignedUserIds } })
      .sort({ generatedAt: -1 })
      .lean();

    const seen = new Set();
    const latest = [];
    for (const ins of insights) {
      const sid = ins.studentId?.toString();
      if (sid && !seen.has(sid)) {
        seen.add(sid);
        latest.push(ins);
      }
    }

    // Fetch student names
    const users = await User.find({ _id: { $in: assignedUserIds } }).select('name').lean();
    const nameMap = {};
    users.forEach(u => { nameMap[u._id.toString()] = u.name; });

    const result = latest.map(ins => ({
      studentId: ins.studentId,
      name: nameMap[ins.studentId?.toString()] || 'Unknown',
      riskLevel: ins.riskLevel,
      riskScore: ins.riskScore,
      trendSummary: ins.trendSummary,
      weakSubjects: ins.weakSubjects,
      subjectTrends: ins.subjectTrends,
      recommendations: ins.recommendations,
      attendanceFlagged: ins.attendanceFlagged,
      insufficientData: ins.insufficientData,
      dataSnapshot: ins.dataSnapshot,
      generatedAt: ins.generatedAt
    }));

    res.json({ students: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/insights/run-now — manually trigger the nightly job (fire and forget)
router.post('/run-now', protect, authorize('ngo_admin'), (req, res) => {
  const status = getJobStatus();
  if (status.running) {
    return res.status(409).json({ error: 'Job is already running', status });
  }
  runInsightJob(); // fire and forget — does not block the response
  res.json({ message: 'Insight job started', startedAt: new Date() });
});

// GET /api/insights/status — poll job progress
router.get('/status', protect, authorize('ngo_admin'), (req, res) => {
  res.json(getJobStatus());
});

module.exports = router;
