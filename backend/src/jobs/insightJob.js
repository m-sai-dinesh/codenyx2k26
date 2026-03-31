const cron = require('node-cron');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Student = require('../models/Student');
const { ExamResult } = require('../models/Exam');
const Session = require('../models/Session');
const Doubt = require('../models/Doubt');
const StudentInsight = require('../models/StudentInsight');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ── Collect all data needed for one student ───────────────────────────────────
async function collectStudentData(studentUserId) {
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const [examResults, sessions, doubts] = await Promise.all([
    ExamResult.find({ studentId: studentUserId })
      .populate('examId', 'subject')
      .sort({ submittedAt: -1 })
      .limit(4)
      .lean(),
    Session.find({
      scheduledDate: { $gte: fourWeeksAgo },
      status: 'completed',
      'attendance.studentId': studentUserId
    }).lean(),
    Doubt.find({ studentId: studentUserId, createdAt: { $gte: fourWeeksAgo } }).lean()
  ]);

  const attended = sessions.filter(s =>
    s.attendance.some(a => a.studentId.toString() === studentUserId.toString() && a.present)
  ).length;

  const doubtCountBySubject = {};
  doubts.forEach(d => {
    doubtCountBySubject[d.subject] = (doubtCountBySubject[d.subject] || 0) + 1;
  });

  return {
    examResults: examResults.reverse(), // oldest → newest for trend
    attended,
    totalSessions: sessions.length,
    doubtCountBySubject
  };
}

// ── Check if student has enough data to send to Gemini ───────────────────────
function hasInsufficientData(student, collected) {
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return collected.examResults.length === 0 || accountAgeDays < 14;
}

// ── Token-optimized prompt (~150–200 tokens per student) ─────────────────────
function buildPrompt(student, collected) {
  const exams = collected.examResults.map(r => ({
    s: r.examId?.subject || 'General',
    pct: r.percentage || 0,
    weak: r.weakTopics || []
  }));

  const data = {
    cls: student.class,
    exams,
    att: { ok: collected.attended, total: collected.totalSessions },
    doubts: collected.doubtCountBySubject
  };

  return `Respond with JSON only. No markdown. No explanation.
Data:${JSON.stringify(data)}
Schema:{"riskLevel":"low|medium|high","riskScore":0-100,"trendSummary":"max 20 words","weakSubjects":[],"subjectTrends":[{"subject":"","trend":"improving|stable|declining","avgScore":0}],"recommendations":["max 12 words","max 12 words"],"attendanceFlagged":bool}
Rules: riskScore 0-30=low,31-65=medium,66-100=high. attendanceFlagged=true if att.total>0 and att.ok/att.total<0.6.`;
}

// ── Call Gemini and parse JSON ────────────────────────────────────────────────
async function callGemini(prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  // Strip accidental markdown fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleaned);

  const validRisk = ['low', 'medium', 'high'];
  if (!validRisk.includes(parsed.riskLevel)) {
    throw new Error(`Invalid riskLevel: ${parsed.riskLevel}`);
  }

  return parsed;
}

// ── Hash collected data to detect changes since last run ─────────────────────
function computeDataHash(student, collected) {
  const payload = JSON.stringify({
    class: student.class,
    exams: collected.examResults.map(r => ({ id: r._id, pct: r.percentage })),
    attended: collected.attended,
    totalSessions: collected.totalSessions,
    doubts: collected.doubtCountBySubject
  });
  return crypto.createHash('md5').update(payload).digest('hex');
}

// ── Save insight record (upsert — one per student) ───────────────────────────
async function saveInsight(studentUserId, ngoId, fields) {
  await StudentInsight.findOneAndUpdate(
    { studentId: studentUserId },
    { studentId: studentUserId, ngoId, ...fields, generatedAt: new Date() },
    { upsert: true, returnDocument: 'after' }
  );
}

