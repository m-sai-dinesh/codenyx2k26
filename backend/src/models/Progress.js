const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  subject: { type: String, required: true },
  week: { type: Number, required: true }, // week number since joining
  resolvedDoubts: { type: Number, default: 0 },
  reopenedDoubts: { type: Number, default: 0 },
  examScore: { type: Number },
  examPercentage: { type: Number },
  weakTopics: [{ type: String }],
  persistentWeakTopics: [{ type: String }], // flagged after 2+ exams
  confidenceScore: { type: Number, min: 1, max: 5 }, // from weekly check-in
  healthStatus: {
    type: String,
    enum: ['red', 'yellow', 'green'],
    default: 'yellow'
  }
}, { timestamps: true });

// Weekly check-in model
const weeklyCheckinSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  week: { type: Number, required: true },
  subjectConfidence: { type: Map, of: Number, default: {} }, // { math: 4, science: 2 }
  mentorRating: { type: Boolean }, // was mentor responsive?
  flaggedSubjects: [{ type: String }],
  submittedAt: { type: Date, default: Date.now }
});

const MentorReview = mongoose.model('MentorReview', new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String }, // anonymous
  createdAt: { type: Date, default: Date.now }
}));

const Progress = mongoose.model('Progress', progressSchema);
const WeeklyCheckin = mongoose.model('WeeklyCheckin', weeklyCheckinSchema);

module.exports = { Progress, WeeklyCheckin, MentorReview };
