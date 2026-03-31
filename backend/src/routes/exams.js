const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Exam, ExamResult } = require('../models/Exam');
const Student = require('../models/Student');
const { detectPersistentWeakTopics } = require('../utils/atRiskDetector');

// GET /api/diagnostic/:class — get diagnostic exam for a student by class
router.get('/diagnostic/:class', protect, async (req, res) => {
  try {
    const studentClass = parseInt(req.params.class);
    const studentId = req.user._id;
    
    // Get student's NGO ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Find all active diagnostic exams for this class from the student's NGO
    const diagnosticExams = await Exam.find({
      type: 'diagnostic',
      class: studentClass,
      isActive: true,
      ngoId: student.ngoId
    }).sort({ subject: 1 });
    
    if (diagnosticExams.length === 0) {
      return res.status(404).json({ error: 'No diagnostic exams found for this class' });
    }
    
    // Check if student has already taken any of these exams
    const takenExams = await ExamResult.find({
      studentId: studentId,
      examId: { $in: diagnosticExams.map(e => e._id) }
    });
    
    if (takenExams.length > 0) {
      return res.status(400).json({ error: 'You have already taken the diagnostic exam' });
    }
    
    // Combine all diagnostic exams into a single exam structure
    const combinedExam = {
      _id: diagnosticExams[0]._id, // Use first exam ID as primary
      title: `Diagnostic Test - Class ${studentClass}`,
      subject: 'All Subjects',
      class: studentClass,
      type: 'diagnostic',
      durationMinutes: diagnosticExams.reduce((sum, e) => sum + (e.durationMinutes || 30), 0),
      questions: diagnosticExams.flatMap(e => 
        e.questions.map(q => ({
          ...q.toObject(),
          subject: e.subject,
          examId: e._id
        }))
      ),
      totalMarks: diagnosticExams.reduce((sum, e) => sum + (e.totalMarks || 0), 0)
    };
    
    res.json({ exam: combinedExam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exams — volunteer or ngo_admin creates exam
router.post('/', protect, authorize('volunteer', 'ngo_admin'), async (req, res) => {
  try {
    if (!req.body.questions || req.body.questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required and cannot be empty' });
    }

    if (req.user.role === 'volunteer') {
      if (req.body.type === 'qualification') {
        return res.status(403).json({ error: 'Volunteers cannot create qualification exams' });
      }

      const reqClass = parseInt(req.body.class);
      const reqSubject = req.body.subject;

      const qualExams = await Exam.find({ 
        type: 'qualification', 
        class: reqClass, 
        isActive: true,
        ...(req.user.ngoId ? { ngoId: req.user.ngoId } : {})
      });
      
      const qualExam = qualExams.find(e => e.subject.toLowerCase() === reqSubject.toLowerCase());

      let isApprovedForSubject = false;
      if (qualExam) {
         const result = await ExamResult.findOne({ 
           studentId: req.user._id, 
           examId: qualExam._id, 
           percentage: { $gte: 60 } 
         });
         if (result) isApprovedForSubject = true;
      }

      if (!isApprovedForSubject) {
         return res.status(403).json({ error: 'You can only make tests and recruit for subjects you got approved for (passed qualification).' });
      }
    }
    
    const totalMarks = req.body.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const exam = await Exam.create({
      creatorId: req.user._id,
      ngoId: req.user.ngoId,
      totalMarks,
      ...req.body
    });
    res.status(201).json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/exams/qualification/required — volunteer gets qualification exams based on teachingPreferences
router.get('/qualification/required', protect, authorize('volunteer'), async (req, res) => {
  try {
    const volunteer = await require('../models/Volunteer').findOne({ userId: req.user._id });
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

    // Build list of required exams
    // For every {class, subjects: []} in teachingPreferences, find exams with type: qualification, class, subject
    const requiredExams = [];
    const preferences = volunteer.teachingPreferences || [];
    
    const ngoId = req.user.ngoId;
    const allQualExams = await Exam.find({ 
      type: 'qualification', 
      isActive: true,
      ...(ngoId ? { ngoId } : {})
    });
    const myResults = await ExamResult.find({ studentId: req.user._id }).populate('examId');

    for (const pref of preferences) {
      for (const subject of pref.subjects) {
        // Find if ngo admin created a qualification exam for this
        const exam = allQualExams.find(e => parseInt(e.class) === parseInt(pref.class) && e.subject.toLowerCase() === subject.toLowerCase());
        if (exam) {
          const result = myResults.find(r => r.examId && r.examId._id.toString() === exam._id.toString());
          requiredExams.push({
            exam,
            status: result ? (result.percentage >= 60 ? 'passed' : 'failed') : 'pending',
            score: result ? result.percentage : null
          });
        }
      }
    }

    res.json(requiredExams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exams/active — student gets active exams for their class
router.get('/active', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const filter = { 
      isActive: true,
      type: { $in: ['diagnostic', 'weekly', 'monthly'] }
    };
    if (req.user.ngoId) filter.ngoId = req.user.ngoId;
    if (student?.class) filter.class = student.class;
    const exams = await Exam.find(filter);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exams/:id — fetch a single exam by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('creatorId', 'name');
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.ngoId && exam.ngoId.toString() !== req.user.ngoId?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exams/:id/submit — students and volunteers can submit
router.post('/:id/submit', protect, authorize('student', 'volunteer'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const { answers } = req.body; // [{ questionIndex, selectedOption, textResponse }]
    let score = 0;
    let totalAutoGradedMarks = 0;
    const topicBreakdown = {};
    const topicTotal = {};

    exam.questions.forEach((q, i) => {
      const ans = answers.find(a => a.questionIndex === i);
      
      if (q.type === 'text') {
        // Text questions are manually graded, exclude from auto-score percentage
        return;
      }

      totalAutoGradedMarks += q.marks || 1;
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

    const percentage = totalAutoGradedMarks > 0 ? Math.round((score / totalAutoGradedMarks) * 100) : 0;

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

    // Update student diagnostic if this is diagnostic exam (only for students)
    if (exam.type === 'diagnostic' && req.user.role === 'student') {
      await Student.findOneAndUpdate({ userId: req.user._id }, {
        diagnosticScore: percentage,
        diagnosticCompleted: true,
        $addToSet: { weakSubjects: exam.subject },
        isPeerMentorCandidate: percentage >= 85
      });
    }

    // Detect persistent weak topics (only meaningful for students)
    const persistentWeak = req.user.role === 'student' ? await detectPersistentWeakTopics(req.user._id) : [];

    res.json({ result, persistentWeakTopics: persistentWeak });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/exams — list all exams with optional type filter
router.get('/', protect, async (req, res) => {
  try {
    const { type, class: cls, subject } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (cls) filter.class = parseInt(cls);
    if (subject) filter.subject = subject;
    
    // NGO admin sees their own exams
    if (req.user.ngoId) {
      filter.ngoId = req.user.ngoId;
    }
    
    const exams = await Exam.find(filter)
      .populate('creatorId', 'name')
      .sort({ class: 1, subject: 1, createdAt: -1 });
    
    res.json({ exams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PUT /api/exams/:id — update exam (NGO admin only)
router.put('/:id', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // Check ownership
    if (exam.ngoId && exam.ngoId.toString() !== req.user.ngoId?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { title, questions, durationMinutes, isActive } = req.body;
    
    if (questions && questions.length > 0) {
      exam.questions = questions;
      exam.totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    }
    
    if (title) exam.title = title;
    if (durationMinutes) exam.durationMinutes = durationMinutes;
    if (isActive !== undefined) exam.isActive = isActive;
    
    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/exams/:id — delete exam (NGO admin only)
router.delete('/:id', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // Check ownership
    if (exam.ngoId && exam.ngoId.toString() !== req.user.ngoId?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exams/results/my — student's results history (MUST be before :id route)
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

// GET /api/exams/results/:id — NGO Admin or Volunteer reviews a specific result
router.get('/results/:id', protect, authorize('ngo_admin', 'volunteer', 'peer_mentor'), async (req, res) => {
  try {
    const result = await ExamResult.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('examId');
    if (!result) return res.status(404).json({ error: 'Result not found' });
    if (req.user.role === 'ngo_admin' && result.ngoId && result.ngoId.toString() !== req.user.ngoId?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