// ── Process a single student ──────────────────────────────────────────────────
async function processStudent(student) {
  const userId = student.userId;
  const ngoId = student.ngoId;

  try {
    const collected = await collectStudentData(userId);
    const dataHash = computeDataHash(student, collected);

    // Skip Gemini call if data hasn't changed since last run
    const existing = await StudentInsight.findOne({ studentId: userId }).select('dataHash').lean();
    if (existing?.dataHash && existing.dataHash === dataHash) {
      console.log(`[InsightJob] ↷ Skipped ${userId} — no new data`);
      return;
    }

    if (hasInsufficientData(student, collected)) {
      await saveInsight(userId, ngoId, {
        riskLevel: 'low',
        riskScore: 0,
        trendSummary: 'Insufficient data — student is too new or has not taken any exams yet.',
        weakSubjects: [],
        subjectTrends: [],
        recommendations: [],
        attendanceFlagged: false,
        insufficientData: true,
        dataHash,
        dataSnapshot: {
          examCount: collected.examResults.length,
          attendedSessions: collected.attended,
          totalSessions: collected.totalSessions,
          doubtCountBySubject: collected.doubtCountBySubject
        }
      });
      return;
    }

    const prompt = buildPrompt(student, collected);
    const parsed = await callGemini(prompt);

    await saveInsight(userId, ngoId, {
      riskLevel: parsed.riskLevel,
      riskScore: Math.max(0, Math.min(100, parseInt(parsed.riskScore) || 0)),
      trendSummary: parsed.trendSummary || '',
      weakSubjects: Array.isArray(parsed.weakSubjects) ? parsed.weakSubjects : [],
      subjectTrends: Array.isArray(parsed.subjectTrends) ? parsed.subjectTrends : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      attendanceFlagged: Boolean(parsed.attendanceFlagged),
      insufficientData: false,
      dataHash,
      dataSnapshot: {
        examCount: collected.examResults.length,
        attendedSessions: collected.attended,
        totalSessions: collected.totalSessions,
        doubtCountBySubject: collected.doubtCountBySubject
      }
    });

    console.log(`[InsightJob] ✓ Student ${userId} — risk: ${parsed.riskLevel} (${parsed.riskScore})`);
  } catch (err) {
    // One failure must never stop the loop
    console.error(`[InsightJob] ✗ Failed for student ${userId}:`, err.message);
  }
}

// ── Track job status so the dashboard can poll it ────────────────────────────
let jobStatus = { running: false, lastStarted: null, lastCompleted: null, processed: 0, skipped: 0, total: 0 };

function getJobStatus() { return { ...jobStatus }; }

// ── Main job: fetch all students, process one by one ─────────────────────────
async function runInsightJob() {
  if (jobStatus.running) {
    console.log('[InsightJob] Already running — skipping duplicate trigger');
    return;
  }

  jobStatus = { running: true, lastStarted: new Date(), lastCompleted: null, processed: 0, skipped: 0, total: 0 };
  console.log(`[InsightJob] Starting at ${new Date().toISOString()}`);

  try {
    const students = await Student.find({})
      .select('userId ngoId class createdAt')
      .lean();

    jobStatus.total = students.length;
    console.log(`[InsightJob] ${students.length} students to check`);

    for (const student of students) {
      await processStudent(student);
      jobStatus.processed++;
      await delay(500); // 0.5s is safe for Flash Lite paid tier
    }

    jobStatus.running = false;
    jobStatus.lastCompleted = new Date();
    console.log(`[InsightJob] Done — ${jobStatus.total} checked at ${new Date().toISOString()}`);
  } catch (err) {
    jobStatus.running = false;
    console.error('[InsightJob] Fatal error:', err.message);
  }
}

// ── Register cron: midnight IST every day ─────────────────────────────────────
function scheduleInsightJob() {
  cron.schedule('0 0 * * *', runInsightJob, { timezone: 'Asia/Kolkata' });
  console.log('[InsightJob] Scheduled — runs at 00:00 IST daily');
}

module.exports = { scheduleInsightJob, runInsightJob, getJobStatus };
