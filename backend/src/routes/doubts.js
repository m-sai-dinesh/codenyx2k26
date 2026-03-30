const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');
const Doubt = require('../models/Doubt');
const Student = require('../models/Student');

// Cloudinary storage for doubt images
const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'edureach/doubts', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/doubts — raise a doubt
router.post('/', protect, authorize('student'), upload.single('image'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student?.mentorId) return res.status(400).json({ error: 'No mentor assigned yet' });

    const doubt = await Doubt.create({
      studentId: req.user._id,
      mentorId: student.mentorId,
      ngoId: student.ngoId,
      subject: req.body.subject,
      topic: req.body.topic,
      question: req.body.question,
      imageUrl: req.file?.path || null,
      imagePublicId: req.file?.filename || null,
    });

    res.status(201).json(doubt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/doubts/my — student's doubts
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const doubts = await Doubt.find({ studentId: req.user._id })
      .populate('mentorId', 'name role')
      .sort({ createdAt: -1 });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/doubts/pending — mentor sees pending doubts
router.get('/pending', protect, authorize('volunteer', 'peer_mentor'), async (req, res) => {
  try {
    const doubts = await Doubt.find({
      mentorId: req.user._id,
      status: { $in: ['pending', 'reopened'] }
    }).populate('studentId', 'name').sort({ createdAt: 1 });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/doubts/:id/answer — mentor answers
router.put('/:id/answer', protect, authorize('volunteer', 'peer_mentor'), upload.single('answerImage'), async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ error: 'Doubt not found' });

    const responseTime = Math.round((Date.now() - new Date(doubt.createdAt)) / 60000);

    await doubt.updateOne({
      answer: req.body.answer,
      answerImageUrl: req.file?.path || null,
      answerImagePublicId: req.file?.filename || null,
      status: 'answered',
      answeredAt: new Date(),
      responseTimeMinutes: responseTime,
    });

    res.json({ message: 'Answered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/doubts/:id/resolve
router.put('/:id/resolve', protect, authorize('student'), async (req, res) => {
  try {
    await Doubt.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      resolvedAt: new Date()
    });
    res.json({ message: 'Marked as resolved' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/doubts/:id/escalate — peer mentor escalates to volunteer
router.put('/:id/escalate', protect, authorize('peer_mentor'), async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    const PeerMentor = require('../models/PeerMentor');
    const pm = await PeerMentor.findOne({ userId: req.user._id });

    await doubt.updateOne({
      escalatedFrom: req.user._id,
      mentorId: pm.volunteerId,
      isEscalated: true,
      status: 'pending'
    });

    res.json({ message: 'Escalated to volunteer' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
