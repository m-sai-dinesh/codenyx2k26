const Student = require('../models/Student');
const Session = require('../models/Session');
const { ExamResult } = require('../models/Exam');
const Doubt = require('../models/Doubt');
const { MentorReview } = require('../models/Progress');

/**
 * Evaluate if a student is at risk
 * Triggers:
 * 1. Attendance < 60% in last 2 weeks
 * 2. Exam score dropped 20%+ vs previous
 * 3. No activity in 3+ weeks
 * 4. Mentor review < 2 stars for 3 consecutive sessions
 * 5. Persistent weak topic unresolved 4+ weeks
 */
const evaluateAtRisk = async (studentId, ngoId) => {
  const reasons = [];
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);

  // 1. Attendance check
  const recentSessions = await Session.find({
    ngoId,
    scheduledDate: { $gte: twoWeeksAgo },
    status: 'completed',
    'attendance.studentId': studentId
  });

  if (recentSessions.length >= 3) {
    const attended = recentSessions.filter(s =>
      s.attendance.find(a => a.studentId.toString() === studentId.toString() && a.present)
    ).length;
    const attendancePct = (attended / recentSessions.length) * 100;
    if (attendancePct < 60) {
      reasons.push(`Low attendance: ${Math.round(attendancePct)}% in last 2 weeks`);
    }
  }

  // 2. Exam score drop
  const examResults = await ExamResult.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(2);

  if (examResults.length === 2) {
    const [latest, previous] = examResults;
    const drop = previous.percentage - latest.percentage;
    if (drop >= 20) {
      reasons.push(`Exam score dropped ${Math.round(drop)}% from last exam`);
    }
  }

  // 3. No activity check
  const lastDoubt = await Doubt.findOne({ studentId }).sort({ createdAt: -1 });
  const lastSession = await Session.findOne({
    'attendance.studentId': studentId,
    status: 'completed'
  }).sort({ scheduledDate: -1 });

  const lastActivity = lastDoubt?.createdAt || lastSession?.scheduledDate;
  if (!lastActivity || lastActivity < threeWeeksAgo) {
    reasons.push('No activity in 3+ weeks');
  }

  // 4. Low mentor reviews
  const recentReviews = await MentorReview.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(3);

  if (recentReviews.length === 3 && recentReviews.every(r => r.rating < 2)) {
    reasons.push('Mentor rated below 2★ for 3 consecutive sessions');
  }

  const isAtRisk = reasons.length > 0;

  // Update student record
  await Student.findOneAndUpdate(
    { userId: studentId },
    { isAtRisk, atRiskReasons: reasons }
  );

  return { isAtRisk, reasons };
};

/**
 * Detect persistent weak topics across exams
 * If student scores < 40% on same topic in 2+ exams → flag
 */
const detectPersistentWeakTopics = async (studentId) => {
  const results = await ExamResult.find({ studentId }).sort({ createdAt: -1 }).limit(5);

  const topicScores = {};
  for (const result of results) {
    for (const [topic, score] of result.topicBreakdown.entries()) {
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(score);
    }
  }

  const persistentWeak = [];
  for (const [topic, scores] of Object.entries(topicScores)) {
    const weakCount = scores.filter(s => s < 40).length;
    if (weakCount >= 2) persistentWeak.push(topic);
  }

  return persistentWeak;
};

module.exports = { evaluateAtRisk, detectPersistentWeakTopics };
