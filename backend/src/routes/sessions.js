const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Session = require('../models/Session');
const Student = require('../models/Student');

// POST /api/sessions — volunteer or peer_mentor creates session
router.post('/', protect, authorize('volunteer', 'peer_mentor'), async (req, res) => {
  try {
    const session = await Session.create({
      volunteerId: req.user._id,
      ngoId: req.user.ngoId,
      ...req.body
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sessions/my
router.get('/my', protect, async (req, res) => {
  try {
    let sessions;
    if (req.user.role === 'volunteer' || req.user.role === 'peer_mentor') {
      sessions = await Session.find({ volunteerId: req.user._id }).sort({ scheduledDate: -1 });
    } else {
      sessions = await Session.find({
        'attendance.studentId': req.user._id,
      }).sort({ scheduledDate: -1 });
    }
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sessions/:id/attendance — mark attendance
router.put('/:id/attendance', protect, authorize('volunteer'), async (req, res) => {
  try {
    const { attendance } = req.body; // [{ studentId, present }]
    await Session.findByIdAndUpdate(req.params.id, {
      attendance,
      status: 'completed'
    });

    // Update each student's attendance count
    for (const record of attendance) {
      await Student.findOneAndUpdate(
        { userId: record.studentId },
        {
          $inc: {
            attendanceCount: record.present ? 1 : 0,
            totalSessions: 1
          }
        }
      );
    }

    res.json({ message: 'Attendance marked' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/sessions/:id/notes — post session notes
router.put('/:id/notes', protect, authorize('volunteer', 'peer_mentor'), async (req, res) => {
  try {
    await Session.findByIdAndUpdate(req.params.id, {
      notes: req.body.notes,
      keyPoints: req.body.keyPoints,
      assignments: req.body.assignments,
      recordingDriveLink: req.body.recordingDriveLink,
      notesPublished: true,
      notesPublishedAt: new Date()
    });
    res.json({ message: 'Notes published' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
