const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Exam, ExamResult } = require('../models/Exam');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');

// NOTE: Static routes must come before dynamic /:class route (Express 5 path-to-regexp v8)

// GET /api/diagnostic/diagnostic-result - Get student's diagnostic result
router.get('/diagnostic-result', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const result = await ExamResult.findOne({
      studentId: req.user._id,
    }).populate('examId', 'title subject class').sort({ submittedAt: -1 });

    if (!result) {
      return res.status(404).json({ error: 'No diagnostic result found' });
    }

    res.json({
      result: {
        exam: result.examId,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        topicBreakdown: result.topicBreakdown,
        weakTopics: result.weakTopics,
        weakSubjects: student.weakSubjects || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diagnostic/select-subjects - Student selects subjects for mentoring
router.post('/select-subjects', protect, async (req, res) => {
  try {
    const { selectedSubjects } = req.body;
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.diagnosticTaken) {
      return res.status(400).json({ error: 'Please complete the diagnostic exam first' });
    }

    const allSubjects = [...new Set([...student.weakSubjects, ...selectedSubjects])];
    student.subjectsForMentoring = allSubjects;
    student.needsMentorMapping = true;
    await student.save();

    const mappingResult = await autoMapStudentToMentors(student, allSubjects);

    res.json({
      message: 'Subjects selected successfully',
      subjects: allSubjects,
      mappings: mappingResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/diagnostic/pending-mappings - Get all students needing manual mentor assignment
router.get('/pending-mappings', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const students = await Student.find({
      ngoId: req.user.ngoId,
      needsMentorMapping: true,
      $or: [
        { pendingSubjects: { $exists: true, $ne: [] } },
        { mentorIds: { $size: 0 } }
      ]
    }).populate('userId', 'name email');

    const pendingMappings = await Promise.all(students.map(async (student) => {
      const volunteerIds = student.mentorIds || [];
      const volunteers = await Volunteer.find({
        userId: { $in: volunteerIds }
      }).populate('userId', 'name');

      return {
        studentId: student.userId._id,
        studentName: student.userId.name,
        studentEmail: student.userId.email,
        class: student.class,
        district: student.district,
        subjectsForMentoring: student.subjectsForMentoring || student.weakSubjects || [],
        pendingSubjects: student.pendingSubjects || [],
        currentMentors: volunteers.map(v => ({
          id: v.userId._id,
          name: v.userId.name
        }))
      };
    }));

    res.json({ pendingMappings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diagnostic/assign-mentor - NGO manually assigns mentor to student
router.post('/assign-mentor', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const { studentId, volunteerId, subjects } = req.body;

    const student = await Student.findOne({ userId: studentId }).populate('userId', 'name email');
    const volunteer = await Volunteer.findOne({ userId: volunteerId }).populate('userId', 'name email');

    if (!student || !volunteer) {
      return res.status(404).json({ error: 'Student or volunteer not found' });
    }

    const currentStudentCount = volunteer.studentIds?.length || 0;
    const capacity = volunteer.capacity || 15;

    if (currentStudentCount >= capacity) {
      return res.status(400).json({ error: 'Volunteer has reached maximum capacity' });
    }

    if (!volunteer.studentIds.some(id => id.toString() === studentId.toString())) {
      volunteer.studentIds.push(studentId);
    }

    if (!student.mentorIds) student.mentorIds = [];
    if (!student.mentorIds.some(id => id.toString() === volunteerId.toString())) {
      student.mentorIds.push(volunteerId);
    }

    if (student.pendingSubjects) {
      student.pendingSubjects = student.pendingSubjects.filter(s => !subjects.includes(s));
    }

    if (!student.pendingSubjects || student.pendingSubjects.length === 0) {
      student.needsMentorMapping = false;
    }

    await volunteer.save();
    await student.save();

    res.json({
      message: 'Mentor assigned successfully',
      student: {
        id: studentId,
        name: student.userId.name,
        assignedSubjects: subjects
      },
      volunteer: {
        id: volunteerId,
        name: volunteer.userId.name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/diagnostic/available-mentors/:class/:subject - Get mentors for a class/subject
router.get('/available-mentors/:class/:subject', protect, authorize('ngo_admin'), async (req, res) => {
  try {
    const { class: studentClass, subject } = req.params;

    const mentors = await Volunteer.find({
      isApproved: true,
      'teachingPreferences.class': parseInt(studentClass),
      'teachingPreferences.subjects': subject,
      ngoId: req.user.ngoId
    }).populate('userId', 'name email').select('userId teachingPreferences capacity studentCount');

    const formattedMentors = mentors.map(m => ({
      id: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      capacity: m.capacity || 15,
      currentStudents: m.studentCount || 0,
      availableSlots: (m.capacity || 15) - (m.studentCount || 0),
      subjects: m.teachingPreferences.map(p => p.subjects).flat()
    }));

    res.json({ mentors: formattedMentors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diagnostic/:examId/submit - Submit diagnostic exam
router.post('/:examId/submit', protect, async (req, res) => {
  try {
    const { answers } = req.body;
    const exam = await Exam.findById(req.params.examId);

    if (!exam || exam.type !== 'diagnostic') {
      return res.status(404).json({ error: 'Diagnostic exam not found' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student.class !== exam.class) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const topicScores = {};
    const topicTotals = {};
    let totalScore = 0;

    exam.questions.forEach((q, idx) => {
      const answer = answers.find(a => a.questionIndex === idx);
      let marks = 0;

      if (q.type === 'mcq' && answer) {
        marks = answer.selectedOption === q.correctAnswer ? q.marks : 0;
      }

      totalScore += marks;

      if (!topicScores[q.topic]) {
        topicScores[q.topic] = 0;
        topicTotals[q.topic] = 0;
      }
      topicScores[q.topic] += marks;
      topicTotals[q.topic] += q.marks;
    });

    const topicBreakdown = {};
    const weakTopics = [];

    Object.keys(topicScores).forEach(topic => {
      const percentage = (topicScores[topic] / topicTotals[topic]) * 100;
      topicBreakdown[topic] = Math.round(percentage);
      if (percentage < 60) weakTopics.push(topic);
    });

    const weakSubjects = exam.subject ? [exam.subject] : [];

    const result = await ExamResult.create({
      examId: exam._id,
      studentId: req.user._id,
      ngoId: student.ngoId,
      answers,
      score: totalScore,
      totalMarks: exam.totalMarks,
      percentage: Math.round((totalScore / exam.totalMarks) * 100),
      topicBreakdown,
      weakTopics
    });

    student.diagnosticTaken = true;
    student.weakSubjects = weakSubjects;
    student.needsMentorMapping = true;
    await student.save();

    res.json({
      result: {
        score: totalScore,
        totalMarks: exam.totalMarks,
        percentage: result.percentage,
        topicBreakdown,
        weakTopics,
        weakSubjects
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/diagnostic/:class - Get diagnostic exam for a class (dynamic — must be last)
router.get('/:class', protect, async (req, res) => {
  try {
    const studentClass = parseInt(req.params.class);
    if (isNaN(studentClass)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const student = await Student.findOne({ userId: req.user._id });

    if (!student || student.class !== studentClass) {
      return res.status(403).json({ error: 'Unauthorized access to diagnostic exam' });
    }

    const exams = await Exam.find({
      type: 'diagnostic',
      class: studentClass,
      isActive: true
    }).populate('creatorId', 'name');

    if (exams.length === 0) {
      return res.status(404).json({ error: 'No diagnostic exam available for your class yet. Please contact your NGO.' });
    }

    const existingResults = await ExamResult.find({
      studentId: req.user._id,
      examId: { $in: exams.map(e => e._id) }
    });

    if (existingResults.length > 0) {
      return res.status(400).json({ error: 'You have already completed the diagnostic exam.' });
    }

    const exam = exams[0];
    const examForStudent = {
      _id: exam._id,
      title: exam.title,
      subject: exam.subject,
      class: exam.class,
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      questions: exam.questions.map(q => ({
        text: q.text,
        topic: q.topic,
        type: q.type,
        options: q.options,
        marks: q.marks
      }))
    };

    res.json({ exam: examForStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-map student to mentors based on subjects and class
async function autoMapStudentToMentors(student, subjects) {
  const mappings = [];
  const pendingSubjects = [];

  for (const subject of subjects) {
    const volunteers = await Volunteer.find({
      isApproved: true,
      'teachingPreferences.subjects': subject,
      'teachingPreferences.class': student.class
    }).populate('userId', 'name email');

    const availableVolunteers = volunteers.filter(v => {
      const capacity = v.capacity || 15;
      const currentCount = v.studentIds?.length || 0;
      return currentCount < capacity;
    });

    if (availableVolunteers.length > 0) {
      availableVolunteers.sort((a, b) => ((a.studentIds?.length || 0) - (b.studentIds?.length || 0)));
      const selectedVolunteer = availableVolunteers[0];

      if (!selectedVolunteer.studentIds.includes(student.userId)) {
        selectedVolunteer.studentIds.push(student.userId);
        await selectedVolunteer.save();
      }

      if (!student.mentorIds) student.mentorIds = [];
      if (!student.mentorIds.includes(selectedVolunteer.userId._id)) {
        student.mentorIds.push(selectedVolunteer.userId._id);
      }

      mappings.push({
        subject,
        volunteer: {
          id: selectedVolunteer.userId._id,
          name: selectedVolunteer.userId.name
        }
      });
    } else {
      pendingSubjects.push(subject);
    }
  }

  if (pendingSubjects.length > 0) {
    student.pendingSubjects = pendingSubjects;
    await student.save();
  }

  await student.save();

  return {
    mapped: mappings,
    pending: pendingSubjects
  };
}

module.exports = router;
