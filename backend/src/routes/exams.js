const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Exam, ExamResult } = require('../models/Exam');
const Student = require('../models/Student');
const { detectPersistentWeakTopics } = require('../utils/atRiskDetector');

// POST /api/exams — volunteer creates exam
router.post('/', protect, authorize('volunteer'), async (req, res) => {
  try {
    if (!req.body.questions || req.body.questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required and cannot be empty' });
    }
    
    const totalMarks = req.body.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const exam = await Exam.create({
      volunteerId: req.user._id,
      ngoId: req.user.ngoId,
      totalMarks,
      ...req.body
    });
    res.status(201).json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/exams/active — student gets active exams for their class
router.get('/active', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const filter = { isActive: true };
    if (req.user.ngoId) filter.ngoId = req.user.ngoId;
    if (student?.class) filter.class = student.class;
    const exams = await Exam.find(filter);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exams/:id/submit
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const { answers } = req.body; // [{ questionIndex, selectedOption }]
    let score = 0;
    const topicBreakdown = {};
    const topicTotal = {};

    exam.questions.forEach((q, i) => {
      const ans = answers.find(a => a.questionIndex === i);
      const isCorrect = ans && ans.selectedOption === q.correctAnswer;
      if (isCorrect) score += q.marks || 1;

      // Topic breakdown
      if (!topicBreakdown[q.topic]) {
        topicBreakdown[q.topic] = 0;
        topicTotal[q.topic] = 0;
      }
      topicTotal[q.topic] += q.marks || 1;
      if (isCorrect) topicBreakdown[q.topic] += q.marks || 1;
    });

    // Convert to percentages
    const topicPercentages = {};
    for (const topic in topicBreakdown) {
      topicPercentages[topic] = Math.round((topicBreakdown[topic] / topicTotal[topic]) * 100);
    }

    const weakTopics = Object.entries(topicPercentages)
      .filter(([, pct]) => pct < 40)
      .map(([topic]) => topic);

    const percentage = exam.totalMarks > 0 ? Math.round((score / exam.totalMarks) * 100) : 0;

    const result = await ExamResult.create({
      examId: exam._id,
      studentId: req.user._id,
      ngoId: req.user.ngoId,
      answers,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      topicBreakdown: topicPercentages,
      weakTopics,
    });

    // Update student diagnostic if this is diagnostic exam
    if (exam.type === 'diagnostic') {
      await Student.findOneAndUpdate({ userId: req.user._id }, {
        diagnosticScore: percentage,
        diagnosticCompleted: true,
        $addToSet: { weakSubjects: exam.subject },
        isPeerMentorCandidate: percentage >= 85
      });
    }

    // Detect persistent weak topics
    const persistentWeak = await detectPersistentWeakTopics(req.user._id);

    res.json({ result, persistentWeakTopics: persistentWeak });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/exams/results/my — student's results history
router.get('/results/my', protect, authorize('student'), async (req, res) => {
  try {
    const results = await ExamResult.find({ studentId: req.user._id })
      .populate('examId', 'title subject type')
      .sort({ createdAt: 1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
